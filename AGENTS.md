# AGENTS.md

> P1 | Root Project Charter & Navigation Map

---

## Identity

Asgard Platform is a unified AI agent integration platform with OpenAI-compatible API gateway for managing and accessing AI agents. Built with Python FastAPI backend and React frontend, it provides a marketplace for agents, API gateway for multi-tool integration, and developer console for credential management.

---

## Project Overview

Asgard Platform is a Git submodule-based monorepo that unifies AI agent integration across IDEs, writing tools, creative software, and SaaS applications. It provides an OpenAI-compatible API endpoint allowing users to call specialized agents through standard protocols.

**Core Pillars:**
- **Agent Registry** — Centralized management of agent metadata, capabilities, and lifecycle (enable/disable)
- **API Gateway** — OpenAI-compatible endpoints (`/v1/chat/completions`, `/v1/models`) routing requests to appropriate agent engines
- **Multi-Tenant Agent Management** — Per-user agent instances with usage tracking, rate limiting, and quota management
- **Marketplace** — Agent discovery interface with categories, capabilities, and pricing
- **Developer Console** — Credential management, integration guides, and usage analytics

---

## Architecture Topology

```
|---------------------------------------------------------------|
|                    ENTRY POINTS                                |
|  packages/web/src/main.jsx → React app startup                |
|  packages/api/app/main.py → FastAPI application               |
|---------------------------------------------------------------|
                              |
                              v
|---------------------------------------------------------------|
|                    FRONTEND LAYER (React)                      |
|  |---------------|  |---------------|  |-------------------|   |
|  | components/  |  | pages/        |  | Layout (nav)      |   |
|  | - Layout     |  | - AgentMarket |  | - Market toggle   |   |
|  |              |  | - Console     |  | - Console toggle  |   |
|  |--------------|  |--------------|  |-------------------|   |
|---------------------------------------------------------------|
                              |
                              v
|---------------------------------------------------------------|
|                    API GATEWAY LAYER                          |
|  |---------------|  |---------------|  |-------------------|   |
|  | routers/      |  | middleware/   |  | Auth (JWT/Key)    |   |
|  | - chat.py     |  | - rate_limit  |  |                   |   |
|  | - agents.py   |  |               |  |-------------------|   |
|  | - auth.py     |  |---------------|                        |
|  | - console.py  |                                               |
|  |--------------|                                               |
|---------------------------------------------------------------|
                              |
                              v
|---------------------------------------------------------------|
|                    CORE LAYER                                 |
|  |---------------|  |---------------|  |-------------------|   |
|  | agents/       |  | services/     |  | Database/Cache     |   |
|  | - base.py     |  | - pencil      |  | - PostgreSQL       |   |
|  | - impl.py     |  |   _gateway.py |  | - Redis            |   |
|  |              |  |               |  | - Ollama (LLM)     |   |
|  |--------------|  |--------------|  |-------------------|   |
|---------------------------------------------------------------|
```

---

## Directory Structure

```
Asgard-platform/
|---- AGENTS.md              # THIS FILE - P1 navigation map
|---- CLAUDE.md              # Existing Claude Code config
|---- README.md              # Project overview
|---- .gitmodules            # Submodule references
|
|---- docs/                  # Documentation
|
|---- packages/
|   |---- api/               # Backend - Python FastAPI (submodule)
|   |   |---- AGENTS.md      # P2: API module map
|   |   |---- app/
|   |   |   |---- agents/    # Agent engines (P2: agents/)
|   |   |   |---- routers/   # API routes (P2: routers/)
|   |   |   |---- middleware/ # Rate limiting (P2: middleware/)
|   |   |   |---- services/  # External integrations (P2: services/)
|   |   |   |---- llm/       # LLM providers (P2: llm/)
|   |   |   |---- models.py  # SQLAlchemy models
|   |   |   |---- schemas.py # Pydantic schemas
|   |   |   |---- config.py  # Settings
|   |   |   |---- auth.py    # Authentication
|   |   |   |---- database.py # DB connection
|   |   |   |---- cache.py   # Redis cache
|   |   |   |---- main.py    # FastAPI app entry
|   |   |
|   |---- web/               # Frontend - React + Vite (submodule)
|   |   |---- AGENTS.md      # P2: Web module map
|   |   |---- src/
|   |   |   |---- components/ # React components (P2: components/)
|   |   |   |---- pages/      # Page components (P2: pages/)
|   |   |   |---- App.jsx     # Main app
|   |   |   |---- main.jsx    # Entry point
|   |   |
|   |---- scripts/           # Utility scripts
```

---

## Build & Run Commands

```bash
# Initialize submodules (after clone)
git submodule update --init --remote

# Backend development
cd packages/api
cp .env.example .env
pip install -r requirements.txt
docker-compose up -d db
uvicorn app.main:app --reload

# Frontend development
cd packages/web
npm install
npm run dev

# Backend tests
cd packages/api
pytest
pytest --cov=app

# Update submodule references (after submodule commits)
git add packages/api packages/web
git commit -m "chore: update submodules"
```

---

## Key Abstractions

### Agent Registry (`packages/api/app/models.py:Agent`)

Centralized agent metadata management with lifecycle control. Each agent has:
- Unique `agent_id` in format `asgard/xxx` or `pencil/xxx` (gateway)
- Categories: dev, writing, creative, analysis
- Capabilities list, context window, pricing
- Active/public flags for access control
- Runtime registry in `routers/chat.py` maps agent IDs to engine implementations

### Multi-Tenant Agent Management (`packages/api/app/models.py`)

Per-user agent instances with comprehensive tracking:
- **User**: Authentication + balance tracking (Credits)
- **APIKey**: Rate limiting, quota management, IP whitelist
- **UsageLog**: Token usage, cost tracking, latency monitoring
- **BalanceTransaction**: Deposit/usage/refund ledger
- Supports user-specific agent enablement and usage isolation

### Agent Engine (`packages/api/app/agents/base.py`)

Abstract base class defining agent execution contract:
- `run()`: Non-streaming execution with temperature/max_tokens control
- `run_streaming()`: SSE streaming with OpenAI-compatible chunk format
- `PromptTemplateAgent`: System prompt-based agents (most common)
- `StructuredAgent`: Output format specification for structured responses
- Ollama integration with fallback to simulation for MVP

### API Gateway (`packages/api/app/main.py`)

OpenAI-compatible request routing and authentication:
- `/v1/chat/completions`: Main chat endpoint with streaming support
- `/v1/models`: List available agents as OpenAI models
- JWT and API Key authentication via `Depends()`
- Global rate limiting middleware
- CORS configuration with debug mode support
- Exception handler for graceful error responses

---

## Configuration Paths

| Path | Purpose |
|------|---------|
| `packages/api/.env` | Environment variables (DATABASE_URL, JWT_SECRET_KEY, DEBUG, RATE_LIMIT_PER_MINUTE, PENCIL_GATEWAY_INTERNAL_KEY) |
| `packages/api/app/config.py` | Pydantic Settings with `lru_cache()` singleton pattern |
| `packages/api/docker-compose.yml` | PostgreSQL + Redis service definitions |
| `packages/web/vite.config.js` | Vite build configuration |
| `packages/web/eslint.config.js` | ESLint rules for frontend code |

---

## Code Standards

### Language Policy

**Source code**: English (variables, functions, comments, docstrings)

**Documentation**: English for DIP protocol (this file and all AGENTS.md)

**Commit messages**: No enforced convention yet. Consider conventional commits: `feat:`, `fix:`, `chore:`, `docs:`

### Backend Conventions

- **Async/await**: All database operations use async SQLAlchemy (`AsyncSession`)
- **Dependency Injection**: FastAPI `Depends()` for auth, DB sessions, rate limiting
- **Error Handling**: Global exception handler returns 500 with generic message
- **Streaming**: SSE (`sse-starlette`) for `/v1/chat/completions?stream=true`
- **API Key Security**: SHA256 hashing, prefix shown to users, IP whitelist support

### Frontend Conventions

- **Components**: Functional React components with hooks
- **Styling**: TailwindCSS 4 utility classes, Wired Elements for buttons/inputs
- **State**: React `useState` for local state, no global state management yet
- **Routing**: Simple page state (market/console), no router library yet

---

## DIP Navigation

### P1 — Root

- [P1: This File](./AGENTS.md)

### P2 — Module Maps

- [P2: packages/api/](./packages/api/AGENTS.md) — Backend: FastAPI, SQLAlchemy, Agent Registry, API Gateway
- [P2: packages/web/](./packages/web/AGENTS.md) — Frontend: React 19, Vite, Agent Marketplace, Developer Console
- [P2: packages/api/app/agents/](./packages/api/app/agents/AGENTS.md) — Agent Engine Base Classes and Implementations
- [P2: packages/api/app/routers/](./packages/api/app/routers/AGENTS.md) — API Routes: auth, agents, chat, console
- [P2: packages/api/app/middleware/](./packages/api/app/middleware/AGENTS.md) — Rate Limiting Middleware
- [P2: packages/api/app/services/](./packages/api/app/services/AGENTS.md) — External Service Integrations (Pencil Gateway)
- [P2: packages/api/app/llm/](./packages/api/app/llm/AGENTS.md) — LLM Provider Integrations (Ollama)
- [P2: packages/web/src/components/](./packages/web/src/components/AGENTS.md) — React Components: Layout
- [P2: packages/web/src/pages/](./packages/web/src/pages/AGENTS.md) — Page Components: AgentMarket, Console

### P3 — File Contracts

**Status**: ⚠️ Partial — Some P3 headers added to core files, comprehensive coverage pending

---

**Covenant**: Maintain map-terrain isomorphism. Keep AGENTS.md aligned with actual structure, or the structure will drift.