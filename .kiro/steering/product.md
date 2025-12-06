---
inclusion: always
---

# Open Canvas Product Overview

Open Canvas is an open source web application for collaborating with AI agents to write and edit documents and code. It's inspired by OpenAI's Canvas but with key differences:

## Core Features

- **Artifact-based editing**: Users interact with "artifacts" (documents or code) that can be versioned and edited through chat or quick actions
- **Built-in memory system**: Reflection agent stores style rules and user insights in a shared memory store, providing personalized experiences across sessions
- **Custom & pre-built quick actions**: Users can define custom prompts or use pre-built actions for common writing/coding tasks
- **Artifact versioning**: Full version history allows time-travel through artifact changes
- **Dual content types**: Supports both markdown text and code artifacts with live rendering
- **Web search integration**: Optional web search capabilities for enhanced context

## Architecture

- **Frontend**: Next.js web application (`apps/web`)
- **Backend**: LangGraph agents (`apps/agents`) running as a separate server
- **Authentication**: Custom JWT-based authentication
- **Storage**: LangGraph built-in store for memory and reflections
- **Observability**: LangSmith for tracing and monitoring

## Key Concepts

- **Artifacts**: The central content unit - either text (markdown) or code with language specification
- **Reflections**: AI-generated memories about user preferences and style rules
- **Quick Actions**: One-click operations on artifacts (e.g., "add comments", "translate", "fix bugs")
- **Assistants**: Customizable AI assistants with their own memory stores (planned feature)
