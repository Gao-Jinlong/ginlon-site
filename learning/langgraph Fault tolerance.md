# LangGraph 图执行、中断调试、优雅关闭 完整学习笔记
## 一、静态中断调试（interrupts）
### 1. 基础概念
静态中断用作流程断点，实现逐节点单步调试；在节点执行前/后暂停流程，仅用于开发调试，**线上人机交互流程请使用 `interrupt()` 函数**。
- `interruptBefore: ["节点名"]`：目标节点执行前暂停
- `interruptAfter: ["节点名1", "节点名2"]`：目标节点执行完成后暂停

### 2. 疑问1：node_a / node_b / node_c 是什么？
1. 不是调试新增节点，是流程图中**原生业务节点标识**；
2. 节点承载真实业务代码，中断仅基于节点名称添加暂停逻辑，不修改业务代码。

### 3. 疑问2：中断暂停后如何继续执行？
流程触发中断后**不会自动恢复**，必须手动执行代码 `graph.invoke(null, config)` 实现 resume：
1. 首次传入业务输入运行，命中第一个断点即暂停；
2. 入参传 `null` 复用原有状态，继续运行至下一个断点；
3. 每一次暂停都需要手动调用一次恢复代码。

### 4. 两种配置时机
1. 编译时配置：全局固定断点，所有调用统一生效；
2. 运行时配置（调试推荐）：每次 `invoke` 单独指定断点，灵活可变。

### 5. 配套调试工具
中断执行、状态快照可通过 LangSmith 可视化排查。

## 二、核心底层概念：Superstep（超步）
1. 定义：LangGraph 基于 BSP 模型，superstep 是图执行最小原子轮次；一轮包含并行节点执行、状态合并、快照持久化。
2. superstep boundary（超步边界）：一轮超步全部执行完毕、检查点落地的安全分割点。
3. 关键特性：
   - 所有暂停、优雅停机、检查点保存，都只会在超步边界执行；
   - 不能在节点运行中途终止流程，否则状态不完整、无法恢复。

## 三、执行上下文 executionInfo 字段说明
executionInfo 存储当前流程运行、快照、会话、重试标识，用于日志与状态定位。
| 字段 | 含义 | 存在条件 |
|------|------|----------|
| nodeAttempt | 当前节点重试次数，从1开始 | 节点执行时一定存在 |
| nodeFirstAttemptTime | 节点第一次执行的时间戳，重试不变 | 节点执行时存在 |
| threadId | 会话唯一ID | 必须配置 checkpointer，否则 undefined |
| runId | 单次完整流程运行ID | 配置传入才存在 |
| checkpointId | 当前快照唯一ID | 开启检查点才存在 |
| checkpointNs | 快照命名空间，用于多租户隔离 | 开启检查点才存在 |
| taskId | 当前节点任务ID | 节点执行时存在 |

### 疑问3：checkpointId / checkpointNs 是否一定存在？为何 threadId 依赖 checkpointer？
1. `checkpointId`、`checkpointNs` 不是永久存在，仅挂载检查点存储时生成；文档仅简写类型，无快照时二者为 `undefined`；
2. `threadId` 是会话顶层主键，快照、中断恢复功能完全依赖 thread 会话隔离；无检查点则无需区分会话，直接为 undefined；
3. 底层存储主键关系：`thread_id`（会话）→ `checkpointNs`（命名空间）→ `checkpointId`（单张快照）。

## 四、节点重试 retryOn 机制
### 1. retryOn 作用
作为异常过滤条件，**仅匹配数组内的错误类型才触发自动重试**；区分临时可重试故障（网络超时）与不可重试业务错误（参数错误、余额不足）。

### 2. 疑问4：不配置 retryOn，重试策略是否生效？
1. 不写 retryOn：默认所有异常都会触发重试，maxAttempts 正常生效；
2. retryOn: [指定异常]：仅匹配异常重试，其余错误直接跳过重试进入错误处理器；
3. retryOn: [] 空数组：完全禁用重试，所有报错直接进入补偿流程。

### 3. 关联 Saga 模式
#### 什么是 Saga 模式？
分布式长事务补偿方案：流程步骤拆分本地事务，某一步失败且重试耗尽后，执行反向补偿操作，保证业务最终一致性。
#### LangGraph 实现方式
节点重试全部失败后，触发错误处理器，可通过 `Command(goto="补偿节点")` 跳转执行回滚逻辑，避免流程直接崩溃、数据不一致。

## 五、优雅关闭 Graceful shutdown（协作式排空）
### 1. 基础作用
收到停机信号后，等待**当前完整 superstep 执行完毕**，自动保存可恢复检查点，不会丢失流程进度；适用于容器重启、SIGTERM 进程信号、资源回收场景。
版本要求：`@langchain/langgraph>=1.4.0`

### 2. 核心组件
- `RunControl`：停机控制器，单次执行绑定；
- `requestDrain(reason)`：下发停机排空信号；
- `GraphDrained`：正常排空停机抛出的专属异常，代表快照已保存；

### 3. SIGTERM 是什么？
Linux/Docker/K8s 友好终止信号：系统通知程序主动清理资源、保存数据；容器默认等待30s，超时未退出会发送 SIGKILL 强制杀进程，丢失中间状态。

### 4. 特殊边界场景：排空与流程自然结束同时发生
若调用 `requestDrain()` 的同一轮超步，流程恰好全部执行完成：
1. 不会抛出 GraphDrained 异常，直接正常返回结果；
2. 需要通过 `control.drainRequested` 布尔值区分：是正常跑完，还是收到停机信号后收尾。

### 5. 在节点内提前读取排空状态
节点第二个入参 `runtime` 可提前感知停机信号，无需等待超步结束：
- `runtime.control.drainRequested`：是否收到停机请求；
- `runtime.control.drainReason`：停机原因；
业务优化：检测到待停机时，直接跳过耗时任务，加速关闭流程。

### 6. 重要限制：requestDrain 无法终止运行中异步任务
1. 仅标记停机状态，不会中断节点内已发起的接口、IO、异步操作，会阻塞至任务完成；
2. 最佳实践：搭配 `AbortSignal` + 超时时间设置硬性等待上限，防止异步死任务导致优雅关闭超时被系统强杀。

## 六、整体流程串联总结
1. 开发调试：使用 `interruptBefore/interruptAfter` 静态断点，配合 invoke(null) 单步执行；
2. 节点异常：通过 retryOn 控制重试范围，重试耗尽走 Saga 补偿节点回滚数据；
3. 服务运维：监听 SIGTERM，调用 requestDrain 触发优雅关闭；
4. 停机逻辑：框架等待当前 superstep 完成保存快照，节点内可读取 runtime 提前简化任务；
5. 恢复机制：依靠 threadId + checkpointId 读取快照，再次调用 invoke(null) 续跑未完成流程。