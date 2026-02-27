# Groq Setup & Configuration

## ✅ Current Setup

**Groq API Key**: Already configured in `.env.local`
```
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 🚀 Available Groq Models

Based on your free plan limits, here are the best models for taxonomy work:

### For Phase 1 (Taxonomy Seeding) & Phase 3 (Finalization)

**Recommended: `llama-3.3-70b-versatile`**
- Best quality/speed balance
- 30 requests/min (RPM)
- 12K tokens/min (TPM)
- Excellent for discovering categories from text
- Currently using this in config ✅

**Alternative: `llama-3.1-8b-instant`**
- Fastest processing
- 30 requests/min (RPM)
- 6K tokens/min (TPM)
- Good for quick prototyping

**Alternative: `meta-llama/llama-4-scout-17b-16e-instruct`**
- Newer model, good reasoning
- 30 requests/min (RPM)
- 30K tokens/min (TPM)
- Better for complex taxonomy refinement

## 📊 Current Configuration

**Phase 1** (Taxonomy Discovery):
```python
model = GROQ_MODELS["balanced"]  # llama-3.3-70b-versatile
max_tokens = 3000
temperature = 0.7  # Higher for creativity
```

**Phase 2** (Bulk Classification):
```python
# Uses Ollama (local, free)
model = "llama3:8b"
```

**Phase 3** (Taxonomy Finalization):
```python
model = GROQ_MODELS["balanced"]  # llama-3.3-70b-versatile
max_tokens = 3000
temperature = 0.3  # Lower for consistency
```

## 🔄 Fallback Chain

If Groq is unavailable:
```
Phase 1: Groq (70b) → Gemini (free tier) → Claude (paid)
Phase 2: Ollama (local) [no fallback - offline]
Phase 3: Groq (70b) → Gemini (free tier) → Claude (paid)
```

## 📈 Rate Limits & Quotas

**Free Plan Limits:**
- **Requests Per Minute (RPM)**: 30 (for balanced model)
- **Tokens Per Minute (TPM)**: 12,000 (for balanced model)
- **Requests Per Day (RPD)**: 14,400
- **Tokens Per Day (TPD)**: 500,000

**For typical taxonomy pipeline:**
- Phase 1: ~100 sample messages → ~2-3 min tokens
- Phase 2: ~1000 messages × 5 batch size → Uses Ollama (local, free)
- Phase 3: ~500 messages sample → ~2-3 min tokens

**Estimate**: Full pipeline uses ~10K tokens/day with Groq (well under limit)

## ⚙️ Environment Variables

```bash
# .env.local (already configured)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional fallbacks
GOOGLE_API_KEY=        # Leave empty for now
ANTHROPIC_API_KEY=     # Leave empty for now

# Local Ollama
OLLAMA_URL=http://localhost:11434
```

## 🧪 Testing Groq Connection

To verify Groq is working:

```python
# In taxonomy_pipeline/ directory
from groq_client import get_groq_client, is_available

# Check if available
if is_available():
    print("✅ Groq is available!")
    client = get_groq_client()

    # Simple test
    message = client.messages.create(
        model="llama-3.3-70b-versatile",
        max_tokens=100,
        messages=[{"role": "user", "content": "Say hello"}]
    )
    print(message.content[0].text)
else:
    print("❌ Groq key not found")
```

## 📚 Available Models Summary

| Model | Speed | Quality | TPM | Best For |
|-------|-------|---------|-----|----------|
| llama-3.1-8b-instant | ⚡⚡⚡ | ⭐⭐ | 6K | Quick tests |
| llama-3.3-70b-versatile | ⚡⚡ | ⭐⭐⭐⭐ | 12K | **CURRENT** - Best balance |
| llama-4-scout-17b | ⚡⚡ | ⭐⭐⭐⭐ | 30K | Complex reasoning |

## 🎯 Next Steps

1. ✅ Groq key added to `.env.local`
2. ✅ Models configured in `groq_client.py`
3. ⏳ Next: Build API endpoints to trigger pipeline
4. ⏳ Then: Create Admin Panel UI
5. ⏳ Finally: Test end-to-end

## 💡 Tips

- Phase 2 uses Ollama (local, no API calls) - this saves Groq quota
- Groq is super fast - expect Phase 1 & 3 to complete in seconds
- Monitor token usage at: https://console.groq.com/account/usage
- Can switch models in `GROQ_MODELS` dict if needed

---

**Ready for PHASE 2 (API Endpoints)?**
