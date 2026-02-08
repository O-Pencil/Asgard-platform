# Asgard Platform

Unified Agent Integration Platform - Monorepo

## Project Structure

```
asgard-platform/
├── packages/
│   ├── web/          # Frontend (React + Vite + TailwindCSS)
│   │   ├── src/
│   │   │   ├── App.jsx
│   │   │   ├── main.jsx
│   │   │   ├── pages/
│   │   │   │   ├── AgentMarket.jsx    # Agent Marketplace
│   │   │   │   └── Console.jsx       # Developer Console
│   │   │   └── components/
│   │   │       └── Layout.jsx
│   │   ├── package.json
│   │   └── vite.config.js
│   │
│   └── api/          # Backend (Python + FastAPI) - Git Submodule
│       ├── app/
│       │   ├── main.py
│       │   ├── config.py
│       │   ├── models.py
│       │   ├── database.py
│       │   ├── auth.py
│       │   ├── schemas.py
│       │   ├── routers/
│       │   │   ├── auth.py
│       │   │   ├── agents.py
│       │   │   ├── chat.py
│       │   │   └── console.py
│       │   └── agents/
│       │       ├── base.py
│       │       └── impl.py
│       ├── requirements.txt
│       ├── Dockerfile
│       └── docker-compose.yml
│
├── README.md
└── .gitmodules
```

## Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: TailwindCSS 4 + Wired Elements
- **Routing**: React Router DOM (planned)

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL + SQLAlchemy (Async)
- **Authentication**: JWT + API Key
- **Streaming**: SSE (Server-Sent Events)

## Features

### Agent Marketplace
- Browse and search available agents
- Filter by category, capabilities, context window, pricing
- Enable/disable agents

### Developer Console
- API Key management (create, rotate, delete)
- Usage statistics and quotas
- Integration guides (Cursor, VS Code, Notion, etc.)

### OpenAI Compatible API
- `/v1/chat/completions` - Chat completion endpoint
- `/v1/models` - List available models/agents
- Streaming support with SSE

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose

### Frontend (packages/web)

```bash
cd packages/web
npm install
npm run dev
```

Access: http://localhost:5173

### Backend (packages/api)

```bash
cd packages/api
# Copy environment file
cp .env.example .env

# Start PostgreSQL
docker-compose up -d db

# Install dependencies
pip install -r requirements.txt

# Run application
uvicorn app.main:app --reload
```

Access: http://localhost:8000
API Docs: http://localhost:8000/docs

## API Usage

### OpenAI Compatible Request

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer asgard_your_api_key" \
  -d '{
    "model": "asgard/code-refactor",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Refactor this code..."}
    ],
    "stream": false
  }'
```

## Available Agents

| Agent ID | Category | Description |
|----------|----------|-------------|
| `asgard/code-refactor` | Development | Code analysis and refactoring |
| `asgard/hanhan-style` | Writing | Han Han style creative writing |

## Git Submodule Commands

### Initialize submodules (after clone)
```bash
git submodule init
git submodule update
```

### Update submodule to latest
```bash
cd packages/api
git fetch
git checkout main
git pull origin main
cd ../..
git add packages/api
git commit -m "chore: update api submodule"
```

## License

MIT
