# OpenAI Model Updates - December 2024

## Summary

Updated Open Canvas to include the latest OpenAI models available in your account, verified via the OpenAI API.

## ✅ All Models Available (12/12)

All configured models are available in your OpenAI account!

### Latest Models (NEW)
- **gpt-5.1** - Latest GPT-5 series model
- **gpt-5** - GPT-5 flagship model
- **gpt-5-mini** - Smaller, faster GPT-5
- **o3** - Latest reasoning model
- **o3-mini** - Smaller reasoning model
- **o1-pro** - Professional reasoning model

### Current Generation
- **o1** - Original reasoning model
- **gpt-4.1** - Latest GPT-4 iteration
- **gpt-4.1-mini** - Smaller GPT-4.1
- **gpt-4o** - Multimodal flagship
- **gpt-4o-mini** - Fast, affordable (default)
- **chatgpt-4o-latest** - Latest ChatGPT snapshot

## New Script: Model Checker

Added `yarn models` command to check which OpenAI models are available in your account:

```bash
# Check model availability
yarn models

# Get JSON output
yarn models --json
```

This script:
- Reads your `OPENAI_API_KEY` from `.env`
- Fetches all available models from OpenAI API
- Shows which Open Canvas models are available
- Lists all GPT/o1/o3 models in your account

## Configuration Changes

### Temperature Settings
- **o1/o3 series**: Temperature excluded (not supported by API)
- **GPT-4/5 series**: Temperature range 0-2, default 1.0

### Max Tokens
- **o1/o3 series**: 100K max, 16K default
- **GPT-5 series**: 32K max, 4K default
- **GPT-4 series**: 16-32K max, 4K default

### Model Access Restrictions
Premium models (o1, o1-pro, o3, gpt-5.x) are restricted to LangChain users with `@langchain.dev` email addresses in the hosted version. For self-hosted deployments, you can remove this restriction by editing `apps/agents/src/utils.ts`.

## Usage

All models will appear in the model selector dropdown in the UI. The default model is `gpt-4o-mini` for cost efficiency.

### Recommended Models by Use Case

**For reasoning/complex tasks:**
- o3 (most advanced)
- o1-pro (professional)
- o1 (original)

**For general use:**
- gpt-5.1 (latest)
- gpt-5 (flagship)
- gpt-4o (multimodal)

**For speed/cost:**
- gpt-5-mini
- gpt-4.1-mini
- gpt-4o-mini (default)

## Technical Notes

- o1/o3 models don't support temperature parameter (handled automatically)
- o1/o3 models don't support tool calling (automatically falls back to gpt-4o)
- All changes are backward compatible
- Models are fetched dynamically from your OpenAI account

## Rebuild Required

After updating models, rebuild the project:

```bash
yarn build
yarn dev
```

## Additional Models in Your Account

Your OpenAI account also has access to:
- GPT-5 variants (pro, nano, codex, search-api)
- GPT-4.1 variants (nano)
- Audio models (gpt-audio, gpt-audio-mini)
- Realtime models (gpt-realtime, gpt-realtime-mini)
- Image models (gpt-image-1)
- Specialized models (transcribe, TTS, search)

These can be added to Open Canvas by updating `packages/shared/src/models.ts`.
