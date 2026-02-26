#!/usr/bin/env python3
"""
Run topic annotation on recognition data using a pre-built taxonomy.

Stage 2: Annotate each recognition message with the best-matching taxonomy tag.
Uses Ollama (local) as primary — free, no API keys, no rate limits.

Usage:
    python run_topic_annotation.py
"""

import sys
import os
import json
import requests
import pandas as pd
import numpy as np
import json5
from typing import Dict, Any, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm

# ---------------------------------------------------------------------------
# Load .env.local / .env
# ---------------------------------------------------------------------------
def _load_env_file():
    for env_file in [".env.local", ".env"]:
        for base in [".", ".."]:
            path = os.path.join(base, env_file)
            if os.path.exists(path):
                with open(path) as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            key, _, value = line.partition("=")
                            value = value.strip().strip('"').strip("'")
                            os.environ.setdefault(key.strip(), value)
                return

_load_env_file()

# ---------------------------------------------------------------------------
# Provider detection
# ---------------------------------------------------------------------------
OLLAMA_AVAILABLE = False
ANTHROPIC_AVAILABLE = False
GEMINI_AVAILABLE = False

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.1")

try:
    r = requests.get(f"{OLLAMA_URL}/api/tags", timeout=3)
    if r.status_code == 200:
        models = [m["name"] for m in r.json().get("models", [])]
        if any(OLLAMA_MODEL in m for m in models):
            OLLAMA_AVAILABLE = True
except:
    pass

try:
    import anthropic
    if os.environ.get("ANTHROPIC_API_KEY"):
        ANTHROPIC_AVAILABLE = True
except ImportError:
    pass

try:
    import google.generativeai as genai
    if os.environ.get("GEMINI_API_KEY"):
        genai.configure(api_key=os.environ["GEMINI_API_KEY"])
        GEMINI_AVAILABLE = True
except ImportError:
    pass

if not OLLAMA_AVAILABLE and not ANTHROPIC_AVAILABLE and not GEMINI_AVAILABLE:
    print("ERROR: No LLM provider available.")
    print("Easiest: install Ollama (https://ollama.com) then: ollama pull llama3.1")
    sys.exit(1)

_providers = []
if OLLAMA_AVAILABLE:
    _providers.append(f"Ollama/{OLLAMA_MODEL} (primary)")
if ANTHROPIC_AVAILABLE:
    _providers.append("Claude (fallback)")
if GEMINI_AVAILABLE:
    _providers.append("Gemini (fallback)")
print(f"LLM providers: {', '.join(_providers)}")

CLAUDE_MODEL = "claude-sonnet-4-20250514"
GEMINI_MODEL = "gemini-2.0-flash"


# ---------------------------------------------------------------------------
# Unified LLM call
# ---------------------------------------------------------------------------
def get_llm_response(text: str, temperature: float = 0.1, max_tokens: int = 4096) -> Tuple[str, str]:
    errors = []

    if OLLAMA_AVAILABLE:
        try:
            r = requests.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": text,
                    "stream": False,
                    "options": {"temperature": temperature, "num_predict": max_tokens},
                },
                timeout=300,
            )
            r.raise_for_status()
            return r.json()["response"], "ollama"
        except Exception as e:
            errors.append(f"Ollama: {e}")

    if ANTHROPIC_AVAILABLE:
        try:
            client = anthropic.Anthropic()
            res = client.messages.create(
                model=CLAUDE_MODEL, max_tokens=max_tokens,
                temperature=temperature,
                messages=[{"role": "user", "content": text}],
            )
            return res.content[0].text, "claude"
        except Exception as e:
            errors.append(f"Claude: {e}")

    if GEMINI_AVAILABLE:
        try:
            model = genai.GenerativeModel(GEMINI_MODEL)
            res = model.generate_content(
                text,
                generation_config=genai.types.GenerationConfig(
                    temperature=temperature, max_output_tokens=max_tokens),
            )
            return res.text, "gemini"
        except Exception as e:
            errors.append(f"Gemini: {e}")

    raise RuntimeError("All LLM providers failed:\n" + "\n".join(errors))


# ---------------------------------------------------------------------------
# JSON parsing
# ---------------------------------------------------------------------------
def to_json(raw: str) -> Optional[Dict[str, Any]]:
    if not raw:
        return None
    raw = raw.strip()
    nf = lambda v, t: v if v >= 0 else t
    lc = nf(raw.find("{"), len(raw))
    rc = nf(raw.rfind("}"), 0) + 1
    ls = nf(raw.find("["), len(raw))
    rs = nf(raw.rfind("]"), 0) + 1
    s, e = min(lc, ls), max(rc, rs)
    if s == len(raw) or e == 1:
        return None
    try:
        return json5.loads(raw[s:e])
    except ValueError:
        return None


# ---------------------------------------------------------------------------
# Data formatting
# ---------------------------------------------------------------------------
def format_award_info(row: pd.Series) -> str:
    parts = []
    if pd.notna(row.get("recipient_title")):
        parts.append(f"Recipient role: {row['recipient_title']}")
    if pd.notna(row.get("nominator_title")):
        parts.append(f"Nominator role: {row['nominator_title']}")
    if pd.notna(row.get("award_title")):
        parts.append(f"Award: {row['award_title']}")
    if pd.notna(row.get("message")):
        parts.append(f"Message: {row['message']}")
    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Batch processing
# ---------------------------------------------------------------------------
ANNOTATION_TEMPLATE = '''{
  "row1": [
    {"reason":"brief reason", "category_name": "name1", "category_id": "A", "sub_category_name": "name", "sub_category_id": "A1"}
  ],
  "row2": [
    {"reason":"brief reason", "category_name": "name1", "category_id": "A", "sub_category_name": "name", "sub_category_id": "A1"}
  ]
}'''


def process_batch(batch_rows: pd.DataFrame, taxonomy: Dict[str, Any], temperature: float):
    content = batch_rows["summary_dict_batch"].values

    prompt = f"""You are an HR researcher. Tag each row with the single most relevant category and subcategory from the taxonomy.

Recognition data:
{content}

Taxonomy:
{json.dumps(taxonomy, indent=2)}

Return ONLY valid JSON following this exact format:
{ANNOTATION_TEMPLATE}"""

    text, provider = get_llm_response(prompt, temperature=temperature)
    parsed = to_json(text)
    return {"parsed_content": parsed, "provider": provider}


def extract_and_map_tags(result_df: pd.DataFrame, taxonomy: Optional[Dict] = None) -> pd.DataFrame:
    rows = []
    for _, row in result_df.iterrows():
        bid = row.get("batch_id", 0)
        tagged = row["tagged_results"]
        if not isinstance(tagged, dict):
            continue
        for row_key, items in tagged.items():
            if not isinstance(row_key, str) or not row_key.startswith("row"):
                continue
            if not isinstance(items, list):
                items = [items]
            for item in items:
                rows.append({
                    "batch_id": bid,
                    "row_id": row_key,
                    "reason": item.get("reason", ""),
                    "category_id": item.get("category_id", ""),
                    "category_name": item.get("category_name", ""),
                    "subcategory_id": item.get("sub_category_id", ""),
                    "subcategory_name": item.get("sub_category_name", ""),
                })
    out = pd.DataFrame(rows)
    if "row_id" in out.columns and not out.empty:
        out["_sort"] = out["row_id"].str.extract(r"row(\d+)").astype(int)
        out = out.sort_values(["batch_id", "_sort"]).drop(columns="_sort")
    return out


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def get_input(prompt, default, validation_fn=None):
    while True:
        value = input(f"{prompt} [{default}]: ").strip() or default
        if validation_fn is None or validation_fn(value):
            return value
        print("Invalid input, try again.")


def main():
    print("=" * 55)
    print("  Stage 2 — Topic Annotation")
    print("=" * 55)

    input_file = get_input("Path to awards CSV", "mockup_awards.csv",
                           lambda x: os.path.exists(x))
    taxonomy_file = get_input("Path to taxonomy JSON",
                              "taxonomy_results/compressed_taxonomy_with_ids.json",
                              lambda x: os.path.exists(x))
    sample_size = int(get_input("Sample size", "1000",
                                lambda x: x.isdigit() and 0 < int(x) <= 10000))
    temperature = float(get_input("Temperature (0.0–1.0)", "0.1",
                                  lambda x: x.replace(".", "").isdigit() and 0 <= float(x) <= 1))
    workers = int(get_input("Concurrent workers (keep low for Ollama)", "2",
                            lambda x: x.isdigit() and 1 <= int(x) <= 10))
    batch_size = int(get_input("Rows per batch", "20",
                               lambda x: x.isdigit() and int(x) > 0))
    output_file = get_input("Output CSV path", "output/annotated_results.csv")

    print(f"\n  Input:     {input_file}")
    print(f"  Taxonomy:  {taxonomy_file}")
    print(f"  Sample:    {sample_size}")
    print(f"  Temp:      {temperature}")
    print(f"  Workers:   {workers}")
    print(f"  Batch:     {batch_size}")
    print(f"  Output:    {output_file}")

    confirm = input("\nProceed? [Y/n]: ").strip().lower()
    if confirm == "n":
        sys.exit(0)

    print("\nLoading…")
    with open(taxonomy_file) as f:
        taxonomy = json.load(f)

    df = pd.read_csv(input_file)
    df = df.sample(n=min(sample_size, len(df)), random_state=42)
    df = df.drop_duplicates(subset=["message"]).reset_index(drop=True)
    print(f"  {len(df)} unique messages.")

    df["formatted_info"] = df.apply(format_award_info, axis=1)
    df["batch_id"] = np.ceil((np.arange(len(df)) + 1) / batch_size).astype(int)
    df["row_in_batch"] = "row" + ((np.arange(len(df)) % batch_size) + 1).astype(str)
    df["summary_dict_batch"] = df["row_in_batch"] + ": " + df["formatted_info"]

    unique_batches = sorted(df["batch_id"].unique())
    print(f"  {len(unique_batches)} batches to process.\n")

    results = []
    failed = []

    def _do_batch(bid):
        try:
            batch_rows = df[df["batch_id"] == bid]
            res = process_batch(batch_rows, taxonomy, temperature)
            if res["parsed_content"]:
                return {"batch_id": bid, "tagged_results": res["parsed_content"],
                        "provider": res["provider"], "ok": True}
            return {"batch_id": bid, "ok": False, "err": "JSON parse failed"}
        except Exception as e:
            return {"batch_id": bid, "ok": False, "err": str(e)}

    with ThreadPoolExecutor(max_workers=workers) as pool:
        futs = {pool.submit(_do_batch, b): b for b in unique_batches}
        with tqdm(total=len(unique_batches), desc="Annotating") as pbar:
            for fut in as_completed(futs):
                r = fut.result()
                if r["ok"]:
                    results.append(r)
                else:
                    failed.append((r["batch_id"], r.get("err")))
                pbar.update(1)

    provider_counts = {}
    for r in results:
        p = r.get("provider", "unknown")
        provider_counts[p] = provider_counts.get(p, 0) + 1

    print(f"\n✅ {len(results)}/{len(unique_batches)} batches succeeded")
    print(f"   Provider usage: {provider_counts}")
    if failed:
        print(f"❌ {len(failed)} failed:")
        for bid, err in failed[:5]:
            print(f"   Batch {bid}: {err}")

    res_df = pd.DataFrame(results)
    tags_df = extract_and_map_tags(res_df, taxonomy)

    df_out = pd.merge(
        df, tags_df,
        left_on=["batch_id", "row_in_batch"],
        right_on=["batch_id", "row_id"],
        how="inner",
    )

    os.makedirs(os.path.dirname(output_file) or ".", exist_ok=True)
    df_out.to_csv(output_file, index=False)

    print(f"\n📄 {len(df_out)} annotated records saved to {output_file}")

    if not df_out.empty and "category_name" in df_out.columns:
        print("\nCategory distribution:")
        dist = df_out["category_name"].value_counts().head(10)
        for cat, cnt in dist.items():
            print(f"   {cat}: {cnt}")


if __name__ == "__main__":
    main()