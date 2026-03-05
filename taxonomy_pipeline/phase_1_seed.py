import config as cfg
from utils import load_awards, call_llm, extract_json, save_json, get_logger
from prompt_composer import compose_phase1_prompt, build_prompt_metadata

logger = get_logger("phase_1")


def build_prompt(messages: list[str]) -> str:
    """
    Legacy prompt builder — used only when no prompt_config is provided.
    Kept for backward compatibility with CLI usage / run_pipeline.py.
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


def run(
    sample_size: int = None,
    random_state: int = None,
    prompt_config: dict | None = None,
) -> dict:
    """
    Execute Phase 1: sample messages → LLM → initial taxonomy.

    Args:
        sample_size:    Override config P1_SAMPLE_SIZE
        random_state:   Override config P1_RANDOM_STATE (None = true random)
        prompt_config:  Custom prompt from dashboard UI. Keys:
                        - task_instruction (str)
                        - category_seeds (list[str])
                        - additional_constraints (str)
                        - mode ("structured" | "raw")
                        - raw_prompt (str, only when mode == "raw")
                        If None, uses legacy build_prompt().

    Returns:
        Tuple of (taxonomy_dict, composed_prompt_string).
        taxonomy has categories, subcategories, and reasoning.
        composed_prompt is the exact string sent to the LLM (for metadata).
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

    if prompt_config is not None:
        # Dashboard-driven: use prompt_composer with all 4 columns
        if prompt_config.get("mode") == "raw" and prompt_config.get("raw_prompt"):
            # Raw mode: user wrote the full editable section
            # We still inject messages at the end (locked section)
            raw = prompt_config["raw_prompt"]
            msg_lines = []
            for i, row in sample.iterrows():
                msg_text = str(row[cfg.COL_MESSAGE])[:cfg.P1_MSG_TRUNCATE]
                award = row.get(cfg.COL_AWARD_TITLE, "N/A")
                recipient = row.get(cfg.COL_RECIPIENT_TITLE, "N/A")
                nominator = row.get(cfg.COL_NOMINATOR_TITLE, "N/A")
                msg_lines.append(
                    f"Message:\n  Award: {award}\n"
                    f"  From: {nominator} → To: {recipient}\n  {msg_text}"
                )
            prompt = raw + f"\n\nHere are {len(sample)} messages:\n\n" + "\n\n---\n\n".join(msg_lines)
        else:
            # Structured mode: compose from fields
            prompt = compose_phase1_prompt(sample, prompt_config)

        logger.info(f"Custom prompt composed ({len(prompt)} chars)")
    else:
        # Legacy: CLI / backward compat — uses only message column
        messages = sample[cfg.COL_MESSAGE].tolist()
        prompt = build_prompt(messages)
        logger.info(f"Default prompt built ({len(prompt)} chars)")

    logger.info("Calling LLM...")

    # Call LLM (Claude or Gemini, with automatic fallback)
    response = call_llm(
        prompt=prompt,
        models=cfg.P1_MODELS,
        max_tokens=cfg.P1_MAX_TOKENS,
    )

    # Parse response
    try:
        taxonomy = extract_json(response)
    except ValueError as e:
        logger.error(f"Failed to parse LLM response: {e}")
        logger.warning("Falling back to default taxonomy")
        from defaults import DEFAULT_TAXONOMY
        taxonomy = DEFAULT_TAXONOMY

    # Validate structure
    categories = taxonomy.get("categories", [])
    if not categories:
        logger.warning("Empty categories returned, using defaults")
        from defaults import DEFAULT_TAXONOMY
        taxonomy = DEFAULT_TAXONOMY
        categories = taxonomy["categories"]

    # Log summary
    logger.info(f"Taxonomy created: {len(categories)} categories")
    for cat in categories:
        subs = cat.get("subcategories", [])
        logger.info(f"  {cat['id']}: {cat['name']} ({len(subs)} subcategories)")

    # Save intermediate (include prompt metadata if custom)
    if cfg.SAVE_INTERMEDIATE:
        output = {
            "metadata": {
                "phase": 1,
                "sample_size": len(sample),
                "random_state": random_state,
                "models": cfg.P1_MODELS,
                "custom_prompt": prompt_config is not None,
            },
            "taxonomy": taxonomy,
        }

        if prompt_config is not None:
            output["metadata"]["prompt_config"] = build_prompt_metadata(
                prompt_config, prompt
            )

        save_json(output, cfg.OUTPUT_DIR / "phase_1_taxonomy.json", "Phase 1 taxonomy")

    return taxonomy, prompt


if __name__ == "__main__":
    taxonomy, _ = run()