---
inclusion: always
---

# Technology Stack

## Build System

- **Monorepo**: Turborepo for managing multiple packages and apps
- **Package Manager**: Yarn v1.22.22 (required)
- **Workspaces**: `apps/*` and `packages/*`

## Frontend (`apps/web`)

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5 with strict mode
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives, shadcn/ui patterns
- **State Management**: Zustand
- **Code Editor**: CodeMirror with language support for TypeScript, JavaScript, Python, Java, C++, Rust, SQL, HTML, PHP, JSON, XML, Clojure, C#
- **Markdown Editor**: BlockNote with live rendering
- **Authentication**: Custom JWT-based authentication

## Backend (`apps/agents`)

- **Framework**: LangGraph for agent orchestration
- **Language**: TypeScript
- **LLM Providers**: OpenAI, Anthropic, Google GenAI, Fireworks AI, Groq, Ollama (local)
- **LangChain**: Core framework for LLM interactions
- **Storage**: LangGraph built-in store for memory and reflections
- **Observability**: LangSmith

## Shared Packages

- **`packages/shared`**: Common types, constants, and utilities used across frontend and backend
- **`packages/evals`**: Evaluation and testing utilities

## Common Commands

### Development

```bash
# Install dependencies (from root)
yarn install

# Build all packages (required before first run)
yarn build

# Run LangGraph server (from root or apps/agents)
yarn dev  # or: npx @langchain/langgraph-cli dev --port 54367

# Run Next.js frontend (from apps/web)
yarn dev

# Run both (use two terminals)
# Terminal 1: cd apps/agents && yarn dev
# Terminal 2: cd apps/web && yarn dev
```

### Building

```bash
# Build all packages and apps
yarn build

# Build specific workspace
yarn turbo build --filter=@opencanvas/web
yarn turbo build --filter=@opencanvas/agents
```

### Code Quality

```bash
# Lint all workspaces
yarn lint

# Fix linting issues
yarn lint:fix

# Format code
yarn format

# Check formatting
yarn format:check
```

## Environment Variables

- Root `.env`: LangGraph server configuration (API keys for LLM providers, LangSmith)
- `apps/web/.env`: Frontend configuration (Custom Auth API URL, LangGraph API URL)

## Key Dependencies

- `@langchain/langgraph`: Agent workflow orchestration
- `@langchain/core`: LangChain core abstractions
- `@assistant-ui/react`: Chat UI components
- `zod`: Runtime type validation
- `framer-motion`: Animations
