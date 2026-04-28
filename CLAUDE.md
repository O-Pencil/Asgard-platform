# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Asgard Platform is a unified AI agent integration platform with an OpenAI-compatible API. It's a monorepo with two Git submodules hosted on GitHub:
- **packages/api** - Backend (Python FastAPI) → `O-Pencil/Asgard-api`
- **packages/web** - Frontend (React + Vite) → `O-Pencil/Asgard-web`

## Commands

### Initialize Project (after clone)

```bash
git submodule update --init --remote
```

### Frontend Development

```bash
cd packages/web
npm install
npm run dev
```

### Backend Development

```bash
cd packages/api
cp .env.example .env
docker-compose up -d db
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Update Submodule Reference

When submodule commits change and need to be saved to parent repo:

```bash
git add packages/api packages/web
git commit -m "chore: update submodules"
```

## Architecture

### Monorepo Structure

This is a Git submodule-based monorepo. The parent repo (`Asgard-platform`) references two GitHub repositories:
- `packages/api` → `git@github.com:O-Pencil/Asgard-api.git` (backend, branch: `main`)
- `packages/web` → `git@github.com:O-Pencil/Asgard-web.git` (frontend, branch: `main`)

### API Backend (packages/api)

FastAPI application with:
- OpenAI-compatible endpoints (`/v1/chat/completions`, `/v1/models`)
- Async SQLAlchemy with PostgreSQL
- JWT + API Key authentication
- SSE streaming support
- Agent registry pattern in `app/routers/chat.py`
- Redis caching + rate limiting middleware
- Ollama LLM integration for agent execution

See `packages/api/CLAUDE.md` for detailed backend architecture.

### Frontend (packages/web)

React 19 + Vite application with:
- TailwindCSS 4 + Wired Elements for styling
- Agent Marketplace page
- Developer Console page

## Important Notes

- When editing code in submodules, commits go to the submodule's own GitHub repository
- Parent repo commits only track submodule commit references
- All submodules use the `main` branch
