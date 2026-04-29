# Render + InsForge Hosted Preview

This document describes the single-user hosted preview deployment path.

## Architecture

- `asgard-web`: public React UI container.
- `asgard-api`: public FastAPI service.
- `pencil-agent-gateway`: private Render service. Only Asgard API calls it.
- InsForge Postgres: external managed PostgreSQL database used by Asgard API.

The Docker images never contain provider keys, database passwords, or Gateway
internal keys. Render environment variables provide all secrets.

## Required Render Environment Variables

### `pencil-agent-gateway`

Set these in Render:

```env
API_KEY=<shared internal gateway key>
OPENAI_API_KEY=<optional provider key>
ANTHROPIC_API_KEY=<optional provider key>
GOOGLE_API_KEY=<optional provider key>
```

`API_KEY` is the service-to-service key. The Blueprint passes it to Asgard API
as `PENCIL_GATEWAY_INTERNAL_KEY`.

### `asgard-api`

Set these in Render:

```env
DATABASE_URL=<InsForge Postgres connection string>
ADMIN_EMAIL=<preview admin email>
ADMIN_PASSWORD=<preview admin password>
ALLOWED_HOSTS=<asgard-web public origin>
```

`DATABASE_URL` can be a provider URL such as `postgresql://...` or
`postgres://...`; the API normalizes it to `postgresql+asyncpg://...`.

The table prefix defaults to:

```env
DB_TABLE_PREFIX=asgard_
```

This creates tables such as:

- `asgard_users`
- `asgard_api_keys`
- `asgard_agents`
- `asgard_usage_logs`
- `asgard_balance_transactions`

### `asgard-web`

Set:

```env
ASGARD_API_ORIGIN=<asgard-api public origin>
```

Example:

```env
ASGARD_API_ORIGIN=https://asgard-api.onrender.com
```

The web container writes this into `/config.js` at startup, so the same image can
be promoted across environments without rebuilding.

## InsForge Notes

For this backend architecture, InsForge is used as managed Postgres only.
Do not add the InsForge anon key to the frontend unless you intentionally decide
to let the browser call InsForge directly.

Asgard API remains the only database client:

```text
browser -> asgard-api -> InsForge Postgres
browser -> asgard-api -> pencil-agent-gateway -> model provider
```

## Provider Key Handling

Asgard stores provider/model names in its database, but not provider keys.
Gateway reads provider keys from environment variables:

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY`

When Asgard creates a PencilAgent with `model.provider=openai`, Gateway uses
`OPENAI_API_KEY` from its environment. The key is not persisted in the agent JSON.

## Deploy Steps

1. Create/sync the root `render.yaml` Blueprint in Render.
2. Fill all `sync: false` values in Render dashboard.
3. Paste the InsForge Postgres URL into `DATABASE_URL`.
4. Set the same internal secret through Gateway `API_KEY`; Blueprint wires it to
   Asgard automatically.
5. Deploy `pencil-agent-gateway`, then `asgard-api`, then `asgard-web`.
6. Open `asgard-web`, create a PencilAgent, and verify its `gateway_status` is
   `ready`.

## Current Limitations

- Hosted preview uses `Base.metadata.create_all`; production migrations should
  use Alembic.
- Conversations persistence is still a separate MVP item.
- Single-user admin auth is tracked separately from this deployment config.
