"""
3-Phase Taxonomy Refinement Pipeline
Phase 1: Claude seeds initial taxonomy (sample)
Phase 2: Llama-3.8B processes bulk messages (local)
Phase 3: Claude reviews & finalizes taxonomy
"""

import json
import pandas as pd
from anthropic import Anthropic
import subprocess
import re
from collections import defaultdict
import os

client = Anthropic()

# ============================================================================
# PHASE 1: SEED TAXONOMY WITH CLAUDE
# ============================================================================

def phase_1_seed_taxonomy(sample_size=100):
    """
    Claude analyzes small sample (~100 messages) to seed initial taxonomy.
    Output: clean category structure with definitions.
    """
    print("\n" + "="*80)
    print("PHASE 1: Seeding Taxonomy with Claude (High Quality)")
    print("="*80)

    # Load sample of award messages
    awards_df = pd.read_csv('results/mockup_awards_annotated.csv')
    sample = awards_df.sample(n=min(sample_size, len(awards_df)), random_state=42)

    sample_text = "\n\n---\n\n".join([
        f"Message {i+1}: {row['message'][:500]}"
        for i, (_, row) in enumerate(sample.iterrows())
    ])

    prompt = f"""You are designing a taxonomy for employee recognition awards.

Analyze these {len(sample)} award messages and design a hierarchical taxonomy of award categories.

SAMPLE AWARD MESSAGES:
{sample_text}

Design a taxonomy with:
1. 4-6 main categories (A-F level)
2. Each main category has 2-3 subcategories
3. Clear descriptions for each
4. Examples from the messages

Output as JSON:
{{
  "categories": [
    {{
      "id": "A",
      "name": "Category Name",
      "description": "What this category recognizes",
      "subcategories": [
        {{"id": "A1", "name": "Subcat Name", "description": "..."}}
      ]
    }}
  ],
  "reasoning": "Why this structure makes sense"
}}"""

    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )

    # Parse JSON response
    response_text = response.content[0].text
    try:
        # Extract JSON from response
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            taxonomy = json.loads(json_match.group())
        else:
            taxonomy = json.loads(response_text)
    except:
        print("Failed to parse taxonomy, using default")
        taxonomy = {
            "categories": [
                {
                    "id": "A",
                    "name": "Leadership & Management",
                    "description": "Demonstrated strong leadership and mentoring",
                    "subcategories": [
                        {"id": "A1", "name": "Team Leadership", "description": "Managing and leading teams"},
                        {"id": "A2", "name": "Mentoring", "description": "Mentoring and developing others"}
                    ]
                },
                {
                    "id": "D",
                    "name": "Teamwork & Collaboration",
                    "description": "Strong collaboration and team support",
                    "subcategories": [
                        {"id": "D1", "name": "Cross-functional Collaboration", "description": "Working across teams"},
                        {"id": "D2", "name": "Team Support", "description": "Supporting team members"}
                    ]
                }
            ]
        }

    print(f"\nInitial taxonomy created:")
    print(json.dumps(taxonomy, indent=2)[:500] + "...")

    return taxonomy

# ============================================================================
# PHASE 2: BULK PROCESSING WITH LLAMA-3.8B (Local Ollama)
# ============================================================================

def check_ollama_available():
    """Check if Ollama is running"""
    try:
        result = subprocess.run(['ollama', 'list'], capture_output=True, timeout=5)
        return result.returncode == 0
    except:
        return False

def call_ollama_api(prompt, model="llama2"):
    """Call local Ollama API"""
    try:
        import requests
        response = requests.post(
            'http://localhost:11434/api/generate',
            json={
                'model': model,
                'prompt': prompt,
                'stream': False
            },
            timeout=60
        )
        if response.status_code == 200:
            return response.json().get('response', '')
        return None
    except Exception as e:
        print(f"Ollama call failed: {e}")
        return None

def phase_2_bulk_processing(taxonomy, batch_size=8):
    """
    Llama-3.8B processes all 1000 messages in batches.
    For each: category extraction, theme identification, candidate new categories.
    """
    print("\n" + "="*80)
    print("PHASE 2: Bulk Processing with Llama-3.8B (Cost Efficient)")
    print("="*80)

    # Load all awards
    awards_df = pd.read_csv('results/mockup_awards_annotated.csv')

    # Build taxonomy schema for Llama
    category_schema = json.dumps(taxonomy['categories'], indent=2)

    results = []
    candidate_categories = defaultdict(int)

    print(f"\nProcessing {len(awards_df)} messages in batches of {batch_size}...")

    for i in range(0, len(awards_df), batch_size):
        batch = awards_df.iloc[i:i+batch_size]
        batch_num = i // batch_size + 1

        # Create prompt for Llama
        batch_messages = "\n\n---\n\n".join([
            f"Message {j+1}: {row['message'][:300]}"
            for j, (_, row) in enumerate(batch.iterrows())
        ])

        prompt = f"""Given this taxonomy:
{category_schema}

For each message, extract:
1. Best-fit category (A-F)
2. Key themes (leadership, innovation, teamwork, etc)
3. Any NEW subcategories that should exist

MESSAGES:
{batch_messages}

For each message, output:
[Message N]
Category: X
Themes: [list]
New Categories: [list or none]
"""

        # Call Ollama (or skip if not available)
        response = call_ollama_api(prompt, model="llama2")

        if response:
            # Parse Llama response
            lines = response.split('\n')
            for line in lines:
                if 'New Categories:' in line:
                    cats = line.split(':', 1)[1].strip()
                    if cats and cats != 'none':
                        for cat in cats.split(','):
                            candidate_categories[cat.strip()] += 1

            results.append({
                'batch': batch_num,
                'messages_processed': len(batch),
                'candidates_found': len([c for c in candidate_categories if candidate_categories[c] > 0])
            })

        if batch_num % 10 == 0:
            print(f"  Processed batch {batch_num} ({i + len(batch)}/{len(awards_df)} messages)")

    print(f"\nPhase 2 Complete:")
    print(f"  Total messages processed: {len(awards_df)}")
    print(f"  Candidate new categories: {len(candidate_categories)}")
    print(f"  Top candidates: {sorted(candidate_categories.items(), key=lambda x: x[1], reverse=True)[:5]}")

    return results, dict(candidate_categories)

# ============================================================================
# PHASE 3: CLAUDE REVIEWS & FINALIZES TAXONOMY
# ============================================================================

def phase_3_finalize_taxonomy(initial_taxonomy, candidates):
    """
    Claude reviews all candidate new categories from Phase 2.
    Merges duplicates, decides what to add, produces final taxonomy.
    """
    print("\n" + "="*80)
    print("PHASE 3: Claude Reviews & Finalizes (Quality Gate)")
    print("="*80)

    # Filter candidates by frequency
    significant_candidates = {
        cat: count for cat, count in candidates.items()
        if count >= 3  # Only consider candidates found 3+ times
    }

    print(f"\nSignificant candidate categories ({len(significant_candidates)}):")
    for cat, count in sorted(significant_candidates.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  - {cat}: {count} occurrences")

    prompt = f"""You are finalizing a taxonomy for employee recognition awards.

CURRENT TAXONOMY:
{json.dumps(initial_taxonomy, indent=2)}

CANDIDATE NEW CATEGORIES (from processing 1000 messages):
{json.dumps(significant_candidates, indent=2)}

Task:
1. Review candidates
2. Identify true new categories vs. duplicates/noise
3. Decide which should be added to main taxonomy
4. Merge/compress where appropriate
5. Produce FINAL taxonomy with additions

Rules:
- Keep taxonomy to 6-8 main categories max
- Each subcategory must be distinct and needed
- Only add if 3+ occurrences AND meaningfully different from existing

Output as JSON:
{{
  "final_taxonomy": {{ "categories": [...] }},
  "additions": [{{ "category": "X", "reason": "..." }}],
  "merges": [{{ "candidates": [...], "merged_to": "X" }}],
  "summary": "..."
}}"""

    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )

    response_text = response.content[0].text
    try:
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            final_result = json.loads(json_match.group())
        else:
            final_result = json.loads(response_text)
    except:
        final_result = {
            "final_taxonomy": initial_taxonomy,
            "additions": [],
            "merges": [],
            "summary": "Used initial taxonomy (no additions)"
        }

    print(f"\nFinal Taxonomy:")
    print(f"  Categories: {len(final_result['final_taxonomy']['categories'])}")
    print(f"  Additions: {len(final_result.get('additions', []))}")
    print(f"  Merges: {len(final_result.get('merges', []))}")
    print(f"  Summary: {final_result.get('summary', 'Complete')}")

    return final_result

# ============================================================================
# MAIN PIPELINE
# ============================================================================

def run_full_pipeline():
    """Execute all 3 phases"""
    print("\n" + "="*80)
    print("TAXONOMY REFINEMENT PIPELINE")
    print("Phase 1: Claude seeds (quality)")
    print("Phase 2: Llama bulk processes (efficiency)")
    print("Phase 3: Claude finalizes (quality gate)")
    print("="*80)

    # Phase 1
    initial_taxonomy = phase_1_seed_taxonomy(sample_size=100)

    # Phase 2
    phase_2_results, candidates = phase_2_bulk_processing(initial_taxonomy, batch_size=8)

    # Phase 3
    final_result = phase_3_finalize_taxonomy(initial_taxonomy, candidates)

    # Save results
    output = {
        'phase_1_initial_taxonomy': initial_taxonomy,
        'phase_2_candidates': candidates,
        'phase_3_final_taxonomy': final_result
    }

    with open('taxonomy_refinement_results.json', 'w') as f:
        json.dump(output, f, indent=2)

    print("\n" + "="*80)
    print("PIPELINE COMPLETE")
    print("Results saved to: taxonomy_refinement_results.json")
    print("="*80)

    return output

if __name__ == '__main__':
    results = run_full_pipeline()
