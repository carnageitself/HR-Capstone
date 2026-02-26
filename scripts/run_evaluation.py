"""
Taxonomy Evaluation Runner
──────────────────────────
Generates 100 synthetic award messages, runs Phase 1 + Phase 3
of the taxonomy pipeline on them, compares the discovered taxonomy
against the baseline, and saves timestamped results.

Usage:
    python scripts/run_evaluation.py
    python scripts/run_evaluation.py --count 200
"""

import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# ── Ensure imports work ────────────────────────────────────────────────────────
_project_root = Path(__file__).resolve().parent.parent
_pipeline_dir = str(_project_root / "taxonomy_pipeline")
_scripts_dir = str(_project_root / "scripts")
for d in [_pipeline_dir, _scripts_dir]:
    if d not in sys.path:
        sys.path.insert(0, d)

import config as cfg
from utils import get_logger
from generate_new_data import generate_data

logger = get_logger("evaluation")

EVAL_DIR = _project_root / "outputs" / "evaluations"
BASELINE_PATH = _project_root / "outputs" / "final_taxonomy.json"
HISTORY_PATH = EVAL_DIR / "history.json"


def load_baseline() -> dict:
    """Load the baseline taxonomy for comparison."""
    if BASELINE_PATH.exists():
        with open(BASELINE_PATH) as f:
            return json.load(f)
    logger.warning("No baseline taxonomy found, comparison will be limited")
    return {"categories": []}


def jaccard_similarity(set_a: set, set_b: set) -> float:
    """Compute Jaccard similarity between two sets."""
    if not set_a and not set_b:
        return 1.0
    intersection = set_a & set_b
    union = set_a | set_b
    return round(len(intersection) / len(union), 4) if union else 0.0


def compare_taxonomies(discovered: dict, baseline: dict) -> dict:
    """Compare discovered taxonomy against the baseline."""
    baseline_cats = {c["name"] for c in baseline.get("categories", [])}
    discovered_cats = {c["name"] for c in discovered.get("categories", [])}

    baseline_subs = set()
    for c in baseline.get("categories", []):
        for s in c.get("subcategories", []):
            baseline_subs.add(s["name"])

    discovered_subs = set()
    for c in discovered.get("categories", []):
        for s in c.get("subcategories", []):
            discovered_subs.add(s["name"])

    return {
        "category_jaccard": jaccard_similarity(discovered_cats, baseline_cats),
        "subcategory_jaccard": jaccard_similarity(discovered_subs, baseline_subs),
        "baseline_categories": sorted(baseline_cats),
        "discovered_categories": sorted(discovered_cats),
        "new_categories": sorted(discovered_cats - baseline_cats),
        "missing_categories": sorted(baseline_cats - discovered_cats),
        "new_subcategories": sorted(discovered_subs - baseline_subs),
        "missing_subcategories": sorted(baseline_subs - discovered_subs),
        "baseline_count": {
            "categories": len(baseline_cats),
            "subcategories": len(baseline_subs),
        },
        "discovered_count": {
            "categories": len(discovered_cats),
            "subcategories": len(discovered_subs),
        },
    }


def run_evaluation(count: int = 100) -> dict:
    """Run the full evaluation cycle."""
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    logger.info(f"{'=' * 60}")
    logger.info(f"TAXONOMY EVALUATION RUN — {timestamp}")
    logger.info(f"{'=' * 60}")

    overall_start = time.time()

    # ── Step 1: Generate synthetic data ────────────────────────────────────
    logger.info(f"\n[1/4] Generating {count} synthetic award messages...")
    gen_start = time.time()
    df = generate_data(count=count)
    gen_time = round(time.time() - gen_start, 1)
    logger.info(f"  Generated {len(df)} messages in {gen_time}s")

    # Save to temp CSV for the pipeline to read
    eval_csv = cfg.DATA_DIR / "eval_sample.csv"
    df.to_csv(eval_csv, index=False)
    logger.info(f"  Saved to {eval_csv}")

    # ── Step 2: Override pipeline data path and run Phase 1 ────────────────
    logger.info(f"\n[2/4] Running Phase 1 (taxonomy discovery)...")
    original_csv = cfg.AWARDS_CSV
    cfg.AWARDS_CSV = eval_csv

    p1_start = time.time()
    try:
        import phase_1_seed
        taxonomy = phase_1_seed.run(sample_size=min(count, 100))
    except Exception as e:
        logger.error(f"  Phase 1 failed: {e}")
        taxonomy = {"categories": []}
    p1_time = round(time.time() - p1_start, 1)
    logger.info(f"  Phase 1 completed in {p1_time}s")

    # ── Step 3: Run Phase 3 (finalization, skip Phase 2) ───────────────────
    logger.info(f"\n[3/4] Running Phase 3 (finalization, no Phase 2)...")
    p3_start = time.time()
    try:
        import phase_3_finalize
        final_taxonomy = phase_3_finalize.run(taxonomy=taxonomy, candidates={})
    except Exception as e:
        logger.error(f"  Phase 3 failed: {e}")
        final_taxonomy = taxonomy
    p3_time = round(time.time() - p3_start, 1)
    logger.info(f"  Phase 3 completed in {p3_time}s")

    # Restore original path
    cfg.AWARDS_CSV = original_csv

    # ── Step 4: Compare against baseline ───────────────────────────────────
    logger.info(f"\n[4/4] Comparing against baseline taxonomy...")
    baseline = load_baseline()
    comparison = compare_taxonomies(final_taxonomy, baseline)

    total_time = round(time.time() - overall_start, 1)

    # ── Build result ───────────────────────────────────────────────────────
    result = {
        "timestamp": timestamp,
        "iso_timestamp": datetime.now(timezone.utc).isoformat(),
        "run_time_seconds": total_time,
        "phase_times": {
            "generation": gen_time,
            "phase_1": p1_time,
            "phase_3": p3_time,
        },
        "generated_count": len(df),
        "pipeline_config": {
            "provider_priority": cfg.LLM_PROVIDER_PRIORITY,
            "phase_1_models": cfg.P1_MODELS,
            "phase_3_models": cfg.P3_MODELS,
            "phases_run": [1, 3],
            "phase_2_skipped": True,
        },
        "discovered_taxonomy": final_taxonomy,
        "comparison": comparison,
    }

    # ── Save result ────────────────────────────────────────────────────────
    EVAL_DIR.mkdir(parents=True, exist_ok=True)
    result_path = EVAL_DIR / f"eval_{timestamp}.json"
    with open(result_path, "w") as f:
        json.dump(result, f, indent=2)
    logger.info(f"\nResults saved to {result_path}")

    # Append to history
    history = []
    if HISTORY_PATH.exists():
        try:
            history = json.load(open(HISTORY_PATH))
        except (json.JSONDecodeError, Exception):
            history = []

    history.append({
        "timestamp": timestamp,
        "iso_timestamp": result["iso_timestamp"],
        "run_time_seconds": total_time,
        "generated_count": len(df),
        "categories_discovered": comparison["discovered_count"]["categories"],
        "subcategories_discovered": comparison["discovered_count"]["subcategories"],
        "category_jaccard": comparison["category_jaccard"],
        "subcategory_jaccard": comparison["subcategory_jaccard"],
        "new_categories": comparison["new_categories"],
        "missing_categories": comparison["missing_categories"],
    })

    with open(HISTORY_PATH, "w") as f:
        json.dump(history, f, indent=2)
    logger.info(f"History updated ({len(history)} total runs)")

    # ── Print summary ──────────────────────────────────────────────────────
    print(f"\n{'=' * 60}")
    print(f"EVALUATION SUMMARY")
    print(f"{'=' * 60}")
    print(f"  Timestamp:          {timestamp}")
    print(f"  Total run time:     {total_time}s")
    print(f"  Messages generated: {len(df)}")
    print(f"  Categories found:   {comparison['discovered_count']['categories']}")
    print(f"  Subcategories:      {comparison['discovered_count']['subcategories']}")
    print(f"  Category Jaccard:   {comparison['category_jaccard']}")
    print(f"  New categories:     {comparison['new_categories'] or 'None'}")
    print(f"  Missing categories: {comparison['missing_categories'] or 'None'}")
    print(f"{'=' * 60}")

    # Cleanup temp CSV
    try:
        eval_csv.unlink()
    except Exception:
        pass

    return result


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Run taxonomy evaluation")
    parser.add_argument("--count", type=int, default=100, help="Number of entries to generate")
    args = parser.parse_args()

    run_evaluation(count=args.count)
