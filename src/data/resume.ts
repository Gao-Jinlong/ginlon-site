export const resumePageContent = {
  header: {
    name: '高金龙',
    title: '前端工程师',
    tagline: '聚焦 Web 可视化、地图应用与工程化交付',
    email: 'ginlon5241@gmail.com',
    website: {
      href: 'https://www.ginlon.site',
      label: 'ginlon.site',
    },
  },
  summary:
    '具备 3 年以上前端开发经验，持续参与 Web 可视化、GIS 应用与业务系统建设。近期工作聚焦地图工具产品、复杂图层渲染与性能优化，也有 Vue 重构、实时数据监测和小程序业务交付经验。擅长在复杂需求中平衡产品理解、工程实现与交付质量。',
  capabilityGroups: [
    {
      title: '前端开发',
      items: ['React', 'TypeScript', 'Vue 3', 'Vite'],
    },
    {
      title: '可视化方向',
      items: ['地图应用开发', 'GIS 数据呈现', 'Canvas / WebGL 优化'],
    },
    {
      title: '性能与工程',
      items: ['Web Worker', 'OffscreenCanvas', 'IndexedDB', '渲染与包体积优化'],
    },
    {
      title: '协作与交付',
      items: ['需求理解', '方案落地', '复杂业务系统开发', '重构治理'],
    },
  ],
  experience: [
    {
      period: '2024.09 - 至今',
      company: '网易（人力外包）',
      role: '高级数据研发工程师（Web 前端）',
      summary: '负责地图效率工具相关产品的设计与研发，参与 BI 数据工具链能力建设，聚焦地图可视化与团队协作场景。',
    },
    {
      period: '2023.08 - 2024.09',
      company: '上海地听信息科技有限公司',
      role: 'Web 开发工程师',
      summary: '参与多个 GIS 可视化项目与监测平台建设，负责地图应用开发、性能优化与前端架构迭代。',
    },
    {
      period: '2022.08 - 2023.07',
      company: '青岛拓宇数字',
      role: '前端开发',
      summary: '参与 H5、小程序与业务管理系统开发，覆盖表单流程、权限模型和业务功能交付。',
    },
  ],
  projects: [
    {
      title: '地图效率工具',
      period: '2024.09 - 至今',
      summary: '面向地图查看、编辑与协作的效率产品，负责产品设计与前端开发。',
      highlights: [
        '推进地图可视化与协作能力落地，支持复杂业务场景下的工具化使用。',
        '结合 AI 工具提升信息收集与需求分析效率，辅助方案沉淀。',
        '优化大规模点渲染性能，将渲染耗时从约 3000ms 降至 700ms。',
      ],
    },
    {
      title: '污染物扩散 / 溯源模拟可视化项目',
      period: '2024.05 - 2024.08',
      summary: '面向污染扩散过程的二维地图可视化系统，负责插值算法可视化落地与复杂地图图层管理。',
      highlights: [
        '基于 IDW 插值算法生成污染扩散权重图。',
        '使用 Web Worker 与 OffscreenCanvas 优化离屏计算与绘制。',
        '通过 IndexedDB 建立大文件缓存机制，支撑多类型图层查询和渲染。',
      ],
    },
    {
      title: '风廓线温监测平台',
      period: '2023.08 - 2024.07',
      summary: '面向监测数据的管理与可视化平台，聚焦前端重构与实时数据展示。',
      highlights: [
        '主导前端项目从 Vue 2 到 Vue 3 的重构，缓解历史耦合与维护成本问题。',
        '基于 WebSocket 实现实时监测点状态更新与消息推送。',
        '围绕 OpenLayers 地图场景进行性能治理，包括图片预加载、任务调度与包体积优化。',
      ],
    },
  ],
} as const;
