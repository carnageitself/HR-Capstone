"""
groq_client.py
Groq LLM client for taxonomy pipeline
Provides Phase 1 (seed taxonomy) and Phase 3 (finalize taxonomy) functions
"""

import os
import json
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger("groq_client")


def get_groq_client():
    """Initialize Groq client"""
    try:
        from groq import Groq
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not set")
        return Groq(api_key=api_key)
    except ImportError:
        logger.error("Groq library not installed. Install with: pip install groq")
        return None
    except ValueError as e:
        logger.error(f"Groq initialization error: {e}")
        return None


# Available Groq models for different use cases
GROQ_MODELS = {
    "fast": "llama-3.1-8b-instant",              # Fastest, good for quick tasks
    "balanced": "llama-3.3-70b-versatile",       # Better quality, still fast
    "large": "meta-llama/llama-4-scout-17b-16e-instruct",  # Newer, good reasoning
}


def phase_1_seed_taxonomy_groq(messages: list[str], sample_size: int = 100, msg_truncate: int = 500) -> Optional[Dict[str, Any]]:
    """
    Phase 1: Use Groq to seed initial taxonomy from sample messages

    Args:
        messages: List of all award messages
        sample_size: Number of messages to sample
        msg_truncate: Max characters per message

    Returns:
        Taxonomy dict with categories and subcategories
    """
    client = get_groq_client()
    if not client:
        return None

    # Sample messages
    import random
    sample = random.sample(messages, min(sample_size, len(messages)))

    # Truncate messages
    sample_texts = [msg[:msg_truncate] for msg in sample]
    messages_str = "\n---\n".join(sample_texts)

    prompt = f"""You are an expert HR analyst. Analyze these {len(sample)} employee recognition messages and discover the underlying taxonomy of recognition themes.

MESSAGES:
{messages_str}

Task:
1. Identify 6-8 main recognition categories
2. For each category, define 3-4 subcategories
3. Provide clear descriptions
4. Return ONLY valid JSON, no markdown

JSON Format:
{{
  "categories": [
    {{
      "id": "category_1",
      "name": "Category Name",
      "description": "What this category is about",
      "color": "#HEXCOLOR",
      "subcategories": [
        {{
          "id": "subcat_1",
          "name": "Subcategory Name",
          "description": "Details"
        }}
      ]
    }}
  ]
}}"""

    try:
        logger.info("Sending Phase 1 request to Groq (using balanced model for quality)...")
        message = client.messages.create(
            model=GROQ_MODELS["balanced"],  # llama-3.3-70b for better taxonomy discovery
            max_tokens=3000,
            temperature=0.7,  # Slightly higher for creativity in category discovery
            messages=[{"role": "user", "content": prompt}]
        )

        # Extract response
        response_text = message.content[0].text

        # Parse JSON
        # Try to find JSON in response
        import re
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            taxonomy = json.loads(json_match.group())
            logger.info(f"Phase 1 complete: {len(taxonomy.get('categories', []))} categories")
            return taxonomy
        else:
            logger.error("No JSON found in Groq response")
            return None

    except Exception as e:
        logger.error(f"Groq Phase 1 error: {e}")
        return None


def phase_3_finalize_taxonomy_groq(
    phase1_taxonomy: Dict[str, Any],
    phase2_candidates: Dict[str, int],
    max_categories: int = 8,
    max_subcategories: int = 4
) -> Optional[Dict[str, Any]]:
    """
    Phase 3: Use Groq to finalize and refine taxonomy

    Args:
        phase1_taxonomy: Taxonomy from Phase 1
        phase2_candidates: New category candidates from Phase 2
        max_categories: Max categories to return
        max_subcategories: Max subcategories per category

    Returns:
        Final refined taxonomy
    """
    client = get_groq_client()
    if not client:
        return None

    # Format existing taxonomy
    existing_cats = json.dumps(phase1_taxonomy.get('categories', []), indent=2)

    # Format candidates
    candidates_str = "\n".join([f"- {name} (appeared {count} times)"
                                for name, count in phase2_candidates.items()])

    prompt = f"""You are an expert HR taxonomy designer. Review the initial taxonomy and candidate new categories discovered from bulk message classification.

EXISTING TAXONOMY:
{existing_cats}

CANDIDATE NEW CATEGORIES (discovered during bulk classification):
{candidates_str}

Task:
1. Keep useful existing categories
2. Add important candidates that appear frequently
3. Ensure max {max_categories} main categories
4. Ensure max {max_subcategories} subcategories per category
5. Remove duplicates and overlaps
6. Provide clear, distinct categories
7. Return ONLY valid JSON, no markdown

JSON Format:
{{
  "categories": [
    {{
      "id": "category_id",
      "name": "Category Name",
      "description": "What this category represents",
      "color": "#HEXCOLOR",
      "subcategories": [
        {{
          "id": "subcat_id",
          "name": "Subcategory Name",
          "description": "Details"
        }}
      ]
    }}
  ],
  "changes": [
    "What was added/modified/removed"
  ]
}}"""

    try:
        logger.info("Sending Phase 3 request to Groq (using balanced model for refinement)...")
        message = client.messages.create(
            model=GROQ_MODELS["balanced"],  # llama-3.3-70b for taxonomy refinement
            max_tokens=3000,
            temperature=0.3,  # Lower temp for consistent refinement
            messages=[{"role": "user", "content": prompt}]
        )

        # Extract response
        response_text = message.content[0].text

        # Parse JSON
        import re
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            final_taxonomy = json.loads(json_match.group())
            logger.info(f"Phase 3 complete: {len(final_taxonomy.get('categories', []))} categories")
            return final_taxonomy
        else:
            logger.error("No JSON found in Groq response")
            return None

    except Exception as e:
        logger.error(f"Groq Phase 3 error: {e}")
        return None


def is_available() -> bool:
    """Check if Groq is available"""
    return os.environ.get("GROQ_API_KEY") is not None
