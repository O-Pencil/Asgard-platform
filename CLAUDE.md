# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Asgard Platform is a unified AI agent integration platform with an OpenAI-compatible API. It's a monorepo with two Git submodules:
- **packages/api** - Backend (Python FastAPI)
- **packages/web** - Frontend (React + Vite)

All development happens on the `feat/ai` branch.

## Commands

### Initialize Project (after clone)

```bash
# Initialize submodules and switch to feat/ai branch
bash scripts/switch-submodules.sh init feat/ai
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

This is a Git submodule-based monorepo. The parent repo (`Asgard-platform`) references two external repositories:
- `packages/api` → Asgard-api.git (backend)
- `packages/web` → Asgard-prd.git (frontend)

### Branch Convention

All submodules should use `feat/ai` branch for development. Use `scripts/switch-submodules.sh` to manage branch switching.

### API Backend (packages/api)

FastAPI application with:
- OpenAI-compatible endpoints (`/v1/chat/completions`, `/v1/models`)
- Async SQLAlchemy with PostgreSQL
- JWT + API Key authentication
- SSE streaming support
- Agent registry pattern in `app/routers/chat.py`

See `packages/api/CLAUDE.md` for detailed backend architecture.

### Frontend (packages/web)

React 19 + Vite application with:
- React Router DOM for routing
- TailwindCSS 4 for styling
- State management via store (likely Zustand or similar)

## Important Notes

- When editing code in submodules, commits go to the submodule's own repository
- Parent repo commits only track submodule commit references
- Both submodules must be on `feat/ai` branch before making parent repo commits
