#!/usr/bin/env python3
"""
Create taxonomy from recognition data using iterative LLM analysis.

Stage 1: Build a grounded-theory taxonomy from employee recognition messages.
Uses Ollama (local) as primary — free, no API keys, no rate limits.
Includes retry logic and robust JSON parsing for local models.

Usage:
    ollama pull llama3.1
    python create_taxonomy.py
"""

import sys
import os
import json
import re
import requests
import pandas as pd
import numpy as np
import json5
import time
from typing import Dict, Any, Optional, Tuple
import copy
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

# Retry config
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds


# ---------------------------------------------------------------------------
# Unified LLM call with fallback
# ---------------------------------------------------------------------------
def get_llm_response(text: str, temperature: float = 0.7, max_tokens: int = 4096) -> Tuple[str, str]:
    """Call LLM with retries. Tries Ollama → Claude → Gemini."""
    errors = []

    if OLLAMA_AVAILABLE:
        for attempt in range(MAX_RETRIES):
            try:
                r = requests.post(
                    f"{OLLAMA_URL}/api/generate",
                    json={
                        "model": OLLAMA_MODEL,
                        "prompt": text,
                        "stream": False,
                        "options": {
                            "temperature": temperature,
                            "num_predict": max_tokens,
                        },
                    },
                    timeout=600,
                )
                r.raise_for_status()
                response_text = r.json().get("response", "")
                if response_text.strip():
                    return response_text, "ollama"
                else:
                    errors.append(f"Ollama attempt {attempt+1}: empty response")
            except Exception as e:
                errors.append(f"Ollama attempt {attempt+1}: {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY)

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
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                ),
            )
            return res.text, "gemini"
        except Exception as e:
            errors.append(f"Gemini: {e}")

    raise RuntimeError("All LLM providers failed:\n" + "\n".join(errors))


# ---------------------------------------------------------------------------
# Robust JSON parsing — handles messy LLM output
# ---------------------------------------------------------------------------
def to_json(raw: str) -> Optional[Dict[str, Any]]:
    """Extract JSON from potentially messy LLM output."""
    if not raw:
        return None
    raw = raw.strip()

    # 1. Try to extract from markdown code blocks first
    code_block = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', raw)
    if code_block:
        try:
            return json5.loads(code_block.group(1))
        except:
            pass

    # 2. Find the outermost { } pair
    depth = 0
    start = None
    for i, c in enumerate(raw):
        if c == '{':
            if depth == 0:
                start = i
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0 and start is not None:
                candidate = raw[start:i+1]
                try:
                    return json5.loads(candidate)
                except:
                    pass
                # Try fixing common issues
                try:
                    # Fix trailing commas before } or ]
                    fixed = re.sub(r',\s*([}\]])', r'\1', candidate)
                    return json5.loads(fixed)
                except:
                    pass

    # 3. Fallback: brute force find { and }
    nf = lambda v, t: v if v >= 0 else t
    lc = nf(raw.find("{"), len(raw))
    rc = nf(raw.rfind("}"), 0) + 1
    if lc < rc:
        candidate = raw[lc:rc]
        try:
            return json5.loads(candidate)
        except:
            # Try fixing
            fixed = re.sub(r',\s*([}\]])', r'\1', candidate)
            try:
                return json5.loads(fixed)
            except:
                pass

    return None


# ---------------------------------------------------------------------------
# Data formatting
# ---------------------------------------------------------------------------
def format_recognition_info(row: pd.Series) -> str:
    parts = []
    if pd.notna(row.get("nominator_title")):
        parts.append(f"Nominator role: {row['nominator_title']}")
    if pd.notna(row.get("recipient_title")):
        parts.append(f"Recipient role: {row['recipient_title']}")
    if pd.notna(row.get("award_title")):
        parts.append(f"Award: {row['award_title']}")
    if pd.notna(row.get("message")):
        # Truncate very long messages to keep prompt manageable
        msg = str(row['message'])[:500]
        parts.append(f"Message: {msg}")
    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Batch processing with retries
# ---------------------------------------------------------------------------
def process_batch(
    batch_id: int, df: pd.DataFrame,
    existing_taxonomy: Optional[Dict[str, Any]] = None,
    responses_dir: str = "llm_responses",
) -> Optional[Dict[str, Any]]:
    """Process one batch with retry logic for JSON parsing failures."""
    os.makedirs(responses_dir, exist_ok=True)
    batch_rows = df[df["batch_id"] == batch_id]
    content = "\n\n".join(batch_rows["summary_dict_batch"].values)

    if existing_taxonomy is None:
        prompt = f"""You are a qualitative researcher using grounded theory.

Analyse this employee recognition data and create a taxonomy of what employees get recognised for.

DATA:
{content}

INSTRUCTIONS:
- Create 5-8 main categories focused on areas of IMPACT (not skills)
- Each category needs a short description and 2-5 subcategories
- Subcategories are just names, no descriptions needed
- Return ONLY a JSON object, nothing else

FORMAT (return exactly this structure):
{{
  "recognition_taxonomy": {{
    "Category Name": {{
      "description": "short description",
      "subcategories": ["Sub1", "Sub2", "Sub3"]
    }}
  }}
}}"""
    else:
        prompt = f"""You are a qualitative researcher analysing recognition data incrementally.

DATA:
{content}

EXISTING TAXONOMY:
{json.dumps(existing_taxonomy, indent=2)}

INSTRUCTIONS:
- Check if the data reveals any NEW categories or subcategories NOT already in the taxonomy
- Return ONLY the NEW additions (not existing ones)
- If nothing new, return: {{"recognition_taxonomy": {{}}}}
- Focus on areas of impact, not skills
- Return ONLY a JSON object, nothing else

FORMAT:
{{
  "recognition_taxonomy": {{
    "New Category": {{
      "description": "short description",
      "subcategories": ["NewSub1", "NewSub2"]
    }}
  }}
}}"""

    # Try up to MAX_RETRIES times to get valid JSON
    last_text = ""
    for attempt in range(MAX_RETRIES):
        text, provider = get_llm_response(prompt)
        last_text = text

        resp_path = os.path.join(responses_dir, f"response_batch_{batch_id}_attempt_{attempt}.json")
        with open(resp_path, "w") as f:
            json.dump({"batch_id": batch_id, "provider": provider, "attempt": attempt, "text": text}, f, indent=2)

        parsed = to_json(text)
        if parsed is not None:
            # Save successful response
            resp_path = os.path.join(responses_dir, f"response_batch_{batch_id}.json")
            with open(resp_path, "w") as f:
                json.dump({"batch_id": batch_id, "provider": provider, "text": text}, f, indent=2)
            return parsed

        if attempt < MAX_RETRIES - 1:
            time.sleep(RETRY_DELAY)

    # All retries failed to produce valid JSON — skip this batch
    print(f"\n  ⚠ Batch {batch_id}: Could not parse JSON after {MAX_RETRIES} attempts, skipping")
    return None


def merge_taxonomies(base: Dict[str, Any], additions: Dict[str, Any]) -> Dict[str, Any]:
    result = copy.deepcopy(base)
    base_rec = result.get("recognition_taxonomy", {})
    add_rec = additions.get("recognition_taxonomy", {})
    for cat, data in add_rec.items():
        if cat in base_rec:
            existing = base_rec[cat].get("subcategories", [])
            for sub in data.get("subcategories", []):
                if sub not in existing:
                    existing.append(sub)
            base_rec[cat]["subcategories"] = existing
        else:
            base_rec[cat] = data
    return result


def compress_taxonomy(taxonomy: Dict[str, Any]) -> Dict[str, Any]:
    """Ask LLM to merge overlapping categories."""
    num_cats = len(taxonomy.get("recognition_taxonomy", {}))
    prompt = f"""You are a taxonomy expert. Clean up this recognition taxonomy.

CURRENT TAXONOMY ({num_cats} categories):
{json.dumps(taxonomy, indent=2)}

INSTRUCTIONS:
1. Merge overlapping or very similar categories (e.g. "Teamwork" and "Support and Collaboration" should be one)
2. Remove duplicate subcategories
3. Aim for 6-10 clean, distinct categories
4. Each category should have 3-6 unique subcategories
5. Keep short descriptions for main categories only
6. Return ONLY a JSON object, nothing else

FORMAT:
{{
  "recognition_taxonomy": {{
    "Category Name": {{
      "description": "short description",
      "subcategories": ["Sub1", "Sub2", "Sub3"]
    }}
  }}
}}"""

    for attempt in range(MAX_RETRIES):
        text, _ = get_llm_response(prompt, max_tokens=5000)
        parsed = to_json(text)
        if parsed and "recognition_taxonomy" in parsed:
            return parsed
        time.sleep(RETRY_DELAY)

    print("  ⚠ Compression failed, keeping current taxonomy")
    return taxonomy


def add_ids_to_taxonomy(taxonomy: Dict[str, Any]) -> Dict[str, Any]:
    letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    result = {"recognition_taxonomy": {}}
    for i, (name, data) in enumerate(taxonomy["recognition_taxonomy"].items()):
        cid = letters[i] if i < 26 else f"Z{i - 25}"
        subs = [{"id": f"{cid}{j}", "name": s}
                for j, s in enumerate(data.get("subcategories", []), 1)]
        result["recognition_taxonomy"][name] = {
            "id": cid, "description": data.get("description", ""), "subcategories": subs
        }
    return result


# ---------------------------------------------------------------------------
# Main orchestration
# ---------------------------------------------------------------------------
def run_taxonomy_creation(
    df, start_batch=1, end_batch=100,
    output_dir="taxonomy_results", responses_dir="llm_responses",
    compress_every=10,
):
    os.makedirs(output_dir, exist_ok=True)
    taxonomy = None
    skipped = 0

    for batch in tqdm(range(start_batch, end_batch + 1), desc="Building taxonomy"):
        if batch not in df["batch_id"].values:
            continue
        try:
            additions = process_batch(batch, df, taxonomy, responses_dir)

            if additions is None:
                skipped += 1
                continue  # Skip this batch, don't break

            if taxonomy is None:
                taxonomy = additions
            else:
                add_rec = additions.get("recognition_taxonomy", {})
                if add_rec:  # Only merge if there are actual additions
                    taxonomy = merge_taxonomies(taxonomy, additions)

            # Save checkpoint
            with open(os.path.join(output_dir, f"taxonomy_batch_{batch}.json"), "w") as f:
                json.dump(taxonomy, f, indent=2)

            # Periodic compression
            if batch % compress_every == 0 and taxonomy:
                print(f"\n  Compressing taxonomy after batch {batch}…")
                taxonomy = compress_taxonomy(taxonomy)
                with open(os.path.join(output_dir, f"taxonomy_compressed_{batch}.json"), "w") as f:
                    json.dump(taxonomy, f, indent=2)

        except Exception as e:
            print(f"\n  ⚠ Error on batch {batch}: {e} — continuing…")
            skipped += 1
            continue  # Don't break, continue to next batch

    if skipped > 0:
        print(f"\n  Skipped {skipped} batches due to errors")

    return taxonomy


def get_input(prompt, default, validation_fn=None):
    while True:
        value = input(f"{prompt} [{default}]: ").strip() or default
        if validation_fn is None or validation_fn(value):
            return value
        print("Invalid input, try again.")


def main():
    print("=" * 55)
    print("  Stage 1 — Taxonomy Creation")
    print("=" * 55)

    input_file = get_input("Path to awards CSV", "mockup_awards.csv",
                           lambda x: os.path.exists(x))
    sample_size = int(get_input("Sample size", "1000", lambda x: x.isdigit() and int(x) > 0))
    batch_size = int(get_input("Rows per batch", "20", lambda x: x.isdigit() and int(x) > 0))
    compress_every = int(get_input("Compress every N batches", "10", lambda x: x.isdigit() and int(x) > 0))
    output_dir = get_input("Output directory", "taxonomy_results")
    responses_dir = get_input("Responses directory", "llm_responses")

    print("\nLoading data…")
    df = pd.read_csv(input_file)
    print(f"  {len(df)} rows loaded.")

    df_sample = df.sample(n=min(sample_size, len(df)), random_state=42)
    df_sample = df_sample.drop_duplicates(subset=["message"]).reset_index(drop=True)
    print(f"  {len(df_sample)} unique messages after dedup.")

    df_sample["formatted_info"] = df_sample.apply(format_recognition_info, axis=1)
    df_sample["batch_id"] = np.ceil((np.arange(len(df_sample)) + 1) / batch_size).astype(int)
    df_sample["row_in_batch"] = "row" + ((np.arange(len(df_sample)) % batch_size) + 1).astype(str)
    df_sample["summary_dict_batch"] = df_sample["row_in_batch"] + ": " + df_sample["formatted_info"]

    total_batches = df_sample["batch_id"].max()
    end_batch = (total_batches // compress_every) * compress_every
    if end_batch == 0:
        end_batch = total_batches

    print(f"\n  Total batches: {total_batches} (processing up to {end_batch})")
    print(f"  Compression every {compress_every} batches")
    print(f"  Retries per batch: {MAX_RETRIES}")

    confirm = input("\nProceed? [Y/n]: ").strip().lower()
    if confirm == "n":
        sys.exit(0)

    # Clean previous results
    import shutil
    if os.path.exists(output_dir):
        confirm_clean = input(f"\n  {output_dir}/ already exists. Delete old results? [Y/n]: ").strip().lower()
        if confirm_clean != "n":
            shutil.rmtree(output_dir)
            print(f"  Cleaned {output_dir}/")
    if os.path.exists(responses_dir):
        confirm_clean = input(f"  {responses_dir}/ already exists. Delete old responses? [Y/n]: ").strip().lower()
        if confirm_clean != "n":
            shutil.rmtree(responses_dir)
            print(f"  Cleaned {responses_dir}/")

    taxonomy = run_taxonomy_creation(
        df_sample, 1, end_batch, output_dir, responses_dir, compress_every)

    if not taxonomy:
        print("\nTaxonomy creation failed — no batches produced valid output.")
        sys.exit(1)

    print("\nFinal compression pass…")
    taxonomy = compress_taxonomy(taxonomy)

    taxonomy_with_ids = add_ids_to_taxonomy(taxonomy)
    final_path = os.path.join(output_dir, "compressed_taxonomy_with_ids.json")
    with open(final_path, "w") as f:
        json.dump(taxonomy_with_ids, f, indent=2)

    cats = taxonomy_with_ids["recognition_taxonomy"]
    print(f"\n{'='*55}")
    print(f"✅ Taxonomy saved to: {final_path}")
    print(f"   {len(cats)} categories:")
    for name, data in cats.items():
        print(f"   • {data['id']} — {name}: {len(data['subcategories'])} subcategories")
    print(f"{'='*55}")


if __name__ == "__main__":
    main()