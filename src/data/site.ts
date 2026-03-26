export const siteConfig = {
  name: 'Ginlon',
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
    title: 'Ginlon 的个人网站',
    description: 'Ginlon 的个人网站 - 展示前端开发技能和经验。',
  },
  en: {
    title: "Ginlon's Portfolio",
    description:
      "Ginlon's Portfolio Website - showcasing skills, and experience in front-end web development.",
  },
} as const;
