import hashlib
import json
from pathlib import Path

import config as cfg

PRESETS_PATH = Path(__file__).parent / "prompt_presets.json"


DEFAULT_TASK_INSTRUCTION = (
    "Read them carefully, then design a hierarchical taxonomy that captures the "
    "distinct TYPES of recognition present in this data.\n\n"
    "Identify 5-8 main categories that emerge naturally from these messages. "
    "Do NOT use generic HR labels — derive categories from what people "
    "actually recognize each other for in this specific dataset."
)

OUTPUT_SCHEMA = """
Output ONLY valid JSON with this structure:
{
  "categories": [
    {
      "id": "A",
      "name": "...",
      "description": "...",
      "subcategories": [
        {
          "id": "A1",
          "name": "...",
          "description": "...",
          "examples": ["short phrase from messages", "another phrase"]
        }
      ]
    }
  ],
  "reasoning": "2-3 sentences explaining why this structure fits the data"
}"""


def load_presets() -> list[dict]:
    """Load prompt presets from prompt_presets.json."""
    if not PRESETS_PATH.exists():
        return [get_default_preset()]
    with open(PRESETS_PATH) as f:
        data = json.load(f)
    return data.get("presets", [get_default_preset()])


def get_default_preset() -> dict:
    return {
        "id": "general_discovery",
        "name": "General Discovery",
        "description": "Pure grounded theory — no seed categories, fully emergent",
        "task_instruction": DEFAULT_TASK_INSTRUCTION,
        "category_seeds": [],
        "additional_constraints": "For each main category, create 2-4 subcategories. "
            "Provide clear descriptions grounded in the messages. "
            "Include 1-2 brief example phrases per subcategory.",
    }


def get_preset_by_id(preset_id: str) -> dict | None:
    for p in load_presets():
        if p["id"] == preset_id:
            return p
    return None


def compose_phase1_prompt(
    df_sample,
    prompt_config: dict | None = None,
) -> str:
    """
    Compose the full Phase 1 prompt from locked + editable sections.

    Args:
        df_sample: DataFrame with columns: message, award_title,
                   recipient_title, nominator_title
        prompt_config: Optional user-provided config with keys:
            - task_instruction (str)
            - category_seeds (list[str])
            - additional_constraints (str)

    Returns:
        The complete prompt string to pass to call_llm().
    """
    messages = df_sample.to_dict("records")

    preamble = "You are a researcher designing a taxonomy for employee recognition awards."

    msg_lines = []
    for i, m in enumerate(messages):
        msg_text = str(m.get(cfg.COL_MESSAGE, ""))[:cfg.P1_MSG_TRUNCATE]
        award = m.get(cfg.COL_AWARD_TITLE, "N/A")
        recipient = m.get(cfg.COL_RECIPIENT_TITLE, "N/A")
        nominator = m.get(cfg.COL_NOMINATOR_TITLE, "N/A")
        msg_lines.append(
            f"Message {i+1}:\n"
            f"  Award: {award}\n"
            f"  From: {nominator} → To: {recipient}\n"
            f"  {msg_text}"
        )

    sample_block = "\n\n---\n\n".join(msg_lines)

    data_block = (
        f"\nBelow are {len(messages)} real award messages from a company's "
        f"recognition platform.\n\nMESSAGES:\n{sample_block}"
    )

    task = DEFAULT_TASK_INSTRUCTION
    if prompt_config and prompt_config.get("task_instruction"):
        task = prompt_config["task_instruction"].strip()

    seeds_block = ""
    if prompt_config and prompt_config.get("category_seeds"):
        seeds = [s.strip() for s in prompt_config["category_seeds"] if s.strip()]
        if seeds:
            seeds_block = (
                "\n\nConsider these starting categories as hints, but freely "
                "add new ones or discard these if the data doesn't support them:\n"
                + "\n".join(f"- {s}" for s in seeds)
            )

    constraints_block = ""
    if prompt_config and prompt_config.get("additional_constraints"):
        c = prompt_config["additional_constraints"].strip()
        if c:
            constraints_block = f"\n\nAdditional guidance:\n{c}"

    full_prompt = (
        preamble
        + data_block
        + "\n\nINSTRUCTIONS:\n"
        + task
        + seeds_block
        + constraints_block
        + "\n"
        + OUTPUT_SCHEMA
    )

    return full_prompt


def build_prompt_metadata(
    prompt_config: dict | None,
    composed_prompt: str,
) -> dict:
    """
    Build the prompt_config metadata block to store in Supabase.
    Saved to pipeline_jobs.prompt_config for reproducibility and comparison.
    """
    config = prompt_config or {}

    return {
        "preset_used": config.get("preset_used", "Default"),
        "mode": config.get("mode", "structured"),
        "task_instruction": config.get("task_instruction", DEFAULT_TASK_INSTRUCTION),
        "category_seeds": config.get("category_seeds", []),
        "additional_constraints": config.get("additional_constraints", ""),
        "full_composed_prompt": composed_prompt,
        "prompt_hash": "sha256:" + hashlib.sha256(composed_prompt.encode()).hexdigest()[:16],
    }