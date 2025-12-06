# Development Guide

## Quick Start

Open Canvas now has a unified development command that starts both the LangGraph server and Next.js frontend with a single command:

```bash
yarn dev
```

This will automatically start:
- 🚀 **LangGraph API** at http://localhost:54367
- 🎨 **LangGraph Studio** at https://smith.langchain.com/studio?baseUrl=http://localhost:54367
- 🌐 **Next.js App** at http://localhost:3000

Press `Ctrl+C` to stop all services.

## Architecture

Open Canvas runs as two separate processes:

1. **LangGraph Server** (`apps/agents`): Handles agent orchestration, LLM calls, and memory
2. **Next.js Frontend** (`apps/web`): Provides the UI and proxies requests to LangGraph

The unified `yarn dev` command manages both processes automatically with:
- Color-coded logging for each service
- Graceful shutdown handling
- Automatic process cleanup
- Clear status messages

## Running Services Separately

If you need to run the services separately (e.g., for debugging):

```bash
# Terminal 1 - LangGraph server
cd apps/agents
yarn dev

# Terminal 2 - Next.js frontend
cd apps/web
yarn dev
```

## Benefits of the Unified Command

- **Single command**: No need to manage multiple terminal windows
- **Proper cleanup**: Stopping one process stops both (no orphaned processes)
- **Better logging**: Color-coded output makes it easy to see which service is logging
- **LangGraph Studio access**: Still get full access to the visual graph debugger
- **Deployment flexibility**: Can still deploy services separately if needed

## Development Workflow

1. Make sure you've built the project first:
   ```bash
   yarn build
   ```

2. Start the dev servers:
   ```bash
   yarn dev
   ```

3. Make your changes to the code

4. Both servers support hot reload:
   - Next.js will automatically reload on frontend changes
   - LangGraph CLI will reload on agent changes

5. Stop all services with `Ctrl+C`

## Troubleshooting

### Port Already in Use

If you see errors about ports already in use:

```bash
# Check what's using port 54367 (LangGraph)
lsof -i :54367

# Check what's using port 3000 (Next.js)
lsof -i :3000

# Kill the process if needed
kill -9 <PID>
```

### Services Not Starting

If services fail to start:

1. Make sure you've run `yarn build` first
2. Check that all environment variables are set correctly
3. Verify you have the required API keys configured
4. Check the logs for specific error messages

### Process Not Stopping

If `Ctrl+C` doesn't stop the processes:

1. The script will force-kill after 2 seconds
2. If that fails, manually kill the processes:
   ```bash
   pkill -f "langgraphjs dev"
   pkill -f "next dev"
   ```

## Script Details

The unified dev script (`scripts/dev.js`) handles:

- Starting LangGraph server first (on port 54367)
- Waiting 2 seconds for LangGraph to initialize
- Starting Next.js frontend (on port 3000)
- Forwarding all output with color-coded prefixes
- Handling `SIGINT` and `SIGTERM` signals for graceful shutdown
- Force-killing processes if they don't stop within 2 seconds

The script is designed to be robust and handle edge cases like:
- Process crashes (will stop all services)
- Errors during startup (will cleanup and exit)
- Multiple shutdown signals (prevents duplicate cleanup)
