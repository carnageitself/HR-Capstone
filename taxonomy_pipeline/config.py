import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# API KEYS & LLM PROVIDER
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

# LLM Provider availability
LLM_PROVIDERS = {
    "claude": bool(ANTHROPIC_API_KEY),       # Paid, highest quality
    "gemini": bool(GOOGLE_API_KEY),          # Free tier available
    "groq": bool(GROQ_API_KEY),              # Free tier, fast (has Llama + Qwen)
}

# Models to evaluate in Phase 1 (run all available)
# Default: all enabled for comparison
EVAL_MODELS = {
    "groq": True,       # Llama 3.3 70B
    "gemini": True,     # Gemini Flash
    "qwen": True,       # Via OpenRouter (Gemma 3 27B recommended)
}

# Provider priority: tries in order, falls back on failure
LLM_PROVIDER_PRIORITY = ["groq", "gemini"]

if not any([ANTHROPIC_API_KEY, GOOGLE_API_KEY, GROQ_API_KEY]):
    import warnings
    warnings.warn(
        "No LLM API key found. Set at least one:\n"
        "  export GROQ_API_KEY='gsk_...'         (Groq, free tier, recommended)\n"
        "  export GOOGLE_API_KEY='AIza...'       (Gemini, free tier)\n"
        "  export ANTHROPIC_API_KEY='sk-ant-...' (Claude, paid, highest quality)\n\n"
        "Get keys at:\n"
        "  Groq:   https://console.groq.com/keys\n"
        "  Gemini: https://aistudio.google.com/apikey\n"
        "  Claude: https://console.anthropic.com/settings/keys",
        stacklevel=2,
    )

# PATHS
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data/raw"
OUTPUT_DIR = PROJECT_ROOT / "outputs"

AWARDS_CSV = DATA_DIR / "mockup_awards.csv"

# Column mapping — update these if your CSV headers change
COL_MESSAGE = "award_message"
COL_AWARD_TITLE = "award_title"
COL_RECIPIENT_TITLE = "recipient_id"
COL_NOMINATOR_TITLE = "nominator_id"
GEMINI_DEFAULT_MODEL = "gemini-flash-lite-latest"
GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile"  # Balanced quality and speed
GROQ_QWEN_MODEL = "qwen/qwen3-32b"              # Groq's Qwen 3 32B (better than OpenRouter alternative)

# Model pricing per 1M tokens (input / output)
# Used for cost comparison in results
# Note: Only P1_MODELS are actually evaluated; others shown for reference/comparison
MODEL_PRICING = {
    "groq_llama": {"input": 0.10, "output": 0.32, "name": "Llama 3.3 70B (Groq)", "status": "active"},
    "groq_qwen": {"input": 0.29, "output": 0.59, "name": "Qwen 3 32B (Groq)", "status": "active"},
    "gemini": {"input": 0.075, "output": 0.30, "name": "Gemini Flash 2.0", "status": "reference"},
    "gemma_openrouter": {"input": 0.04, "output": 0.15, "name": "Gemma 3 27B (OpenRouter)", "status": "reference"},
    "gpt_mini": {"input": 0.075, "output": 0.30, "name": "GPT 4.5 Mini (OpenAI)", "status": "reference"},
    "mistral": {"input": 0.06, "output": 0.18, "name": "Mistral Small 3.2", "status": "reference"},
    "claude": {"input": 15.0, "output": 90.0, "name": "Claude Opus", "status": "reference"},
}

# PHASE 1 — Multiple Models Comparison
P1_SAMPLE_SIZE = 100          # messages to sample for taxonomy discovery
P1_RANDOM_STATE = 42          # reproducibility seed (set None for true random)
P1_MSG_TRUNCATE = 500         # max chars per message sent to LLM
P1_MAX_TOKENS = 3000          # headroom for 6-8 categories with descriptions + reasoning

# Models to evaluate in Phase 1 (run all for comparison)
# Using only Groq models (both Llama and Qwen)
# Reference models (Gemini, GPT Mini, Gemma) shown in UI for cost comparison only
P1_MODELS = {
    "groq": GROQ_DEFAULT_MODEL,        # Llama 3.3 70B (best reasoning)
    "groq_qwen": GROQ_QWEN_MODEL,      # Qwen 3 32B (via Groq, good reasoning)
}

# PHASE 2 — Local SLM Bulk Processing
P2_BATCH_SIZE = 5             # messages per Ollama call (keep ≤8 for 8K context)
P2_MSG_TRUNCATE = 400         # max chars per message (smaller window than Claude)
P2_MODEL = "llama3:8b"           # actual model tag in Ollama — NOT "llama2"
P2_TEMPERATURE = 0.15         # low temp for classification consistency
P2_TIMEOUT = 120              # seconds per Ollama request
P2_OLLAMA_URL = "http://localhost:11434/api/generate"

# Candidate filtering
P2_MIN_CANDIDATE_FREQ = 3    # minimum occurrences to surface a new category

# Checkpointing — crash recovery for long-running Phase 2
P2_CHECKPOINT_EVERY = 20     # save intermediate results every N batches
P2_CHECKPOINT_DIR = OUTPUT_DIR / "checkpoints"

# If True, simulate Phase 2 without Ollama (for testing Phase 1 + 3 flow)
P2_ALLOW_SIMULATION = False

# PHASE 3 — Claude/Gemini Finalizes Taxonomy
P3_MAX_TOKENS = 3000
P3_MAX_MAIN_CATEGORIES = 8   # upper bound on final category count
P3_MAX_SUBCATEGORIES = 4     # max subcategories per main category
P3_MIN_CANDIDATE_FREQ = 3    # redundant with P2 but explicit for Phase 3 logic

P3_MODELS = {
    "claude": "claude-sonnet-4-5-20250929",
    "gemini": GEMINI_DEFAULT_MODEL,
    "groq": GROQ_DEFAULT_MODEL,
}

# Retry settings for rate-limited APIs
LLM_MAX_RETRIES = 3
LLM_RETRY_DELAY = 5  # seconds between retries

# PIPELINE-LEVEL
SAVE_INTERMEDIATE = True      # write phase outputs to disk between phases
LOG_LEVEL = "INFO"            # DEBUG | INFO | WARNING