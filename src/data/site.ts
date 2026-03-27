export const siteConfig = {
  name: 'Ginlon 写作档案',
  url: 'https://www.ginlon.site',
  defaultOgImage: 'https://www.ginlon.site/og/site-default.png',
  articleOgImage: 'https://www.ginlon.site/og/article-default.png',
  recordNumber: '鲁ICP备2024058644号',
  contactLinks: [
    {
      href: 'https://github.com/Gao-Jinlong',
      label: {
        zh: 'GitHub',
        en: 'GitHub',
      },
      external: true,
    },
    {
      href: 'mailto:ginlon5241@gmail.com',
      label: {
        zh: '邮箱',
        en: 'Email',
      },
      external: true,
    },
    {
      href: 'https://juejin.cn/user/2775585439885320',
      label: {
        zh: '掘金',
        en: 'Juejin',
      },
      external: true,
    },
  ],
  zh: {
    title: 'Ginlon 的写作档案',
    description: '记录前端工程、写作实践与长期主义思考的中文站点。',
  },
  en: {
    title: "Ginlon's Writing Archive",
    description: 'A writing archive about frontend engineering, craft, and long-term practice.',
  },
} as const;
