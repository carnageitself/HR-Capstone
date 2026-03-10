"""
sentiment_scoring_vader.py
────────────────────────────────────────────────────────────────────────────────
Scores every row in awards_enriched.csv using VADER sentiment analysis.
Outputs awards_enriched_with_sentiment.csv + sentiment_summary.json.

Install once:
    pip install vaderSentiment pandas

Run:
    python sentiment_scoring_vader.py
    python sentiment_scoring_vader.py --input awards_enriched.csv --output awards_enriched_with_sentiment.csv

Why VADER over a manual lexicon:
  ✓ 7,500+ word lexicon (vs ~150 handcoded)
  ✓ Handles punctuation boosts  (great!! > great)
  ✓ Handles ALL-CAPS emphasis   (GREAT > great)
  ✓ Handles degree modifiers    (very great, barely good)
  ✓ Handles 4-word negation window (not at all great)
  ✓ Validated on real human-written text

New columns added to CSV
────────────────────────
  vader_compound       float  [-1.0 → +1.0]  THE main score — use this everywhere
  vader_positive       float  [0.0  → 1.0]   proportion of positive tokens
  vader_negative       float  [0.0  → 1.0]   proportion of negative tokens
  vader_neutral        float  [0.0  → 1.0]   proportion of neutral tokens
                               Note: pos + neg + neu always = 1.0
  sentiment_label      str    Highly Positive / Positive / Neutral /
                               Negative / Highly Negative
  word_count           int    number of tokens in the message
"""

import csv
import json
import argparse
from collections import defaultdict
from pathlib import Path

try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
except ImportError:
    print("\n" + "="*60)
    print("ERROR: vaderSentiment is not installed.")
    print("Fix:   pip install vaderSentiment")
    print("="*60 + "\n")
    raise


# ─────────────────────────────────────────────────────────────────────────────
# LABEL THRESHOLDS
# ─────────────────────────────────────────────────────────────────────────────
# HR recognition messages skew heavily positive, so we use tighter thresholds
# than VADER's default (>=0.05 positive, <=-0.05 negative).
# This gives more meaningful bucketing across the dataset.

def label_compound(score: float) -> str:
    if score >= 0.6:   return "Highly Positive"
    elif score >= 0.2: return "Positive"
    elif score >= -0.1:return "Neutral"
    elif score >= -0.4:return "Negative"
    else:              return "Highly Negative"


# ─────────────────────────────────────────────────────────────────────────────
# PROCESSING
# ─────────────────────────────────────────────────────────────────────────────

def process(input_path: str, output_path: str, summary_path: str) -> None:
    print(f"\n{'='*60}")
    print("VADER SENTIMENT SCORING")
    print(f"{'='*60}")
    print(f"  Input:   {input_path}")
    print(f"  Output:  {output_path}")
    print(f"  Summary: {summary_path}")

    # Initialise VADER — loads its full 7,500-word lexicon
    analyzer = SentimentIntensityAnalyzer()
    print("  VADER lexicon loaded ✓")

    with open(input_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        original_fields = list(reader.fieldnames or [])

    print(f"  Rows:    {len(rows)}\n")
    print("Scoring", end="", flush=True)

    # ── Per-row scoring ──────────────────────────────────────────────────────
    scored = []
    all_compound   : list[float] = []
    all_labels     : list[str]   = []
    by_category    : dict[str, list[float]] = defaultdict(list)
    by_department  : dict[str, list[float]] = defaultdict(list)
    by_seniority   : dict[str, list[float]] = defaultdict(list)

    for i, row in enumerate(rows):
        msg = row.get("message", "")

        # VADER returns: {"pos": 0.x, "neg": 0.x, "neu": 0.x, "compound": 0.x}
        scores = analyzer.polarity_scores(msg)

        compound = round(scores["compound"], 4)
        positive = round(scores["pos"],      4)
        negative = round(scores["neg"],      4)
        neutral  = round(scores["neu"],      4)
        label    = label_compound(compound)
        wc       = len(msg.split())

        # Write new columns
        row["vader_compound"]  = compound
        row["vader_positive"]  = positive
        row["vader_negative"]  = negative
        row["vader_neutral"]   = neutral
        row["sentiment_label"] = label
        row["word_count"]      = wc

        scored.append(row)

        # Accumulate for summary stats
        all_compound.append(compound)
        all_labels.append(label)
        by_category[row.get("category_name", "Unknown")].append(compound)
        by_department[row.get("recipient_department", "Unknown")].append(compound)
        by_seniority[row.get("recipient_seniority", "Unknown")].append(compound)

        if (i + 1) % 200 == 0:
            print(f" {i+1}", end="", flush=True)

    print(f" {len(rows)} ✓")

    # ── Write enriched CSV ───────────────────────────────────────────────────
    # Deduplicate fields (safe to re-run on already-enriched files)
    new_fields = original_fields + [
        "vader_compound", "vader_positive", "vader_negative",
        "vader_neutral", "sentiment_label", "word_count"
    ]
    seen: set[str] = set()
    deduped: list[str] = []
    for f in new_fields:
        if f not in seen:
            deduped.append(f)
            seen.add(f)

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=deduped, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(scored)

    print(f"  Saved → {output_path}")

    # ── Build summary JSON ───────────────────────────────────────────────────
    def avg(lst: list[float]) -> float:
        return round(sum(lst) / len(lst), 4) if lst else 0.0

    def pct(lst: list[float], lo: float, hi: float) -> float:
        return round(sum(1 for x in lst if lo <= x < hi) / len(lst) * 100, 1) if lst else 0.0

    label_counts: dict[str, int] = defaultdict(int)
    for l in all_labels:
        label_counts[l] += 1

    # By category
    category_stats = {}
    for cat, vals in sorted(by_category.items(), key=lambda x: avg(x[1]), reverse=True):
        category_stats[cat] = {
            "avg_compound":         avg(vals),
            "count":                len(vals),
            "pct_highly_positive":  pct(vals,  0.6,  2.0),
            "pct_positive":         pct(vals,  0.2,  0.6),
            "pct_neutral":          pct(vals, -0.1,  0.2),
            "pct_negative_or_below":pct(vals, -2.0, -0.1),
        }

    # By department
    dept_stats = {}
    for dept, vals in sorted(by_department.items(), key=lambda x: avg(x[1]), reverse=True):
        dept_stats[dept] = {
            "avg_compound": avg(vals),
            "count":        len(vals),
        }

    # By seniority
    seniority_stats = {}
    for seniority, vals in sorted(by_seniority.items(), key=lambda x: avg(x[1]), reverse=True):
        seniority_stats[seniority] = {
            "avg_compound": avg(vals),
            "count":        len(vals),
        }

    # Top and bottom messages
    def msg_card(row: dict) -> dict:
        return {
            "award_id":        row.get("award_id"),
            "recipient":       row.get("recipient_name"),
            "department":      row.get("recipient_department"),
            "category":        row.get("category_name"),
            "vader_compound":  row["vader_compound"],
            "sentiment_label": row["sentiment_label"],
            "preview":         row.get("message", "")[:120] + "...",
        }

    sorted_rows = sorted(scored, key=lambda r: float(r["vader_compound"]), reverse=True)

    summary = {
        "meta": {
            "method":       "VADER (vaderSentiment)",
            "lexicon_size": "7,500+ words",
            "total_scored": len(rows),
            "output_file":  output_path,
        },
        "overview": {
            "avg_compound":   avg(all_compound),
            "avg_word_count": round(avg([float(r["word_count"]) for r in scored]), 1),
        },
        "distribution": {
            "highly_positive_pct": pct(all_compound,  0.6,  2.0),
            "positive_pct":        pct(all_compound,  0.2,  0.6),
            "neutral_pct":         pct(all_compound, -0.1,  0.2),
            "negative_pct":        pct(all_compound, -0.4, -0.1),
            "highly_negative_pct": pct(all_compound, -2.0, -0.4),
            "label_counts":        dict(label_counts),
        },
        "by_category":   category_stats,
        "by_department": dept_stats,
        "by_seniority":  seniority_stats,
        "top_10_most_positive":  [msg_card(r) for r in sorted_rows[:10]],
        "top_10_most_negative":  [msg_card(r) for r in sorted_rows[-10:]],
    }

    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)

    print(f"  Saved → {summary_path}")

    # ── Print results ────────────────────────────────────────────────────────
    ov   = summary["overview"]
    dist = summary["distribution"]

    print(f"\n{'='*60}")
    print("RESULTS")
    print(f"{'='*60}")
    print(f"  Avg compound score:  {ov['avg_compound']:+.4f}  (range -1.0 to +1.0)")
    print(f"  Avg word count:      {ov['avg_word_count']}")
    print(f"\n  Sentiment Distribution:")
    for label, val, icon in [
        ("Highly Positive", dist["highly_positive_pct"],  "🟢"),
        ("Positive",        dist["positive_pct"],          "🟩"),
        ("Neutral",         dist["neutral_pct"],           "⬜"),
        ("Negative",        dist["negative_pct"],          "🟥"),
        ("Highly Negative", dist["highly_negative_pct"],   "🔴"),
    ]:
        bar = "█" * int(val / 2)
        print(f"    {icon} {label:<18} {val:5.1f}%  {bar}")

    print(f"\n  By Category:")
    for cat, s in summary["by_category"].items():
        bar = "█" * int(s["avg_compound"] * 20)
        print(f"    {cat[:38]:<38} {s['avg_compound']:+.4f}  {bar}")

    print(f"\n  By Department:")
    for dept, s in summary["by_department"].items():
        bar = "█" * int(s["avg_compound"] * 20)
        print(f"    {dept:<22} {s['avg_compound']:+.4f}  n={s['count']:<4}  {bar}")

    print(f"\n{'='*60}")
    print(f"Next step: copy {output_path}")
    print(f"        → employee-dashboard/data/awards_enriched_with_sentiment.csv")
    print(f"{'='*60}\n")


# ─────────────────────────────────────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input",   default="awards_enriched.csv")
    parser.add_argument("--output",  default="awards_enriched_with_sentiment.csv")
    parser.add_argument("--summary", default="sentiment_summary.json")
    args = parser.parse_args()
    process(args.input, args.output, args.summary)