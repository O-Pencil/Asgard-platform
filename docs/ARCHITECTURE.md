# Asgard Agent 集成平台 - 架构设计文档

> 文档版本: v1.0
> 创建日期: 2026-02-09
> 文档状态: 初稿

---

## 目录

1. [文档概述](#1-文档概述)
2. [系统整体架构](#2-系统整体架构)
3. [模块职责边界与交互](#3-模块职责边界与交互)
4. [数据库核心 Schema](#4-数据库核心-schema)
5. [API 接口规范](#5-api-接口规范)
6. [技术实现路线图](#6-技术实现路线图)
7. [安全设计](#7-安全设计)
8. [性能与可扩展性](#8-性能与可扩展性)
9. [部署架构](#9-部署架构)

---

## 1. 文档概述

### 1.1 项目背景

Asgard Agent 集成平台是一个统一的 Agent 管理与分发平台，提供 OpenAI 兼容的 API 网关，支持多领域 Agent 的展示、搜索、启用和管理。平台面向开发者提供完整的集成能力，包括 API Key 管理、用量统计、集成指南等功能。

### 1.2 设计目标

| 目标 | 描述 |
|------|------|
| **OpenAI 兼容性** | 提供与 OpenAI Chat Completions API 完全兼容的接口，降低集成成本 |
| **高可用性** | 支持水平扩展，单点故障不影响整体服务 |
| **安全可控** | 多层认证机制，API Key 加密存储，支持 IP 白名单 |
| **可观测性** | 完整的日志、监控、告警体系 |
| **可扩展性** | Agent 引擎插件化设计，支持快速扩展新 Agent |

### 1.3 技术选型总览

```
┌─────────────────────────────────────────────────────────────────────┐
│                         技术栈总览                                    │
├─────────────────────────────────────────────────────────────────────┤
│  前端层                                                                 │
│    - 框架: React 19 + Vite                                           │
│    - 路由: React Router DOM                                           │
│    - 状态管理: Zustand                                                │
│    - 数据请求: TanStack Query                                        │
│    - 图表: Recharts                                                   │
│    - UI 组件: TailwindCSS 4 + 自定义组件                              │
├─────────────────────────────────────────────────────────────────────┤
│  后端层                                                                 │
│    - Web 框架: FastAPI (Python 3.11+)                                │
│    - ORM: SQLAlchemy 2.0 (Async)                                     │
│    - 数据库: PostgreSQL 15                                            │
│    - 认证: JWT + API Key                                              │
│    - 缓存: Redis 7                                                    │
│    - 消息队列: Redis Streams (可选)                                    │
├─────────────────────────────────────────────────────────────────────┤
│  基础设施层                                                             │
│    - 容器化: Docker + Docker Compose                                  │
│    - 反向代理: Nginx (生产环境)                                        │
│    - CI/CD: GitHub Actions                                            │
│    - 监控: Prometheus + Grafana                                       │
│    - 日志: ELK Stack (可选)                                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. 系统整体架构

### 2.1 分层架构图

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                              客户端层 (Client Layer)                           │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│    ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐    │
│    │   Web 浏览器      │     │   IDE 插件        │     │   CLI 工具        │    │
│    │  (React SPA)     │     │ (Cursor/VS Code)  │     │  (asgard-cli)    │    │
│    └────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘    │
│             │                        │                        │              │
└─────────────┼────────────────────────┼────────────────────────┼──────────────┘
              │                        │                        │
              └────────────────────────┼────────────────────────┘
                                       │
                                       ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                              API 网关层 (API Gateway Layer)                    │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                        Nginx / Traefik                                   │  │
│  │   - SSL/TLS 终结                                                         │  │
│  │   - 静态资源服务                                                          │  │
│  │   - 负载均衡 (生产环境)                                                   │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                        FastAPI Application                               │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐             │  │
│  │  │  CORS 中间件    │  │  Rate Limit    │  │  Auth 中间件    │             │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘             │  │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                        Router Layer                                   │  │  │
│  │  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │  │  │
│  │  │  │  /auth/*   │ │ /agents/*  │ │ /console/* │ │ /v1/*      │       │  │  │
│  │  │  │  认证路由   │ │  Agent 管理 │ │  控制台    │ │ OpenAI兼容 │       │  │  │
│  │  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘       │  │  │
│  │  └─────────────────────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                       │
└───────────────────────────────────────┼───────────────────────────────────────┘
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                             服务层 (Service Layer)                            │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                         Auth Service                                      │  │
│  │   - JWT Token 生成与验证                                                  │  │
│  │   - API Key 创建与验证                                                   │  │
│  │   - 用户会话管理                                                          │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                         Agent Service                                     │  │
│  │   - Agent 生命周期管理                                                   │  │
│  │   - Agent 注册与发现                                                     │  │
│  │   - Agent 启用/停用控制                                                  │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                         Usage Service                                     │  │
│  │   - Token 计数                                                           │  │
│  │   - 用量记录                                                             │  │
│  │   - 配额管理                                                             │  │
│  │   - 统计分析                                                             │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                         Billing Service                                   │  │
│  │   - 余额管理                                                             │  │
│  │   - 充值处理                                                             │  │
│  │   - 计费规则                                                             │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
└───────────────────────────────────────┬───────────────────────────────────────┘
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                            Agent 引擎层 (Agent Engine Layer)                  │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                        Agent Engine Registry                             │  │
│  │   - 动态 Agent 注册                                                      │  │
│  │   - Agent 工厂                                                           │  │
│  │   - 版本管理                                                             │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │ Code Agent │  │ Writer Agent│ │ Test Agent │  │ Custom     │             │
│  │ 代码重构    │  │ 韩寒风格写作 │ │ 单元测试    │  │ Agents    │             │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘             │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                         LLM Provider Abstraction                          │  │
│  │   - OpenAI Provider                                                     │  │
│  │   - Anthropic Provider (预留)                                           │  │
│  │   - Local Model Provider (预留)                                          │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
└───────────────────────────────────────┬───────────────────────────────────────┘
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────�│
│                            数据层 (Data Layer)                                │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐      │
│  │    PostgreSQL      │  │      Redis         │  │   文件存储 (可选)    │      │
│  │  - 用户数据         │  │  - 缓存            │  │  - Agent 配置       │      │
│  │  - API Keys        │  │  - 会话            │  │  - 日志             │      │
│  │  - Agents 元数据    │  │  - Rate Limit      │  │  - 导出数据         │      │
│  │  - 用量记录         │  │  - 排行榜           │  │                     │      │
│  └────────────────────┘  └────────────────────┘  └────────────────────┘      │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 架构说明

#### 2.2.1 客户端层

客户端层是用户与系统交互的入口，支持多种接入方式：

| 客户端类型 | 技术实现 | 典型场景 |
|-----------|---------|---------|
| **Web 应用** | React SPA + Vite | Agent 市场浏览、控制台管理 |
| **IDE 插件** | OpenAI 兼容协议 | Cursor、VS Code Continue 插件 |
| **CLI 工具** | Python Click + Rich | 本地开发、脚本集成 |

#### 2.2.2 API 网关层

API 网关层是系统的统一入口，负责：

- **请求路由**: 将请求分发到对应的服务
- **认证鉴权**: 验证 JWT Token 和 API Key
- **限流控制**: 防止恶意请求耗尽资源
- **CORS 处理**: 跨域资源共享配置
- **日志记录**: 请求日志和审计追踪

#### 2.2.3 服务层

服务层包含核心业务逻辑：

| 服务 | 职责 | 主要功能 |
|-----|------|---------|
| Auth Service | 认证服务 | JWT 令牌管理、API Key 生命周期 |
| Agent Service | Agent 管理 | Agent 注册、发现、状态控制 |
| Usage Service | 用量统计 | Token 计数、配额管理、统计分析 |
| Billing Service | 计费服务 | 余额管理、充值、账单生成 |

#### 2.2.4 Agent 引擎层

Agent 引擎层是平台的差异化核心：

- **Agent Registry**: 动态注册机制，支持运行时加载
- **Agent Base Classes**: 统一的基类接口
- **LLM Provider**: LLM 调用抽象，支持多模型
- **Streaming**: SSE 流式响应支持

#### 2.2.5 数据层

数据持久化层：

| 存储 | 用途 | 特点 |
|-----|------|------|
| PostgreSQL | 主数据库 | ACID 事务、复杂查询、关系型数据 |
| Redis | 缓存/会话 | 高速读写、TTL 支持 |
| 文件系统 | 静态资源 | Agent 配置、日志、导出 |

---

## 3. 模块职责边界与交互

### 3.1 后端模块划分

```
packages/api/
├── app/
│   ├── __init__.py
│   ├── main.py                    # 应用入口，FastAPI 配置
│   ├── config.py                  # 配置管理 (Pydantic Settings)
│   ├── database.py                # 数据库连接和会话管理
│   ├── constants.py               # 常量定义
│   │
│   ├── models.py                  # SQLAlchemy ORM 模型
│   ├── schemas.py                 # Pydantic 请求/响应模型
│   │
│   ├── auth.py                    # 认证服务 (JWT + API Key)
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── auth.py                # 认证中间件
│   │   ├── rate_limit.py          # 限流中间件
│   │   └── cors.py                # CORS 配置
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── agent_service.py       # Agent 业务逻辑
│   │   ├── usage_service.py       # 用量统计服务
│   │   ├── billing_service.py     # 计费服务
│   │   └── cache_service.py       # 缓存服务
│   │
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py                # /api/v1/auth 认证路由
│   │   ├── agents.py              # /api/v1/agents Agent 管理路由
│   │   ├── console.py             # /api/v1/console 控制台路由
│   │   └── chat.py                # /v1/chat OpenAI 兼容路由
│   │
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── base.py                # Agent 基类定义
│   │   ├── registry.py            # Agent 注册表
│   │   ├── impl.py                # Agent 实现
│   │   └── prompts/               # System Prompt 模板
│   │
│   └── utils/
│       ├── __init__.py
│       ├── token_counter.py       # Token 计数工具
│       └── validators.py           # 自定义验证器
│
├── migrations/                    # Alembic 数据库迁移
├── tests/                         # 单元测试
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

### 3.2 前端模块划分

```
packages/web/
├── src/
│   ├── main.jsx                   # 应用入口
│   ├── App.jsx                     # 根组件 + 路由配置
│   │
│   ├── routes/                     # 路由配置
│   │   ├── index.jsx              # 重定向到 /market 或 /console
│   │   ├── layout.jsx             # 主布局
│   │   ├── market.jsx             # Agent 市场页
│   │   ├── console.jsx            # 控制台页
│   │   ├── login.jsx              # 登录页
│   │   └── settings.jsx           # 设置页
│   │
│   ├── stores/                    # Zustand 状态管理
│   │   ├── authStore.js           # 认证状态
│   │   ├── agentStore.js         # Agent 状态
│   │   └── usageStore.js          # 用量状态
│   │
│   ├── hooks/                     # 自定义 Hooks
│   │   ├── useAuth.js            # 认证相关
│   │   ├── useAgents.js          # Agent 数据获取
│   │   └── useUsage.js           # 用量数据
│   │
│   ├── components/               # 通用组件
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Layout.jsx
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── Loading.jsx
│   │   └── agents/
│   │       ├── AgentCard.jsx
│   │       ├── AgentFilter.jsx
│   │       └── AgentDetail.jsx
│   │
│   ├── api/                      # API 调用层
│   │   ├── client.js             # Axios 实例配置
│   │   ├── auth.js               # 认证 API
│   │   ├── agents.js             # Agent API
│   │   └── usage.js              # 用量 API
│   │
│   ├── pages/                    # 页面组件
│   │   ├── market/
│   │   │   ├── AgentMarket.jsx
│   │   │   └── AgentDetail.jsx
│   │   └── console/
│   │       ├── Dashboard.jsx
│   │       ├── ApiKeys.jsx
│   │       ├── UsageStats.jsx
│   │       └── IntegrationGuide.jsx
│   │
│   ├── styles/                   # 样式文件
│   │   └── index.css
│   │
│   └── utils/                    # 工具函数
│       └── formatters.js
│
├── package.json
├── vite.config.js
└── tailwind.config.js
```

### 3.3 模块交互关系

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                              模块交互时序图                                      │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  场景 1: 用户请求 Agent 聊天                                                   │
│  ─────────────────────────────────────────────────────                         │
│                                                                                │
│  Client → [Middleware] → [Auth] → [Chat Router] → [Agent Engine] → LLM         │
│                  │              │          │                                    │
│                  ▼              ▼          ▼                                    │
│              Rate Limit    Token验证    Agent选择                               │
│              日志记录       权限检查     配额检查                                │
│                                                                                │
│  Agent Engine → [Usage Service] → [Database]                                  │
│       │                  │                                                        │
│       │                  ▼                                                        │
│       │              记录用量                                                    │
│       │              更新配额                                                    │
│       ▼                                                                         │
│  Stream Response                                                               │
│                                                                                │
│  ─────────────────────────────────────────────────────                         │
│  场景 2: 管理 Agent                                                           │
│  ─────────────────────────────────────────────────────                         │
│                                                                                │
│  Admin → [Auth Router] → [Auth Service] → [Database]                          │
│               │              │                │                                 │
│               │              │                ▼                                 │
│               │              │            Validate User                         │
│               │              ▼                                                  │
│               │         JWT Token                                               │
│               ▼                                                                   │
│         [Agent Router] → [Agent Service] → [Agent Registry]                    │
│               │              │                │                                 │
│               │              │                ▼                                 │
│               │              │            Get Agent                              │
│               │              ▼                                                  │
│               │         CRUD Operations                                         │
│               ▼                                                                   │
│         Response                                                               │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

### 3.4 模块职责定义

#### 3.4.1 Router 层职责

| Router | 路径 | 职责 |
|--------|------|------|
| auth.py | `/api/v1/auth` | 用户注册、登录、令牌刷新、密码重置 |
| agents.py | `/api/v1/agents` | Agent 列表查询、详情获取、启用/停用、收藏 |
| console.py | `/api/v1/console` | API Key 管理、用量统计、集成配置 |
| chat.py | `/v1/chat` | OpenAI 兼容的聊天完成接口 |

#### 3.4.2 Service 层职责

| Service | 职责 | 核心方法 |
|---------|------|---------|
| AuthService | 认证鉴权 | `create_user`, `verify_password`, `create_token`, `verify_api_key` |
| AgentService | Agent 管理 | `list_agents`, `get_agent`, `enable_agent`, `disable_agent` |
| UsageService | 用量统计 | `log_usage`, `get_usage_stats`, `check_quota` |
| BillingService | 计费服务 | `get_balance`, `create_payment`, `deduct_balance` |
| CacheService | 缓存服务 | `get`, `set`, `delete`, `invalidate_pattern` |

#### 3.4.3 Agent 引擎职责

| Agent 类型 | 基类 | 功能 |
|-----------|------|------|
| AgentEngine | 抽象基类 | 定义 Agent 接口 `run()`, `run_streaming()` |
| PromptTemplateAgent | AgentEngine | 支持系统提示词模板 |
| StructuredAgent | PromptTemplateAgent | 支持结构化输出 (JSON) |
| CodeRefactorAgent | PromptTemplateAgent | 代码分析与重构 |
| HanHanStyleAgent | PromptTemplateAgent | 韩寒风格创意写作 |
| BusinessCopywritingAgent | PromptTemplateAgent | 商业文案生成 |
| UnitTestAgent | PromptTemplateAgent | 单元测试生成 |

---

## 4. 数据库核心 Schema

### 4.1 ER 图

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                              数据库 ER 图                                        │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐                    │
│   │    users    │      │  api_keys   │      │   agents    │                    │
│   ├─────────────┤      ├─────────────┤      ├─────────────┤                    │
│   │ id (PK)     │◄──── │ user_id (FK)│      │ id (PK)     │                    │
│   │ email       │      │ id (PK)     │      │ agent_id    │                    │
│   │ password    │      │ key_hash    │      │ name        │                    │
│   │ username    │      │ key_prefix  │      │ description │                    │
│   │ balance     │      │ quota_total │      │ category    │                    │
│   │ is_active   │      │ quota_used  │      │ capabilities│                    │
│   │ created_at  │      │ is_active   │      │ context_len │                    │
│   │ updated_at  │      │ expires_at  │      │ pricing     │                    │
│   └─────────────┘      │ last_used   │      │ is_enabled  │                    │
│          │             │ created_at  │      │ created_at  │                    │
│          │             └─────────────┘      │ updated_at  │                    │
│          │                    │             └─────────────┘                    │
│          │                    │                    │                           │
│          │                    │                    │                           │
│          ▼                    ▼                    ▼                           │
│   ┌─────────────────────────────────────────────────────────┐                   │
│   │                     usage_logs                          │                   │
│   ├─────────────────────────────────────────────────────────┤                   │
│   │  id (PK)              │  api_key_id (FK)                │                   │
│   │  user_id (FK)         │  agent_id (FK)                  │                   │
│   │  prompt_tokens        │  completion_tokens              │                   │
│   │  total_tokens         │  cost                           │                   │
│   │  status               │  latency_ms                      │                   │
│   │  created_at           │  metadata (JSON)                │                   │
│   └─────────────────────────────────────────────────────────┘                   │
│                                                                                 │
│   ┌─────────────┐      ┌─────────────┐                                           │
│   │balance_trans│      │   audit_logs│                                           │
│   ├─────────────┤      ├─────────────┤                                           │
│   │ id (PK)     │      │ id (PK)     │                                           │
│   │ user_id (FK)│      │ user_id (FK)│                                           │
│   │ amount      │      │ action      │                                           │
│   │ type        │      │ resource    │                                           │
│   │ order_id    │      │ ip_address  │                                           │
│   │ status      │      │ created_at  │                                           │
│   │ created_at  │      └─────────────┘                                           │
│   └─────────────┘                                                             │
│                                                                                 │
└────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 表结构定义

#### 4.2.1 users 用户表

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    balance DECIMAL(12, 4) NOT NULL DEFAULT 0.0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT users_balance_check CHECK (balance >= 0)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);
```

#### 4.2.2 api_keys API Key 表

```sql
CREATE TABLE api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(64) NOT NULL,
    key_prefix VARCHAR(16) NOT NULL,
    name VARCHAR(100) NOT NULL,
    quota_total BIGINT NOT NULL DEFAULT 1000000,  -- Token 配额
    quota_used BIGINT NOT NULL DEFAULT 0,
    rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT api_keys_quota_check CHECK (quota_used <= quota_total)
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX idx_api_keys_expires_at ON api_keys(expires_at);
```

#### 4.2.3 agents Agent 表

```sql
CREATE TABLE agents (
    id SERIAL PRIMARY KEY,
    agent_id VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    capabilities TEXT[] NOT NULL DEFAULT '{}',  -- JSON 数组: ["代码分析", "重构建议"]
    context_length INTEGER NOT NULL DEFAULT 4096,
    pricing_model VARCHAR(20) NOT NULL DEFAULT 'token',  -- token, per_call, free
    price_per_1k_tokens DECIMAL(10, 4) DEFAULT 0.002,
    price_per_call DECIMAL(10, 4),
    agent_type VARCHAR(50) NOT NULL,  -- code_refactor, writing, test, custom
    engine_class VARCHAR(200),  -- Python 类名
    system_prompt TEXT,
    parameters JSONB DEFAULT '{}',  -- Agent 参数配置
    metadata JSONB DEFAULT '{}',  -- 扩展字段: 图标、截图、文档链接
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agents_agent_id ON agents(agent_id);
CREATE INDEX idx_agents_category ON agents(category);
CREATE INDEX idx_agents_is_enabled ON agents(is_enabled);
CREATE INDEX idx_agents_is_public ON agents(is_public);
CREATE INDEX idx_agents_created_at ON agents(created_at);
CREATE INDEX idx_agents_capabilities ON agents USING GIN(capabilities);
```

#### 4.2.4 usage_logs 用量日志表

```sql
CREATE TABLE usage_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_key_id INTEGER NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    agent_id INTEGER NOT NULL REFERENCES agents(id),
    request_id UUID NOT NULL DEFAULT gen_random_uuid(),

    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    cost DECIMAL(12, 6) NOT NULL DEFAULT 0,

    latency_ms INTEGER,
    status_code INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'success',  -- success, error, rate_limited

    request_metadata JSONB DEFAULT '{}',
    response_metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_api_key_id ON usage_logs(api_key_id);
CREATE INDEX idx_usage_logs_agent_id ON usage_logs(agent_id);
CREATE INDEX idx_usage_logs_request_id ON usage_logs(request_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at);

-- 复合索引: 按用户和时间范围查询
CREATE INDEX idx_usage_logs_user_time ON usage_logs(user_id, created_at DESC);

-- 复合索引: 按 API Key 和时间范围查询
CREATE INDEX idx_usage_logs_key_time ON usage_logs(api_key_id, created_at DESC);
```

#### 4.2.5 user_agents 用户启用的 Agent 表

```sql
CREATE TABLE user_agents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    custom_config JSONB DEFAULT '{}',  -- 用户自定义配置
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT user_agents_unique UNIQUE (user_id, agent_id)
);

CREATE INDEX idx_user_agents_user_id ON user_agents(user_id);
CREATE INDEX idx_user_agents_agent_id ON user_agents(agent_id);
```

#### 4.2.6 balance_transactions 余额交易表

```sql
CREATE TABLE balance_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,  -- deposit, payment, refund, adjustment
    amount DECIMAL(12, 4) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    balance_before DECIMAL(12, 4) NOT NULL,
    balance_after DECIMAL(12, 4) NOT NULL,
    description TEXT,
    order_id VARCHAR(200),
    payment_method VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, completed, failed
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_balance_trans_user_id ON balance_transactions(user_id);
CREATE INDEX idx_balance_trans_order_id ON balance_transactions(order_id);
CREATE INDEX idx_balance_trans_created_at ON balance_transactions(created_at);
CREATE INDEX idx_balance_trans_status ON balance_transactions(status);
```

#### 4.2.7 audit_logs 审计日志表

```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(200),
    ip_address INET,
    user_agent TEXT,
    request_id UUID,
    old_value JSONB,
    new_value JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

### 4.3 数据库优化建议

#### 4.3.1 分区策略

对于 `usage_logs` 表，建议按月分区以优化大表查询：

```sql
CREATE TABLE usage_logs_partitioned (
    LIKE usage_logs INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- 创建月度分区
CREATE TABLE usage_logs_2026_01 PARTITION OF usage_logs_partitioned
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE usage_logs_2026_02 PARTITION OF usage_logs_partitioned
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
```

#### 4.3.2 物化视图

创建常用统计的物化视图：

```sql
CREATE MATERIALIZED VIEW daily_usage_stats AS
SELECT
    DATE(created_at) as date,
    user_id,
    agent_id,
    COUNT(*) as request_count,
    SUM(total_tokens) as total_tokens,
    SUM(cost) as total_cost,
    AVG(latency_ms) as avg_latency_ms
FROM usage_logs
GROUP BY DATE(created_at), user_id, agent_id;

CREATE UNIQUE INDEX idx_daily_stats ON daily_usage_stats(date, user_id, agent_id);
```

---

## 5. API 接口规范

### 5.1 API 版本策略

| 版本 | 路径 | 状态 | 说明 |
|-----|------|------|------|
| v1 | `/api/v1/*` | 稳定 | 内部管理 API |
| v1 | `/v1/*` | 稳定 | OpenAI 兼容 API |
| v2 | `/api/v2/*` | 规划中 | 下一代 API |

### 5.2 OpenAI 兼容 API (`/v1/*`)

#### 5.2.1 聊天完成接口

```
POST /v1/chat/completions
```

**请求参数**:

```json
{
  "model": "asgard/code-refactor",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Refactor this Python code..."}
  ],
  "temperature": 0.7,
  "max_tokens": 1000,
  "stream": false,
  "top_p": 1.0,
  "frequency_penalty": 0.0,
  "presence_penalty": 0.0
}
```

**非流式响应**:

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1699867632,
  "model": "asgard/code-refactor",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Here is the refactored code..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 200,
    "total_tokens": 350
  }
}
```

**流式响应 (SSE)**:

```
data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1699867632,"model":"asgard/code-refactor","choices":[{"index":0,"delta":{"content":"Here"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1699867632,"model":"asgard/code-refactor","choices":[{"index":0,"delta":{"content":" is"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1699867632,"model":"asgard/code-refactor","choices":[{"index":0,"delta":{"content":" the"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1699867632,"model":"asgard/code-refactor","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}
```

#### 5.2.2 模型列表接口

```
GET /v1/models
```

**响应**:

```json
{
  "object": "list",
  "data": [
    {
      "id": "asgard/code-refactor",
      "object": "model",
      "created": 1699867632,
      "owned_by": "asgard"
    },
    {
      "id": "asgard/hanhan-style",
      "object": "model",
      "created": 1699867632,
      "owned_by": "asgard"
    }
  ]
}
```

### 5.3 认证 API (`/api/v1/auth`)

#### 5.3.1 用户注册

```
POST /api/v1/auth/register
```

**请求体**:

```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "secure_password123"
}
```

**响应**:

```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "username",
  "created_at": "2026-02-09T10:00:00Z"
}
```

#### 5.3.2 用户登录

```
POST /api/v1/auth/login
```

**请求体**:

```json
{
  "email": "user@example.com",
  "password": "secure_password123"
}
```

**响应**:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

#### 5.3.3 刷新令牌

```
POST /api/v1/auth/refresh
Authorization: Bearer {refresh_token}
```

**响应**:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### 5.4 Agent 管理 API (`/api/v1/agents`)

#### 5.4.1 Agent 列表

```
GET /api/v1/agents
```

**查询参数**:

| 参数 | 类型 | 默认值 | 说明 |
|-----|------|--------|------|
| page | integer | 1 | 页码 |
| page_size | integer | 20 | 每页数量 |
| category | string | - | 分类筛选 |
| capabilities | string | - | 能力标签筛选 (逗号分隔) |
| search | string | - | 关键词搜索 |
| sort | string | created_at | 排序字段 |
| order | string | desc | 排序方向 |

**响应**:

```json
{
  "data": [
    {
      "id": 1,
      "agent_id": "asgard/code-refactor",
      "name": "代码重构助手",
      "description": "专业的代码分析和重构建议",
      "category": "development",
      "capabilities": ["代码分析", "重构建议", "最佳实践"],
      "context_length": 8192,
      "pricing_model": "token",
      "price_per_1k_tokens": 0.002,
      "is_enabled": true,
      "is_public": true
    }
  ],
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 50,
    "total_pages": 3
  }
}
```

#### 5.4.2 Agent 详情

```
GET /api/v1/agents/{agent_id}
```

**响应**:

```json
{
  "id": 1,
  "agent_id": "asgard/code-refactor",
  "name": "代码重构助手",
  "description": "专业的代码分析和重构建议，提供重构方案和最佳实践指导。",
  "category": "development",
  "capabilities": ["代码分析", "重构建议", "最佳实践", "Bug 修复"],
  "context_length": 8192,
  "pricing_model": "token",
  "price_per_1k_tokens": 0.002,
  "parameters": {
    "language": "python",
    "strict_mode": false
  },
  "metadata": {
    "icon": "/icons/code-refactor.png",
    "screenshots": ["/screenshots/1.png"],
    "documentation": "/docs/agents/code-refactor"
  },
  "is_enabled": true,
  "is_public": true,
  "version": 1,
  "created_at": "2026-01-01T00:00:00Z"
}
```

#### 5.4.3 启用/停用 Agent

```
POST /api/v1/agents/{agent_id}/enable
POST /api/v1/agents/{agent_id}/disable
```

**响应**:

```json
{
  "success": true,
  "message": "Agent 已启用"
}
```

### 5.5 控制台 API (`/api/v1/console`)

#### 5.5.1 API Key 管理

**创建 API Key**:

```
POST /api/v1/console/api-keys
```

**请求体**:

```json
{
  "name": "开发环境",
  "quota_total": 1000000,
  "rate_limit_per_minute": 60
}
```

**响应**:

```json
{
  "id": 1,
  "name": "开发环境",
  "key_prefix": "asgard_sk_abc1",
  "key": "asgard_sk_abc1def2ghij3klmn...",  // 仅创建时返回
  "quota_total": 1000000,
  "quota_used": 0,
  "rate_limit_per_minute": 60,
  "is_active": true,
  "created_at": "2026-02-09T10:00:00Z"
}
```

**列出 API Keys**:

```
GET /api/v1/console/api-keys
```

**响应**:

```json
{
  "data": [
    {
      "id": 1,
      "name": "开发环境",
      "key_prefix": "asgard_sk_abc1",
      "quota_total": 1000000,
      "quota_used": 125000,
      "quota_remaining": 875000,
      "rate_limit_per_minute": 60,
      "is_active": true,
      "last_used_at": "2026-02-09T09:30:00Z",
      "created_at": "2026-02-09T10:00:00Z"
    }
  ]
}
```

**删除 API Key**:

```
DELETE /api/v1/console/api-keys/{key_id}
```

#### 5.5.2 用量统计

**获取用量统计**:

```
GET /api/v1/console/usage
```

**查询参数**:

| 参数 | 类型 | 默认值 | 说明 |
|-----|------|--------|------|
| start_date | date | - | 开始日期 |
| end_date | date | - | 结束日期 |
| group_by | string | day | 按 day/week/month 分组 |
| agent_id | string | - | Agent ID 筛选 |

**响应**:

```json
{
  "summary": {
    "total_requests": 1500,
    "total_tokens": 750000,
    "total_cost": 15.50,
    "average_latency_ms": 250
  },
  "data": [
    {
      "date": "2026-02-09",
      "requests": 150,
      "tokens": 75000,
      "cost": 1.55,
      "latency_ms": 250
    }
  ],
  "by_agent": [
    {
      "agent_id": "asgard/code-refactor",
      "requests": 800,
      "tokens": 400000,
      "cost": 8.00
    }
  ]
}
```

**导出用量数据**:

```
GET /api/v1/console/usage/export?format=csv
```

#### 5.5.3 集成指南

```
GET /api/v1/console/integration-guide
```

**响应**:

```json
{
  "quickstart": {
    "title": "快速开始",
    "description": "在 5 分钟内完成集成",
    "steps": [
      {
        "step": 1,
        "title": "获取 API Key",
        "description": "在控制台创建 API Key"
      },
      {
        "step": 2,
        "title": "配置客户端",
        "description": "设置 API Base URL 和 Key"
      }
    ]
  },
  "examples": [
    {
      "platform": "Cursor",
      "description": "Cursor IDE 配置",
      "code": "OPENAI_API_KEY=asgard_sk_xxx\nOPENAI_API_BASE=https://api.asgard.com/v1",
      "link": "/docs/integrations/cursor"
    },
    {
      "platform": "Continue (VS Code)",
      "description": "Continue 插件配置",
      "code": "...",
      "link": "/docs/integrations/continue"
    }
  ]
}
```

### 5.6 错误响应格式

```json
{
  "error": {
    "code": "invalid_api_key",
    "message": "提供的 API Key 无效或已过期",
    "type": "authentication_error",
    "status": 401,
    "details": {
      "key_prefix": "asgard_sk_abc1"
    }
  }
}
```

**错误代码列表**:

| 代码 | HTTP 状态码 | 说明 |
|-----|------------|------|
| invalid_api_key | 401 | API Key 无效 |
| rate_limit_exceeded | 429 | 超出请求限制 |
| quota_exceeded | 402 | 超出配额 |
| agent_not_found | 404 | Agent 不存在 |
| agent_disabled | 403 | Agent 已停用 |
| invalid_request | 400 | 请求参数错误 |
| server_error | 500 | 服务器内部错误 |

---

## 6. 技术实现路线图

### 6.1 阶段一：基础设施搭建 (1-2 周)

#### 目标
完成项目初始化，搭建开发环境，建立 CI/CD 流水线。

#### 交付物

| 任务 | 描述 | 优先级 |
|-----|------|--------|
| 后端项目初始化 | FastAPI + SQLAlchemy 项目骨架 | P0 |
| 前端项目升级 | React Router DOM + Zustand + TanStack Query | P0 |
| 数据库迁移工具 | Alembic 集成 | P0 |
| 开发环境 Docker 化 | docker-compose.yml 完善 | P0 |
| CI/CD 流水线 | GitHub Actions 配置 | P1 |
| 配置文件管理 | .env.example, 配置分层 | P1 |

#### 技术要点

**Alembic 初始化**:
```bash
pip install alembic
alembic init migrations
```

**Alembic 配置** (`migrations/env.py`):
```python
from app.models import Base
target_metadata = Base.metadata
```

**Docker Compose 配置**:
```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: asgard
      POSTGRES_USER: asgard
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build: ./packages/api
    environment:
      DATABASE_URL: postgresql+asyncpg://asgard:${DB_PASSWORD}@db:5432/asgard
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - db
      - redis
    ports:
      - "8000:8000"

  web:
    build: ./packages/web
    ports:
      - "5173:5173"

volumes:
  postgres_data:
```

### 6.2 阶段二：核心后端服务 (2-3 周)

#### 目标
完成认证系统、API 网关、Agent 管理、OpenAI 兼容接口。

#### 交付物

| 任务 | 描述 | 优先级 |
|-----|------|--------|
| 用户认证系统 | JWT 注册登录、令牌刷新 | P0 |
| API Key 系统 | 创建、验证、轮换、删除 | P0 |
| OpenAI 兼容网关 | /v1/chat/completions, SSE 流式 | P0 |
| Agent 管理系统 | CRUD、启用/停用 | P0 |
| 用量统计服务 | Token 计数、配额更新 | P0 |
| Redis 缓存层 | Agent 信息缓存、会话 | P1 |
| Rate Limit 中间件 | 基于 IP/API Key 限流 | P1 |

#### 技术要点

**认证中间件**:
```python
# app/middleware/auth.py
async def verify_api_key(request: Request, api_key: str = Depends(get_api_key_from_header)):
    # 验证 Key 是否有效
    # 检查配额
    # 检查是否过期
    return api_key_info
```

**OpenAI 兼容接口**:
```python
# app/routers/chat.py
@app.post("/v1/chat/completions")
async def chat_completions(
    request: ChatCompletionRequest,
    api_key: APIKey = Depends(verify_api_key),
    db: AsyncSession = Depends(get_db)
):
    # 1. 路由到对应 Agent
    agent = await get_agent_by_id(request.model)

    # 2. 检查配额
    if api_key.quota_remaining <= 0:
        raise QuotaExceededError()

    # 3. 执行 Agent
    if request.stream:
        return StreamingResponse(
            agent.run_streaming(request.messages),
            media_type="text/event-stream"
        )
    else:
        return await agent.run(request.messages)
```

### 6.3 阶段三：前端功能完善 (2-3 周)

#### 目标
完成 Agent 市场、控制台功能、用户系统。

#### 交付物

| 任务 | 描述 | 优先级 |
|-----|------|--------|
| Agent 市场页面 | 列表、搜索、筛选 | P0 |
| Agent 详情页 | 详情展示、使用统计 | P0 |
| 控制台仪表盘 | 概览、用量图表 | P0 |
| API Key 管理 | 创建、复制、轮换、删除 | P0 |
| 集成指南页面 | 多平台配置示例 | P1 |
| 用户登录/注册 | 认证流程 | P1 |
| 用量统计图表 | Recharts 集成 | P1 |

#### 技术要点

**Zustand 状态管理**:
```javascript
// stores/agentStore.js
import { create } from 'zustand'
import { fetchAgents, searchAgents } from '../api/agents'

export const useAgentStore = create((set, get) => ({
  agents: [],
  filters: {
    category: null,
    capabilities: [],
    search: ''
  },
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0
  },
  loading: false,

  // Actions
  loadAgents: async () => {
    set({ loading: true })
    const { filters, pagination } = get()
    const { data, meta } = await searchAgents(filters, pagination)
    set({ agents: data, pagination: meta, loading: false })
  },

  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } })
    get().loadAgents()
  }
}))
```

**TanStack Query 数据获取**:
```javascript
// hooks/useAgents.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAgents, enableAgent, disableAgent } from '../api/agents'

export function useAgents(filters) {
  return useQuery({
    queryKey: ['agents', filters],
    queryFn: () => fetchAgents(filters),
    staleTime: 5 * 60 * 1000 // 5 分钟内不重新请求
  })
}

export function useToggleAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ agentId, action }) =>
      action === 'enable' ? enableAgent(agentId) : disableAgent(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    }
  })
}
```

### 6.4 阶段四：Agent 引擎实现 (2-3 周)

#### 目标
完成核心 Agent 实现，建立 Agent 框架。

#### 交付物

| 任务 | 描述 | 优先级 |
|-----|------|--------|
| Agent 基础框架 | 基类定义、接口标准化 | P0 |
| Code Refactor Agent | 代码分析、重构建议 | P0 |
| Han Han Style Agent | 风格化写作 | P0 |
| Unit Test Agent | 单元测试生成 | P1 |
| Business Copywriting Agent | 商业文案 | P2 |
| Agent 注册系统 | 动态注册、发现 | P1 |
| LLM Provider 抽象 | 多模型支持 | P2 |

#### 技术要点

**Agent 基类**:
```python
# app/agents/base.py
from abc import ABC, abstractmethod
from typing import AsyncGenerator, List, Dict, Any

class AgentEngine(ABC):
    agent_id: str
    name: str
    description: str
    capabilities: List[str]
    context_length: int = 4096

    @abstractmethod
    async def run(
        self,
        messages: List[Dict[str, str]],
        **kwargs
    ) -> Dict[str, Any]:
        """同步执行 Agent"""
        pass

    @abstractmethod
    async def run_streaming(
        self,
        messages: List[Dict[str, str]],
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """流式执行 Agent"""
        pass

    async def count_tokens(self, text: str) -> int:
        """Token 计数（可被覆盖）"""
        return len(text) // 4  # 简单估算


class PromptTemplateAgent(AgentEngine):
    system_prompt: str

    def _build_messages(
        self,
        messages: List[Dict[str, str]],
        **kwargs
    ) -> List[Dict[str, str]]:
        """构建完整的消息列表"""
        return [
            {"role": "system", "content": self.system_prompt},
            *messages
        ]


class StructuredAgent(PromptTemplateAgent):
    """支持结构化输出的 Agent"""

    @abstractmethod
    async def run_structured(
        self,
        messages: List[Dict[str, str]],
        response_format: Dict[str, Any],
        **kwargs
    ) -> Dict[str, Any]:
        """返回结构化数据"""
        pass
```

### 6.5 阶段五：CLI 工具与集成 (1-2 周)

#### 目标
提供本地开发工具，支持第三方集成。

#### 交付物

| 任务 | 描述 | 优先级 |
|-----|------|--------|
| CLI 基础功能 | 安装、认证、配置 | P0 |
| 本地交互 | 与 Agent 对话 | P0 |
| 配置管理 | ~/.asgardrc 配置 | P1 |
| Cursor 集成 | 配置模板、文档 | P1 |
| VS Code Continue | 配置模板、文档 | P1 |
| API 文档 | OpenAPI/Swagger | P1 |

#### 技术要点

**CLI 工具架构**:
```
asgard-cli/
├── src/
│   ├── __init__.py
│   ├── main.py          # Click 入口
│   ├── commands/
│   │   ├── __init__.py
│   │   ├── login.py     # 登录命令
│   │   ├── agents.py    # Agent 列表/选择
│   │   ├── chat.py      # 对话命令
│   │   └── config.py    # 配置命令
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py  # 配置模型
│   │   └── loader.py    # 配置加载
│   └── utils/
│       ├── __init__.py
│       └── http.py      # HTTP 客户端
├── pyproject.toml
└── README.md
```

### 6.6 阶段六：可观测性与生产化 (持续)

#### 目标
建立监控、告警、日志体系，准备生产部署。

#### 交付物

| 任务 | 描述 | 优先级 |
|-----|------|--------|
| Prometheus 指标 | 请求延迟、QPS、错误率 | P1 |
| Grafana 仪表盘 | 监控面板 | P1 |
| 日志结构化 | JSON 格式、链路追踪 | P1 |
| Health Check | 就绪/存活探针 | P1 |
| K8s 部署配置 | Deployment, Service, Ingress | P2 |
| 负载测试 | Locust/JMeter 脚本 | P2 |

#### 技术要点

**Prometheus 指标**:
```python
# app/metrics.py
from prometheus_client import Counter, Histogram, Gauge

REQUEST_COUNT = Counter('asgard_requests_total', 'Total requests')
REQUEST_LATENCY = Histogram('asgard_request_duration_seconds', 'Request latency')
ACTIVE_CONNECTIONS = Gauge('asgard_active_connections', 'Active connections')
QUOTA_REMAINING = Gauge('asgard_quota_remaining', 'API Key remaining quota')


@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    latency = time.time() - start_time

    REQUEST_COUNT.labels(
        method=request.method,
        path=request.url.path,
        status=response.status_code
    ).inc()

    REQUEST_LATENCY.labels(
        method=request.method,
        path=request.url.path
    ).observe(latency)

    return response
```

### 6.7 里程碑时间线

```
Week 1-2      Week 3-5      Week 6-8      Week 9-11     Week 12-13    Week 14+
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ 基础设施搭建  │ 核心后端服务  │ 前端功能完善  │ Agent 引擎   │ CLI 工具     │ 可观测性     │
│             │             │             │             │             │ 生产化       │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ □ 项目初始化 │ □ 认证系统   │ □ Agent 市场 │ □ Agent 框架 │ □ CLI 基础   │ □ 监控指标   │
│ □ Docker    │ □ API Key   │ □ 控制台    │ □ Code Agent│ □ 本地交互   │ □ Grafana   │
│ □ CI/CD     │ □ OpenAI 网关│ □ 用户系统  │ □ Writer    │ □ 集成文档   │ □ K8s 配置   │
│ □ 数据库迁移 │ □ Agent 管理 │ □ 集成指南  │ □ Test Agent│              │ □ 压测      │
│ □ 缓存层    │ □ 用量统计  │             │             │              │             │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ MVP 发布 ──────────────────────►│             │             │             │             │
└───────────────────────────────┘             │             │             │             │
                                              ▼             │             │             │
                                    内部 Beta ─────────────►│             │             │
                                                          ▼             │             │
                                                公开 Beta ─────────────►│             │
                                                                          ▼             │
                                                                            正式发布 ──►│
```

---

## 7. 安全设计

### 7.1 认证机制

#### 7.1.1 JWT 认证

```python
# app/auth.py
from datetime import datetime, timedelta
from jose import jwt, JWTError

class JWTAuth:
    def create_access_token(
        self,
        user_id: int,
        expires_delta: timedelta = timedelta(hours=1)
    ) -> str:
        payload = {
            "sub": str(user_id),
            "type": "access",
            "exp": datetime.utcnow() + expires_delta,
            "iat": datetime.utcnow()
        }
        return jwt.encode(
            payload,
            settings.jwt_secret_key,
            algorithm="HS256"
        )

    def create_refresh_token(self, user_id: int) -> str:
        expires_delta = timedelta(days=7)
        payload = {
            "sub": str(user_id),
            "type": "refresh",
            "exp": datetime.utcnow() + expires_delta,
            "iat": datetime.utcnow()
        }
        return jwt.encode(
            payload,
            settings.jwt_secret_key,
            algorithm="HS256"
        )
```

#### 7.1.2 API Key 认证

```python
# app/auth.py
from secrets import compare_digest
import hashlib

class APIKeyAuth:
    def hash_key(self, key: str) -> str:
        """SHA256 哈希存储"""
        return hashlib.sha256(key.encode()).hexdigest()

    async def verify_key(self, key: str, db: AsyncSession) -> Optional[APIKey]:
        key_hash = self.hash_key(key)

        result = await db.execute(
            select(APIKey).where(
                APIKey.key_hash == key_hash,
                APIKey.is_active == True
            )
        )

        api_key = result.scalar_one_or_none()

        if api_key and api_key.expires_at:
            if datetime.utcnow() > api_key.expires_at:
                raise APIKeyExpiredError()

        return api_key
```

### 7.2 数据安全

#### 7.2.1 密码存储

```python
# 使用 bcrypt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
```

#### 7.2.2 API Key 显示

- **创建时**: 显示完整 Key `asgard_sk_abc123...`
- **存储时**: 仅存储 SHA256 Hash
- **查询时**: 只返回前缀 `asgard_sk_abc1***`

### 7.3 网络安全

#### 7.3.1 CORS 配置

```python
# app/middleware/cors.py
from fastapi.middleware.cors import CORSMiddleware

# 生产环境只允许指定域名
allow_origins = (
    ["https://app.asgard.com", "https://admin.asgard.com"]
    if not settings.debug
    else []  # 调试模式不允许跨域
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 7.3.3 Rate Limiting

```python
# app/middleware/rate_limit.py
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # API Key 级别限流
    if api_key := request.state.api_key:
        if not await limiter.check_request(
            f"apikey:{api_key.id}",
            limit=api_key.rate_limit_per_minute
        ):
            raise RateLimitExceededError()

    return await call_next(request)
```

### 7.4 审计日志

```python
# app/services/audit_service.py
class AuditService:
    async def log(
        self,
        user_id: Optional[int],
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        old_value: Optional[dict] = None,
        new_value: Optional[dict] = None
    ):
        await db.execute(
            insert(AuditLog).values(
                user_id=user_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                ip_address=ip_address,
                old_value=old_value,
                new_value=new_value,
                created_at=datetime.utcnow()
            )
        )
```

---

## 8. 性能与可扩展性

### 8.1 性能优化策略

#### 8.1.1 数据库优化

| 优化项 | 策略 | 预期收益 |
|-------|------|---------|
| 查询优化 | 合理使用索引、分区 | 查询延迟降低 50%+ |
| 连接池 | AsyncSession + SQLAlchemy Pool | 吞吐量提升 3x |
| 只读副本 | 读写分离 | 读操作扩展 5x |
| 物化视图 | 预计算统计 | 统计查询 <100ms |

#### 8.1.2 缓存策略

```python
# app/services/cache_service.py
class CacheService:
    CACHE_TTL = {
        "agent_info": 300,      # 5 分钟
        "user_profile": 600,     # 10 分钟
        "usage_stats": 60,       # 1 分钟
        "rate_limit": 60,       # 1 分钟
    }

    async def get_agent_info(self, agent_id: str) -> Optional[dict]:
        # 1. 先查缓存
        cached = await self.client.get(f"agent:{agent_id}")
        if cached:
            return json.loads(cached)

        # 2. 查数据库
        agent = await self.get_agent_from_db(agent_id)

        # 3. 写入缓存
        if agent:
            await self.client.setex(
                f"agent:{agent_id}",
                self.CACHE_TTL["agent_info"],
                json.dumps(agent)
            )

        return agent
```

#### 8.1.3 连接池配置

```python
# app/database.py
from sqlalchemy.ext.asyncio import create_async_engine

engine = create_async_engine(
    settings.database_url,
    pool_size=20,           # 常规连接数
    max_overflow=10,        # 最大额外连接
    pool_pre_ping=True,     # 连接健康检查
    pool_recycle=3600,      # 连接回收时间
)
```

### 8.2 水平扩展

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                            水平扩展架构                                          │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│                           ┌─────────────┐                                      │
│                           │   Nginx     │                                      │
│                           │ Load Balancer│                                      │
│                           └──────┬──────┘                                      │
│                                  │                                             │
│           ┌──────────────────────┼──────────────────────┐                       │
│           │                      │                      │                       │
│           ▼                      ▼                      ▼                       │
│    ┌─────────────┐       ┌─────────────┐       ┌─────────────┐                  │
│    │  API Pod 1  │       │  API Pod 2  │       │  API Pod N  │                  │
│    └──────┬──────┘       └──────┬──────┘       └──────┬──────┘                  │
│           │                     │                     │                         │
│           └──────────────────────┼────────────────────┘                         │
│                                  │                                              │
│                    ┌─────────────┼─────────────┐                               │
│                    │   PostgreSQL │   Redis     │                               │
│                    │   Primary + │   Cluster    │                               │
│                    │   Replicas  │             │                               │
│                    └─────────────────────────────┘                              │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

### 8.3 性能指标目标

| 指标 | 当前目标 | 长期目标 |
|-----|---------|---------|
| P99 延迟 | <500ms | <200ms |
| 可用性 | 99.9% | 99.95% |
| QPS | 100 | 1000 |
| 错误率 | <0.5% | <0.1% |
| 缓存命中率 | >70% | >85% |

---

## 9. 部署架构

### 9.1 开发环境

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: asgard
      POSTGRES_USER: asgard
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build:
      context: ./packages/api
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql+asyncpg://asgard:${DB_PASSWORD}@postgres:5432/asgard
      REDIS_URL: redis://redis:6379/0
      DEBUG: "true"
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
    volumes:
      - ./packages/api:/app

  web:
    build:
      context: ./packages/web
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    volumes:
      - ./packages/web:/app
      - /app/node_modules

volumes:
  postgres_data:
```

### 9.2 生产环境 K8s 部署

```yaml
# k8s/manifests/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: asgard-api
  namespace: asgard
spec:
  replicas: 3
  selector:
    matchLabels:
      app: asgard-api
  template:
    metadata:
      labels:
        app: asgard-api
    spec:
      containers:
      - name: api
        image: asgard/api:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: asgard-secrets
              key: database-url
        - name: JWT_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: asgard-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: asgard-api
  namespace: asgard
spec:
  selector:
    app: asgard-api
  ports:
  - port: 80
    targetPort: 8000
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: asgard-api
  namespace: asgard
spec:
  rules:
  - host: api.asgard.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: asgard-api
            port:
              number: 80
```

### 9.3 监控配置

```yaml
# k8s/manifests/monitoring.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: asgard-api
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: asgard-api
  endpoints:
  - port: metrics
    path: /metrics
    interval: 15s

---
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: asgard-alerts
  namespace: monitoring
spec:
  groups:
  - name: asgard.rules
    rules:
    - alert: HighErrorRate
      expr: rate(asgard_requests_total{status=~"5.."}[5m]) > 0.1
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "High error rate detected"
    - alert: HighLatency
      expr: histogram_quantile(0.95, rate(asgard_request_duration_seconds_bucket[5m])) > 0.5
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High latency detected"
```

---

## 附录

### A. 参考文档

| 文档 | 链接 |
|-----|------|
| FastAPI 官方文档 | https://fastapi.tiangolo.com |
| SQLAlchemy 文档 | https://docs.sqlalchemy.org |
| React Router 文档 | https://reactrouter.com |
| Zustand 文档 | https://docs.pmnd.rs/zustand |
| TanStack Query | https://tanstack.com/query |
| OpenAI API 文档 | https://platform.openai.com/docs |

### B. 术语表

| 术语 | 定义 |
|-----|------|
| Agent | 特定领域的 AI 助手实现 |
| API Key | 用于认证的密钥 |
| Token | LLM 处理的文本单位 |
| SSE | Server-Sent Events，用于流式响应 |
| Rate Limiting | 请求频率限制 |
| Quota | API Key 的使用配额 |

### C. 版本历史

| 版本 | 日期 | 作者 | 变更 |
|-----|------|-----|------|
| v1.0 | 2026-02-09 | 架构师 | 初始版本 |

---

*文档生成时间: 2026-02-09*
