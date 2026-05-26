# Pencil 生态发展路线 — Charter Pointer

> **生态发展路线唯一源头**：[nanoPencil/docs/pencil-platform-charter.md](https://github.com/O-Pencil/nanoPencil/blob/main/docs/pencil-platform-charter.md)
>
> 本文是 **Asgard Platform** 在 Pencil 生态中的 pointer 文档。所有生态级事实（4 项目拓扑、术语、阶段叙事、跨项目工作线/决策）以 charter 为准；本文只描述 Asgard Platform 本仓的角色 + 边界 + 跨项目事实查表入口。

## 1. 本仓在 Pencil 生态中的位置

Asgard Platform 是 Pencil 生态 4 项目之一，定位为**多 Agent 管理平台**（charter §3）：

- 用户系统、API Key 管理、PencilAgent CRUD、用量记录、计费策略、Marketplace
- 通过 HTTP 代理到 Pencil-Agent-Gateway，**不** import Gateway 代码
- **不**实现 Agent 引擎；**不**实现 HTTP serving 协议；**不**直接管容器进程（编排是阶段四 C 线）

本仓是 Asgard Platform 的 **monorepo 入口**，包含两个子模块：

| 子模块 | 仓库 | 技术栈 |
|---|---|---|
| Asgard-api | `O-Pencil/Asgard-api` | FastAPI + SQLAlchemy（async）+ PostgreSQL |
| Asgard-web | `O-Pencil/Asgard-web` | React + Vite |

每个子模块仓库都有自己的 charter pointer。

## 2. 本仓在 charter §7 各工作线中的角色

charter §7 列出阶段四的 6 条工作线。Asgard 主导其中 2 条：

| 工作线 | Asgard 是否主导 | 落地位置 |
|---|---|---|
| **A 工具回传 v0.2** | ⚪ 不主导（Gateway + nano-pencil + editor 主导） | — |
| **B 计费与用量闭环** | ✅ **主导** | Asgard-api 用量 API + 配额检查；Asgard-web 用量看板 |
| **C 容器隔离与编排** | ✅ **主导**（与运维协同） | 编排脚本 + Gateway 容器化 |
| D Soul/Memory 配置 UI | ✅ Asgard-web 主导 | Asgard-web |
| E Channel 拆仓 | ⚪ 不参与 | — |
| F Rust 性能层 | ⚪ 不参与 | — |

详细里程碑见 charter §7.2 / §7.3。

## 3. 跨项目事实查表入口

| 想找什么 | 去 charter 哪一节 |
|---|---|
| 4 项目拓扑与依赖关系 | §2 |
| 各项目责任边界 | §3 |
| 术语表（PencilAgent / Pencil / Asgard 等） | §4 |
| 协议策略（HTTP+SSE / ACP / PCP） | §5 |
| 阶段叙事（一→四） | §6 |
| 跨项目工作线 / 里程碑 | §7 |
| 跨项目决策记录 | §8 |
| 文档维护机制 | §10 |

## 4. charter 失同步时怎么办

发现 charter 跟实际不符时，**不要修改本仓 pointer**，而是按 charter §10.1 流程：

1. 直接在 `O-Pencil/nanoPencil` 仓库提 PR 改 charter（源头修），或开 issue 说明问题
2. charter 改动会通过 `nanoPencil/.github/workflows/charter-sync-notify.yml` 自动通知本仓
3. 收到 charter-sync issue 后，本仓再决定是否需要刷新本 pointer

**本仓 pointer 只在以下情况修改**：
- charter §2 / §3 / §4 关于 Asgard 的描述变化
- §7 工作线 B/C 的里程碑表更新
- 子模块结构变化（例如新增 / 移除 / 替换 submodule）

详见 charter §10.1（修改流程）、§10.2（防止重复）、§10.3（同步检测自动化）。
