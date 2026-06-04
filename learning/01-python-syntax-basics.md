# Python 语法基础

本文档整理了 DeerFlow 项目中涉及的 Python 核心语法知识点。

---

## 1. `**` 字典解包运算符

`**` 将字典解包为关键字参数：

```python
def foo(a, b, c):
    pass

kwargs = {"a": 1, "b": 2, "c": 3}
foo(**kwargs)   # 等同于 foo(a=1, b=2, c=3)
```

### 项目中的用法

在 `RunManager._store_put_payload()` 中，函数返回一个字典，调用方通过 `**` 解包传参：

```python
def _store_put_payload(record, *, error=None) -> dict:
    return {
        "thread_id": record.thread_id,
        "status": record.status.value,
        "metadata": record.metadata or {},
        ...
    }

# 调用时
self._store.put(record.run_id, **self._store_put_payload(record))
# 等同于
self._store.put(record.run_id, thread_id=..., status=..., metadata=..., ...)
```

好处：新增字段只改 `_store_put_payload()` 一处。

### `*` vs `**`

| 运算符 | 作用于 | 解包为 |
|--------|--------|--------|
| `*` | 列表/元组 | 位置参数 |
| `**` | 字典 | 关键字参数 |

```python
args = [1, 2, 3]
foo(*args)      # foo(1, 2, 3)

kwargs = {"a": 1}
foo(**kwargs)   # foo(a=1)
```

---

## 2. `@dataclass` 数据类

自动生成 `__init__`、`__repr__`、`__eq__` 等样板方法：

```python
from dataclasses import dataclass, field

@dataclass
class RunRecord:
    run_id: str
    status: RunStatus
    metadata: dict = field(default_factory=dict)  # 可变默认值必须用 field()
    task: asyncio.Task | None = field(default=None, repr=False)  # repr=False 隐藏
```

### `frozen=True`：不可变数据类

```python
@dataclass(frozen=True)
class RunContext:
    checkpointer: Any
    store: Any | None = field(default=None)
```

- 创建后不能修改字段值（赋值会抛 `FrozenInstanceError`）
- 自动变为可哈希（可以当 dict 的 key 或放入 set）
- 适合做"参数捆绑包"——防止在传递过程中被意外篡改

### `field(default_factory=...)`

可变类型（list、dict）不能用 `= {}` 做默认值（所有实例会共享同一个对象），必须用 `field(default_factory=dict)` 让每个实例创建独立的字典。

---

## 3. `async with` 异步上下文管理器

同步上下文管理器用 `with`，异步的用 `async with`：

```python
# 同步
with open("file.txt") as f:
    content = f.read()

# 异步
async with AsyncSqliteSaver.from_conn_string(conn_str) as saver:
    await saver.setup()
    # 使用 saver
# 退出时自动关闭连接
```

### `AsyncExitStack`：动态管理多个异步上下文

当需要同时管理多个异步资源时，嵌套 `async with` 会变得很深：

```python
# 嵌套写法（难维护）
async with make_stream_bridge(config) as bridge:
    async with make_checkpointer(config) as cp:
        async with make_store(config) as store:
            ...  # 越来越深
```

用 `AsyncExitStack` 可以扁平化：

```python
async with AsyncExitStack() as stack:
    bridge = await stack.enter_async_context(make_stream_bridge(config))
    cp = await stack.enter_async_context(make_checkpointer(config))
    store = await stack.enter_async_context(make_store(config))
    ...
    # 退出时，stack 按后进先出顺序关闭所有资源
```

项目中的用法：`deps.py` 的 `langgraph_runtime()` 函数。

---

## 4. `@abc.abstractmethod` 抽象基类

定义接口规范，子类必须实现所有抽象方法：

```python
import abc

class RunEventStore(abc.ABC):
    @abc.abstractmethod
    async def put(self, *, thread_id, run_id, event_type, ...):
        """Write an event."""

    @abc.abstractmethod
    async def list_messages(self, thread_id, ...):
        """Return messages."""
```

如果子类没有实现某个抽象方法，实例化时会抛 `TypeError`。

---

## 5. `TypeVar` 和泛型

```python
from typing import TypeVar, Callable

T = TypeVar("T")

def _require(attr: str, label: str) -> Callable[[Request], T]:
    def dep(request: Request) -> T:
        val = getattr(request.app.state, attr, None)
        if val is None:
            raise HTTPException(status_code=503)
        return cast(T, val)
    return dep

# 根据使用场景，T 会被推断为具体类型
get_checkpointer: Callable[[Request], Checkpointer] = _require("checkpointer", "Checkpointer")
get_run_manager: Callable[[Request], RunManager] = _require("run_manager", "Run manager")
```

一个工厂函数生成多种类型的依赖注入函数——避免重复代码。

---

## 6. `ContextVar` 上下文变量

类似线程局部存储，但是面向 asyncio 的——每个协程有独立的值：

```python
from contextvars import ContextVar

_current_user: ContextVar[User | None] = ContextVar("current_user", default=None)

# 在请求中间件中设置
token = _current_user.set(user)

# 在任意异步代码中读取
user = _current_user.get()

# 请求结束时重置
_current_user.reset(token)
```

项目中的用法：`user_context.py` 中用 ContextVar 存储当前请求的用户 ID，供中间件和工具在异步执行链中访问。

---

## 7. `lru_cache` 缓存

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def _cached_agent_factory_supports_app_config(agent_factory):
    return "app_config" in inspect.signature(agent_factory).parameters
```

- 对相同输入自动返回缓存结果
- `maxsize=128` 最多缓存 128 个不同输入的结果
- 要求参数是可哈希的（否则会 TypeError，项目中有 try/except 兜底）
