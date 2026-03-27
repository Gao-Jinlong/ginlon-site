# Ginlon Site Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the public site into a Chinese-only editorial experience with a new shell, new Home/Writing/About pages, a centered article reading surface, and migrated published Chinese articles.

**Architecture:** Keep Astro content collections and low-level utilities as the data backbone, but replace the public page/layout/component layer with a new editorial display system. Preserve existing published article slugs under `/blogs/[slug]`, introduce `/writing` as the archive entry, and convert legacy English and non-core routes into explicit redirect surfaces or retire them when they no longer need public reachability.

**Tech Stack:** Astro 6, MDX content collections, Tailwind CSS v4, TypeScript, Vitest, Astro Container tests

---

## File Structure

### Reuse and simplify

- Modify: `astro.config.mjs` - remove bilingual public routing assumptions and register any static redirect handling needed for legacy routes.
- Modify: `src/content.config.ts` - redefine the blog schema around the Chinese-only rebuild, with safe defaults for summary/tags and optional updated/featured fields.
- Modify: `src/utils/getBlogs.ts` - return one normalized Chinese article shape for Home, Writing, Article, and redirect generation.
- Modify: `src/utils/getTags.ts` - treat tags as secondary metadata derived from the normalized article set.
- Modify: `src/utils/seo.ts` - drop locale alternates, keep canonical/metadata helpers, and support redirect/noindex metadata where needed.
- Modify: `src/data/site.ts` - replace bilingual site copy with the Chinese editorial site identity and stable contact/link metadata.

### New site shell and presentational layer

- Create: `src/layouts/SiteLayout.astro` - shared public layout for Home, Writing, About, and Article pages.
- Create: `src/components/site/SiteHeader.astro` - minimal header with `首页 / 写作 / 关于` only.
- Create: `src/components/site/SiteFooter.astro` - restrained footer with contact links and record number.
- Create: `src/components/site/ThemeToggleButton.astro` - lightweight theme switcher that matches the new shell.
- Create: `src/components/site/PageSection.astro` - reusable section wrapper for editorial page rhythm.
- Create: `src/components/site/SectionHeading.astro` - section eyebrow/title/description primitive.
- Create: `src/components/site/ArticleCard.astro` - archive/home list item with title, date, summary, and tags.
- Create: `src/components/site/TagFilterBar.astro` - secondary archive filter UI.
- Create: `src/components/site/ArticleHero.astro` - compact article header.
- Create: `src/components/site/ArticleTocRail.astro` - desktop sticky TOC support rail.
- Create: `src/components/site/ArticleTocDrawer.astro` - mobile on-demand TOC drawer.
- Create: `src/components/site/ArticlePager.astro` - after-reading navigation to adjacent or selected articles.
- Create: `src/components/site/RedirectPage.astro` - meta-refresh and canonical redirect surface for retired legacy routes.
- Create: `src/styles/theme.css` - design tokens for colors, typography, spacing, borders, and reading widths.
- Modify: `src/styles/styles.css` - reduce old dashboard-like styling and import the new theme layer.

### New public pages and legacy route handling

- Modify: `src/pages/index.astro` - rebuild Home as a concise author landing page.
- Create: `src/pages/writing/index.astro` - canonical archive route.
- Modify: `src/pages/blogs/index.astro` - convert old archive route into a redirect to `/writing`.
- Modify: `src/pages/blogs/[slug].astro` - keep slug generation but render the new article layout.
- Modify: `src/pages/about.astro` - rebuild About as an author page instead of a resume-like page.
- Modify: `src/pages/tags/index.astro` - redirect to `/writing`.
- Modify: `src/pages/tags/[tag].astro` - redirect to `/writing?tag=...`.
- Modify: `src/pages/resume.astro` - redirect to `/about` and mark the route non-canonical/noindex if it stays reachable.
- Modify: `src/pages/techStack.astro` - redirect to `/about` or `/writing` instead of exposing a separate primary page.
- Modify: `src/pages/en/index.astro` - redirect to `/`.
- Modify: `src/pages/en/about/index.astro` - redirect to `/about`.
- Modify: `src/pages/en/blogs/index.astro` - redirect to `/writing`.
- Modify: `src/pages/en/blogs/[slug]/index.astro` - redirect each legacy English article URL to `/blogs/[slug]`.
- Modify: `src/pages/en/tags/index.astro` - redirect to `/writing`.
- Modify: `src/pages/en/tags/[tag]/index.astro` - redirect to `/writing?tag=...`.
- Modify: `src/pages/en/techStack/index.astro` - redirect to `/about`.

### Tests and verification

- Modify: `tests/unit/seo.test.ts` - replace locale-alternate expectations with Chinese-only canonical and redirect metadata expectations.
- Create: `tests/unit/getBlogs.test.ts` - verify normalized Chinese article sorting, draft exclusion, and fallback summary behavior.
- Create: `tests/unit/getTags.test.ts` - verify secondary tag aggregation and writing-filter compatibility.
- Create: `tests/unit/site-shell.test.ts` - render shell/header/footer and verify only `首页 / 写作 / 关于` appear in primary navigation.
- Create: `tests/unit/article-toc.test.ts` - render desktop/mobile TOC components and verify drawer/rail behavior hooks.
- Modify: `tests/unit/head.test.ts` - verify redirect/noindex metadata and canonical behavior.
- Modify: `tests/unit/resume-page.test.ts` - replace legacy content assertions with redirect-route expectations or retire the test if the route becomes a pure redirect page.

## Delivery Notes

- Canonical archive path becomes `/writing`; article detail remains `/blogs/[slug]` to preserve published article URLs.
- Tags stay available only as secondary filters and legacy tag routes redirect into the Writing filter view.
- English remains out of scope for content delivery; all `/en/*` routes become explicit redirect shells instead of parallel translated pages.
- `resume` and `techStack` remain out of primary navigation and should not present themselves as first-class top-level destinations.
- Phase A must ship with every currently published Chinese article reachable and safe to render even if some articles need fallback summaries or normalized tags.

### Task 1: Reset Routing, Locale, and SEO Baseline

**Files:**
- Modify: `astro.config.mjs`
- Modify: `src/i18n/utils.ts`
- Modify: `src/utils/seo.ts`
- Modify: `src/data/site.ts`
- Modify: `tests/unit/seo.test.ts`
- Modify: `tests/unit/head.test.ts`

- [ ] **Step 1: Write failing SEO and locale baseline tests**

```ts
expect(buildCanonicalUrl('https://www.ginlon.site', '/writing')).toBe(
  'https://www.ginlon.site/writing',
);

expect(buildLocaleAlternates('https://www.ginlon.site', '/writing')).toEqual([]);
```

- [ ] **Step 2: Run the targeted baseline tests**

Run: `pnpm test -- --run tests/unit/seo.test.ts tests/unit/head.test.ts`
Expected: FAIL because current helpers still emit `zh/en` alternates and bilingual defaults.

- [ ] **Step 3: Simplify locale helpers to Chinese-only public behavior**

```ts
export type AppLocale = 'zh';
export const defaultLocale: AppLocale = 'zh';
export const appLocales: AppLocale[] = ['zh'];
```

- [ ] **Step 4: Rewrite site metadata defaults for the editorial Chinese site**

```ts
export const siteConfig = {
  name: 'Ginlon',
  zh: {
    title: 'Ginlon',
    description: '关于工程、写作与长期主义实践的中文写作站点。',
  },
};
```

- [ ] **Step 5: Remove locale alternates from SEO helpers and support redirect/noindex pages**

```ts
export function buildCanonicalUrl(site: string, pathname: string) {
  return new URL(pathname, site).toString();
}
```

- [ ] **Step 6: Align `astro.config.mjs` with the single-language public route strategy**

Run: update config so build output no longer assumes a live bilingual public surface.
Expected: local typecheck/build config stays valid.

- [ ] **Step 7: Re-run the targeted baseline tests**

Run: `pnpm test -- --run tests/unit/seo.test.ts tests/unit/head.test.ts`
Expected: PASS

- [ ] **Step 8: Commit the routing/SEO baseline**

```bash
git add astro.config.mjs src/i18n/utils.ts src/utils/seo.ts src/data/site.ts tests/unit/seo.test.ts tests/unit/head.test.ts
git commit -m "refactor: simplify public locale and seo baseline"
```

### Task 2: Normalize Article Data for the Rebuild

**Files:**
- Modify: `src/content.config.ts`
- Modify: `src/utils/getBlogs.ts`
- Modify: `src/utils/getTags.ts`
- Create: `tests/unit/getBlogs.test.ts`
- Create: `tests/unit/getTags.test.ts`

- [ ] **Step 1: Write failing tests for normalized article data**

```ts
expect(articles[0]).toMatchObject({
  title: expect.any(String),
  summary: expect.any(String),
  slug: expect.any(String),
  publishedAt: expect.any(String),
});
```

- [ ] **Step 2: Run the article data tests to capture current gaps**

Run: `pnpm test -- --run tests/unit/getBlogs.test.ts tests/unit/getTags.test.ts`
Expected: FAIL because no normalized Chinese-only article adapter exists yet.

- [ ] **Step 3: Update the content schema to match rebuild requirements**

```ts
schema: z.object({
  lang: z.literal('zh'),
  title: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  featured: z.boolean().optional(),
})
```

- [ ] **Step 4: Refactor `getBlogs` into one normalized article adapter**

```ts
return sortedBlogs.map((blog) => ({
  id: blog.id,
  slug: blog.data.permalink,
  title: blog.data.title,
  summary: blog.data.description ?? deriveSummaryFromBody(blog),
  tags: blog.data.tags ?? [],
  publishedAt: blog.data.createdAt,
}));
```

- [ ] **Step 5: Refactor `getTags` to derive secondary filters from normalized articles**

```ts
return buildTagCounts(articles).sort((a, b) => b.count - a.count);
```

- [ ] **Step 6: Re-run the article data tests**

Run: `pnpm test -- --run tests/unit/getBlogs.test.ts tests/unit/getTags.test.ts`
Expected: PASS

- [ ] **Step 7: Commit the normalized article data layer**

```bash
git add src/content.config.ts src/utils/getBlogs.ts src/utils/getTags.ts tests/unit/getBlogs.test.ts tests/unit/getTags.test.ts
git commit -m "refactor: normalize article data for rebuild"
```

### Task 3: Build the New Editorial Site Shell

**Files:**
- Create: `src/layouts/SiteLayout.astro`
- Create: `src/components/site/SiteHeader.astro`
- Create: `src/components/site/SiteFooter.astro`
- Create: `src/components/site/ThemeToggleButton.astro`
- Create: `src/components/site/PageSection.astro`
- Create: `src/components/site/SectionHeading.astro`
- Create: `src/styles/theme.css`
- Modify: `src/styles/styles.css`
- Create: `tests/unit/site-shell.test.ts`

- [ ] **Step 1: Write a failing shell test for the simplified header**

```ts
expect(html).toContain('首页');
expect(html).toContain('写作');
expect(html).toContain('关于');
expect(html).not.toContain('标签');
expect(html).not.toContain('技术栈');
```

- [ ] **Step 2: Run the shell test**

Run: `pnpm test -- --run tests/unit/site-shell.test.ts`
Expected: FAIL because the new shell components do not exist yet.

- [ ] **Step 3: Define theme tokens for the editorial rebuild**

```css
:root {
  --accent: #256b4f;
  --page-bg: #f7f5ef;
  --reading-width: 46rem;
}
```

- [ ] **Step 4: Implement the shared site layout and navigation primitives**

Run: create `SiteLayout`, `SiteHeader`, `SiteFooter`, and the lightweight theme toggle with only the approved top-level nav items.
Expected: pages can render without reusing the old tab-heavy shell.

- [ ] **Step 5: Reduce old global styles to utility and typography support only**

Run: move shell-level visual decisions into `theme.css` and keep `styles.css` as the import surface.
Expected: no old dashboard gradients, heavy cards, or blue-first tokens remain as defaults.

- [ ] **Step 6: Re-run the shell test**

Run: `pnpm test -- --run tests/unit/site-shell.test.ts`
Expected: PASS

- [ ] **Step 7: Commit the new site shell**

```bash
git add src/layouts/SiteLayout.astro src/components/site src/styles/theme.css src/styles/styles.css tests/unit/site-shell.test.ts
git commit -m "feat: add editorial site shell"
```

### Task 4: Rebuild Home and Writing Archive Pages

**Files:**
- Modify: `src/pages/index.astro`
- Create: `src/pages/writing/index.astro`
- Create: `src/components/site/ArticleCard.astro`
- Create: `src/components/site/TagFilterBar.astro`
- Modify: `src/pages/blogs/index.astro`
- Modify: `src/pages/tags/index.astro`
- Modify: `src/pages/tags/[tag].astro`
- Create: `tests/unit/home-writing-pages.test.ts`

- [ ] **Step 1: Write a failing route-content test for Home/Writing**

```ts
expect(homeHtml).toContain('写作');
expect(homeHtml).not.toContain('tab-panel');
expect(writingHtml).toContain('全部文章');
```

- [ ] **Step 2: Run the focused page test**

Run: `pnpm test -- --run tests/unit/home-writing-pages.test.ts`
Expected: FAIL because Home and Writing are still using the old page structure.

- [ ] **Step 3: Rebuild the homepage as a short author landing page**

Run: compose hero, selected writing, current focus, and about preview using the new shell primitives.
Expected: home is no longer a second archive or a panel grid.

- [ ] **Step 4: Build `/writing` as the canonical chronological archive**

```ts
const selectedTag = Astro.url.searchParams.get('tag');
const visibleArticles = selectedTag
  ? articles.filter((article) => article.tags.includes(selectedTag))
  : articles;
```

- [ ] **Step 5: Convert legacy archive/tag routes into redirects**

Run: make `/blogs` redirect to `/writing`, `/tags` redirect to `/writing`, and `/tags/[tag]` redirect to `/writing?tag=<slug or tag>`.
Expected: no legacy tag or tab page remains a first-class destination.

- [ ] **Step 6: Re-run the focused page/data tests**

Run: `pnpm test -- --run tests/unit/home-writing-pages.test.ts tests/unit/getBlogs.test.ts tests/unit/getTags.test.ts`
Expected: PASS

- [ ] **Step 7: Commit the Home/Writing rebuild**

```bash
git add src/pages/index.astro src/pages/writing/index.astro src/pages/blogs/index.astro src/pages/tags src/components/site/ArticleCard.astro src/components/site/TagFilterBar.astro tests/unit/home-writing-pages.test.ts
git commit -m "feat: rebuild home and writing archive"
```

### Task 5: Rebuild the Article Reading Experience

**Files:**
- Modify: `src/pages/blogs/[slug].astro`
- Create: `src/components/site/ArticleHero.astro`
- Create: `src/components/site/ArticleTocRail.astro`
- Create: `src/components/site/ArticleTocDrawer.astro`
- Create: `src/components/site/ArticlePager.astro`
- Create: `tests/unit/article-toc.test.ts`

- [ ] **Step 1: Write failing TOC component tests**

```ts
expect(desktopHtml).toContain('文章目录');
expect(desktopHtml).toContain('position: sticky');
expect(mobileHtml).toContain('aria-controls="article-toc-drawer"');
```

- [ ] **Step 2: Run the TOC tests**

Run: `pnpm test -- --run tests/unit/article-toc.test.ts`
Expected: FAIL because the new rail/drawer components do not exist yet.

- [ ] **Step 3: Rebuild the article page around a centered reading column**

Run: render metadata, article body, and related navigation inside `SiteLayout` with a controlled reading width and a right-side desktop support rail.
Expected: the article column stays visually centered; the TOC no longer steals center alignment.

- [ ] **Step 4: Implement the desktop TOC rail**

```astro
<aside class="hidden xl:block">
  <ArticleTocRail headings={headings} />
</aside>
```

- [ ] **Step 5: Implement the mobile TOC drawer**

```astro
<ArticleTocDrawer headings={headings} buttonLabel="目录" />
```

- [ ] **Step 6: Add after-reading navigation instead of pre-reading clutter**

Run: place related/adjacent article navigation after the article body, not beside it.
Expected: reading flow remains uninterrupted.

- [ ] **Step 7: Re-run the TOC tests**

Run: `pnpm test -- --run tests/unit/article-toc.test.ts`
Expected: PASS

- [ ] **Step 8: Commit the article reading surface**

```bash
git add src/pages/blogs/[slug].astro src/components/site/ArticleHero.astro src/components/site/ArticleTocRail.astro src/components/site/ArticleTocDrawer.astro src/components/site/ArticlePager.astro tests/unit/article-toc.test.ts
git commit -m "feat: rebuild article reading experience"
```

### Task 6: Rebuild About and Retire Resume-Style Surfaces

**Files:**
- Modify: `src/pages/about.astro`
- Modify: `src/pages/resume.astro`
- Modify: `src/pages/techStack.astro`
- Create: `src/components/site/RedirectPage.astro`
- Modify: `tests/unit/resume-page.test.ts`

- [ ] **Step 1: Write a failing test around retired resume-style routes**

```ts
expect(resumeHtml).toContain('http-equiv="refresh"');
expect(resumeHtml).toContain('/about');
```

- [ ] **Step 2: Run the redirect-focused test**

Run: `pnpm test -- --run tests/unit/resume-page.test.ts`
Expected: FAIL because `resume.astro` still renders a full content page.

- [ ] **Step 3: Rebuild About as an author page**

Run: replace resume-like sections with personal introduction, working style, writing motivation, and selected links.
Expected: About supports the site narrative without becoming a portfolio matrix.

- [ ] **Step 4: Convert `/resume` and `/techStack` into hidden legacy redirects**

Run: create and use `RedirectPage.astro` so these routes stop acting as primary site destinations.
Expected: the routes stay harmless if referenced, but the public IA stays `首页 / 写作 / 关于`.

- [ ] **Step 5: Re-run the redirect-focused test**

Run: `pnpm test -- --run tests/unit/resume-page.test.ts`
Expected: PASS

- [ ] **Step 6: Commit the About/legacy route cleanup**

```bash
git add src/pages/about.astro src/pages/resume.astro src/pages/techStack.astro src/components/site/RedirectPage.astro tests/unit/resume-page.test.ts
git commit -m "feat: rebuild about and retire legacy profile routes"
```

### Task 7: Add Explicit Redirect Coverage for Legacy English Routes

**Files:**
- Modify: `src/pages/en/index.astro`
- Modify: `src/pages/en/about/index.astro`
- Modify: `src/pages/en/blogs/index.astro`
- Modify: `src/pages/en/blogs/[slug]/index.astro`
- Modify: `src/pages/en/tags/index.astro`
- Modify: `src/pages/en/tags/[tag]/index.astro`
- Modify: `src/pages/en/techStack/index.astro`
- Modify: `tests/unit/head.test.ts`

- [ ] **Step 1: Write a failing redirect metadata test**

```ts
expect(html).toContain('http-equiv="refresh"');
expect(html).toContain('canonical');
expect(html).toContain('/blogs/example-slug');
```

- [ ] **Step 2: Run the redirect metadata test**

Run: `pnpm test -- --run tests/unit/head.test.ts`
Expected: FAIL because legacy English routes still present real content pages.

- [ ] **Step 3: Implement a reusable redirect page component**

```astro
<meta http-equiv="refresh" content={`0;url=${target}`} />
<link rel="canonical" href={canonical} />
```

- [ ] **Step 4: Replace each `/en/*` page with a route-specific redirect target**

Run: map `/en -> /`, `/en/about -> /about`, `/en/blogs -> /writing`, `/en/blogs/[slug] -> /blogs/[slug]`, `/en/tags -> /writing`, `/en/tags/[tag] -> /writing?tag=...`, `/en/techStack -> /about`.
Expected: legacy public URLs continue to resolve without maintaining an English presentation layer.

- [ ] **Step 5: Re-run the redirect metadata test**

Run: `pnpm test -- --run tests/unit/head.test.ts`
Expected: PASS

- [ ] **Step 6: Commit the English-route redirects**

```bash
git add src/components/site/RedirectPage.astro src/pages/en tests/unit/head.test.ts
git commit -m "feat: redirect legacy english routes"
```

### Task 8: Content Migration Checks and Final Verification

**Files:**
- Modify: `src/content/blogs/zh/**/*.mdx` as needed for missing `description`, normalized `tags`, or optional `updatedAt`.
- Modify: `src/content.config.ts` if migration uncovered schema gaps.
- Modify: `docs/superpowers/specs/2026-03-27-ginlon-site-rebuild-design.md` only if an implementation-discovered constraint must be documented.

- [ ] **Step 1: Audit the published Chinese article set for launch blockers**

Run: inspect all `src/content/blogs/zh/**/index.mdx` files for missing descriptions, malformed tags, or permalink inconsistencies.
Expected: produce a concrete fix list before touching content.

- [ ] **Step 2: Add only the minimum metadata normalization needed for Phase A**

Run: patch missing descriptions/tags or optional updated dates so every migrated article renders safely in Home, Writing, and Article contexts.
Expected: no published Chinese article depends on empty summary or broken tag data to render.

- [ ] **Step 3: Run the full test suite**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 4: Run the production build**

Run: `pnpm build`
Expected: PASS with all rebuilt routes generated successfully.

- [ ] **Step 5: Perform browser acceptance review**

Run: `pnpm dev`
Expected: manually confirm `/`, `/writing`, `/about`, one long-form `/blogs/[slug]`, one `/en/blogs/[slug]` redirect, and one `/tags/[tag]` redirect in Chrome DevTools.

- [ ] **Step 6: Commit the verified rebuild baseline**

```bash
git add src docs tests
git commit -m "feat: complete ginlon site rebuild phase a"
```

## Acceptance Checklist

- [ ] Primary navigation shows only `首页`, `写作`, and `关于`.
- [ ] Homepage is concise and writing-first, not an archive clone.
- [ ] `/writing` is the canonical archive route and defaults to a chronological stream.
- [ ] Tags appear only as secondary filters or redirect targets.
- [ ] `/blogs/[slug]` articles keep current public slugs and render inside the new centered reading layout.
- [ ] Desktop TOC sits in a right-side support rail; mobile TOC opens on demand as a drawer.
- [ ] `/about` reads like an author page, not a resume dump.
- [ ] `/en/*`, `/resume`, `/techStack`, `/blogs`, and `/tags*` no longer act as primary destinations.
- [ ] All currently published Chinese articles render successfully.
- [ ] `pnpm test`, `pnpm build`, and browser acceptance review all pass.
