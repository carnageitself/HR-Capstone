"""
gemini_client.py
Google Gemini LLM client for taxonomy pipeline
Provides Phase 1 (seed taxonomy) and Phase 3 (finalize taxonomy) functions
"""

import os
import json
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger("gemini_client")


def get_gemini_client():
    """Initialize Gemini client"""
    try:
        import google.generativeai as genai
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not set")
        genai.configure(api_key=api_key)
        return genai
    except ImportError:
        logger.error("google-generativeai library not installed. Install with: pip install google-generativeai")
        return None
    except ValueError as e:
        logger.error(f"Gemini initialization error: {e}")
        return None


# Available Gemini models
GEMINI_MODELS = {
    "fast": "gemini-2.0-flash",              # Fastest, good for quick tasks
    "balanced": "gemini-1.5-pro",            # Better quality
}


def phase_1_seed_taxonomy_gemini(messages: list[str], sample_size: int = 100, msg_truncate: int = 500) -> Optional[Dict[str, Any]]:
    """
    Phase 1: Use Gemini to seed initial taxonomy from sample messages

    Args:
        messages: List of all award messages
        sample_size: Number of messages to sample
        msg_truncate: Max characters per message

    Returns:
        Taxonomy dict with categories and subcategories
    """
    genai = get_gemini_client()
    if not genai:
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
        logger.info("Sending Phase 1 request to Gemini (using fast model for speed)...")
        model = genai.GenerativeModel(GEMINI_MODELS["fast"])

        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                max_output_tokens=3000,
            ),
        )

        # Extract JSON from response
        response_text = response.text.strip()

        # Remove markdown code blocks if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        response_text = response_text.strip()

        taxonomy = json.loads(response_text)
        logger.info(f"Phase 1 complete. Generated {len(taxonomy.get('categories', []))} categories")
        return taxonomy

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Gemini response as JSON: {e}")
        logger.error(f"Response text: {response.text[:500]}")
        return None
    except Exception as e:
        logger.error(f"Gemini Phase 1 error: {e}")
        return None


def phase_3_finalize_taxonomy_gemini(
    messages: list[str],
    initial_taxonomy: Dict[str, Any],
    phase2_results: Optional[Dict[str, Any]] = None,
    msg_truncate: int = 500
) -> Optional[Dict[str, Any]]:
    """
    Phase 3: Use Gemini to finalize and refine taxonomy based on Phase 2 results

    Args:
        messages: List of all award messages
        initial_taxonomy: Taxonomy from Phase 1
        phase2_results: Results and candidates from Phase 2
        msg_truncate: Max characters per message

    Returns:
        Refined taxonomy dict
    """
    genai = get_gemini_client()
    if not genai:
        return initial_taxonomy  # Fall back to Phase 1 taxonomy

    # Build context from Phase 2 results
    candidates_text = ""
    if phase2_results and "candidates" in phase2_results:
        candidates = phase2_results["candidates"]
        candidates_text = f"\n\nNew candidate categories found during Phase 2:\n"
        candidates_text += "\n".join([f"- {cat}: {count} occurrences" for cat, count in candidates.items()])

    categories_str = json.dumps(initial_taxonomy.get("categories", []), indent=2)

    prompt = f"""You are an expert HR analyst. Based on the initial taxonomy and new insights from message classification, refine the recognition taxonomy.

INITIAL TAXONOMY:
{categories_str}
{candidates_text}

Task:
1. Review the initial categories and subcategories
2. Consider adding any strong candidate categories
3. Refine descriptions based on actual message patterns
4. Ensure all categories are distinct and well-defined
5. Keep 6-8 main categories with 3-4 subcategories each
6. Return ONLY valid JSON, no markdown

JSON Format:
{{
  "categories": [
    {{
      "id": "category_1",
      "name": "Category Name",
      "description": "Updated description based on Phase 2 insights",
      "color": "#HEXCOLOR",
      "subcategories": [
        {{
          "id": "subcat_1",
          "name": "Subcategory Name",
          "description": "Refined details"
        }}
      ]
    }}
  ]
}}"""

    try:
        logger.info("Sending Phase 3 request to Gemini (refinement)...")
        model = genai.GenerativeModel(GEMINI_MODELS["fast"])

        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.5,
                max_output_tokens=3000,
            ),
        )

        # Extract JSON from response
        response_text = response.text.strip()

        # Remove markdown code blocks if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        response_text = response_text.strip()

        refined_taxonomy = json.loads(response_text)
        logger.info(f"Phase 3 complete. Refined taxonomy with {len(refined_taxonomy.get('categories', []))} categories")
        return refined_taxonomy

    except json.JSONDecodeError as e:
        logger.warning(f"Failed to parse Gemini Phase 3 response as JSON: {e}")
        logger.warning(f"Using Phase 1 taxonomy as fallback")
        return initial_taxonomy
    except Exception as e:
        logger.error(f"Gemini Phase 3 error: {e}")
        return initial_taxonomy  # Fall back to Phase 1 taxonomy
