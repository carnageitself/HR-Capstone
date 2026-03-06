"""
FastAPI server wrapping the taxonomy pipeline.

Run:  uvicorn taxonomy_pipeline.api:app --reload --port 8000
Deps: pip install fastapi uvicorn python-multipart supabase
"""

import json, uuid, os, csv, time, io, threading
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client

from dotenv import load_dotenv
from prompt_composer import load_presets, get_preset_by_id, build_prompt_metadata

load_dotenv()


UPLOAD_DIR = Path("data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

STORAGE_BUCKET = "pipeline-uploads"

REQUIRED_COLUMNS = {"message", "award_title", "recipient_title", "nominator_title"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

REGISTRY_PATH = Path(__file__).parent / "model_registry.json"


def get_supabase() -> Client:
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    return create_client(url, key)

db = get_supabase()


def load_registry() -> dict:
    with open(REGISTRY_PATH) as f:
        return json.load(f)

def get_config(config_id: str) -> dict | None:
    reg = load_registry()
    for c in reg["configs"]:
        if c["id"] == config_id and c.get("enabled", True):
            return c
    return None


app = FastAPI(title="Taxonomy Pipeline API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class PromptConfig(BaseModel):
    """User-editable Phase 1 prompt fields from the dashboard."""
    preset_id: Optional[str] = None
    task_instruction: Optional[str] = None
    category_seeds: Optional[list[str]] = None
    additional_constraints: Optional[str] = None
    mode: str = "structured"
    raw_prompt: Optional[str] = None

class RunRequest(BaseModel):
    file_id: str
    config_ids: list[str]
    prompt_config: Optional[PromptConfig] = None

class ApplyTaxonomyRequest(BaseModel):
    job_id: str
    file_id: str
    category_actions: dict       # {"C1":"keep","C2":"bin","C3":{"merge":"C1"}}
    subcategory_actions: dict    # {"C1.1":"keep","C1.2":"bin"}
    final_taxonomy: dict         # curated taxonomy JSON


@app.get("/api/configs")
def get_configs():
    reg = load_registry()
    enabled = [c for c in reg["configs"] if c.get("enabled", True)]
    return {"configs": enabled}


@app.post("/api/upload")
async def upload_csv(file: UploadFile = File(...)):
    # Validate file type
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(400, "File must be a .csv")

    # Read contents
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(400, f"File exceeds {MAX_FILE_SIZE // 1024 // 1024}MB limit")

    # Parse CSV
    try:
        text = contents.decode("utf-8")
        reader = csv.DictReader(io.StringIO(text))
        rows = list(reader)
    except Exception as e:
        raise HTTPException(400, f"CSV parse error: {e}")

    if not rows:
        raise HTTPException(400, "CSV is empty")

    # Validate columns
    columns = list(rows[0].keys())
    col_set = {c.strip().lower() for c in columns}
    missing = REQUIRED_COLUMNS - col_set
    if missing:
        raise HTTPException(400, f"Missing required columns: {', '.join(missing)}")

    if len(rows) < 10:
        raise HTTPException(400, "CSV must have at least 10 rows")

    # Store file in Supabase Storage
    file_id = str(uuid.uuid4())[:12]
    storage_path = f"{file_id}/{file.filename}"

    db.storage.from_(STORAGE_BUCKET).upload(
        path=storage_path,
        file=contents,
        file_options={"content-type": "text/csv"},
    )

    # Sample rows for preview
    sample = rows[:5]

    # Insert metadata into Supabase
    db.table("pipeline_uploads").insert({
        "file_id": file_id,
        "filename": file.filename,
        "row_count": len(rows),
        "columns": columns,
        "sample_rows": sample,
        "file_path": storage_path,
    }).execute()

    return {
        "file_id": file_id,
        "filename": file.filename,
        "row_count": len(rows),
        "columns": columns,
        "sample_rows": sample,
    }


@app.post("/api/run")
def start_runs(req: RunRequest):
    res = db.table("pipeline_uploads").select("*").eq("file_id", req.file_id).execute()
    if not res.data:
        raise HTTPException(404, f"Upload {req.file_id} not found")

    upload = res.data[0]
    jobs = []

    # ── Resolve prompt_config into a plain dict ────────────────────
    prompt_dict = None
    if req.prompt_config:
        pc = req.prompt_config

        if pc.preset_id:
            preset = get_preset_by_id(pc.preset_id)
            if not preset:
                raise HTTPException(400, f"Unknown preset: {pc.preset_id}")
            prompt_dict = {
                "preset_used": preset["name"],
                "task_instruction": pc.task_instruction or preset["task_instruction"],
                "category_seeds": pc.category_seeds if pc.category_seeds is not None else preset.get("category_seeds", []),
                "additional_constraints": pc.additional_constraints or preset.get("additional_constraints", ""),
            }
        else:
            prompt_dict = {
                "preset_used": "Custom",
                "task_instruction": pc.task_instruction,
                "category_seeds": pc.category_seeds or [],
                "additional_constraints": pc.additional_constraints or "",
            }

        prompt_dict["mode"] = pc.mode
        if pc.mode == "raw" and pc.raw_prompt:
            prompt_dict["raw_prompt"] = pc.raw_prompt

    for config_id in req.config_ids:
        config = get_config(config_id)
        if not config:
            raise HTTPException(400, f"Unknown or disabled config: {config_id}")

        job_id = str(uuid.uuid4())[:12]

        db.table("pipeline_jobs").insert({
            "job_id": job_id,
            "file_id": req.file_id,
            "config_id": config_id,
            "config_snapshot": config,
            "status": "queued",
            "current_phase": 0,
            "progress_pct": 0,
            "prompt_config": prompt_dict,
        }).execute()

        t = threading.Thread(
            target=_run_pipeline_job,
            args=(job_id, upload["file_path"], config, prompt_dict),
            daemon=True,
        )
        t.start()

        jobs.append({"job_id": job_id, "config_id": config_id, "status": "queued"})

    return {"jobs": jobs}


@app.get("/api/status/{job_id}")
def get_status(job_id: str):
    res = db.table("pipeline_jobs").select(
        "job_id, config_id, config_snapshot, status, current_phase, progress_pct, error_message, started_at, completed_at"
    ).eq("job_id", job_id).execute()

    if not res.data:
        raise HTTPException(404, f"Job {job_id} not found")

    return res.data[0]


@app.get("/api/results/{job_id}")
def get_results(job_id: str):
    res = db.table("pipeline_jobs").select("*").eq("job_id", job_id).execute()

    if not res.data:
        raise HTTPException(404, f"Job {job_id} not found")

    job = res.data[0]
    if job["status"] != "completed":
        raise HTTPException(400, f"Job not completed (status: {job['status']})")

    return {
        "job_id": job["job_id"],
        "config_id": job["config_id"],
        "config_snapshot": job["config_snapshot"],
        "prompt_config": job.get("prompt_config"),
        "pipeline_summary": job["pipeline_summary"],
        "final_taxonomy": job["final_taxonomy"],
        "phase_3_final": job["phase_3_final"],
        "eda_report": job["eda_report"],
        "token_usage": job.get("token_usage"),
    }


@app.get("/api/history")
def get_history(limit: int = 20):
    jobs_res = (
        db.table("pipeline_jobs")
        .select("job_id, file_id, config_id, config_snapshot, status, current_phase, progress_pct, error_message, started_at, completed_at, created_at, eda_report, token_usage, prompt_config")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    jobs = jobs_res.data or []

    # Attach upload metadata (row count, filename, columns)
    file_ids = list({j["file_id"] for j in jobs if j.get("file_id")})
    uploads_map = {}
    if file_ids:
        for fid in file_ids:
            up_res = db.table("pipeline_uploads").select("file_id, filename, row_count, columns").eq("file_id", fid).execute()
            if up_res.data:
                uploads_map[fid] = up_res.data[0]

    for j in jobs:
        j["upload"] = uploads_map.get(j["file_id"])

    return {"jobs": jobs}


@app.post("/api/apply-taxonomy")
def apply_taxonomy(req: ApplyTaxonomyRequest):
    # Validate job exists and is completed
    job_res = db.table("pipeline_jobs").select("*").eq("job_id", req.job_id).execute()
    if not job_res.data:
        raise HTTPException(404, f"Job {req.job_id} not found")
    if job_res.data[0]["status"] != "completed":
        raise HTTPException(400, "Job not completed")

    source_taxonomy = job_res.data[0]["final_taxonomy"]

    curation_id = str(uuid.uuid4())[:12]

    db.table("curated_taxonomies").insert({
        "curation_id": curation_id,
        "job_id": req.job_id,
        "file_id": req.file_id,
        "source_taxonomy": source_taxonomy,
        "category_actions": req.category_actions,
        "subcategory_actions": req.subcategory_actions,
        "final_taxonomy": req.final_taxonomy,
        "applied_at": datetime.now(timezone.utc).isoformat(),
    }).execute()

    return {
        "curation_id": curation_id,
        "status": "applied",
        "categories_kept": sum(1 for v in req.category_actions.values() if v == "keep"),
        "categories_binned": sum(1 for v in req.category_actions.values() if v == "bin"),
        "categories_merged": sum(1 for v in req.category_actions.values() if isinstance(v, dict)),
    }


@app.get("/api/curations/{file_id}")
def get_curations(file_id: str):
    res = (
        db.table("curated_taxonomies")
        .select("*")
        .eq("file_id", file_id)
        .order("created_at", desc=True)
        .execute()
    )
    return {"curations": res.data or []}


def _update_job(job_id: str, **fields):
    db.table("pipeline_jobs").update(fields).eq("job_id", job_id).execute()

def _download_from_storage(storage_path: str) -> str:
    """Download a file from Supabase Storage to a local temp path for pipeline processing."""
    local_path = UPLOAD_DIR / storage_path.replace("/", "_")
    if not local_path.exists():
        res = db.storage.from_(STORAGE_BUCKET).download(storage_path)
        local_path.write_bytes(res)
    return str(local_path)

def _calculate_costs(token_usage: dict, registry: dict) -> dict:
    """Calculate USD costs from token counts using registry pricing."""
    pricing = registry.get("pricing", {})
    cost_by_phase = {}
    total_cost = 0.0

    for phase_key in ["phase_1", "phase_2", "phase_3"]:
        phase = token_usage.get(phase_key, {})
        provider = phase.get("provider", "")
        model = phase.get("model", "")
        inp = phase.get("input_tokens", 0)
        out = phase.get("output_tokens", 0)

        model_pricing = pricing.get(provider, {}).get(model, {})
        input_cost = (inp / 1_000_000) * model_pricing.get("input_per_1m", 0)
        output_cost = (out / 1_000_000) * model_pricing.get("output_per_1m", 0)
        phase_cost = round(input_cost + output_cost, 6)

        cost_by_phase[phase_key] = phase_cost
        total_cost += phase_cost

    return {
        "total_cost_usd": round(total_cost, 6),
        "cost_by_phase": cost_by_phase,
    }


def _run_pipeline_job(job_id: str, file_path: str, config: dict, prompt_config: dict | None = None):
    """
    Runs the 3-phase taxonomy pipeline in a background thread.
    Updates Supabase job record with progress at each phase.

    NOTE: The pipeline currently reads models/paths from its own config.py.
    The `config` dict from the model registry is stored for metadata/display
    but doesn't yet override the pipeline's internal config. That's a future
    refactor — making phase scripts accept provider/model as arguments.
    """
    import sys
    pipeline_dir = str(Path(__file__).parent)
    if pipeline_dir not in sys.path:
        sys.path.insert(0, pipeline_dir)

    try:
        now = datetime.now(timezone.utc).isoformat()
        _update_job(job_id, status="running", started_at=now, current_phase=1, progress_pct=5)

        # Download CSV from Supabase Storage to local temp for pipeline
        local_csv = _download_from_storage(file_path)

        start = time.time()

        # Import token tracker
        from utils import token_tracker

        token_usage = {}

        _update_job(job_id, current_phase=1, progress_pct=10)

        token_tracker.reset()
        from phase_1_seed import run as run_phase_1
        taxonomy, composed_prompt = run_phase_1(prompt_config=prompt_config)
        token_usage["phase_1"] = token_tracker.get()

        # Save the full composed prompt in metadata for reproducibility
        prompt_metadata = build_prompt_metadata(prompt_config, composed_prompt)
        _update_job(job_id, prompt_config=prompt_metadata)

        _update_job(job_id, progress_pct=35)

        _update_job(job_id, current_phase=2, progress_pct=40)

        token_tracker.reset()
        from phase_2_bulk import run as run_phase_2
        classifications, candidates = run_phase_2(taxonomy=taxonomy)
        token_usage["phase_2"] = token_tracker.get()

        _update_job(job_id, progress_pct=75)

        _update_job(job_id, current_phase=3, progress_pct=80)

        token_tracker.reset()
        from phase_3_finalize import run as run_phase_3
        phase_3_result = run_phase_3(taxonomy=taxonomy, candidates=candidates)
        token_usage["phase_3"] = token_tracker.get()

        _update_job(job_id, progress_pct=95)

        elapsed = time.time() - start
        final_tax = phase_3_result.get("final_taxonomy", taxonomy)
        changes = phase_3_result.get("changes", [])

        
        total_in = sum(token_usage[p]["input_tokens"] for p in ["phase_1", "phase_2", "phase_3"])
        total_out = sum(token_usage[p]["output_tokens"] for p in ["phase_1", "phase_2", "phase_3"])

        registry = load_registry()
        costs = _calculate_costs(token_usage, registry)

        token_usage["totals"] = {
            "input_tokens": total_in,
            "output_tokens": total_out,
            "total_tokens": total_in + total_out,
            "estimated_cost_usd": costs["total_cost_usd"],
            "cost_by_phase": costs["cost_by_phase"],
        }

        summary = {
            "pipeline": {
                "total_time_seconds": round(elapsed, 2),
                "phases_run": [1, 2, 3],
                "llm_provider_priority": [config["phases"]["phase_1"]["provider"]],
                "phase_1_models": {config["phases"]["phase_1"]["provider"]: config["phases"]["phase_1"]["model"]},
                "phase_2_model": config["phases"]["phase_2"]["model"],
                "phase_3_models": {config["phases"]["phase_3"]["provider"]: config["phases"]["phase_3"]["model"]},
            },
            "results": {
                "final_categories": len(final_tax.get("categories", [])),
                "total_subcategories": sum(
                    len(c.get("subcategories", []))
                    for c in final_tax.get("categories", [])
                ),
                "candidates_found": len(candidates),
                "changes_applied": len(changes),
            },
            "token_usage": token_usage,
        }

        eda = _build_eda_report(local_csv)

        done = datetime.now(timezone.utc).isoformat()
        _update_job(
            job_id,
            status="completed",
            current_phase=3,
            progress_pct=100,
            completed_at=done,
            pipeline_summary=summary,
            final_taxonomy=final_tax,
            phase_3_final=phase_3_result,
            eda_report=eda,
            token_usage=token_usage,
        )

    except Exception as e:
        _update_job(
            job_id,
            status="failed",
            error_message=str(e),
            completed_at=datetime.now(timezone.utc).isoformat(),
        )

def _build_eda_report(csv_path: str) -> dict:
    """Compute basic EDA stats from the raw CSV."""
    import csv as csv_mod

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv_mod.DictReader(f)
        rows = list(reader)

    if not rows:
        return {"basic": {"total_rows": 0}}

    columns = list(rows[0].keys())
    messages = [r.get("message", "") for r in rows]
    char_lens = [len(m) for m in messages]
    word_counts = [len(m.split()) for m in messages]

    def pctl(arr, p):
        s = sorted(arr)
        i = int(len(s) * p / 100)
        return s[min(i, len(s) - 1)]

    # Interaction stats
    pairs = [(r.get("nominator_title", ""), r.get("recipient_title", "")) for r in rows]
    unique_pairs = len(set(pairs))
    recips = set(r.get("recipient_title", "") for r in rows)
    noms = set(r.get("nominator_title", "") for r in rows)

    return {
        "basic": {
            "total_rows": len(rows),
            "total_columns": len(columns),
            "columns": columns,
            "null_counts": {c: sum(1 for r in rows if not r.get(c)) for c in columns},
        },
        "message": {
            "char_length": {
                "min": min(char_lens),
                "max": max(char_lens),
                "mean": round(sum(char_lens) / len(char_lens), 1),
                "median": pctl(char_lens, 50),
                "std": round((sum((x - sum(char_lens)/len(char_lens))**2 for x in char_lens) / len(char_lens)) ** 0.5, 1),
                "p5": pctl(char_lens, 5),
                "p95": pctl(char_lens, 95),
            },
            "word_count": {
                "min": min(word_counts),
                "max": max(word_counts),
                "mean": round(sum(word_counts) / len(word_counts), 1),
            },
        },
        "interactions": {
            "total_interactions": len(rows),
            "unique_pairs": unique_pairs,
            "unique_recipients": len(recips),
            "unique_nominators": len(noms),
        },
    }

@app.get("/api/presets")
def get_presets_endpoint():
    """Return available prompt presets for the dashboard editor."""
    return {"presets": load_presets()}

@app.get("/api/health")
def health():
    try:
        res = db.table("pipeline_jobs").select("job_id", count="exact").limit(1).execute()
        return {"status": "healthy", "jobs_count": res.count or 0}
    except Exception as e:
        return {"status": "error", "detail": str(e)}