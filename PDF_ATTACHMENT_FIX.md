# PDF Attachment Fix

## Problem
When attaching PDF documents, the agent would process them successfully but fail to persist the response due to a `RangeError: Invalid string length` serialization error. This prevented artifacts from being saved and potentially from appearing in the canvas.

## Root Cause
1. **Large document data in messages**: PDF content was being stored in message `additional_kwargs.documents` with full base64 data
2. **Serialization failure**: When LangGraph tried to persist the thread state, the full conversation history (including all document data) was too large to serialize to JSON
3. **No cleanup**: Document data remained in messages even after being processed, bloating the state

## Solution

### 1. Document Cleanup After Processing
Modified `convertContextDocumentToHumanMessage()` in `apps/agents/src/open-canvas/nodes/generate-path/documents.ts`:
- Now returns both the context message AND a cleaned version of the original message
- Cleaned message keeps document metadata (name, type) but replaces data with a placeholder
- This prevents serialization issues while maintaining message history

### 2. Reduced PDF Text Limit
Changed `MAX_PDF_TEXT_LENGTH` in `apps/agents/src/utils.ts`:
- Reduced from 50,000 to 20,000 characters
- Prevents oversized context that could cause serialization issues
- Adds helpful truncation message for users

### 3. Enhanced Logging
Added comprehensive logging throughout the pipeline:
- **Frontend** (`content-composer.tsx`): Document processing and stream lifecycle
- **Backend** (`utils.ts`): PDF conversion with character counts
- **Backend** (`documents.ts`): Document processing steps
- **Frontend** (`GraphContext.tsx`): Artifact creation and updates

## Testing Instructions

### Test 1: Simple Request (No PDF)
1. Start both servers: `./dev.sh`
2. Open the app in browser
3. Type: "Write a short poem about AI"
4. **Expected**: Artifact appears in canvas with the poem

### Test 2: Small PDF (1-2 pages)
1. Attach a small PDF (< 5 pages)
2. Type: "Summarize this document"
3. **Expected**: 
   - Browser console shows `[Frontend]` logs with document processing
   - LangGraph terminal shows `[Documents]` and `[PDF]` logs
   - Artifact appears with summary
   - No serialization errors

### Test 3: Large PDF (10+ pages)
1. Attach a larger PDF
2. Type: "What is this document about?"
3. **Expected**:
   - PDF text truncated to 20k characters (check logs)
   - Truncation message appears in logs
   - Artifact still appears with response based on first 20k chars
   - No serialization errors

## What to Look For

### Success Indicators
- ✅ `[Frontend] Stream completed` in browser console
- ✅ `[GraphContext] Setting artifact from generateArtifact` in browser console
- ✅ `info: ┏ Background run succeeded` in LangGraph terminal
- ✅ Artifact visible in canvas
- ✅ No `RangeError: Invalid string length` errors

### Failure Indicators
- ❌ `RangeError: Invalid string length` in LangGraph terminal
- ❌ Stream completes but no artifact appears
- ❌ `[PDF] Error converting PDF to text` in logs
- ❌ Serialization retry attempts in LangGraph terminal

## Files Modified

1. `apps/agents/src/open-canvas/nodes/generate-path/documents.ts`
   - Changed return type of `convertContextDocumentToHumanMessage()`
   - Added document cleanup logic

2. `apps/agents/src/open-canvas/nodes/generate-path/index.ts`
   - Updated to handle new return type
   - Added message replacement logic

3. `apps/agents/src/utils.ts`
   - Reduced `MAX_PDF_TEXT_LENGTH` from 50k to 20k
   - Enhanced logging in `convertPDFToText()`

4. `apps/web/src/components/canvas/content-composer.tsx`
   - Added stream lifecycle logging

5. `apps/web/src/contexts/GraphContext.tsx`
   - Added artifact creation logging

## Next Steps if Issues Persist

If artifacts still don't appear:

1. **Check browser console** for `[GraphContext]` logs - is artifact being set?
2. **Check LangGraph logs** for the actual response content
3. **Try with no PDF** to isolate PDF-specific issues
4. **Check artifact state** in React DevTools
5. **Verify model is generating proper tool calls** in LangGraph logs

## Rollback Instructions

If this causes issues, revert these commits:
```bash
git revert HEAD
```

The previous implementation will be restored.
