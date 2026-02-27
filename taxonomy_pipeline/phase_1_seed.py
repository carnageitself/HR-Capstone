"""
phase_1_seed.py — Claude discovers taxonomy from sample messages.

Key change from original: NO pre-defined categories.
Claude derives the structure purely from message content.

Input:  Sample of award messages (size from config)
Output: Initial taxonomy JSON saved to outputs/phase_1_taxonomy.json
Cost:   ~50K tokens, one Claude API call
"""

import config as cfg
from utils import load_awards, call_llm, extract_json, save_json, get_logger, PROVIDER_CALLERS
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

logger = get_logger("phase_1")


def build_prompt(messages: list[str]) -> str:
    """
    Construct the taxonomy discovery prompt.

    Deliberately avoids naming any categories — Claude must
    derive them from patterns in the messages.
    """
    sample_block = "\n\n---\n\n".join(
        f"Message {i+1}: {msg[:cfg.P1_MSG_TRUNCATE]}"
        for i, msg in enumerate(messages)
    )

    return f"""You are a researcher designing a taxonomy for employee recognition awards.

Below are {len(messages)} real award messages from a company's recognition platform.
Read them carefully, then design a hierarchical taxonomy that captures the
distinct TYPES of recognition present in this data.

MESSAGES:
{sample_block}

INSTRUCTIONS:
1. Identify 5-8 main categories that emerge naturally from these messages.
   Do NOT use generic HR labels — derive categories from what people
   actually recognize each other for in this specific dataset.
2. For each main category, create 2-4 subcategories.
3. Provide clear descriptions grounded in the messages you read.
4. Include 1-2 brief example phrases (not full messages) per subcategory.

Output ONLY valid JSON with this structure:
{{
  "categories": [
    {{
      "id": "A",
      "name": "...",
      "description": "...",
      "subcategories": [
        {{
          "id": "A1",
          "name": "...",
          "description": "...",
          "examples": ["short phrase from messages", "another phrase"]
        }}
      ]
    }}
  ],
  "reasoning": "2-3 sentences explaining why this structure fits the data"
}}"""


def _call_single_model(provider: str, model: str, prompt: str, max_tokens: int) -> tuple[str, str, str]:
    """
    Call a single LLM provider for Phase 1.
    Returns (provider, model, response_text).
    """
    try:
        caller = PROVIDER_CALLERS[provider]
        response = caller(prompt, model, max_tokens)
        return (provider, model, response)
    except Exception as e:
        logger.error(f"Failed to call {provider} ({model}): {e}")
        raise


def run(sample_size: int = None, random_state: int = None) -> dict:
    """
    Execute Phase 1: sample messages → multiple LLMs → initial taxonomy (from best model).

    Runs all configured P1_MODELS in parallel, parses results, returns the first valid taxonomy.
    Results from all models are logged for comparison.

    Args:
        sample_size:  Override config P1_SAMPLE_SIZE
        random_state: Override config P1_RANDOM_STATE (None = true random)

    Returns:
        Taxonomy dict with categories, subcategories, and reasoning
    """
    sample_size = sample_size or cfg.P1_SAMPLE_SIZE
    random_state = random_state if random_state is not None else cfg.P1_RANDOM_STATE

    logger.info(f"Phase 1: Sampling {sample_size} messages (seed={random_state})")

    # Load and sample
    df = load_awards()
    sample = df.sample(
        n=min(sample_size, len(df)),
        random_state=random_state,
    )
    messages = sample[cfg.COL_MESSAGE].tolist()

    logger.info(f"Sampled {len(messages)} messages, building prompt...")

    # Prepare model calls
    prompt = build_prompt(messages)
    model_tasks = [
        (provider, model)
        for provider, model in cfg.P1_MODELS.items()
    ]

    if not model_tasks:
        logger.error("No models configured in P1_MODELS")
        raise ValueError("P1_MODELS is empty")

    logger.info(f"Running Phase 1 with {len(model_tasks)} model(s): {model_tasks}")

    # Call all models in parallel
    results_by_provider = {}
    with ThreadPoolExecutor(max_workers=len(model_tasks)) as executor:
        futures = {
            executor.submit(
                _call_single_model,
                provider,
                model,
                prompt,
                cfg.P1_MAX_TOKENS,
            ): (provider, model)
            for provider, model in model_tasks
        }

        for future in as_completed(futures):
            provider, model = futures[future]
            try:
                prov, mdl, response = future.result()
                results_by_provider[prov] = (mdl, response)
                logger.info(f"Received response from {prov}")
            except Exception as e:
                logger.warning(f"Model {provider}/{model} failed: {e}")

    if not results_by_provider:
        logger.error("All models failed to respond")
        raise RuntimeError("No Phase 1 models could be called successfully")

    # Parse results and select best taxonomy
    parsed_results = {}
    best_taxonomy = None
    best_provider = None

    for provider, (model, response) in results_by_provider.items():
        try:
            taxonomy = extract_json(response)
            parsed_results[provider] = taxonomy
            if best_taxonomy is None:
                best_taxonomy = taxonomy
                best_provider = provider
            logger.info(f"{provider}: {len(taxonomy.get('categories', []))} categories")
        except ValueError as e:
            logger.warning(f"Failed to parse {provider} response: {e}")

    # Fallback if no valid responses
    if best_taxonomy is None:
        logger.warning("No valid taxonomies from LLMs, using defaults")
        from defaults import DEFAULT_TAXONOMY
        best_taxonomy = DEFAULT_TAXONOMY
        best_provider = "default"
        parsed_results["default"] = best_taxonomy

    # Validate structure
    categories = best_taxonomy.get("categories", [])
    if not categories:
        logger.warning("Empty categories, using defaults")
        from defaults import DEFAULT_TAXONOMY
        best_taxonomy = DEFAULT_TAXONOMY
        best_provider = "default"
        categories = best_taxonomy["categories"]

    # Log summary
    logger.info(f"Selected {best_provider} as best")
    logger.info(f"Taxonomy: {len(categories)} categories")
    for cat in categories:
        subs = cat.get("subcategories", [])
        logger.info(f"  {cat['id']}: {cat['name']} ({len(subs)} subcategories)")

    # Save
    if cfg.SAVE_INTERMEDIATE:
        output = {
            "metadata": {
                "phase": 1,
                "sample_size": len(messages),
                "random_state": random_state,
                "models": cfg.P1_MODELS,
                "selected_model": best_provider,
                "all_results": list(parsed_results.keys()),
            },
            "taxonomy": best_taxonomy,
        }
        save_json(output, cfg.OUTPUT_DIR / "phase_1_taxonomy.json", "Phase 1 taxonomy")

        # Also save all model results for comparison
        if len(parsed_results) > 1:
            all_results = {}
            for prov, tax in parsed_results.items():
                all_results[prov] = {
                    "categories_count": len(tax.get("categories", [])),
                    "taxonomy": tax,
                }
            save_json(
                all_results,
                cfg.OUTPUT_DIR / "phase_1_all_models.json",
                "Phase 1 all models"
            )

    return best_taxonomy


if __name__ == "__main__":
    run()