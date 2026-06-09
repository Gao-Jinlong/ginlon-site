# LangGraph 短期记忆 \+ RunnableConfig 核心原理 学习笔记（复盘完整版）

**整理说明**：本文汇总所有对话核心知识点，打通「会话记忆、检查点、线程ID、时间戳、RunnableConfig 上下文机制、设计模式、实战场景」，从零到通透，适合长期复习、面试、项目开发。

# 一、核心整体认知（总纲）

LangGraph 实现 AI 对话多轮记忆、状态持久、断点续跑的核心体系由两大模块构成：

1. **短期记忆体系（Thread 会话级记忆）**：负责单会话上下文连贯、状态保存、历史回溯

2. **RunnableConfig 上下文体系**：全局统一调用容器，承载所有会话参数、运行时配置，自动穿透所有节点

**核心结论**：LangGraph 所有记忆、会话隔离、断点续跑、动态配置能力，全部依赖 **RunnableConfig \+ Checkpointer \+ Thread 机制** 三者联动。

# 二、LangGraph 短期记忆（Short\-Term Memory）详解

## 1\. 定义

短期记忆 = **单 Thread（单会话/单聊天窗口）级别的状态记忆**，仅在当前对话线程内生效，用于保存多轮对话上下文、节点运行状态、临时任务数据。

官方属性：**线程级持久化、会话隔离、依赖 Checkpointer、受 LLM 上下文窗口限制**。

## 2\. 存储内容

- 对话历史 messages 数组（核心）

- Graph 自定义 State 状态（用户临时参数、任务中间结果）

- 工具调用中间数据、本轮会话临时变量

## 3\. 核心特征

- ✅ **绑定 thread\_id**：不同会话完全隔离，不会串对话

- ✅ **自动持久化**：每一步 superstep 自动生成检查点快照

- ✅ **自动读写**：每轮执行开始读状态，执行结束更新状态

- ❌ **会话隔离**：新开 thread 直接清空记忆

- ❌ **容量受限**：受 LLM Context Window 限制，超长需要裁剪/总结

## 4\. 短期记忆解决方案（超长对话优化）

解决上下文溢出、模型长上下文遗忘问题，官方四种方案：

1. **消息裁剪 Trim**：保留最新 N 条消息，截断历史

2. **消息删除 Delete**：精准删除指定旧消息

3. **消息总结 Summarize**：将早期对话压缩为摘要，保留关键信息

4. **自定义策略**：过滤无效消息、去重、优先级保留

## 5\. 短期记忆 VS 长期记忆（核心区别）

|维度|短期记忆（Thread）|长期记忆（User/全局）|
|---|---|---|
|作用域|单会话、单 thread\_id|跨会话、跨线程、用户全局|
|绑定标识|thread\_id|user\_id / 自定义命名空间|
|存储内容|实时对话流水、临时状态|用户偏好、核心事实、知识库、经验|
|持久化方式|Checkpointer 会话快照|向量库/数据库独立存储|
|Prompt 注入|自动带入上下文|需手动检索注入|
|生命周期|会话结束即失效|永久持久化|

# 三、Checkpointer 检查点核心机制

## 1\. 作用

为 Graph 提供**状态持久化层**，每一步执行生成状态快照，支撑记忆、断点续跑、人工介入、历史回放。

## 2\. 核心概念

- **Checkpoint 检查点**：某一时刻 Graph State 的完整快照

- **Thread 线程**：一组连续检查点的集合，对应一次对话会话

- **thread\_id**：会话唯一标识（必填），用于会话隔离

- **thread\_ts**：检查点时序时间戳，用于精准回溯某一步快照

- **checkpoint\_id**：全局唯一快照ID，精准定位快照

- **Pending writes 待写入**：节点执行失败时，保留已成功节点的结果，续跑无需重跑

## 3\. 核心接口（BaseCheckpointSaver）

- **put**：存储检查点、配置、元数据

- **putWrites**：存储节点中间临时数据

- **getTuple**：根据 thread\_id \+ thread\_ts 查询历史快照

- **list**：列出某线程下所有历史检查点

# 四、RunnableConfig 终极核心（重中之重）

## 1\. 定义

**RunnableConfig 是 LangChain/LangGraph 所有执行的统一运行时上下文容器**。

所有 invoke/stream/batch 调用的第二个参数，**一次传入，全链自动穿透**。

## 2\. 核心字段分类

### （1）核心业务字段（记忆/会话必备）

- **configurable**：自定义运行时参数（存放 thread\_id、thread\_ts、自定义业务参数）

### （2）追踪监控字段

- tags：自定义标签，用于日志筛选

- metadata：自定义元数据，用于审计、统计

- runId/runName：单次执行唯一标识、自定义名称

### （3）执行控制字段

- timeout：执行超时时间

- signal：中止信号，支持手动取消请求

- maxConcurrency：批量执行最大并发数

- recursionLimit：递归最大层数（防死循环，默认25）

## 3\. 关键问题：配置参数如何在 Graph 节点中使用？

**核心规则**：Graph 自定义节点的**第二个参数即为 RunnableConfig**，自动注入，无需手动传参。

```Plain Text
// 节点标准格式
function customNode(state, config) {
  // 读取会话核心参数
  const { thread_id, user_id, user_level } = config.configurable;
  
  // 读取监控配置
  const tags = config.tags;
  
  // 读取执行控制
  const timeout = config.timeout;
}

```

**机制**：外层 invoke 传入 config → LangGraph 自动透传 → 所有节点统一接收。

## 4\. 底层设计模式（高阶理解）

统一采用：**上下文传播模式（Context Propagation Pattern）**

- 解决多层组件手动传参的代码冗余问题

- 一次配置，全链（Graph/Node/Tool/LLM）生效

- 隔离单次调用上下文，无全局污染、无串参

类比：Express req、Koa ctx、OpenTelemetry 链路上下文。

# 五、核心实战场景汇总（全覆盖）

1. **会话隔离**：通过 thread\_id 区分多用户/多窗口对话，记忆互不干扰

2. **历史回溯/断点续跑**：通过 thread\_ts 定位历史快照，实现回放、重试、编辑对话

3. **动态参数控制**：运行时动态传入温度、用户权限、业务参数，无需重建实例

4. **链路追踪监控**：tags/metadata 用于 LangSmith 日志筛选、问题排查

5. **请求安全控制**：timeout 防卡死、signal 取消流式请求、recursionLimit 防死循环

6. **批量任务限流**：maxConcurrency 控制并发，保护服务

# 六、终极极简复盘口诀（考前/快速复习）

- 短期记忆绑线程，新开会话全清零

- 检查点存快照，thread\_ts 可回溯

- Config 是上下文，一次传入全链通

- 节点二参拿配置，业务参数随意用

- 短期会话长期人，记忆分层不混淆

> （注：文档部分内容可能由 AI 生成）
