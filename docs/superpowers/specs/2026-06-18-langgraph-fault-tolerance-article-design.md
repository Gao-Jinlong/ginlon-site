# 设计文档：LangGraph 容错专栏文章（第 5 篇）

> 依据：用户学习笔记 `learning/langgraph Fault tolerance.md` + 官方文档
> https://docs.langchain.com/oss/javascript/langgraph/fault-tolerance
> 日期：2026-06-18

## 1. 目标

在 langgraph-notes 专栏新增第 5 篇文章，系统讲解 LangGraph 的容错机制。
覆盖官方 fault-tolerance 文档的全部内容，同时把学习笔记里的 FAQ 疑问作为
"加深理解"穿插进对应小节，并补全笔记里缺失的 Timeouts / setNodeDefaults /
Functional API 三大块。

## 2. 关键决策（已与用户确认）

| 决策点 | 选择 |
|---|---|
| 覆盖范围 | 以官方文档为蓝本，完整覆盖（Retries/Timeouts/Error handling/Defaults/Functional API/Graceful shutdown）|
| 文章定位 | 沉入 langgraph-notes 专栏风格（一句话定义+心智模型+实际应用+设计规则+一句话总结）|
| 超时部分 | 完整写 runTimeout / idleTimeout / heartbeat 三个机制 |
| 代码风格 | 纯 TypeScript（不用 ` ```text ` 伪代码块）|
| 整体结构 | 方案 A：按"触发时序"为主线（Timeouts → Retries → Error handling）|

## 3. 文件与元信息

- 路径：`src/content/columns/langgraph-notes/05-fault-tolerance/index.mdx`
- frontmatter：
  ```yaml
  title: 'LangGraph 容错全景：让单个节点失败不拖垮整张图'
  subtitle: ''
  poster: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800'
  createdAt: '2026-06-18 18:00 +08:00'
  tags: ['LangGraph', 'JavaScript', '容错', '分布式系统']
  order: 5
  draft: false
  ```
- 专栏入口 `src/content/columns/langgraph-notes/index.md`：status 已是 `ongoing`，无需改动。

## 4. 章节结构（11 节）

| # | 小节 | 内容要点 | 来源 |
|---|------|---------|------|
| 1 | **一句话定义** | 容错 = 超时→重试→错误处理三段式管线 + 图级默认 + 优雅关闭；引用官方"three composable mechanisms" | 官方 |
| 2 | **心智模型：一次 attempt 失败后会怎样** | mermaid 流程图：attempt 抛异常 → 是否 NodeTimeoutError → retry policy 判断 → 重试耗尽? → errorHandler 兜底 → Command 路由/冒泡。强调"固定组合顺序" | 笔记洞察 |
| 3 | **Timeouts：让节点"快失败"** | 3.1 runTimeout（硬性 wall-clock，永不刷新）；3.2 idleTimeout（进度重置式）；3.3 进度信号（refreshOn 四种：manual/node_start/any_node_start/node_finish，默认 auto）；3.4 heartbeat 模式 + 手动 `runtime.heartbeat()`；3.5 NodeTimeoutError 字段表（type/timedOutAtMs/kind/signals）+ `isNodeTimeoutError()` 类型守卫；3.6 timeout + retry 天然组合（每次 attempt 重置时钟、清空 writes）；3.7 Dynamic timeouts with Send | 官方新增（笔记无）|
| 4 | **Retries：自动恢复 + 区分错误类型** | 4.1 retryPolicy 参数表（maxAttempts/backoffFactor/backoffMax/jitter/initialInterval 等）；4.2 默认行为（opt-in，空 policy `{}` 即可）；4.3 **内置 blocklist**（AbortError/ECONNABORTED/4xx/insufficient_quota 等，强调"默认不是所有异常都重试"）；4.4 关键点：NodeTimeoutError 可重试、控制流错误冒泡不重试；4.5 自定义 retryOn（JS 无 defaultRetryOn helper，需自己写）；4.6 用 `executionInfo.nodeAttempt` 切 fallback | 官方 + 笔记 FAQ（修正笔记"默认所有异常重试"的旧认知）|
| 5 | **executionInfo：窥探重试状态** | 字段表（nodeAttempt/nodeFirstAttemptTime/threadId/runId/checkpointId/checkpointNs/taskId）+ 何时为 undefined + 底层主键关系 thread_id → checkpointNs → checkpointId | 笔记 FAQ |
| 6 | **Error handling：Saga 补偿兜底** | 6.1 errorHandler 仅 StateGraph 可用、重试耗尽后运行；6.2 NodeError（node + error）字段；6.3 Command 路由实现 Saga（订单支付失败→refund→finalize 示例）；6.4 子图失败冒泡；6.5 限制（一节点一 handler、handler 抛错冒泡、handler 不应用自身）| 笔记 + 官方 |
| 7 | **setNodeDefaults：图级默认配置** | 7.1 一次配置 retryPolicy/errorHandler/timeout/cachePolicy；7.2 **Precedence**（addNode 直接传值 > defaults，compile 时解析）；7.3 **Applicability matrix**（errorHandler/cachePolicy 不应用到 error-handler 节点）；7.4 **Scope**（不继承子图）| 官方新增（笔记无）|
| 8 | **Functional API：task/entrypoint 的容错** | task 支持 timeout + retry（注意 task 用 `retry` 不是 `retryPolicy`）；entrypoint 支持 timeout；JS/TS SDK 上 task/entrypoint **不支持 errorHandler**；task 重试时内部状态重置、需用 return 传递 | 官方新增（笔记无）|
| 9 | **Graceful shutdown：协作式排空** | 9.1 RunControl + requestDrain + GraphDrained（版本 ≥1.4.0）；9.2 **Superstep 边界语义表**（node 中途/重试中/自然完成/还有 superstep/子图请求 drain 五种场景）；9.3 Resume after drain（invoke(null, config)）；9.4 节点内读 drain state（runtime.control.drainRequested/drainReason）；9.5 SIGTERM hook 模式；9.6 **重要限制**：requestDrain 无法中断运行中异步任务，需配 AbortSignal + 超时兜底 | 笔记 + 官方（superstep 概念交叉引用 04-pregel-bsp）|
| 10 | **设计规则** | 8 条踩坑总结：① runTimeout 是必配项 ② retry 要区分临时/业务错误 ③ errorHandler 用 Command 实现 Saga 而非吞错 ④ heartbeat 用于长任务保活 ⑤ setNodeDefaults 不继承子图 ⑥ Graceful shutdown 必配 AbortSignal ⑦ retryOn 在 JS 里要自己写 ⑧ timeout 与 retry 天然组合，别自己写 setTimeout | 官方 limitations + 实战 |
| 11 | **一句话总结** | 收尾，点出"容错不是单一开关，而是按固定顺序接力的管线" | — |

## 5. 交叉引用策略（避免与现有文章重复）

| 主题 | 处理方式 |
|---|---|
| 静态中断（interruptBefore/After）| 不展开，一句话带过 + 引用 `03-interrupts` |
| Superstep / barrier | 不展开，引用 `04-pregel-bsp`；仅在 §9 Graceful shutdown 简要回顾"为什么只能在 superstep 边界停" |
| checkpointer | 引用 `01-checkpointer`（在 executionInfo 节提到 threadId/checkpointId 依赖时）|

## 6. 风格对齐

- 沿用专栏统一结构：**一句话定义开头 + 一句话总结收尾**
- 大量使用表格（参数表、语义表、对照表、applicability matrix）
- 至少 2 张 mermaid 图：
  - §2「一次 attempt 失败后的组合顺序」流程图（flowchart）
  - §9「Graceful shutdown 与 superstep 边界」时序图（sequenceDiagram）
- 通俗类比：
  - 组合管线 → "电路保险丝层层保护"
  - Saga 补偿 → "快递破损走理赔流程"
  - heartbeat → "长跑运动员每圈按一下计时器"
- 代码全部 TypeScript，用真实 LLM Agent 场景（API 调用、支付、长任务批处理）

## 7. 构建验证约定（写完后必须做）

依据 AGENTS.md「构建验证约定」：

1. 运行 `pnpm build`（含 `astro check` 类型检查 + frontmatter schema 校验）
2. 验证 mermaid 真渲染：构建日志打印 `[astro-mermaid] Remark transformed mermaid block #N in <file>`，确认块数 ≥2
3. 若文章含数学公式，验证 KaTeX 真渲染（本文预计无公式，但 §4 backoff 公式可能用 KaTeX，需检查产物含 `class="katex"`）
4. 验证文章被收录：构建日志页面列表里应出现 `05-fault-tolerance/index.html`

## 8. 范围外（YAGNI）

- 不写英文化版本（en/ 路由无对应专栏页面，专栏目前只有中文）
- 不改专栏入口 index.md（status 已是 ongoing）
- 不新增博客（只加专栏文章，符合用户"在 langgraph 专栏中新增"的要求）
- 不写 `requestTimeout` / 异步停止等官方未在 fault-tolerance 页详述的边缘 API

## 9. 风险与注意点

| 风险 | 应对 |
|---|---|
| 笔记里"默认所有异常都重试"与官方"内置 blocklist"矛盾 | 在 §4.3 显式修正此认知，说明笔记旧描述不准 |
| JS SDK 与 Python SDK 行为差异（如 defaultRetryOn）| 在 §4.5 注明 JS 无 helper，需自写 retryOn |
| Functional API 的 task 用 `retry` 而非 `retryPolicy` | 在 §8 显式提示这个命名陷阱 |
| mermaid 节点文字含特殊字符需双引号包裹 + `<br/>` 换行 | 遵循 AGENTS.md 约定 |
