# Asgard 接入 Pencil Agent Gateway 开发指南

## 1. 目标

本文说明 Asgard 如何接入 `Pencil-Agent-Gateway`，让用户可以在 Asgard 平台上创建一个 PencilAgent 实例，并通过 Asgard 的 OpenAI-compatible API 调用它。

这里的 PencilAgent 不是 MCP tool，也不是 Asgard 内置 Python AgentEngine。它是 Gateway 托管的运行实例：

```text
PencilAgent = nano-pencil engine + extended Soul + memory + model
```

目标调用链路：

```text
nanopencil-editor / OpenAI-compatible client
  -> Asgard API
      -> API key / quota / permission
      -> if model = pencil/<gateway_agent_id>
          proxy to Pencil Agent Gateway
  -> Pencil Agent Gateway
      -> PencilAgent instance
      -> nano-pencil engine
```

Asgard 的职责仍是平台层：用户、API key、Marketplace、权限、计费、控制台、部署编排。Gateway 的职责是运行 PencilAgent。Asgard 不 import Gateway 代码，也不 import nano-pencil SDK。

## 2. 当前架构是否够用

当前 Asgard 技术方案够用，不需要更换后端技术栈。

现有架构：

```text
React + Vite frontend
  -> FastAPI backend
      -> PostgreSQL + SQLAlchemy async
      -> APIKey / Agent / UsageLog
      -> /v1/chat/completions
      -> /v1/models
      -> built-in AgentEngine registry
      -> MCP router
```

FastAPI + `httpx.AsyncClient` 可以直接完成 Gateway 集成。需要做的是把当前 `app/routers/chat.py` 中的内置 AgentEngine 调用，扩展为按 agent 类型路由：

| Agent 类型 | model | 执行位置 |
|---|---|---|
| 内置 Asgard Agent | `asgard/code-refactor` | Asgard Python 进程 |
| PencilAgent | `pencil/<gateway_agent_id>` | Pencil Agent Gateway |
| MCP Tool | MCP tool name | Asgard MCP server，旁路能力 |

MCP 不是本方案的主链路。editor 调用 PencilAgent 时只走 HTTP/SSE。

## 3. 需要新增的后端配置

文件：`Asgard-api/app/config.py`

新增配置：

```python
from typing import Optional

class Settings(BaseSettings):
    # Pencil Agent Gateway
    pencil_gateway_url: str = "http://pencil-gateway:8080"
    pencil_gateway_internal_key: str = ""
    pencil_gateway_connect_timeout_s: float = 5.0
    pencil_gateway_read_timeout_s: Optional[float] = None
```

环境变量：

```env
PENCIL_GATEWAY_URL=http://pencil-gateway:8080
PENCIL_GATEWAY_INTERNAL_KEY=pk_internal_asgard
PENCIL_GATEWAY_CONNECT_TIMEOUT_S=5
PENCIL_GATEWAY_READ_TIMEOUT_S=
```

`PENCIL_GATEWAY_INTERNAL_KEY` 只在 Asgard 后端和 Gateway 配置中出现，不能发给浏览器或 editor。

## 4. 数据模型方案

### 4.1 MVP：复用 `agents.parameters`

当前 `Agent` 表已有：

- `agent_id`
- `name`
- `description`
- `category`
- `pricing`
- `parameters`
- `is_active`
- `is_public`

MVP 可以把 PencilAgent 配置放进 `parameters`：

```json
{
  "agent_type": "pencil-agent",
  "gateway_agent_id": "asgard-u_42-tpl_writer",
  "soul": {
    "systemPrompt": "你是小铅笔，专注帮用户做长篇小说创作。",
    "styleTags": ["zh-cn", "literary"]
  },
  "memory": {
    "mode": "short-term",
    "maxTurns": 30
  },
  "model": {
    "provider": "anthropic",
    "name": "claude-sonnet-4-5-20250929"
  },
  "gateway_status": "ready",
  "last_synced_at": "2026-04-28T00:00:00Z"
}
```

建议 Asgard DB 中的 `Agent.agent_id` 对 PencilAgent 直接使用：

```text
pencil/<gateway_agent_id>
```

例如：

```text
pencil/asgard-u_42-tpl_writer
```

这样 `/v1/chat/completions` 的 `model` 可以直接查 `Agent.agent_id`。

### 4.2 后续：拆专表

当需要更完整的用户级实例管理时，再新增：

```sql
CREATE TABLE pencil_agent_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  default_soul TEXT NOT NULL,
  default_memory_max_turns INT NOT NULL DEFAULT 30,
  default_provider TEXT,
  default_model TEXT,
  visibility TEXT NOT NULL DEFAULT 'public',
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE pencil_user_agents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  template_id TEXT REFERENCES pencil_agent_templates(id),
  gateway_agent_id TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  soul_prompt TEXT NOT NULL,
  memory_max_turns INT NOT NULL DEFAULT 30,
  model_provider TEXT,
  model_name TEXT,
  status TEXT NOT NULL DEFAULT 'syncing',
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

MVP 不强制拆表，但代码里要避免把 Gateway 当主存。Asgard DB 是主存，Gateway `agents/*.json` 是运行副本。

## 5. 新增 `PencilAgentBackend`

建议新增文件：

```text
Asgard-api/app/services/pencil_gateway.py
```

职责：

- `create_agent(...)`：Asgard 创建/同步 PencilAgent 时调用 Gateway `POST /v1/agents`
- `proxy_chat(...)`：Asgard chat 路由中把 `pencil/*` 请求反代到 Gateway
- `list_gateway_models(...)`：可选，仅内部诊断，不直接暴露给用户

核心实现骨架：

```python
import httpx
from fastapi.responses import StreamingResponse, JSONResponse
from starlette.background import BackgroundTask


class PencilAgentBackend:
    def __init__(self, settings):
        self.internal_key = settings.pencil_gateway_internal_key
        self.client = httpx.AsyncClient(
            base_url=settings.pencil_gateway_url,
            timeout=httpx.Timeout(
                connect=settings.pencil_gateway_connect_timeout_s,
                read=settings.pencil_gateway_read_timeout_s,
                write=30.0,
                pool=30.0,
            ),
        )

    def headers(self, request, user, gateway_agent_id: str) -> dict[str, str]:
        request_id = request.headers.get("x-request-id") or new_request_id()
        return {
            "Authorization": f"Bearer {self.internal_key}",
            "Content-Type": "application/json",
            "X-Request-Id": request_id,
            "X-Asgard-User": str(user.uuid),
            "X-Asgard-Agent": gateway_agent_id,
        }

    async def create_agent(self, request, user, agent):
        params = agent.parameters or {}
        gateway_agent_id = params["gateway_agent_id"]

        body = {
            "id": gateway_agent_id,
            "name": agent.name,
            "soul": params.get("soul") or {},
            "memory": params.get("memory") or {"mode": "short-term", "maxTurns": 30},
            "model": params.get("model") or {},
            "engine": {"type": "nano-pencil"},
        }

        res = await self.client.post(
            "/v1/agents",
            json=body,
            headers=self.headers(request, user, gateway_agent_id),
        )
        res.raise_for_status()
        return res.json()

    async def proxy_chat(self, request, body: dict, user, agent):
        params = agent.parameters or {}
        gateway_agent_id = params["gateway_agent_id"]
        body["model"] = f"pencil/{gateway_agent_id}"

        headers = self.headers(request, user, gateway_agent_id)

        if body.get("stream"):
            upstream = await self.client.send(
                self.client.build_request(
                    "POST",
                    "/v1/chat/completions",
                    json=body,
                    headers=headers,
                ),
                stream=True,
            )
            return StreamingResponse(
                upstream.aiter_raw(),
                status_code=upstream.status_code,
                media_type=upstream.headers.get("content-type", "text/event-stream"),
                headers={
                    "Cache-Control": "no-cache",
                    "X-Accel-Buffering": "no",
                    "X-Request-Id": headers["X-Request-Id"],
                },
                background=BackgroundTask(upstream.aclose),
            )

        upstream = await self.client.post(
            "/v1/chat/completions",
            json=body,
            headers=headers,
        )
        try:
            payload = upstream.json()
        except Exception:
            payload = {"error": {"message": upstream.text}}
        return JSONResponse(payload, status_code=upstream.status_code)
```

SSE 反代必须使用 `aiter_raw()`，不要用 `EventSourceResponse` 重新包装 Gateway 的 SSE。

## 6. 修改 chat 路由

文件：`Asgard-api/app/routers/chat.py`

当前逻辑：

```python
agent_id = request.model
agent = await db.get(Agent where agent_id == request.model)
engine = get_agent_engine(agent_id)
return engine.run(...)
```

目标逻辑：

```python
@router.post("/completions")
async def chat_completions(
    request: ChatCompletionRequest,
    raw_request: Request,
    api_key: APIKey = Depends(get_api_key_from_header),
    db: AsyncSession = Depends(get_db),
):
    agent = await load_agent_by_model(db, request.model)
    user = await load_user(db, api_key.user_id)

    enforce_agent_active(agent)
    enforce_user_can_call(api_key, agent)
    enforce_quota(api_key, request)

    if is_pencil_agent(agent):
        body = request.model_dump(exclude_none=True)
        return await pencil_gateway.proxy_chat(
            request=raw_request,
            body=body,
            user=user,
            agent=agent,
        )

    return await run_builtin_agent(request, agent, api_key, user, db)
```

判断函数：

```python
def is_pencil_agent(agent: Agent) -> bool:
    params = agent.parameters or {}
    return (
        agent.agent_id.startswith("pencil/")
        or params.get("agent_type") == "pencil-agent"
    )
```

注意：

- 最终应以 DB 中的 agent 类型为准，不只信任用户传入的 `model`。
- `pencil/*` 请求不要进入 `get_agent_engine()`。
- `asgard/*` 旧内置 agent 继续走现有 Python AgentEngine。

## 7. 修改 ChatCompletionRequest

文件：`Asgard-api/app/schemas.py`

当前 schema 没有 `session_id`。Gateway 需要它隔离短期记忆。

新增：

```python
class ChatCompletionRequest(BaseModel):
    model: str
    messages: List[Message]
    temperature: Optional[float] = Field(default=0.7, ge=0, le=2)
    top_p: Optional[float] = Field(default=1.0, ge=0, le=1)
    max_tokens: Optional[int] = Field(default=4096, ge=1, le=65536)
    stream: Optional[bool] = False
    user: Optional[str] = None
    session_id: Optional[str] = None
```

如果未来支持 OpenAI message content blocks，再把 `Message.content` 从 `str` 扩为 `Union[str, list[...]]`。MVP 文本可以先保持 `str`。

## 8. 修改 `/v1/models`

文件：`Asgard-api/app/main.py`

当前 `/v1/models` 是硬编码。接入 PencilAgent 后应该从 DB 读取当前用户可见 agent。

建议把 `/v1/models` 移到独立 router，使用 `get_api_key_from_header`：

```python
@router.get("/models")
async def list_models(
    api_key: APIKey = Depends(get_api_key_from_header),
    db: AsyncSession = Depends(get_db),
):
    agents = await list_agents_visible_to_key(db, api_key)
    return {
        "object": "list",
        "data": [
            {
                "id": agent.agent_id,
                "object": "model",
                "created": int(agent.created_at.timestamp()),
                "owned_by": "asgard",
            }
            for agent in agents
        ],
    }
```

返回结果可以同时包含：

- `asgard/code-refactor`
- `asgard/hanhan-style`
- `pencil/asgard-u_42-tpl_writer`

不要把 Gateway `/v1/models` 全量透给用户。Asgard 必须按 user-key 权限过滤。

## 9. 创建 PencilAgent 流程

可以新增 API：

```text
POST /api/v1/agents/pencil
```

或者在现有 marketplace enable 流程中，当 template 类型是 `pencil-agent` 时创建 Gateway 实例。

推荐流程：

```text
User creates/enables PencilAgent
  -> Asgard 生成 gateway_agent_id
  -> DB 插入/更新 Agent，status=syncing
  -> Asgard 调 Gateway POST /v1/agents
  -> 成功：DB status=ready
  -> 失败：DB status=error，保留 row 以便重试
```

Gateway 请求体：

```json
{
  "id": "asgard-u_42-tpl_writer",
  "name": "小铅笔",
  "soul": {
    "systemPrompt": "你是小铅笔，专注帮用户写作。",
    "styleTags": ["zh-cn", "literary"]
  },
  "memory": {
    "mode": "short-term",
    "maxTurns": 30
  },
  "model": {
    "provider": "anthropic",
    "name": "claude-sonnet-4-5-20250929"
  },
  "engine": {
    "type": "nano-pencil"
  }
}
```

Gateway 返回：

```json
{
  "id": "asgard-u_42-tpl_writer",
  "modelId": "pencil/asgard-u_42-tpl_writer",
  "status": "ready"
}
```

## 10. 权限和 API key

当前 `APIKey` 只绑定 `user_id`，没有 per-agent scope。MVP 可先使用：

- API key 所属用户能调用自己启用/创建的 agent。
- 公共 `asgard/*` agent 可按现有规则开放。
- `pencil/*` 必须校验 owner 或 user-agent 关系。

如果暂时没有 `user_agents` 表，至少要在 `Agent.parameters` 中保存 owner：

```json
{
  "owner_user_id": "u_42",
  "agent_type": "pencil-agent"
}
```

并在 chat 路由中校验：

```python
def enforce_user_can_call(api_key: APIKey, agent: Agent):
    params = agent.parameters or {}
    if params.get("agent_type") == "pencil-agent":
        if str(params.get("owner_user_id")) != str(api_key.user_id):
            raise HTTPException(status_code=403, detail="Agent not allowed")
```

后续应加正式 user-agent relation 或 API key scope。

## 11. 计费和 usage

Gateway v0.1 的真实 token usage 可能还不完整。Asgard 可先保留当前估算策略：

```python
prompt_tokens = len(prompt_text) // 4
estimated_cost = (prompt_tokens / 1000) * (agent.pricing or 0.02)
```

流式请求注意：

- 不要在 upstream 还没建立时就记录 success。
- Gateway 返回 4xx/5xx 时应记录 error。
- v0.1 可以按 prompt 估算扣费。
- Gateway usage 补齐后，改为读取最后 response/chunk 的 usage。

## 12. 错误映射

Gateway 返回 OpenAI-compatible error shape：

```json
{
  "error": {
    "type": "invalid_request_error",
    "code": "agent_not_found",
    "message": "Agent instance 'pencil/unknown' not found"
  }
}
```

Asgard 建议：

| Gateway HTTP | 处理 |
|---|---|
| 401 | internal key 配错，告警，不暴露给用户 |
| 403 | internal key scope 或 agent 权限配置错误，告警 |
| 404 | 标记 agent missing，提示用户重新同步 |
| 408 | 用户取消，不计费 |
| 422 | client/editor 请求字段不支持 |
| 500 | 模型或 Gateway 运行失败，保留 message 方便用户动作 |

反代时 status code 要保真，不要全部改成 500。

## 13. 部署

推荐部署拓扑：

```text
Internet
  -> Asgard ingress / Caddy / nginx
      -> asgard-web
      -> asgard-api
          -> pencil-agent-gateway (internal network only)
              -> nano-pencil SDK
              -> model provider
```

Gateway 不直接暴露公网。Asgard API 通过内网 URL 访问 Gateway。

Gateway 凭据默认由 Gateway 容器持有：

```yaml
services:
  pencil-gateway:
    image: pencil-agent-gateway:0.1
    volumes:
      - gateway-data:/data
      - ./secrets/nanopencil-auth.json:/root/.nanopencil/auth.json:ro
    environment:
      DATA_DIR: /data
      LOG_LEVEL: info
```

Asgard 不存 provider API key。后续企业 BYO key 场景再单独设计。

## 14. nanopencil-editor 集成影响

editor 只配置 Asgard，不配置 Gateway：

```text
Asgard Base URL: https://asgard.example.com
API Key:         asgard_xxx
Agent ID:        asgard-u_42-tpl_writer
```

editor 调 Asgard：

```json
{
  "model": "pencil/asgard-u_42-tpl_writer",
  "messages": [
    { "role": "user", "content": "继续写第三章。" }
  ],
  "stream": true,
  "session_id": "workspace_doc_1"
}
```

Asgard 转发到 Gateway 时替换认证：

```http
Authorization: Bearer <PENCIL_GATEWAY_INTERNAL_KEY>
X-Asgard-User: <user uuid>
X-Asgard-Agent: asgard-u_42-tpl_writer
```

## 15. 开发任务清单

### P0：端到端可用

- [ ] `app/config.py` 增加 Gateway 配置。
- [ ] 新增 `app/services/pencil_gateway.py`。
- [ ] `app/schemas.py` 的 `ChatCompletionRequest` 增加 `session_id`。
- [ ] `app/routers/chat.py` 增加 `pencil/*` 路由分支。
- [ ] `app/routers/chat.py` 对 Gateway SSE 使用 `StreamingResponse + aiter_raw()`。
- [ ] `/v1/models` 改为 DB + user-key 权限过滤。
- [ ] Agent 创建/启用流程支持 `agent_type=pencil-agent`。
- [ ] 创建 PencilAgent 时调用 Gateway `POST /v1/agents`。
- [ ] 错误 status code 保真透传。

### P1：上线前补齐

- [ ] `user_agents` 或 API key scope，完成 per-agent 权限。
- [ ] UsageLog 覆盖 streaming success/error。
- [ ] `X-Request-Id` 全链路日志。
- [ ] Gateway missing/error 状态同步回 DB。
- [ ] Console UI 显示 PencilAgent 的同步状态。

### P2：后续增强

- [ ] `PUT /v1/agents/:id` 更新 Soul/Memory。
- [ ] session 管理：清理某个 `session_id`。
- [ ] BYO provider key。
- [ ] 精确 usage 计费。

## 16. 验收标准

1. 用户能在 Asgard 创建一个 PencilAgent。
2. Asgard DB 中有 `agent_id=pencil/<gateway_agent_id>`。
3. Gateway `/v1/agents` 能看到对应实例。
4. editor 使用 Asgard user-key 调 `/v1/chat/completions`，能收到 SSE token。
5. editor 不知道 Gateway URL，不持有 Gateway internal key。
6. `asgard/*` 内置 Agent 仍可调用。
7. MCP 测试不受影响，但 PencilAgent 主链路不依赖 MCP。

## 17. 本地联调命令

先验证 Asgard -> Gateway 创建：

```bash
curl -sS -X POST "$PENCIL_GATEWAY_URL/v1/agents" \
  -H "Authorization: Bearer $PENCIL_GATEWAY_INTERNAL_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Asgard-User: u_42" \
  -H "X-Asgard-Agent: asgard-u_42-tpl_writer" \
  -d '{
    "id":"asgard-u_42-tpl_writer",
    "name":"小铅笔",
    "soul":{"systemPrompt":"你是小铅笔，专注帮用户写作。"},
    "memory":{"mode":"short-term","maxTurns":30},
    "model":{"provider":"anthropic","name":"claude-sonnet-4-5-20250929"},
    "engine":{"type":"nano-pencil"}
  }'
```

再验证外部 client -> Asgard：

```bash
curl -N -X POST "http://localhost:8000/v1/chat/completions" \
  -H "Authorization: Bearer $ASGARD_USER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model":"pencil/asgard-u_42-tpl_writer",
    "messages":[{"role":"user","content":"继续写第三章。"}],
    "stream":true,
    "session_id":"workspace_doc_1"
  }'
```

成功时终端应持续收到 `data:` chunk，并最终收到 `data: [DONE]`。

