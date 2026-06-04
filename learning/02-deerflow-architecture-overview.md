# DeerFlow 架构概览

本文档从整体视角介绍 DeerFlow 的架构设计，重点讲解运行时存储层次和请求处理流程。

---

## 1. 项目分层

```
deer-flow/
├── backend/
│   ├── packages/harness/deerflow/   ← Harness 层 (deerflow.*)
│   │   ├── agents/                   # Agent 系统
│   │   ├── runtime/                  # 运行时 (RunManager, Checkpointer, Store)
│   │   ├── config/                   # 配置系统
│   │   ├── persistence/              # 持久化 (ORM models, repositories)
│   │   └── ...
│   └── app/                          ← App 层 (app.*)
│       ├── gateway/                   # FastAPI Gateway
│       └── channels/                  # IM 平台集成
└── frontend/                         ← Next.js 前端
```

**依赖规则**：App 可以导入 Harness，但 Harness 绝不能导入 App。由 CI 中的 `test_harness_boundary.py` 强制执行。

---

## 2. 请求处理流程

```
浏览器 → nginx (2026) → 路由 API 请求 → LangGraph (2024) / Gateway (8001)
                     → 提供静态文件 → Frontend (3000)
```

### 单次对话请求的完整路径

```
1. 用户发送消息 → POST /api/threads/{tid}/runs/stream
2. nginx 转发 → Gateway (8001)
3. Gateway 路由 → 调用 get_run_context(request) 构建依赖
4. RunManager.create_or_reject() → 检查冲突 + 创建 Run 记录
5. asyncio.create_task(run_agent(ctx, record, ...)) → 后台执行
6. run_agent 内部:
   a. 从 ctx.checkpointer 加载历史状态
   b. 创建 Agent，挂载 checkpointer/store
   c. agent.astream(input, config) → LangGraph 执行图
   d. 每步节点完成 → checkpointer 自动保存 checkpoint
   e. 流式事件 → StreamBridge → SSE → 前端
   f. RunJournal 写入 event_store
7. Run 完成 → set_status(success/failed) → 持久化
```

---

## 3. 五种存储各司其职

DeerFlow 的运行时数据分散在五个独立的存储中，每个解决不同的问题：

| # | 存储 | 存什么 | 隔离单位 | 写入者 | 对应实体 |
|---|------|--------|---------|--------|---------|
| 1 | **Checkpointer** | ThreadState 版本快照 | thread_id | LangGraph 自动 | SQLite/Postgres/Memory |
| 2 | **Store** | 跨线程 KV 键值对 | namespace 元组 | 业务代码手动 | SQLite/Postgres/Memory |
| 3 | **RunStore** | Run 元数据 | run_id + thread_id | RunManager | SQL/Memory |
| 4 | **RunEventStore** | 事件流（AI chunk、工具调用等）| thread_id + run_id + seq | RunJournal | SQL/JSONL/Memory |
| 5 | **ThreadMetaStore** | 线程元数据（标题、状态） | thread_id + user_id | Gateway 路由 + worker | SQL 或 #2 Store |

### 存储之间的关系图

```
                     ┌─────────────────────────┐
                     │       前端 (Next.js)      │
                     └───────────┬─────────────┘
                                 │ HTTP 请求
                                 ↓
                     ┌─────────────────────────┐
                     │    Gateway (FastAPI)      │
                     │                           │
                     │  ┌─ ThreadMetaStore ──┐  │  ← 线程列表、标题、状态
                     │  │  (SQL 或 Store)     │  │
                     │  └────────────────────┘  │
                     │                           │
                     │  ┌─ RunManager ────────┐  │
                     │  │  + RunStore         │  │  ← Run 状态、token 用量
                     │  └────────────────────┘  │
                     │                           │
                     │  ┌─ RunEventStore ─────┐  │  ← 事件回放、断线重连
                     │  │  (SQL/JSONL/Memory) │  │
                     │  └────────────────────┘  │
                     └───────────┬─────────────┘
                                 │ run_agent(ctx, ...)
                                 ↓
                     ┌─────────────────────────┐
                     │   LangGraph Agent 执行    │
                     │                           │
                     │  ┌─ Checkpointer ──────┐  │  ← 对话状态快照
                     │  │  (SQLite/Postgres)   │  │     自动保存/恢复
                     │  └────────────────────┘  │
                     │                           │
                     │  ┌─ Store ──────────────┐  │  ← 跨线程共享数据
                     │  │  (作为 ThreadMeta    │  │     (当前主要为
                     │  │   Store 的底层存储)   │  │      ThreadMetaStore)
                     │  └────────────────────┘  │
                     └─────────────────────────┘
```

### 为什么不合并成一个数据库？

- **Checkpointer** 由 LangGraph 驱动，表结构由 LangGraph 定义
- **RunStore / RunEventStore / ThreadMetaStore** 由 DeerFlow 定义
- 职责分离：对话状态（可回滚）vs 运行记录（只追加）vs 列表元数据（频繁查询）

---

## 4. 依赖注入链路

### 启动时：lifespan → langgraph_runtime → app.state

```python
# app.py
@asynccontextmanager
async def lifespan(app: FastAPI):
    startup_config = get_app_config()
    async with langgraph_runtime(app, startup_config):  # ← 创建所有单例
        yield

# deps.py
async def langgraph_runtime(app, startup_config):
    async with AsyncExitStack() as stack:
        app.state.checkpointer = await stack.enter_async_context(make_checkpointer(config))
        app.state.store = await stack.enter_async_context(make_store(config))
        app.state.run_manager = RunManager(store=...)
        app.state.run_event_store = make_run_event_store(...)
        ...
        yield
```

### 请求时：request → app.state → RunContext

```python
# deps.py
def get_run_context(request: Request) -> RunContext:
    return RunContext(
        checkpointer=get_checkpointer(request),   # request.app.state.checkpointer
        store=get_store(request),                  # request.app.state.store
        ...
    )

def get_checkpointer(request):
    val = getattr(request.app.state, "checkpointer", None)
    if val is None:
        raise HTTPException(503)
    return val
```

### 关键概念

- `app.state` = FastAPI 应用级共享命名空间
- `request.app` = 每个 Request 自动持有 FastAPI 应用实例的引用
- 启动时挂、请求时取、关闭时清理

---

## 5. 配置热重载边界

| 类别 | 字段 | 行为 |
|------|------|------|
| **每次请求热重载** | models、tools、summarization、memory、subagents | 通过 `get_app_config()` 检查 mtime 自动重载 |
| **启动时冻结** | checkpointer、database、run_events、sandbox.use | 持有连接/句柄，重启才生效 |

`get_run_context()` 故意让 `app_config` 走热重载，`event_store` + `run_events_config` 走冻结快照——避免"新配置 + 旧实例"的不一致。
