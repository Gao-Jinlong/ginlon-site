# Resume Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a hidden Chinese-only `/resume` page that rewrites the screenshot resume into a privacy-safe, single-column resume page consistent with the current site and printable near one A4 page.

**Architecture:** Keep the implementation small and local to the existing Astro app. Store the rewritten resume content in a dedicated data module, render it from a standalone page that reuses `Main`, and extend page-level SEO metadata just enough to support hidden-page behavior (`robots` + no locale alternates). Add print-focused styles at the page level rather than introducing a new global subsystem.

**Tech Stack:** Astro 6, TypeScript, existing `Main` layout and shared CSS variables, Vitest for unit tests

---

## File Map

### Files to Create

- `src/data/resume.ts`
  - Single source of truth for the rewritten resume content
  - Holds the header, summary, capability groups, work experience, and the three selected projects
- `src/pages/resume.astro`
  - Hidden Chinese-only route for the resume page
  - Owns page metadata, layout composition, and page-local print styling
- `tests/unit/resume.test.ts`
  - Verifies privacy rules and content-shaping rules in `src/data/resume.ts`

### Files to Modify

- `src/types/seo.ts`
  - Extend `PageMeta` so hidden pages can control robots behavior
- `src/components/Head.astro`
  - Render a `<meta name="robots">` tag when provided
- `tests/unit/seo.test.ts`
  - Cover `robots` overrides and empty `alternates` overrides used by `/resume`

### Files Explicitly Not Touched

- `src/components/NavigationBar.astro`
  - The page stays out of the main navigation
- `src/i18n/**`
  - This phase is Chinese-only and should not introduce a localized English route
- `src/data/site.ts`
  - Reuse existing site config; do not add a public resume link

---

### Task 1: Create the Resume Content Model

**Files:**
- Create: `src/data/resume.ts`
- Test: `tests/unit/resume.test.ts`

- [ ] **Step 1: Write the failing content-shape test**

```ts
import { describe, expect, it } from 'vitest';

import { resumePageContent } from '../../src/data/resume';

describe('resume page content', () => {
  it('keeps only the approved public contact fields', () => {
    expect(resumePageContent.header.name).toBe('高金龙');
    expect(resumePageContent.header.email).toBe('ginlon5241@gmail.com');
    expect(resumePageContent.header.website.label).toBe('ginlon.site');
    expect(resumePageContent.header).not.toHaveProperty('phone');
    expect(resumePageContent.header).not.toHaveProperty('photo');
  });

  it('keeps exactly three work entries and three core projects', () => {
    expect(resumePageContent.experience).toHaveLength(3);
    expect(resumePageContent.projects).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test -- tests/unit/resume.test.ts`

Expected: FAIL because `src/data/resume.ts` does not exist yet.

- [ ] **Step 3: Add the minimal resume data module**

```ts
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
```

- [ ] **Step 4: Expand the test to enforce the hidden-page privacy contract**

```ts
it('does not leak removed sections or non-core projects', () => {
  const serialized = JSON.stringify(resumePageContent);

  expect(serialized).not.toContain('136');
  expect(serialized).not.toContain('接龙管家');
  expect(serialized).not.toContain('面训');
});
```

Run: `pnpm test -- tests/unit/resume.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/data/resume.ts tests/unit/resume.test.ts
git commit -m "feat: add hidden resume content model"
```

---

### Task 2: Extend SEO Metadata for Hidden Pages

**Files:**
- Modify: `src/types/seo.ts`
- Modify: `src/components/Head.astro`
- Modify: `tests/unit/seo.test.ts`

- [ ] **Step 1: Write the failing SEO test for hidden-page overrides**

Add to `tests/unit/seo.test.ts`:

```ts
it('allows pages to disable alternates and set robots directives', () => {
  expect(
    mergePageMeta(
      {
        title: 'Default',
        description: 'Default description',
        alternates: [{ hrefLang: 'zh-CN', href: 'https://www.ginlon.site/resume' }],
      },
      {
        alternates: [],
        robots: 'noindex, nofollow',
      },
    ),
  ).toMatchObject({
    alternates: [],
    robots: 'noindex, nofollow',
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test -- tests/unit/seo.test.ts`

Expected: FAIL because `robots` is not part of `PageMeta`.

- [ ] **Step 3: Add the minimal SEO type and head support**

Update `src/types/seo.ts`:

```ts
export interface PageMeta {
  title: string;
  description: string;
  canonical?: string;
  ogType?: OgType;
  ogImage?: string;
  keywords?: string;
  alternates?: AlternateLink[];
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  robots?: string;
}
```

Update `src/components/Head.astro`:

```astro
{pageMeta.robots && <meta name="robots" content={pageMeta.robots} />}
```

Place the `robots` tag alongside the existing `description` / `keywords` meta tags.

- [ ] **Step 4: Re-run the SEO tests**

Run: `pnpm test -- tests/unit/seo.test.ts`

Expected: PASS, including the new override case.

- [ ] **Step 5: Commit**

```bash
git add src/types/seo.ts src/components/Head.astro tests/unit/seo.test.ts
git commit -m "feat: support hidden-page seo overrides"
```

---

### Task 3: Build the Hidden `/resume` Page

**Files:**
- Create: `src/pages/resume.astro`
- Modify: `src/data/resume.ts`
- Test: `tests/unit/resume.test.ts`

- [ ] **Step 1: Add a rendering-oriented content test for the page data**

Extend `tests/unit/resume.test.ts`:

```ts
it('keeps capability groups and project highlights compact enough for a single-page layout', () => {
  expect(resumePageContent.capabilityGroups).toHaveLength(4);
  expect(
    resumePageContent.projects.every((project) => project.highlights.length <= 3),
  ).toBe(true);
});
```

- [ ] **Step 2: Run the content tests**

Run: `pnpm test -- tests/unit/resume.test.ts`

Expected: PASS before the page is built; this locks the density rules before markup work starts.

- [ ] **Step 3: Create the Astro page with hidden-route metadata**

Create `src/pages/resume.astro` with this structure:

```astro
---
import Main from '../layouts/Main.astro';
import PageContainer from '../components/PageContainer.astro';
import { resumePageContent } from '../data/resume';

const pageMeta = {
  title: '高金龙 | 简历',
  description: '高金龙的个人简历页面，聚焦 Web 可视化、地图应用与工程化交付。',
  ogType: 'profile' as const,
  alternates: [],
  robots: 'noindex, nofollow',
};
---

<Main pageMeta={pageMeta}>
  <PageContainer class="resume-page py-8 md:py-12">
    <article class="resume-sheet">
      <header class="resume-header">
        <div>
          <p class="resume-eyebrow">RESUME</p>
          <h1>{resumePageContent.header.name}</h1>
          <p class="resume-title">{resumePageContent.header.title}</p>
          <p class="resume-tagline">{resumePageContent.header.tagline}</p>
        </div>

        <div class="resume-links">
          <a href={`mailto:${resumePageContent.header.email}`}>{resumePageContent.header.email}</a>
          <a href={resumePageContent.header.website.href} target="_blank" rel="noreferrer">
            {resumePageContent.header.website.label}
          </a>
        </div>
      </header>

      <section class="resume-section">
        <h2>个人摘要</h2>
        <p>{resumePageContent.summary}</p>
      </section>

      <section class="resume-section">
        <h2>核心能力</h2>
        <div class="resume-capabilities">
          {resumePageContent.capabilityGroups.map((group) => (
            <section class="capability-card">
              <h3>{group.title}</h3>
              <p>{group.items.join(' / ')}</p>
            </section>
          ))}
        </div>
      </section>

      <section class="resume-section">
        <h2>工作经历</h2>
        <div class="resume-experience">
          {resumePageContent.experience.map((item) => (
            <article class="experience-item">
              <div class="experience-heading">
                <h3>{item.company}</h3>
                <p>{item.period}</p>
              </div>
              <p class="experience-role">{item.role}</p>
              <p>{item.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section class="resume-section">
        <h2>核心项目</h2>
        <div class="resume-projects">
          {resumePageContent.projects.map((project) => (
            <article class="project-card">
              <div class="project-heading">
                <h3>{project.title}</h3>
                <p>{project.period}</p>
              </div>
              <p>{project.summary}</p>
              <ul>
                {project.highlights.map((highlight) => <li>{highlight}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </article>
  </PageContainer>
</Main>
```

Add page-local styles directly in `src/pages/resume.astro` rather than creating a new global stylesheet. Keep the layout narrow, single-column, and visibly calmer than a dashboard screen.

- [ ] **Step 4: Verify the route builds successfully**

Run: `pnpm build`

Expected: PASS with `/resume` generated and no missing-type or metadata errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/resume.astro src/data/resume.ts tests/unit/resume.test.ts
git commit -m "feat: add hidden resume page"
```

---

### Task 4: Add Print Styles and Final Verification

**Files:**
- Modify: `src/pages/resume.astro`
- Modify: `tests/unit/resume.test.ts`
- Verify: local browser print preview and production build

- [ ] **Step 1: Add one last density test for the project section**

Extend `tests/unit/resume.test.ts`:

```ts
it('keeps each project summary and highlights present for print-friendly rendering', () => {
  for (const project of resumePageContent.projects) {
    expect(project.summary.length).toBeLessThan(80);
    expect(project.highlights.length).toBeGreaterThan(1);
  }
});
```

- [ ] **Step 2: Run the resume data tests**

Run: `pnpm test -- tests/unit/resume.test.ts`

Expected: PASS

- [ ] **Step 3: Add page-local print styles**

In `src/pages/resume.astro`, add an `@media print` block similar to:

```css
@media print {
  .site-glow,
  .grid-background,
  nav,
  footer {
    display: none !important;
  }

  .resume-page {
    padding: 0 !important;
  }

  .resume-sheet {
    max-width: none;
    border: none;
    box-shadow: none;
    background: white;
  }

  .project-card,
  .capability-card,
  .experience-item {
    break-inside: avoid;
    box-shadow: none;
  }
}
```

If hiding `nav` / `footer` globally in print proves too broad, switch to selectors scoped by `.resume-page` and use `body:has(.resume-page)` only if Astro output and browser support stay acceptable. Prefer the simplest rules that work in Chromium print preview.

- [ ] **Step 4: Run final verification**

Run:

```bash
pnpm test -- tests/unit/seo.test.ts tests/unit/resume.test.ts
pnpm build
```

Expected:

- all Vitest assertions pass
- Astro build passes
- local browser print preview for `/resume` is visually close to a single A4 page and keeps the correct content order

- [ ] **Step 5: Commit**

```bash
git add src/pages/resume.astro tests/unit/resume.test.ts
git commit -m "feat: polish resume print layout"
```

---

## Manual Verification Checklist

- [ ] Visit `/resume` in the browser and confirm the page is not linked from the main navigation.
- [ ] Confirm the header shows only name, email, and website; no phone number or photo appears.
- [ ] Confirm there are exactly 3 work entries and 3 project cards.
- [ ] Confirm project titles and wording stay generalized where required.
- [ ] Confirm the page renders comfortably on mobile without horizontal overflow.
- [ ] Open print preview and confirm the page is close to one A4 page with readable spacing.
- [ ] Inspect page source or devtools and confirm `<meta name="robots" content="noindex, nofollow">` is present.
- [ ] Confirm no locale alternate links are rendered for `/resume`.

## Notes for the Implementer

- Do not add the route to `NavigationBar` or `siteConfig.contactLinks`.
- Do not create `src/pages/en/resume.astro` in this phase.
- Keep the implementation inside the current visual system; no separate resume theme.
- If the content still overflows one page after styling, shorten project highlight copy before changing the layout structure.
- The repo currently has unrelated uncommitted changes (`tailwind.config.js`, `.superpowers/brainstorm/...`, and another plan file). Leave them alone while executing this plan.
