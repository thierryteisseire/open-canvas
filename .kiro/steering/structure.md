---
inclusion: always
---

# Project Structure

## Monorepo Layout

```
open-canvas/
├── apps/
│   ├── agents/          # LangGraph backend agents
│   └── web/             # Next.js frontend application
├── packages/
│   ├── shared/          # Shared types, constants, utilities
│   └── evals/           # Evaluation and testing
├── static/              # Static assets (screenshots, etc.)
├── langgraph.json       # LangGraph configuration
└── turbo.json           # Turborepo configuration
```

## Frontend Structure (`apps/web/src`)

```
src/
├── app/                 # Next.js App Router pages
│   ├── api/            # API routes (proxy to LangGraph, auth operations)
│   ├── auth/           # Authentication pages (login, signup, callback)
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/
│   ├── artifacts/      # Artifact rendering (code, text, actions toolbar)
│   ├── assistant-select/  # Assistant management UI
│   ├── assistant-ui/   # Chat UI components
│   ├── auth/           # Authentication forms
│   ├── canvas/         # Main canvas/editor components
│   ├── chat-interface/ # Chat interface, composer, messages
│   ├── reflections-dialog/  # Memory/reflections UI
│   ├── tool-hooks/     # Tool-specific UI hooks
│   ├── ui/             # Reusable UI components (shadcn/ui)
│   └── web-search-results/  # Web search display
├── contexts/           # React contexts (Assistant, Graph, Thread, User)
├── hooks/              # Custom React hooks
├── lib/                # Utilities (API clients, converters, storage)
├── workers/            # Web workers (graph streaming)
├── constants.ts        # Frontend constants
└── types.ts            # Frontend-specific types
```

## Backend Structure (`apps/agents/src`)

```
src/
├── open-canvas/        # Main agent graph
│   ├── nodes/         # Graph nodes (generate, rewrite, update, reflect)
│   ├── index.ts       # Graph definition
│   ├── prompts.ts     # LLM prompts
│   └── state.ts       # Graph state definition
├── reflection/         # Reflection agent (memory generation)
├── summarizer/         # Message summarization agent
├── thread-title/       # Thread title generation agent
├── web-search/         # Web search agent
└── utils.ts           # Shared utilities
```

## Shared Package (`packages/shared/src`)

```
src/
├── constants.ts        # Shared constants (programming languages, keys)
├── models.ts           # Model configuration
├── types.ts            # Shared TypeScript types
├── prompts/            # Shared prompts (quick actions)
└── utils/              # Shared utilities (artifacts, URLs)
```

## Key Files

- **`langgraph.json`**: Defines all LangGraph agents and their entry points
- **`turbo.json`**: Turborepo task pipeline configuration
- **Root `package.json`**: Workspace definitions and root scripts
- **`.env.example`**: Template for environment variables (root and `apps/web`)

## Naming Conventions

- **Components**: PascalCase (e.g., `ArtifactRenderer.tsx`)
- **Utilities**: camelCase (e.g., `convertMessages.ts`)
- **Types**: PascalCase interfaces/types (e.g., `ArtifactV3`, `GraphInput`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `LANGGRAPH_API_URL`)
- **Hooks**: camelCase with `use` prefix (e.g., `useLocalStorage`)
- **Contexts**: PascalCase with `Context` suffix (e.g., `AssistantContext`)

## Import Patterns

- Use `@/` alias for imports within `apps/web/src` (e.g., `@/components/ui/button`)
- Use `@opencanvas/shared` for shared package imports
- Relative imports for local files in same directory or subdirectories

## Agent Graph Organization

Each agent follows a consistent structure:
- **`index.ts`**: Graph definition and export
- **`state.ts`**: State schema using Zod or TypeScript interfaces
- **`prompts.ts`**: LLM prompt templates
- **`nodes/`**: Individual node implementations

## API Route Patterns

- **`/api/[..._path]`**: Proxy to LangGraph server
- **`/api/runs/*`**: Run-specific operations (feedback, sharing)
- **`/api/store/*`**: Memory store operations (get, put, delete)
- **`/api/whisper/*`**: Audio transcription
- **`/api/firecrawl/*`**: Web scraping

## Component Organization

- **Presentational components**: In `components/ui/`
- **Feature components**: In feature-specific folders (e.g., `components/artifacts/`)
- **Page components**: In `app/` directory following Next.js App Router conventions
