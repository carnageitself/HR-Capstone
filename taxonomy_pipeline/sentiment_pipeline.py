"""
sentiment_pipeline.py
─────────────────────
Sentiment analysis pipeline for HR recognition messages.

Scores every award message across four NLP dimensions:
  • Depth          — message length / effort invested
  • Specificity    — concrete outcomes, metrics, named deliverables
  • Warmth         — emotional language intensity
  • Personalisation— this-person-specifically signals

Outputs
  ├── outputs/sentiment_awards.csv        per-award scores (full detail)
  ├── outputs/sentiment_summary.json      org-wide stats + monthly trend
  ├── outputs/sentiment_employees.json    per-employee profile
  ├── outputs/sentiment_nominators.json   per-nominator profile
  └── outputs/sentiment_dashboard.json   compact payload for Next.js

Usage
  python sentiment_pipeline.py                    # full run
  python sentiment_pipeline.py --input path/to/awards.csv
  python sentiment_pipeline.py --output-dir /tmp/results
  python sentiment_pipeline.py --no-cache         # ignore saved hash, re-score

Cron (4 AM daily)
  0 4 * * * cd /path/to/project && python sentiment_pipeline.py >> logs/sentiment.log 2>&1
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import logging
import re
import sys
import time
from collections import Counter, defaultdict
from concurrent.futures import ProcessPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import pandas as pd

# ─────────────────────────────────────────────────────────────────────────────
# PATHS  (mirrors project config.py conventions)
# ─────────────────────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent
DATA_DIR     = PROJECT_ROOT / "data" / "raw"
OUTPUT_DIR   = PROJECT_ROOT / "outputs"

DEFAULT_INPUT  = DATA_DIR / "awards_enriched.csv"
CACHE_FILE     = OUTPUT_DIR / ".sentiment_cache.json"

# ─────────────────────────────────────────────────────────────────────────────
# LOGGING
# ─────────────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("sentiment")


# ─────────────────────────────────────────────────────────────────────────────
# SCORING PATTERNS
# Tuned against the real awards_enriched.csv dataset (1,000 messages).
# Each pattern is (points, compiled_regex).
# ─────────────────────────────────────────────────────────────────────────────

def _compile(patterns: list[tuple[int, str]]) -> list[tuple[int, re.Pattern]]:
    return [(pts, re.compile(p, re.IGNORECASE)) for pts, p in patterns]


# -- DEPTH: raw character count → 0-10  (applied separately, no regex)

# -- SPECIFICITY: concrete outcomes, deliverables, metrics
SPEC_PATTERNS = _compile([
    (3, r"\$[\d,]+[KkMm]?\b"),              # dollar amounts
    (3, r"\b\d+[.,]?\d*\s*%"),              # percentages
    (3, r"\b\d+[KkMm]\b"),                  # "100K", "2M" figures
    (2, r"\b(Q[1-4]|H[12])\s*\d{4}?\b"),   # quarters / halves
    (2, r"\b(launched|shipped|deployed|released|delivered|completed|finished)\b"),
    (2, r"\b(built|created|designed|developed|architected|engineered|authored)\b"),
    (2, r"\b(reduced|increased|improved|saved|grew|doubled|tripled|halved)\b"),
    (2, r"\b(client|customer|stakeholder|partner)\b.{0,50}\b(pleased|happy|satisfied|impressed)\b"),
    (1, r"\b(sprint|milestone|deadline|quarter|initiative|campaign|programme|program)\b"),
    (1, r"\b(process|workflow|system|platform|portal|tool|feature|product|module)\b"),
    (1, r"\b(meeting|presentation|demo|review|workshop|session|call|stand.?up)\b"),
    (1, r"\b(issue|bug|blocker|incident|error|problem)\b.{0,50}\b(solved|fixed|resolved|addressed|closed)\b"),
    (1, r"\b(first time|record|milestone|breakthrough|first ever)\b"),
])

# -- WARMTH: emotional language intensity
WARMTH_PATTERNS = _compile([
    (3, r"\b(truly|deeply|profoundly|wholeheartedly|sincerely|genuinely)\b"),
    (2, r"\b(grateful|heartfelt|moved|touched|honoured|honored|privilege|blessed)\b"),
    (2, r"\b(incredible|extraordinary|remarkable|exceptional|phenomenal|outstanding)\b"),
    (2, r"\b(inspired|inspiring|blown away|amazed|in awe|speechless)\b"),
    (2, r"\b(wouldn't|couldn't|can't)\b.{0,40}\b(without you|without your)\b"),
    (2, r"\bfrom the (bottom|depth) of my\b"),
    (2, r"\b(made a real difference|made such a difference|made all the difference)\b"),
    (2, r"\b(you are the reason|you are why|you are the kind)\b"),
    (2, r"\b(can't imagine|cannot imagine)\b"),
    (1, r"\b(special|meaningful|valuable|invaluable|priceless|irreplaceable)\b"),
    (1, r"\b(proud|joy|smile|laugh|love|care|heart|soul)\b"),
    (1, r"\b(always|never|every time|consistently|reliably|unfailingly)\b"),
    (1, r"\b(above and beyond|went the extra|exceeded)\b"),
    (1, r"\b(thank you|thanks|appreciate|grateful)\b"),  # base warmth signal (low weight)
])

# -- PERSONALISATION: "you specifically" signals
PERS_PATTERNS = _compile([
    (3, r"\bI (will always|'ll never|won't forget|remember when|still think about)\b"),
    (3, r"\byou (taught|showed|helped) me\b"),
    (3, r"\byou (changed|transformed|shaped|altered)\b"),
    (2, r"\b(only you|just you|no one else|uniquely)\b"),
    (2, r"\byou.{0,80}(specifically|in particular|especially)\b"),
    (2, r"\bI'?ve (watched|seen|noticed|observed)\b.{0,80}\byou\b"),
    (2, r"\byour (approach|style|way of working|manner|attitude|mindset)\b"),
    (1, r"\byou\b.{3,80}\b(built|created|led|drove|delivered|solved|managed|fixed|launched)\b"),
    (1, r"\byour\b.{3,80}\b(work|effort|contribution|support|help|guidance|expertise)\b"),
    (1, r"\bI (noticed|saw|watched|observed)\b"),
])

# -- GENERIC PHRASES that reduce net warmth (penalty)
GENERIC_PENALTY = _compile([
    (-1, r"\bcheers\b"),
    (-1, r"\bhappy (new year|christmas|holiday)\b"),
    (-1, r"\bteam player\b"),
    (-1, r"\bcongrats on (being|winning|getting)\b"),  # lottery-style awards
])


# ─────────────────────────────────────────────────────────────────────────────
# CORE SCORER  (pure function — safe for multiprocessing)
# ─────────────────────────────────────────────────────────────────────────────

def score_message(msg: str) -> dict:
    """
    Score a single message. Returns dict with tier (1-5) and all dimension scores.
    This function is imported by worker processes — must be top-level.
    """
    if not msg or not msg.strip():
        return _empty_score()

    n = len(msg)

    # 1. Depth  (0-10)
    if n >= 700:   depth = 10
    elif n >= 400: depth = 7
    elif n >= 200: depth = 5
    elif n >= 100: depth = 3
    else:          depth = 1

    # 2. Specificity  (0-10)
    spec = sum(pts for pts, pat in SPEC_PATTERNS if pat.search(msg))
    spec = min(10, spec)

    # 3. Warmth  (0-10, with penalty)
    warmth = sum(pts for pts, pat in WARMTH_PATTERNS if pat.search(msg))
    penalty = sum(abs(pts) for pts, pat in GENERIC_PENALTY if pat.search(msg))
    warmth = max(0, min(10, warmth - penalty))

    # 4. Personalisation  (0-10)
    pers = sum(pts for pts, pat in PERS_PATTERNS if pat.search(msg))
    pers = min(10, pers)

    total = depth + spec + warmth + pers  # 0-40

    return {
        "total":  total,
        "depth":  depth,
        "spec":   spec,
        "warmth": warmth,
        "pers":   pers,
    }


def _empty_score() -> dict:
    return {"total": 0, "depth": 0, "spec": 0, "warmth": 0, "pers": 0}


def _score_row(args: tuple) -> tuple[str, dict]:
    """Worker entry point — returns (award_id, score_dict)."""
    award_id, message = args
    return award_id, score_message(message)


# ─────────────────────────────────────────────────────────────────────────────
# TIER ASSIGNMENT  (percentile-based, calibrated on real data)
# ─────────────────────────────────────────────────────────────────────────────

TIER_META = {
    5: {"label": "Deeply Heartfelt", "color": "#1E8449", "bg": "#EAFAF1", "border": "#A9DFBF",
        "desc": "Highly specific, emotionally rich, clearly personal"},
    4: {"label": "Genuine",          "color": "#1A5276", "bg": "#EBF5FB", "border": "#AED6F1",
        "desc": "Meaningful praise with real personal context"},
    3: {"label": "Warm",             "color": "#9A7D0A", "bg": "#FEF9E7", "border": "#F9E79F",
        "desc": "Sincere but fairly general appreciation"},
    2: {"label": "Routine",          "color": "#BA4A00", "bg": "#FEF5E7", "border": "#FAD7A0",
        "desc": "Standard appreciation, limited specificity"},
    1: {"label": "Perfunctory",      "color": "#922B21", "bg": "#FDEDEC", "border": "#F5B7B1",
        "desc": "Very brief or formulaic recognition"},
}


def assign_tiers(scores: dict[str, dict]) -> dict[str, int]:
    """
    Assign tiers using percentile boundaries computed over the full dataset.
    Bottom 20% → 1, next 25% → 2, next 25% → 3, next 18% → 4, top 12% → 5.
    Returns {award_id: tier}.
    """
    if not scores:
        return {}

    totals = sorted(s["total"] for s in scores.values())
    n = len(totals)

    def pct(p: float) -> int:
        return totals[max(0, min(n - 1, int(p * n)))]

    t1 = pct(0.20)
    t2 = pct(0.45)
    t3 = pct(0.70)
    t4 = pct(0.88)

    log.info(f"Tier thresholds: ≥{t4+1}→5  ≥{t3+1}→4  ≥{t2+1}→3  ≥{t1+1}→2  else→1")

    def tier(total: int) -> int:
        if total > t4: return 5
        if total > t3: return 4
        if total > t2: return 3
        if total > t1: return 2
        return 1

    return {aid: tier(s["total"]) for aid, s in scores.items()}


# ─────────────────────────────────────────────────────────────────────────────
# CACHING  — skip unchanged rows on incremental runs
# ─────────────────────────────────────────────────────────────────────────────

def _file_hash(path: Path) -> str:
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def load_cache(cache_path: Path) -> dict:
    if cache_path.exists():
        try:
            with open(cache_path) as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def save_cache(cache_path: Path, data: dict) -> None:
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    with open(cache_path, "w") as f:
        json.dump(data, f)


# ─────────────────────────────────────────────────────────────────────────────
# SCORING ENGINE  (parallel)
# ─────────────────────────────────────────────────────────────────────────────

def score_all(
    df: pd.DataFrame,
    msg_col: str = "message",
    id_col:  str = "award_id",
    workers: int = 4,
    cache:   Optional[dict] = None,
    no_cache: bool = False,
) -> dict[str, dict]:
    """
    Score all messages in parallel. Returns {award_id: score_dict}.

    Args:
        df:        awards DataFrame
        msg_col:   column containing the message text
        id_col:    column containing the award identifier
        workers:   number of parallel worker processes
        cache:     existing cache dict {award_id: score_dict}
        no_cache:  if True, ignore cache and re-score everything
    """
    cache = {} if no_cache or cache is None else cache
    results: dict[str, dict] = {}

    # Separate rows that need scoring vs cached
    to_score: list[tuple[str, str]] = []
    for _, row in df.iterrows():
        aid = str(row[id_col])
        if aid in cache and not no_cache:
            results[aid] = cache[aid]
        else:
            to_score.append((aid, str(row.get(msg_col, "") or "")))

    cached_count = len(results)
    log.info(f"Scoring {len(to_score)} messages ({cached_count} from cache) with {workers} workers")

    if not to_score:
        return results

    t0 = time.perf_counter()

    if workers <= 1 or len(to_score) < 50:
        # Single-process (simpler on Windows or small datasets)
        for aid, msg in to_score:
            results[aid] = score_message(msg)
    else:
        with ProcessPoolExecutor(max_workers=workers) as ex:
            futs = {ex.submit(_score_row, item): item[0] for item in to_score}
            done = 0
            for fut in as_completed(futs):
                aid, score = fut.result()
                results[aid] = score
                done += 1
                if done % 200 == 0:
                    log.info(f"  Scored {done}/{len(to_score)}…")

    elapsed = time.perf_counter() - t0
    log.info(f"Scoring complete in {elapsed:.2f}s ({len(to_score)/elapsed:.0f} msg/s)")
    return results


# ─────────────────────────────────────────────────────────────────────────────
# AGGREGATE PROFILES
# ─────────────────────────────────────────────────────────────────────────────

def build_recipient_profiles(df: pd.DataFrame, tiers: dict[str, int]) -> dict:
    """Per-employee received-sentiment profile."""
    by_rid: dict[str, list] = defaultdict(list)
    for _, row in df.iterrows():
        aid = str(row["award_id"])
        if aid in tiers:
            by_rid[str(row["recipient_id"])].append({
                "tier":  tiers[aid],
                "date":  str(row.get("award_date", "")),
                "title": str(row.get("award_title", "")),
            })

    profiles = {}
    for rid, entries in by_rid.items():
        tier_list = [e["tier"] for e in entries]
        dist = dict(Counter(tier_list))
        profiles[rid] = {
            "count":  len(tier_list),
            "avg":    round(sum(tier_list) / len(tier_list), 2),
            "dist":   dist,
            "hf":     sum(1 for t in tier_list if t >= 4),   # heartfelt (≥4)
            "perf":   sum(1 for t in tier_list if t <= 1),   # perfunctory (1)
            "recent": sorted(entries, key=lambda e: e["date"], reverse=True)[:3],
        }
    return profiles


def build_nominator_profiles(df: pd.DataFrame, tiers: dict[str, int]) -> dict:
    """Per-nominator writing-quality profile."""
    by_nid: dict[str, list] = defaultdict(list)
    for _, row in df.iterrows():
        aid = str(row["award_id"])
        if aid in tiers:
            by_nid[str(row["nominator_id"])].append({
                "tier":  tiers[aid],
                "name":  str(row.get("nominator_name", "")),
                "dept":  str(row.get("nominator_department", "")),
            })

    profiles = {}
    for nid, entries in by_nid.items():
        tier_list = [e["tier"] for e in entries]
        profiles[nid] = {
            "name":  entries[0]["name"],
            "dept":  entries[0]["dept"],
            "count": len(tier_list),
            "avg":   round(sum(tier_list) / len(tier_list), 2),
            "hf":    sum(1 for t in tier_list if t >= 4),
        }
    return profiles


def build_monthly_trend(df: pd.DataFrame, tiers: dict[str, int]) -> dict[str, float]:
    """Average tier per YYYY-MM."""
    by_month: dict[str, list] = defaultdict(list)
    for _, row in df.iterrows():
        aid = str(row["award_id"])
        if aid in tiers:
            month = str(row.get("award_date", ""))[:7]
            if month:
                by_month[month].append(tiers[aid])
    return {m: round(sum(v) / len(v), 3) for m, v in sorted(by_month.items())}


def build_org_summary(tiers: dict[str, int], scores: dict[str, dict]) -> dict:
    """Org-wide sentiment summary."""
    tier_list = list(tiers.values())
    n = len(tier_list)
    tier_dist = dict(Counter(tier_list))

    return {
        "total_awards":    n,
        "avg_tier":        round(sum(tier_list) / n, 3) if n else 0,
        "tier_dist":       tier_dist,
        "tier_pct": {
            str(t): round(tier_dist.get(t, 0) / n * 100, 1) for t in range(1, 6)
        },
        "avg_dimensions": {
            "depth":  round(sum(s["depth"]  for s in scores.values()) / n, 2) if n else 0,
            "spec":   round(sum(s["spec"]   for s in scores.values()) / n, 2) if n else 0,
            "warmth": round(sum(s["warmth"] for s in scores.values()) / n, 2) if n else 0,
            "pers":   round(sum(s["pers"]   for s in scores.values()) / n, 2) if n else 0,
        },
        "run_at": datetime.now(timezone.utc).isoformat(),
    }


# ─────────────────────────────────────────────────────────────────────────────
# OUTPUT WRITERS
# ─────────────────────────────────────────────────────────────────────────────

def write_awards_csv(
    df: pd.DataFrame,
    scores: dict[str, dict],
    tiers:  dict[str, int],
    path:   Path,
) -> None:
    """Write per-award CSV with all sentiment fields."""
    path.parent.mkdir(parents=True, exist_ok=True)
    rows = []
    for _, row in df.iterrows():
        aid   = str(row["award_id"])
        sc    = scores.get(aid, _empty_score())
        tier  = tiers.get(aid, 3)
        meta  = TIER_META[tier]
        rows.append({
            "award_id":          aid,
            "award_date":        row.get("award_date", ""),
            "award_title":       row.get("award_title", ""),
            "recipient_id":      row.get("recipient_id", ""),
            "recipient_name":    row.get("recipient_name", ""),
            "recipient_dept":    row.get("recipient_department", ""),
            "nominator_id":      row.get("nominator_id", ""),
            "nominator_name":    row.get("nominator_name", ""),
            "nominator_dept":    row.get("nominator_department", ""),
            "category":          row.get("category_name", ""),
            "value":             row.get("value", 0),
            "message_len":       len(str(row.get("message", "") or "")),
            "sentiment_tier":    tier,
            "sentiment_label":   meta["label"],
            "dim_depth":         sc["depth"],
            "dim_specificity":   sc["spec"],
            "dim_warmth":        sc["warmth"],
            "dim_personalization": sc["pers"],
            "sentiment_total":   sc["total"],
        })

    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    log.info(f"Wrote {len(rows)} rows → {path}")


def write_json(data: object, path: Path, label: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, separators=(",", ":"))
    log.info(f"Wrote {label} → {path}")


def write_dashboard_json(
    scores:     dict[str, dict],
    tiers:      dict[str, int],
    recipients: dict,
    nominators: dict,
    monthly:    dict,
    path:       Path,
) -> None:
    """
    Compact payload consumed by SentimentAnalysis.tsx in the Next.js dashboard.
    Uses short keys (t, l, c, bg, d, s, w, p) to minimise bundle size.
    """
    awards_compact = {}
    for aid, sc in scores.items():
        tier = tiers.get(aid, 3)
        meta = TIER_META[tier]
        awards_compact[aid] = {
            "t":   tier,
            "l":   meta["label"],
            "c":   meta["color"],
            "bg":  meta["bg"],
            "d":   sc["depth"],
            "s":   sc["spec"],
            "w":   sc["warmth"],
            "p":   sc["pers"],
            "tot": sc["total"],
        }

    write_json(
        {
            "awards":     awards_compact,
            "recipients": recipients,
            "monthly":    monthly,
            "nominators": nominators,
        },
        path,
        "dashboard JSON",
    )


# ─────────────────────────────────────────────────────────────────────────────
# MAIN PIPELINE
# ─────────────────────────────────────────────────────────────────────────────

def run(
    input_csv:  Path,
    output_dir: Path,
    workers:    int  = 4,
    no_cache:   bool = False,
) -> dict:
    """
    Full sentiment pipeline.

    Returns:
        dict with keys: scores, tiers, summary, recipient_profiles,
                         nominator_profiles, monthly_trend
    """
    t_start = time.perf_counter()
    output_dir.mkdir(parents=True, exist_ok=True)
    cache_path = output_dir / ".sentiment_cache.json"

    log.info("=" * 60)
    log.info("SENTIMENT ANALYSIS PIPELINE")
    log.info("=" * 60)
    log.info(f"Input:  {input_csv}")
    log.info(f"Output: {output_dir}")
    log.info(f"Workers: {workers} | Cache: {'disabled' if no_cache else 'enabled'}")

    # ── 1. Load data ──────────────────────────────────────────────────────────
    if not input_csv.exists():
        raise FileNotFoundError(f"Input CSV not found: {input_csv}")

    df = pd.read_csv(input_csv)
    required = ["award_id", "message", "recipient_id", "nominator_id"]
    missing  = [c for c in required if c not in df.columns]
    if missing:
        raise KeyError(f"Missing columns in CSV: {missing}. Check column names.")

    df["message"] = df["message"].fillna("").astype(str)
    log.info(f"Loaded {len(df):,} awards")

    # ── 2. Check cache validity ───────────────────────────────────────────────
    file_hash = _file_hash(input_csv)
    cache = load_cache(cache_path)

    if not no_cache and cache.get("__meta__", {}).get("file_hash") == file_hash:
        log.info("Input file unchanged — loading scores from cache")
        cached_scores = cache.get("scores", {})
    else:
        if no_cache:
            log.info("Cache disabled — scoring all messages")
        else:
            log.info("Input file changed or no cache — scoring all messages")
        cached_scores = {}

    # ── 3. Score messages ─────────────────────────────────────────────────────
    scores = score_all(df, workers=workers, cache=cached_scores, no_cache=no_cache)

    # Persist cache
    save_cache(cache_path, {
        "__meta__": {"file_hash": file_hash, "scored_at": datetime.now(timezone.utc).isoformat()},
        "scores": scores,
    })

    # ── 4. Assign tiers (percentile-based) ───────────────────────────────────
    tiers = assign_tiers(scores)

    # ── 5. Build profiles ─────────────────────────────────────────────────────
    log.info("Building recipient profiles…")
    recipients = build_recipient_profiles(df, tiers)

    log.info("Building nominator profiles…")
    nominators = build_nominator_profiles(df, tiers)

    log.info("Building monthly trend…")
    monthly = build_monthly_trend(df, tiers)

    # ── 6. Org summary ────────────────────────────────────────────────────────
    summary = build_org_summary(tiers, scores)

    # ── 7. Write outputs ─────────────────────────────────────────────────────
    write_awards_csv(df, scores, tiers, output_dir / "sentiment_awards.csv")
    write_json(summary,    output_dir / "sentiment_summary.json",   "summary")
    write_json(recipients, output_dir / "sentiment_employees.json", "employee profiles")
    write_json(nominators, output_dir / "sentiment_nominators.json","nominator profiles")
    write_dashboard_json(
        scores, tiers, recipients, nominators, monthly,
        output_dir / "sentiment_dashboard.json",
    )

    # ── 8. Print report ───────────────────────────────────────────────────────
    elapsed = time.perf_counter() - t_start
    tier_dist = summary["tier_dist"]
    n = summary["total_awards"]

    log.info("=" * 60)
    log.info("RESULTS")
    log.info("=" * 60)
    for t in range(5, 0, -1):
        count = tier_dist.get(t, 0)
        bar   = "█" * int(count / n * 40)
        log.info(f"  {t} {TIER_META[t]['label']:20s} {count:5d}  {bar}")
    log.info(f"\n  Avg tier:     {summary['avg_tier']:.2f} / 5")
    log.info(f"  Recipients:   {len(recipients)}")
    log.info(f"  Nominators:   {len(nominators)}")
    log.info(f"  Run time:     {elapsed:.1f}s")
    log.info("=" * 60)

    return {
        "scores":            scores,
        "tiers":             tiers,
        "summary":           summary,
        "recipient_profiles":recipients,
        "nominator_profiles":nominators,
        "monthly_trend":     monthly,
    }


# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Sentiment analysis pipeline for HR recognition messages",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python sentiment_pipeline.py
  python sentiment_pipeline.py --input data/raw/awards_enriched.csv
  python sentiment_pipeline.py --output-dir outputs/sentiment_2025
  python sentiment_pipeline.py --workers 8 --no-cache
  python sentiment_pipeline.py --dry-run

Cron (4 AM daily):
  0 4 * * * cd /path/to/project && python sentiment_pipeline.py >> logs/sentiment.log 2>&1
        """,
    )
    parser.add_argument(
        "--input", "-i",
        type=Path,
        default=DEFAULT_INPUT,
        help=f"Path to awards CSV (default: {DEFAULT_INPUT})",
    )
    parser.add_argument(
        "--output-dir", "-o",
        type=Path,
        default=OUTPUT_DIR,
        help=f"Output directory (default: {OUTPUT_DIR})",
    )
    parser.add_argument(
        "--workers", "-w",
        type=int,
        default=4,
        help="Parallel workers for scoring (default: 4)",
    )
    parser.add_argument(
        "--no-cache",
        action="store_true",
        help="Ignore cache and re-score all messages",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Load and validate data but do not write any output files",
    )
    args = parser.parse_args()

    if args.dry_run:
        log.info("DRY RUN — loading and validating only")
        df = pd.read_csv(args.input)
        log.info(f"Loaded {len(df)} rows. Columns: {list(df.columns)}")
        sample = df["message"].dropna().iloc[0] if "message" in df.columns else ""
        sc = score_message(str(sample))
        log.info(f"Sample score: {sc}")
        log.info("Dry run complete — no files written.")
        return

    run(
        input_csv  = args.input,
        output_dir = args.output_dir,
        workers    = args.workers,
        no_cache   = args.no_cache,
    )


if __name__ == "__main__":
    main()