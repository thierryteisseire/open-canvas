# Scaleway LLM Integration Guide

## Overview

Gutenberg AI now supports Scaleway's managed inference service with the Qwen 3 Coder 30B model. This provides a powerful coding-focused LLM as an alternative to OpenAI, Anthropic, and other providers.

## Model Details

- **Model**: Qwen 3 Coder 30B (FP8 quantized)
- **Provider**: Scaleway Managed Inference
- **API**: OpenAI-compatible
- **Specialization**: Code generation and understanding

## Setup Instructions

### 1. Get Your Scaleway API Key

You need a Scaleway IAM API key (Secret Key) to use this service.

1. Log in to your Scaleway account
2. Navigate to IAM (Identity and Access Management)
3. Create a new API key or use an existing one
4. Copy the Secret Key (starts with `SCW_SECRET_KEY` or similar)

### 2. Configure Environment Variables

On your Ubuntu server, edit the `.env` file:

```bash
cd ~/gutenberg
nano .env
```

Add or update these lines:

```bash
# Scaleway LLM Provider
SCALEWAY_API_KEY="YOUR_SCALEWAY_SECRET_KEY_HERE"
SCALEWAY_BASE_URL="https://eb5c2023-a9e4-4f41-a890-88e9b72baede.ifr.fr-par.scaleway.com/v1"
```

Replace `YOUR_SCALEWAY_SECRET_KEY_HERE` with your actual Scaleway Secret Key.

### 3. Enable Scaleway in Web App

Edit `apps/web/.env`:

```bash
nano apps/web/.env
```

Set:

```bash
NEXT_PUBLIC_SCALEWAY_ENABLED=true
```

### 4. Deploy

Pull the latest code and rebuild:

```bash
cd ~/gutenberg
git pull origin gutenbergai
./docker-rebuild-ubuntu.sh
```

## Usage

After deployment:

1. Log in to Gutenberg AI at `https://canvas.gutenbergai.app`
2. Click on the model selector in the chat interface
3. Look for "Qwen 3 Coder 30B (Scaleway)" in the model list
4. Select it and start chatting!

## Model Configuration

The Scaleway model is configured with:

- **Temperature**: 0.7 (default, adjustable 0-1)
- **Max Tokens**: 512 (default, adjustable 1-4096)
- **Top P**: 0.8
- **Streaming**: Enabled

You can adjust these parameters in the model settings within the app.

## API Compatibility

Scaleway's inference service uses an OpenAI-compatible API, which means:

- Same request/response format as OpenAI
- Supports streaming
- Supports chat completions
- Works with existing LangChain integrations

## Cost Considerations

Scaleway's pricing may differ from other providers. Check Scaleway's pricing page for current rates.

## Troubleshooting

### Model Not Appearing in Selector

1. Verify `NEXT_PUBLIC_SCALEWAY_ENABLED=true` in `apps/web/.env`
2. Rebuild the web container: `docker compose -f docker-compose.ubuntu.yml restart web`
3. Clear browser cache and reload

### Authentication Errors

```
Error: 401 Unauthorized
```

**Solution**: Check that your `SCALEWAY_API_KEY` is correct in the root `.env` file.

### Connection Errors

```
Error: Failed to connect to Scaleway API
```

**Solution**: 
1. Verify the `SCALEWAY_BASE_URL` is correct
2. Check that your server can reach Scaleway's API (firewall/network issues)
3. Test with curl:

```bash
curl -H "Authorization: Bearer YOUR_KEY" \
  https://eb5c2023-a9e4-4f41-a890-88e9b72baede.ifr.fr-par.scaleway.com/v1/models
```

### Model Errors

If you see errors about the model not being found, verify the model name in `apps/agents/src/utils.ts` matches your Scaleway deployment.

## Adding More Scaleway Models

To add additional Scaleway models:

1. Edit `packages/shared/src/models.ts`
2. Add a new entry to `SCALEWAY_MODELS` array:

```typescript
{
  name: "scaleway/your-model-name",
  label: "Your Model Display Name",
  config: {
    provider: "scaleway",
    temperatureRange: {
      min: 0,
      max: 1,
      default: 0.7,
      current: 0.7,
    },
    maxTokens: {
      min: 1,
      max: 4_096,
      default: 512,
      current: 512,
    },
  },
  isNew: true,
}
```

3. Update `apps/agents/src/utils.ts` to map the model name to the actual Scaleway model ID
4. Rebuild and deploy

## Example Python Code

Here's how the Scaleway API works (for reference):

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://eb5c2023-a9e4-4f41-a890-88e9b72baede.ifr.fr-par.scaleway.com/v1",
    api_key="SCW_SECRET_KEY"
)

response = client.chat.completions.create(
    model="qwen/qwen3-coder-30b-a3b-instruct:fp8",
    messages=[
        {"role": "system", "content": "You are a helpful assistant"},
        {"role": "user", "content": "Write a Python function to sort a list"},
    ],
    max_tokens=512,
    temperature=0.7,
    top_p=0.8,
    stream=True
)

for chunk in response:
    if chunk.choices and chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

## Benefits of Qwen 3 Coder

- **Code-specialized**: Trained specifically for code generation and understanding
- **30B parameters**: Large enough for complex tasks, efficient enough for fast responses
- **FP8 quantization**: Optimized for performance without significant quality loss
- **Multi-language**: Supports many programming languages
- **European hosting**: Data stays in Europe (Paris region)

## Support

For Scaleway-specific issues:
- Scaleway Documentation: https://www.scaleway.com/en/docs/
- Scaleway Support: https://console.scaleway.com/support/

For Gutenberg AI integration issues:
- Check the logs: `docker compose -f docker-compose.ubuntu.yml logs -f agents`
- Review this guide
- Check GitHub issues
