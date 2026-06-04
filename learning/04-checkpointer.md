# LangGraph Checkpointer 详解

本文档深入讲解 LangGraph Checkpointer 的设计原理和 DeerFlow 中的使用方式。

---

## 1. 一句话定义

**Checkpointer = 对话状态的版本管理系统**——LangGraph 每执行完一个图节点就自动保存完整 ThreadState 快照，支持恢复、回滚和分叉。

类比游戏的"自动存档系统"：每打完一关自动存档，下次启动从最近的存档继续，还能回到任何一个旧存档。

---

## 2. Checkpointer 存什么

### ThreadState 的全部字段

```python
class ThreadState(AgentState):
    messages: list[BaseMessage]     # 对话消息
    sandbox: SandboxId | None       # 沙箱 ID
    thread_data: dict               # 线程级数据
    title: str                      # 自动生成的标题
    artifacts: list                 # 输出文件
    todos: list                     # 任务列表 (plan mode)
    uploaded_files: list            # 上传文件
    viewed_images: list             # 查看的图片
```

### 一个 Checkpoint 的完整结构

```python
CheckpointTuple(
    config={
        "configurable": {
            "thread_id": "thread-abc",
            "checkpoint_id": "01HXY...004",   # 快照 ID (基于 ULID，含时间戳)
        }
    },
    checkpoint={
        "id": "01HXY...004",
        "ts": "2026-06-04T10:15:23.123456Z",
        "channel_values": {                   # ★ 这里就是 ThreadState 的内容 ★
            "messages": [HumanMessage("你好"), AIMessage("你好！"), ...],
            "title": "代码请求对话",
            "sandbox": "sb-xyz-123",
            "artifacts": [],
            ...
        },
        "channel_versions": {                 # 每个字段的版本号
            "messages": 4,
            "title": 1,
            "sandbox": 1,
            ...
        },
    },
    metadata={
        "source": "loop",
        "step": 3,
        "writes": {"agent_node": {"messages": [AIMessage(...)]}}
    },
    parent_config={                           # 指向上一个 checkpoint
        "configurable": {"checkpoint_id": "01HXY...003"}
    },
)
```

---

## 3. 三张表的结构

### 表 1：`checkpoints` —— 快照清单（轻量索引）

```
┌────────────┬──────────────┬──────────────────┬─────────────────────────────────┐
│ thread_id  │ checkpoint_id│ parent_cp_id     │ channel_versions                │
├────────────┼──────────────┼──────────────────┼─────────────────────────────────┤
│ thread-abc │ ...001       │ NULL             │ {messages:1, sandbox:1, ...}    │
│ thread-abc │ ...002       │ ...001           │ {messages:1, sandbox:1, title:1}│
│ thread-abc │ ...003       │ ...002           │ {messages:2, sandbox:1, title:1}│
│ thread-abc │ ...004       │ ...00003         │ {messages:2, ..., upl_files:1}  │
└────────────┴──────────────┴──────────────────┴─────────────────────────────────┘
```

**不存任何实际数据**，只存 `channel_versions` 映射（每个字段对应哪个版本）。

`parent_checkpoint_id` 形成链表，记录快照之间的先后关系。

### 表 2：`checkpoint_blobs` —— 真实数据（去重存储池）

```
┌────────────┬────────────┬─────────┬──────────────────────────────────────────┐
│ thread_id  │ channel    │ version │ blob (序列化数据)                         │
├────────────┼────────────┼─────────┼──────────────────────────────────────────┤
│ thread-abc │ messages   │ 1       │ <[Human("你好"), AI("你好！")]>           │
│ thread-abc │ messages   │ 2       │ <[..., Human("帮我写代码"), AI("好的")]> │
│ thread-abc │ sandbox    │ 1       │ "sb-xyz"                                │
│ thread-abc │ title      │ 1       │ "代码请求对话"                           │
│ thread-abc │ upl_files  │ 1       │ [<File: report.pdf>]                    │
└────────────┴────────────┴─────────┴──────────────────────────────────────────┘
```

**按 (thread_id, channel, version) 三元组唯一标识**。

### 表 3：`checkpoint_writes` —— 待合并的增量写入

存执行过程中产生但还没完成合并的写入，用于崩溃恢复。

---

## 4. Channel 版本化 + Blob 共享 = 自动去重

### 核心机制

LangGraph 把 ThreadState 的每个字段叫做一个 **Channel**。每个 Channel 独立维护版本号。**只有发生变化的 Channel 才会产生新版本的 blob**。

### 完整例子

**Step 1**：用户发消息，AI 回答 → messages 变了，sandbox/artifacts 新建
```
checkpoints:  ck-001 {messages:1, sandbox:1, artifacts:1}
blobs:        (messages, 1), (sandbox, 1), (artifacts, 1)
```

**Step 2**：TitleMiddleware 生成标题 → 只有 title 变了
```
checkpoints:  ck-002 {messages:1, sandbox:1, artifacts:1, title:1}   ← messages 仍是 v1
blobs:        + (title, 1)                                            ← 只新增 1 条 blob
```
ck-001 和 ck-002 共享 messages v1、sandbox v1、artifacts v1。

**Step 3**：用户继续对话 → messages 变了
```
checkpoints:  ck-003 {messages:2, sandbox:1, artifacts:1, title:1}
blobs:        + (messages, 2)                                         ← 只新增 1 条 blob
```

**Step 4**：用户上传文件 → uploaded_files 变了
```
checkpoints:  ck-004 {messages:2, sandbox:1, artifacts:1, title:1, upl_files:1}
blobs:        + (upl_files, 1)                                        ← 只新增 1 条 blob
```

### 两张表的关系

- **`checkpoints`** 是"目录页"——记录每个时间点引用了哪些版本
- **`checkpoint_blobs`** 是"正文页"——存放实际数据
- 关联方式：`checkpoints.channel_versions` 中的 `{messages: 2}` 指向 `blobs WHERE channel='messages' AND version=2`
- 多个 checkpoint 可以共享同一个 blob（多对多关系）

### 存储节省效果

假设 10 步对话，每步只有 messages 变化：

| 方案 | 数据量 |
|------|--------|
| 朴素（每步完整拷贝全部字段）| 10 × 9 字段 = 90 份数据 |
| Channel 版本化 | messages × 10 + 其他 8 字段 × 1 = 18 份 |

**节省 80%**。

---

## 5. 查询过程

获取 `ck-003` 时刻的完整状态：

```
Step 1: 查 checkpoints 表
   → channel_versions = {messages:2, sandbox:1, title:1, ...}

Step 2: 按 (channel, version) 查 blobs 表
   → 5 条 blob 数据

Step 3: 在内存中组装
   → ThreadState(messages=blob_v2, sandbox=blob_v1, title=blob_v1, ...)

Step 4: 返回给调用方
```

---

## 6. DeerFlow 如何使用 Checkpointer

### 写入位置

| 位置 | 触发方式 | 用途 |
|------|---------|------|
| LangGraph 内部 | **自动**（每个图节点执行完毕后） | 持久化 ThreadState |
| `worker.py` rollback | **手动** `_rollback_to_pre_run_checkpoint()` | 回滚到旧状态 |

### 读取位置

| 位置 | 方法 | 用途 |
|------|------|------|
| LangGraph 内部 | **自动** `aget_tuple()` | 每次 Run 启动时恢复 ThreadState |
| `worker.py:189` | `aget_tuple()` | Run 前捕获快照（rollback 锚点） |
| `worker.py:419` | `aget_tuple()` | Run 后读 title 同步到 thread_store |
| `threads.py:396` | `aget_tuple()` | `GET /threads/{tid}` 线程详情 |
| `threads.py:515` | `aget_tuple()` | `POST /threads/{tid}/state` 状态查询 |
| `thread_runs.py:191` | `aget_tuple()` | `GET /runs/{rid}/messages` 消息列表 |
| `threads.py:231` | `adelete_thread()` | `DELETE /threads/{tid}` 删除线程 |

### Rollback 实现

```python
async def _rollback_to_pre_run_checkpoint(...):
    # 1. 深拷贝旧 checkpoint
    checkpoint_to_restore = copy.deepcopy(pre_run_snapshot["checkpoint"])

    # 2. 生成新 ID/ts（创建"新版本的旧状态"）
    marker = _new_checkpoint_marker()
    checkpoint_to_restore["id"] = marker["id"]
    checkpoint_to_restore["ts"] = marker["ts"]

    # 3. 用 aput 写入（前向追加，不是回退删除）
    await checkpointer.aput(config, checkpoint_to_restore, metadata, versions)

    # 4. 恢复 pending_writes
    for task_id, writes in writes_by_task.items():
        await checkpointer.aput_writes(config, writes, task_id)
```

为什么不能直接删旧 checkpoint？因为 checkpoint 链表式存储（`parent_checkpoint_id`），删除会破坏链结构。Rollback 本质是"创建一个新 checkpoint，其内容是旧 checkpoint 的副本"。

---

## 7. 三种后端

| 后端 | LangGraph 类 | 适用场景 |
|------|-------------|---------|
| `memory` | `InMemorySaver` | 开发/测试，重启即失 |
| `sqlite` | `SqliteSaver` / `AsyncSqliteSaver` | 单机生产，开箱即用 |
| `postgres` | `PostgresSaver` / `AsyncPostgresSaver` | 多实例/企业级部署 |

### DeerFlow 的工厂选择

```python
# config.yaml 中的配置
checkpointer:
  type: sqlite
  connection_string: .deer-flow/checkpoints.db
```

Store 和 Checkpointer **共用同一个配置段**，保证两者始终使用相同的后端技术。

### 为什么同时支持 SQLite 和 Postgres

| 维度 | SQLite | Postgres |
|------|--------|---------|
| 部署复杂度 | 零依赖，一个文件 | 需独立数据库服务 |
| 并发写入 | 受限（WAL 模式改善但仍有限） | 高并发 MVCC |
| 多实例共享 | ❌ 文件锁冲突 | ✅ 多实例读同一库 |
| 适合规模 | 个人/小团队 | 企业/SaaS |
| 运维成本 | 零 | 需要 DBA |

不是冗余，是覆盖不同的部署场景。
