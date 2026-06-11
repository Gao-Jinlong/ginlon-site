# LangGraph `interrupt()` / `Command({ resume })` 工作原理

> 学习笔记：解释 `apps/server/src/ai/langgraph/nodes/tool-node.ts` 中前端工具如何通过 LangGraph 的 interrupt 机制实现「服务端暂停 → 前端执行 → 服务端恢复」的握手协议。

---

## 1. 场景概览

前端工具（FRONTEND_TOOLS）由浏览器端执行（例如读文件、弹原生对话框），但 LLM 推理在服务端。为了让一次 graph 运行可以「跨越前后端」完成工具调用，使用 LangGraph 的两个原语：

- **`interrupt(value)`**：在节点内调用 → 暂停当前 graph，把 `value` 透传给客户端
- **`new Command({ resume })`**：作为 `graph.stream()` 的输入 → 把客户端回传的结果注入节点，让节点继续

涉及的核心文件：

| 文件 | 角色 |
|------|------|
| `apps/server/src/ai/langgraph/nodes/tool-node.ts` | 调用 `interrupt()`，把 tool_call 透传给前端 |
| `apps/server/src/ai/ai.service.ts` | 编排 `graph.stream`、识别 `__interrupt__`、用 `Command` 恢复 |
| `apps/server/src/ai/langgraph/threads.controller.ts` | 路由 `command.resume` 到 `resumeFromCommand` |
| `apps/server/src/ai/run/run-record.ts` | 暂存 resume payload |
| `apps/web/src/hooks/use-langgraph-stream.ts` | 前端感知 interrupt、执行工具、回传 resume |

---

## 2. 一次完整生命周期

```
tool-node --1. interrupt({tool_call_id, args})--> Pregel Runner
    ^                                                  |
    |                                                  | 2. 写 checkpoint, stream 推送 __interrupt__
    |                                                  v
    |                                        ai.service.ts
    |                                        - emit values event (SSE)
    |                                        - setStatus(Interrupted)
    |                                                  |
    |                                                  v
    |                                        浏览器
    |                                        - 执行前端工具
    |                                        - POST /runs/stream
    |                                          { command: { resume } }
    |                                                  |
    |                                                  v
    |                                        ai.service.ts
    |                                        - resumeFromCommand
    |                                        - graph.stream(new Command({resume}))
    |                                                  |
    |                                                  v
    |                                        3. 注入 scratchpad.nullResume, 节点重跑
    +---------- 4. interrupt() 返回 resumeValue -------+
```

### 2.1 首次执行 — 抛出 `GraphInterrupt`

`tool-node.ts:34`：

```ts
const resumeValue = interrupt({
    tool_call_id: toolCall.id,
    tool_name: toolCall.name,
    args: toolCall.args ?? {},
});
```

- `interrupt()` 内部抛出 `GraphInterrupt`
- 异常**不会冒泡到业务代码**，由 LangGraph 的 PregelRunner 在 `_runWithRetry` 里 catch
- LangGraph 把 `value` 写入 `task.interrupts`，并往 `values` 流推送 `{ __interrupt__: [...] }`
- checkpointer 写盘后，本次 stream **正常结束**（不是 reject）

### 2.2 服务端识别 interrupt 并通知前端

`ai.service.ts:213-225` 监听 `streamMode: 'values'`，发现 `__interrupt__` 数组就：

- 通过 SSE 把 `values` 事件透传给前端
- 在 `ai.service.ts:234-236` 把 `RunStatus` 切到 `Interrupted`

前端 `use-langgraph-stream.ts:38` 的 `ToolInterrupt` 拿到 `{ toolCallId, toolName, input }`，触发本地工具执行。

### 2.3 前端回传结果

前端调用 `POST /threads/:id/runs/stream`，body：

```json
{ "command": { "resume": { "tool_call_id": "...", "tool_result": "..." } } }
```

`threads.controller.ts:219` 检测 `body.command.resume !== undefined`，转发到 `aiService.resumeFromCommand`：

```ts
record.setResumePayload(command.resume);
record.setStatus(RunStatus.Running);
```

### 2.4 二次执行 — `interrupt()` 返回 resume 值

`ai.service.ts:160-161`：

```ts
if (record.isResume) {
    input = new Command({ resume: record.pendingResume });
}
```

`graph.stream(input, ...)` 收到 `Command` 后：

1. 从 checkpoint 加载暂停时的状态
2. **重新执行 `tools` 节点**（节点函数被整体重跑！）
3. 这次 `interrupt()` 不抛异常，直接同步**返回 resume 值**

随后节点把结果包成 `ToolMessage` append 到 `state.messages`，路由回 `llm_call` 继续推理。

---

## 3. 关键问题 1：异常为什么不会让程序崩溃？

`GraphInterrupt` 是一个**被 LangGraph 自己捕获的「控制流异常」**：

- 在节点函数里它确实是 `throw`，会冒泡
- 但它**只会冒到 Pregel 运行循环**，不会跑到 `executeRunProtocol`
- LangGraph 通过 `isGraphInterrupt(err)` 识别，按「软中断」处理：
  - 写 `task.interrupts`
  - 推送 `__interrupt__` 到 `values` 流
  - 写 checkpoint
  - 让 `graph.stream()` **正常 return**

从外部代码看，整个流程跟普通完成没区别。`for await (const chunk of stream)` 能正常迭代到结束。

### 一个容易踩的坑

LangGraph 源码注释（`interrupt.js:17-19`）特别强调：

> 不要在 `interrupt()` 外面套 `try/catch`，除非你在 `catch` 里把 `GraphInterrupt` 再 throw 出去。

否则你会把控制流异常吞掉，LangGraph 以为节点正常返回，**整个暂停机制失效**。

---

## 4. 关键问题 2：怎么区分「首次调用」与「resume 调用」？

核心是 **`scratchpad`**（每个 task 一份的"草稿板"），保存在 `RunnableConfig.configurable[CONFIG_KEY_SCRATCHPAD]`，通过 `AsyncLocalStorage` 注入到节点函数上下文。

### 4.1 源码精简版

`node_modules/@langchain/langgraph/dist/interrupt.js`：

```ts
function interrupt(value) {
    const scratchpad = config.configurable[CONFIG_KEY_SCRATCHPAD];
    scratchpad.interruptCounter += 1;          // 节点内第 N 个 interrupt
    const idx = scratchpad.interruptCounter;

    // 分支 A: resume 数组里已有第 idx 个值 → 直接返回（重放）
    if (scratchpad.resume.length > 0 && idx < scratchpad.resume.length) {
        return scratchpad.resume[idx];
    }

    // 分支 B: 有"待消费"的单值 resume（Command 注入的）
    if (scratchpad.nullResume !== undefined) {
        const v = scratchpad.consumeNullResume();
        scratchpad.resume.push(v);              // 持久化进重放日志
        return v;
    }

    // 分支 C: 都没有 → 真·首次调用 → 抛异常暂停
    throw new GraphInterrupt([{ id, value }]);
}
```

### 4.2 三个关键字段

| 字段 | 来源 | 作用 |
|------|------|------|
| `interruptCounter` | 节点每次进入时**重置为 0** | 表示「本次节点执行中的第 N 个 `interrupt()`」 |
| `resume` (数组) | 从 checkpoint 恢复 | 之前已 resume 完成的 interrupt 结果，按顺序排列 |
| `nullResume` | `new Command({ resume })` 注入 | 「下一个未完成的」interrupt 该返回什么 |

### 4.3 判定逻辑

| 状态 | resume[] | nullResume | 行为 |
|------|----------|-----------|------|
| **首次调用** | 空 | undefined | 分支 C：抛 `GraphInterrupt` |
| **恰好该消费 resume** | length == idx-1 | 有值 | 分支 B：返回值并 push 到 resume[] |
| **重跑遇到已 resume 的** | length >= idx | — | 分支 A：直接从 resume[] 读 |

### 4.4 对应到 `tool-node.ts` 的循环场景

假设当前轮次 LLM 输出了 3 个 tool_call：

```ts
for (const toolCall of lastMessage.tool_calls) {
    const resumeValue = interrupt({...});   // 每次循环可能抛 / 可能返回
}
```

| 执行轮次 | counter=1 | counter=2 | counter=3 |
|---------|-----------|-----------|-----------|
| 第 1 次跑（无 resume） | throw（暂停） | — | — |
| 第 2 次跑（resume A） | 返回 A（分支 B） | throw（暂停） | — |
| 第 3 次跑（resume B） | 返回 A（分支 A，重放） | 返回 B（分支 B） | throw（暂停） |
| 第 4 次跑（resume C） | 返回 A | 返回 B | 返回 C → 节点正常结束 |

`resume[]` 就像一个**重放日志**：每次重跑都按相同顺序把已知答案 replay 出来，直到遇到下一个未知的才再次中断。

---

## 5. 设计原则与约束

### 5.1 节点必须是「纯函数 + 依赖 state」

因为 LangGraph 通过**重新执行节点 + 顺序消费 resume** 来等价模拟「在原地恢复」，节点函数会被**整体重跑多次**。

- 不要在 `interrupt()` 之前做有副作用的事（写 DB、发邮件……）
- 不要依赖 `Math.random()`、`Date.now()`、外部变量等非确定性源
- 所有外部交互应该放在 `interrupt()` 内部（通过 value 传给客户端），或放到 interrupt 之后由后续节点处理

### 5.2 持久化依赖 checkpointer

没有 `PostgresSaver`（`ai.service.ts:358` 的 `compileGraph` 里注入），interrupt 无法跨请求保存状态，恢复机制会失效。

### 5.3 不要 swallow `GraphInterrupt`

如必须 `try/catch`，要在 `catch` 里重新 `throw` 异常，否则 graph 不会暂停。

### 5.4 `__interrupt__` 是状态 channel，不是异常

服务端不靠异常对外通信，而是观察 `values` payload 中的 `__interrupt__` 数组判定是否要挂起（`ai.service.ts:216-224`）。

---

## 6. 一句话总结

> `interrupt()` 把节点的本次调用当作**可重入函数**：第一次抛 `GraphInterrupt` 暂停 graph、第二次拿到 `Command({resume})` 注入的值后返回。由 checkpointer 保证两次执行之间的状态一致，由 `scratchpad`（`interruptCounter` / `resume[]` / `nullResume`）保证多 interrupt 顺序正确、已完成的不会重复触发。

---

## 7. 参考代码位置

- 节点侧 interrupt 调用：`apps/server/src/ai/langgraph/nodes/tool-node.ts:34`
- 服务端识别 interrupt：`apps/server/src/ai/ai.service.ts:213-236`
- 服务端 resume 入口：`apps/server/src/ai/ai.service.ts:99-121`、`160-161`
- 控制器路由：`apps/server/src/ai/langgraph/threads.controller.ts:219`
- LangGraph 源码：`node_modules/@langchain/langgraph/dist/interrupt.js`
