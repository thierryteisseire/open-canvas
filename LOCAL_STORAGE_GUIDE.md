# Local Storage Guide - Using LangGraph Store

## Overview

Open Canvas now uses **LangGraph's built-in store** for all data persistence. No external database or cloud storage is required.

## Storage Location

All data is stored locally in:
```
.langgraph_api/.langgraphjs_api.store.json
```

This file is automatically created and managed by LangGraph.

## What's Stored

### 1. User Memories & Reflections

**Purpose:** AI-generated insights about user preferences and writing style

**Namespace:** `["memories", assistantId]`  
**Key:** `"reflection"`  
**Structure:**
```typescript
{
  styleRules: string[],  // Writing style guidelines
  content: string[]      // Facts about the user
}
```

**Example:**
```json
{
  "styleRules": [
    "User prefers concise, technical writing",
    "Avoid flowery language"
  ],
  "content": [
    "User is a software engineer",
    "Prefers TypeScript over JavaScript"
  ]
}
```

### 2. Custom Quick Actions

**Purpose:** User-defined prompts for artifact manipulation

**Namespace:** `["custom_actions", assistantId]`  
**Key:** `"actions"`  
**Structure:**
```typescript
{
  actions: Array<{
    id: string,
    name: string,
    prompt: string,
    type: "text" | "code"
  }>
}
```

### 3. Context Documents

**Purpose:** Uploaded files for context (PDFs, images, etc.)

**Namespace:** `["context_documents", assistantId]`  
**Structure:**
```typescript
{
  documents: Array<{
    name: string,
    type: string,
    data: string  // base64 encoded
  }>
}
```

## Accessing the Store

### From Frontend (via API)

```typescript
// Get item
const response = await fetch('/api/store/get', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    namespace: ['memories', assistantId],
    key: 'reflection'
  })
});
const { item } = await response.json();

// Put item
await fetch('/api/store/put', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    namespace: ['memories', assistantId],
    key: 'reflection',
    value: { styleRules: [...], content: [...] }
  })
});

// Delete item
await fetch('/api/store/delete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    namespace: ['memories', assistantId],
    key: 'reflection'
  })
});
```

### From Backend (LangGraph Agents)

```typescript
import { ensureStoreInConfig } from "../utils.js";

// In your node function
const store = ensureStoreInConfig(config);
const assistantId = config.configurable?.open_canvas_assistant_id;

// Get
const item = await store.get(["memories", assistantId], "reflection");
const value = item?.value;

// Put
await store.put(
  ["memories", assistantId],
  "reflection",
  { styleRules: [...], content: [...] }
);

// Delete
await store.delete(["memories", assistantId], "reflection");
```

## Backup & Restore

### Manual Backup

```bash
# Backup the store
cp .langgraph_api/.langgraphjs_api.store.json backups/store-$(date +%Y%m%d).json

# Restore from backup
cp backups/store-20241206.json .langgraph_api/.langgraphjs_api.store.json
```

### Automated Backup Script

```bash
#!/bin/bash
# backup-store.sh

BACKUP_DIR="./backups"
STORE_FILE=".langgraph_api/.langgraphjs_api.store.json"

mkdir -p "$BACKUP_DIR"
cp "$STORE_FILE" "$BACKUP_DIR/store-$(date +%Y%m%d-%H%M%S).json"

# Keep only last 30 backups
ls -t "$BACKUP_DIR"/store-*.json | tail -n +31 | xargs rm -f
```

Run daily via cron:
```bash
0 2 * * * /path/to/backup-store.sh
```

## Production Considerations

### 1. File Permissions

Ensure the LangGraph process has write access:
```bash
chmod 755 .langgraph_api
chmod 644 .langgraph_api/.langgraphjs_api.store.json
```

### 2. Volume Mounting (Docker)

```yaml
# docker-compose.yml
services:
  langgraph:
    volumes:
      - ./data/.langgraph_api:/app/.langgraph_api
```

### 3. Scaling Considerations

- **Single instance:** LangGraph store works perfectly
- **Multiple instances:** Consider using LangGraph Cloud or a shared database
- **High availability:** Implement regular backups and monitoring

### 4. Monitoring

Watch store file size:
```bash
# Check size
du -h .langgraph_api/.langgraphjs_api.store.json

# Monitor growth
watch -n 60 'du -h .langgraph_api/.langgraphjs_api.store.json'
```

## Migration from Supabase

If you're migrating from a Supabase-based deployment:

### 1. Export Existing Data

```sql
-- Export reflections from Supabase
SELECT user_id, reflections FROM user_memories;
```

### 2. Import to LangGraph Store

```typescript
// migration-script.ts
import { Client } from "@langchain/langgraph-sdk";

const client = new Client({ apiUrl: "http://localhost:54367" });

// For each user
await client.store.putItem(
  ["memories", userId],
  "reflection",
  {
    styleRules: existingStyleRules,
    content: existingContent
  }
);
```

### 3. Verify Migration

```bash
# Check store contents
cat .langgraph_api/.langgraphjs_api.store.json | jq '.json.data'
```

## Troubleshooting

### Store file corrupted

```bash
# Restore from backup
cp backups/store-latest.json .langgraph_api/.langgraphjs_api.store.json

# Or reset (loses all data)
rm .langgraph_api/.langgraphjs_api.store.json
# Restart LangGraph server to recreate
```

### Store not persisting

Check file permissions and ensure LangGraph has write access:
```bash
ls -la .langgraph_api/
```

### Store growing too large

Implement cleanup for old data:
```typescript
// Clean up old context documents
const docs = await store.get(["context_documents", assistantId]);
if (docs?.value?.documents?.length > 100) {
  // Keep only recent 50
  const recent = docs.value.documents.slice(-50);
  await store.put(["context_documents", assistantId], { documents: recent });
}
```

## Benefits of Local Storage

✅ **No external dependencies** - Everything runs locally  
✅ **Fast access** - No network latency  
✅ **Simple deployment** - Just one file to manage  
✅ **Cost effective** - No database hosting fees  
✅ **Privacy** - Data never leaves your server  
✅ **Easy backup** - Simple file copy  

## Limitations

⚠️ **Single instance only** - Not suitable for multi-instance deployments without shared storage  
⚠️ **File-based** - Not optimized for very large datasets (>100MB)  
⚠️ **No transactions** - Concurrent writes handled by LangGraph but not ACID compliant  

For production deployments with multiple instances, consider LangGraph Cloud or implementing a shared database backend.
