# RunManager 详解

本文档深入讲解 RunManager 的设计——DeerFlow 运行时的"空中交通管制塔"，管理每次 Agent 执行的完整生命周期。

---

## 1. 核心定位

RunManager 是一个 **内存注册表 + 可选持久化存储** 的双层架构：

```python
class RunManager:
    def __init__(self, store=None, *, persistence_retry_policy=None):
        self._runs: dict[str, RunRecord] = {}      # 内存：run_id → 记录
        self._lock = asyncio.Lock()                  # 保护并发修改
        self._store = store                           # 可选持久化 (RunStore)
```

所有对 `_runs` 字典的修改都必须在 `self._lock` 保护下进行。

---

## 2. RunRecord 数据结构

每个 Run 在内存中对应一个 `RunRecord`：

```python
@dataclass
class RunRecord:
    # 身份
    run_id: str
    thread_id: str
    assistant_id: str | None

    # 状态
    status: RunStatus                    # pending / running / success / failed / interrupted
    on_disconnect: DisconnectMode        # cancel / continue
    abort_action: str                    # interrupt / rollback

    # 执行控制
    task: asyncio.Task | None            # 后台协程（不可序列化）
    abort_event: asyncio.Event           # 取消信号（不可序列化）

    # 元数据
    multitask_strategy: str              # reject / interrupt / rollback
    metadata: dict
    kwargs: dict
    model_name: str | None

    # Token 统计
    total_input_tokens: int
    total_output_tokens: int
    lead_agent_tokens: int
    subagent_tokens: int
    ...

    # 标记
    store_only: bool                     # True = 从持久化层恢复的只读记录
```

**关键区分**：
- 活跃 Run（当前进程有 task/abort_event）→ `_runs` 字典中
- 历史 Run（其他进程创建或已完成的）→ 从 RunStore 按需恢复

---

## 3. 生命周期

### 创建

```python
record = await run_manager.create(thread_id, multitask_strategy="reject")
# 1. 生成 UUID 作为 run_id
# 2. 创建 RunRecord (status=pending)
# 3. async with self._lock: self._runs[run_id] = record
# 4. 如果有 store → _persist_new_run_to_store() 持久化
# 5. 如果持久化失败 → 回滚内存记录 (self._runs.pop)
```

### 状态转换

```
pending → running → success
                  → failed
                  → interrupted (用户取消)
                  → error (rollback)
```

```python
await run_manager.set_status(run_id, RunStatus.running)
# 1. async with self._lock: record.status = status
# 2. _persist_status() 同步到 store
```

### 完成

```python
await run_manager.update_run_completion(run_id, total_input_tokens=120, ...)
# 更新 token 用量等字段 + 持久化
```

### 清理

```python
await run_manager.cleanup(run_id, delay=300)
# 延迟 300 秒后从 _runs 字典移除（保留 store 中的历史记录）
```

---

## 4. 多任务冲突策略

核心方法 `create_or_reject()` 在同一把锁内完成"检查冲突 + 创建新 Run"：

### 三种策略

| 策略 | 旧 Run 处理 | Checkpoint 处理 | 用户体验 |
|------|------------|----------------|---------|
| `reject` | 拒绝新请求（抛 ConflictError） | — | "上一条还在处理，请等待" |
| `interrupt` | 取消旧 Run（保留 checkpoint） | 保留 | 旧任务停止但已完成的工作不丢 |
| `rollback` | 取消旧 Run（回滚到执行前） | 丢弃 | 旧任务彻底撤销 |

### interrupt vs rollback 的区别

```
旧 Run 执行了 5 步：
  Step 1-4: 已完成
  Step 5: 正在执行... ⏸️ 被打断

interrupt:  保留 Step 1-4 → 新 Run 从 Step 4 继续
rollback:   丢弃全部 → 新 Run 从起点开始
```

### 原子性保证

```python
async def create_or_reject(self, thread_id, *, multitask_strategy="reject"):
    async with self._lock:                              # ← 同一把锁
        inflight = [r for r in ... if r.status in (pending, running)]  # 检查
        if multitask_strategy == "reject" and inflight:
            raise ConflictError(...)                    # 拒绝
        self._runs[run_id] = record                    # 创建
        await self._persist_new_run_to_store(record)   # 持久化
        if multitask_strategy in ("interrupt", "rollback") and inflight:
            for r in inflight:
                r.abort_event.set()                     # 取消旧 Run
                r.task.cancel()
                r.status = RunStatus.interrupted
```

### 持久化内容

`_store_put_payload()` 选择 RunRecord 中 9 个可序列化字段写入 RunStore：

```
thread_id, assistant_id, status, multitask_strategy, metadata, kwargs, error, created_at, model_name
```

不持久化的：`task`（协程对象）、`abort_event`（信号量）、token 用量（通过专门的 `update_run_completion` 单独更新）。

---

## 5. 取消机制

```python
await run_manager.cancel(run_id, action="interrupt")
# 1. async with self._lock:
#    - record.abort_event.set()      → 通知 worker 停止
#    - record.task.cancel()           → 取消 asyncio.Task
#    - record.status = interrupted
# 2. _persist_status(interrupted)    → 同步到 store
```

幂等设计：对已 interrupted 的 Run 再次调用 cancel 仍返回 True。

---

## 6. 孤儿 Run 回收

进程重启后，store 中可能有 `pending/running` 状态的 Run，但当前进程没有对应的 asyncio Task：

```python
async def reconcile_orphaned_inflight_runs(self, *, error, before=None):
    # 1. 从 store 查询所有 pending/running 的 Run
    rows = await self._store.list_inflight(before=before)

    for row in rows:
        # 2. 检查内存中是否有活跃 task
        if live_record is not None and live_record.status in (pending, running):
            continue                                    # 有活跃 task，跳过

        # 3. 标记为 error
        record.status = RunStatus.error
        record.error = error
        await self._persist_status(record, RunStatus.error, error=error)
```

防止 UI 显示永远活跃的"僵尸 Run"。

---

## 7. 查询策略：内存优先 + Store 补偿

```python
async def get(self, run_id):
    # 1. 先查内存
    async with self._lock:
        record = self._runs.get(run_id)
    if record is not None:
        return record

    # 2. 内存没有 → 查 store
    if self._store is None:
        return None
    row = await self._store.get(run_id)

    # 3. store 查询期间可能有并发 create()，再检查一次
    async with self._lock:
        record = self._runs.get(run_id)
    if record is not None:
        return record

    # 4. 真的是历史 Run → 反序列化
    return self._record_from_store(row)
```

`store_only=True` 的记录是只读的——没有 task/abort_event，无法被取消。

---

## 8. SQLite 持久化重试

RunManager 内置指数退避重试策略，专门处理 SQLite 的锁竞争：

```python
@dataclass(frozen=True)
class PersistenceRetryPolicy:
    max_attempts: int = 5
    initial_delay: float = 0.05    # 50ms
    max_delay: float = 1.0         # 最大 1s
    backoff_factor: float = 2.0    # 每次翻倍
```

延迟序列：50ms → 100ms → 200ms → 400ms → 800ms → 放弃

识别可重试错误的逻辑：遍历异常链，检查是否包含 "database is locked" 等关键词或 SQLite 错误码（SQLITE_BUSY / SQLITE_LOCKED）。
