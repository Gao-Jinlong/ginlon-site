# Ginlon Site Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the public site into a unified personal-brand experience with a softer product-style visual system, stronger article reading surfaces, and page-level SEO/OG metadata.

**Architecture:** Keep the Astro + MDX + i18n content model intact, but refactor the shared shell, page components, and metadata API so the visual system and SEO contract are centralized. Implement reusable layout primitives first, then rebuild homepage, writing, article, and about surfaces on top of those primitives, and finish by wiring localized metadata and responsive verification.

**Tech Stack:** Astro 6, TypeScript, Tailwind CSS v4, MDX, Vue 3, pnpm, Vitest

---

## File Structure

### Existing files to modify

- `package.json`
- `src/styles/styles.css`
- `src/layouts/Main.astro`
- `src/layouts/Blog.astro`
- `src/components/Head.astro`
- `src/components/NavigationBar.astro`
- `src/components/Footer.astro`
- `src/components/BlogCard.astro`
- `src/components/RecentPosts.astro`
- `src/components/TableOfContents.astro`
- `src/pages/index.astro`
- `src/pages/about.astro`
- `src/pages/blogs/index.astro`
- `src/pages/blogs/[slug].astro`
- `src/pages/tags/index.astro`
- `src/pages/tags/[tag].astro`
- `src/pages/techStack.astro`
- `src/content.config.ts`
- `src/i18n/utils.ts`
- `src/i18n/common/zh.json`
- `src/i18n/common/en.json`
- `src/pages/blogs/_i18n/zh.json`
- `src/pages/blogs/_i18n/en.json`

### New files to create

- `vitest.config.ts`
- `src/types/seo.ts`
- `src/utils/seo.ts`
- `src/data/site.ts`
- `src/components/PageContainer.astro`
- `src/components/PageIntro.astro`
- `src/components/SectionHeader.astro`
- `src/components/HomeHero.astro`
- `src/components/FocusAreaGrid.astro`
- `src/components/AboutSnapshot.astro`
- `src/components/MetadataRow.astro`
- `tests/unit/seo.test.ts`
- `public/og/site-default.png`
- `public/og/article-default.png`

### Responsibility map

- `src/data/site.ts`: central source for site-wide branding, social image defaults, and contact links
- `src/types/seo.ts` and `src/utils/seo.ts`: page metadata contracts and deterministic metadata builders
- `src/components/Head.astro`: rendering HTML `<head>` from the metadata contract
- `src/layouts/Main.astro`: page shell, background, navigation/footer composition, default metadata handoff
- `src/layouts/Blog.astro`: article reading template and article-level metadata handoff
- `src/components/PageContainer.astro`, `PageIntro.astro`, `SectionHeader.astro`: reusable structural primitives for all top-level pages
- `src/components/HomeHero.astro`, `FocusAreaGrid.astro`, `AboutSnapshot.astro`: homepage-specific brand sections
- `src/components/BlogCard.astro`, `MetadataRow.astro`, `RecentPosts.astro`, `TableOfContents.astro`: content browsing and reading surfaces

## Task 1: Add Metadata Contracts And Test Harness

**Files:**
- Modify: `package.json`
- Modify: `src/i18n/utils.ts`
- Create: `vitest.config.ts`
- Create: `src/types/seo.ts`
- Create: `src/utils/seo.ts`
- Create: `src/data/site.ts`
- Test: `tests/unit/seo.test.ts`

- [ ] **Step 1: Add test dependencies and scripts to `package.json`**

Add a minimal test script block and Vitest dev dependency so metadata helpers can be implemented with deterministic tests.

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 2: Install dependencies and refresh the lockfile**

Run: `pnpm install`

Expected: PASS and `pnpm-lock.yaml` is updated to include `vitest`.

- [ ] **Step 3: Create the failing metadata tests**

Write `tests/unit/seo.test.ts` with coverage for canonical URLs, alternate locale links, and page-meta merging.

```ts
import { describe, expect, it } from 'vitest'
import { buildCanonicalUrl, buildLocaleAlternates, mergePageMeta } from '../../src/utils/seo'

describe('seo helpers', () => {
  it('builds the canonical URL from the Astro site URL and pathname', () => {
    expect(buildCanonicalUrl('https://www.ginlon.site', '/blogs/abc')).toBe(
      'https://www.ginlon.site/blogs/abc'
    )
  })

  it('builds locale alternates for zh and en pages', () => {
    expect(buildLocaleAlternates('https://www.ginlon.site', '/about')).toEqual([
      { hrefLang: 'zh-CN', href: 'https://www.ginlon.site/about' },
      { hrefLang: 'en', href: 'https://www.ginlon.site/en/about' },
      { hrefLang: 'x-default', href: 'https://www.ginlon.site/about' },
    ])
  })

  it('lets page-level values override layout defaults', () => {
    expect(
      mergePageMeta(
        { title: 'Default', description: 'Default description' },
        { title: 'About', ogType: 'profile' }
      )
    ).toMatchObject({
      title: 'About',
      description: 'Default description',
      ogType: 'profile',
    })
  })
})
```

- [ ] **Step 4: Run the test file and confirm it fails**

Run: `pnpm test tests/unit/seo.test.ts`

Expected: FAIL with import or symbol errors for `src/utils/seo.ts`.

- [ ] **Step 5: Create the metadata types and utility implementation**

Create `src/types/seo.ts`, `src/data/site.ts`, and `src/utils/seo.ts` with a small, explicit contract.

```ts
// src/types/seo.ts
export type OgType = 'website' | 'article' | 'profile'

export interface AlternateLink {
  hrefLang: string
  href: string
}

export interface PageMeta {
  title: string
  description: string
  canonical?: string
  ogType?: OgType
  ogImage?: string
  keywords?: string
  alternates?: AlternateLink[]
  publishedTime?: string
  modifiedTime?: string
  tags?: string[]
}
```

```ts
// src/utils/seo.ts
import type { PageMeta, AlternateLink } from '../types/seo'

export function buildCanonicalUrl(site: string, pathname: string): string {
  return new URL(pathname, site).toString()
}

export function buildLocaleAlternates(site: string, pathname: string): AlternateLink[] {
  const normalized = pathname === '/en' ? '/' : pathname.replace(/^\/en/, '') || '/'

  return [
    { hrefLang: 'zh-CN', href: new URL(normalized, site).toString() },
    { hrefLang: 'en', href: new URL(normalized === '/' ? '/en' : `/en${normalized}`, site).toString() },
    { hrefLang: 'x-default', href: new URL(normalized, site).toString() },
  ]
}

export function mergePageMeta(defaults: PageMeta, overrides: Partial<PageMeta>): PageMeta {
  return { ...defaults, ...overrides }
}
```

- [ ] **Step 6: Export locale constants from `src/i18n/utils.ts`**

Add a single exported locale list so the metadata layer and page code do not duplicate locale assumptions.

```ts
export const appLocales: AppLocale[] = ['zh', 'en']
```

- [ ] **Step 7: Run the metadata tests again**

Run: `pnpm test tests/unit/seo.test.ts`

Expected: PASS with 3 passing tests.

- [ ] **Step 8: Commit the foundation**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts src/types/seo.ts src/utils/seo.ts src/data/site.ts src/i18n/utils.ts tests/unit/seo.test.ts
git commit -m "test: add metadata helper contracts"
```

## Task 2: Build The Shared Visual Shell

**Files:**
- Modify: `src/styles/styles.css`
- Modify: `src/layouts/Main.astro`
- Modify: `src/components/Head.astro`
- Modify: `src/components/NavigationBar.astro`
- Modify: `src/components/Footer.astro`
- Modify: `src/components/GridBackground.astro`
- Create: `src/components/PageContainer.astro`
- Create: `src/components/PageIntro.astro`
- Create: `src/components/SectionHeader.astro`

- [ ] **Step 1: Define global design tokens in `src/styles/styles.css`**

Add CSS custom properties for page background, panel background, border, text, muted text, and accent colors so page components stop hard-coding unrelated gray values.

```css
:root {
  --page-bg: linear-gradient(180deg, #edf6f3 0%, #f8fafc 42%, #fbfcfd 100%);
  --surface-bg: rgba(255, 255, 255, 0.86);
  --surface-border: rgba(148, 163, 184, 0.22);
  --text-strong: #12202b;
  --text-muted: #51606f;
  --accent: #1f7667;
  --shadow-soft: 0 18px 50px rgba(15, 23, 42, 0.06);
}
```

- [ ] **Step 2: Create structural primitives**

Create `PageContainer.astro`, `PageIntro.astro`, and `SectionHeader.astro` so top-level pages share the same width, spacing, and section rhythm.

```astro
--- // src/components/PageContainer.astro
const { class: className = '' } = Astro.props
---

<section class:list={['mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8', className]}>
  <slot />
</section>
```

- [ ] **Step 3: Refactor `Head.astro` to accept a typed metadata object**

Replace the current translation-only defaults with a `pageMeta` prop that renders canonical, alternates, OG, and Twitter tags from the Task 1 helpers.

```astro
---
import type { PageMeta } from '../types/seo'
const { pageMeta } = Astro.props as { pageMeta: PageMeta }
---
<title>{pageMeta.title}</title>
<link rel="canonical" href={pageMeta.canonical} />
{pageMeta.alternates?.map(link => <link rel="alternate" hreflang={link.hrefLang} href={link.href} />)}
<meta name="description" content={pageMeta.description} />
<meta property="og:type" content={pageMeta.ogType ?? 'website'} />
<meta property="og:image" content={pageMeta.ogImage} />
```

- [ ] **Step 4: Refactor `Main.astro` into the default page shell**

Have `Main.astro` build localized defaults from `src/data/site.ts` and merge them with `pageMeta` overrides before passing to `Head.astro`.

```astro
---
import { buildCanonicalUrl, buildLocaleAlternates, mergePageMeta } from '../utils/seo'
import { siteConfig } from '../data/site'
const locale = getLocaleFromUrl(Astro.url)
const defaults = {
  title: locale === 'zh' ? siteConfig.zh.title : siteConfig.en.title,
  description: locale === 'zh' ? siteConfig.zh.description : siteConfig.en.description,
  canonical: buildCanonicalUrl(siteConfig.url, Astro.url.pathname),
  alternates: buildLocaleAlternates(siteConfig.url, Astro.url.pathname),
  ogImage: siteConfig.defaultOgImage,
}
const resolvedMeta = mergePageMeta(defaults, Astro.props.pageMeta ?? {})
---
```

- [ ] **Step 5: Rebuild navigation and footer around the new IA**

Update `NavigationBar.astro` to prioritize `Home`, `Writing`, and `About`, move `Tags` and `Tech Stack` into a smaller secondary area or footer, and simplify hover/active styles to match the new surface tokens.

- [ ] **Step 6: Run typecheck and production build**

Run: `pnpm build`

Expected: PASS with Astro typecheck and static build completing successfully.

- [ ] **Step 7: Commit the shell work**

```bash
git add src/styles/styles.css src/layouts/Main.astro src/components/Head.astro src/components/NavigationBar.astro src/components/Footer.astro src/components/GridBackground.astro src/components/PageContainer.astro src/components/PageIntro.astro src/components/SectionHeader.astro
git commit -m "feat: build shared site shell for redesign"
```

## Task 3: Rebuild The Homepage Around Brand-First Sections

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/i18n/common/zh.json`
- Modify: `src/i18n/common/en.json`
- Create: `src/components/HomeHero.astro`
- Create: `src/components/FocusAreaGrid.astro`
- Create: `src/components/AboutSnapshot.astro`

- [ ] **Step 1: Add the new homepage copy contract to the i18n JSON files**

Extend both `src/i18n/common/zh.json` and `src/i18n/common/en.json` with grouped homepage fields for hero, focus areas, selected writing, about snapshot, and the final contact link section.

```json
"homepage": {
  "hero": {
    "eyebrow": "ENGINEERING + WRITING",
    "title": "Build calm interfaces and clear systems.",
    "description": "Frontend engineer focused on product quality, architecture, and technical writing.",
    "primaryCta": "Read Writing",
    "secondaryCta": "About"
  }
}
```

- [ ] **Step 2: Create the homepage section components**

Build `HomeHero.astro`, `FocusAreaGrid.astro`, and `AboutSnapshot.astro` as presentational components that only read localized props and render section-level layout.

- [ ] **Step 3: Replace the current homepage structure in `src/pages/index.astro`**

Use the shared shell components and the new homepage sections in this order:

```astro
<Main pageMeta={homePageMeta}>
  <PageContainer class="space-y-12 py-10 md:space-y-16 md:py-16">
    <HomeHero locale={locale} />
    <FocusAreaGrid locale={locale} />
    <section aria-labelledby="selected-writing">
      <SectionHeader ... />
      <div class="grid gap-5">
        {sortedBlogs.slice(0, 3).map(blog => <BlogCard blog={blog} compact={false} />)}
      </div>
    </section>
    <AboutSnapshot locale={locale} />
    <section aria-labelledby="contact-links">
      <SectionHeader title={t('homepage.contact.title')} eyebrow={t('homepage.contact.eyebrow')} />
      <div class="flex flex-wrap gap-3">
        {siteConfig.contactLinks.map(link => (
          <a href={link.href} class="inline-flex rounded-full border px-4 py-2 text-sm" target={link.external ? '_blank' : undefined}>
            {link.label[locale]}
          </a>
        ))}
      </div>
    </section>
  </PageContainer>
</Main>
```

- [ ] **Step 4: Add homepage-level metadata overrides**

Set homepage-specific `title`, `description`, and `ogType` in `src/pages/index.astro` instead of relying on global defaults.

- [ ] **Step 5: Run a focused build check for homepage changes**

Run: `pnpm build`

Expected: PASS and generated homepage HTML should include the updated hero copy, the new nav, and a canonical URL in `dist/index.html`.

- [ ] **Step 6: Commit the homepage**

```bash
git add src/pages/index.astro src/i18n/common/zh.json src/i18n/common/en.json src/components/HomeHero.astro src/components/FocusAreaGrid.astro src/components/AboutSnapshot.astro
git commit -m "feat: redesign homepage for personal brand focus"
```

## Task 4: Rebuild The Writing Index And Shared Content Cards

**Files:**
- Modify: `src/pages/blogs/index.astro`
- Modify: `src/components/BlogCard.astro`
- Modify: `src/pages/blogs/_i18n/zh.json`
- Modify: `src/pages/blogs/_i18n/en.json`
- Create: `src/components/MetadataRow.astro`

- [ ] **Step 1: Update blog page copy and labels**

Refresh the copy in `src/pages/blogs/_i18n/zh.json` and `src/pages/blogs/_i18n/en.json` so the page intro matches the new “Writing” positioning and not the current casual wording.

- [ ] **Step 2: Create `MetadataRow.astro`**

Move reusable date, tag, and optional reading-context metadata into a small shared component.

```astro
---
const { date, tags = [] } = Astro.props
---
<div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[var(--text-muted)]">
  <time>{date}</time>
  {tags.length > 0 && <span aria-hidden="true">/</span>}
  {tags.map(tag => <span class="rounded-full border px-2 py-1">{tag}</span>)}
</div>
```

- [ ] **Step 3: Refactor `BlogCard.astro` into the new card contract**

Drop the random placeholder color logic and rebuild the card around typography, surface quality, and consistent metadata. Keep poster support, but make non-poster cards look intentional rather than decorative.

- [ ] **Step 4: Replace the writing index layout**

Refactor `src/pages/blogs/index.astro` to use `PageIntro`, a lightweight category switch, and a tighter card list. Remove the artificial loading state.

- [ ] **Step 5: Verify the page compiles and the loading state is gone**

Run: `pnpm build`

Expected: PASS and `dist/blogs/index.html` should no longer contain “加载中” or the loading spinner markup.

- [ ] **Step 6: Commit the writing index changes**

```bash
git add src/pages/blogs/index.astro src/components/BlogCard.astro src/components/MetadataRow.astro src/pages/blogs/_i18n/zh.json src/pages/blogs/_i18n/en.json
git commit -m "feat: redesign writing index and article cards"
```

## Task 5: Rebuild The Article Reading Template

**Files:**
- Modify: `src/layouts/Blog.astro`
- Modify: `src/pages/blogs/[slug].astro`
- Modify: `src/content.config.ts`
- Modify: `src/components/RecentPosts.astro`
- Modify: `src/components/TableOfContents.astro`

- [ ] **Step 1: Expand the blog frontmatter schema carefully**

Add an optional `description` field to `src/content.config.ts`, but keep all existing entries valid by falling back to `subtitle` where `description` is missing.

```ts
description: z.string().optional(),
```

- [ ] **Step 2: Add article metadata tests before wiring article pages**

Extend `tests/unit/seo.test.ts` with one more failing test for article metadata overrides.

```ts
it('keeps article metadata when merged with layout defaults', () => {
  expect(
    mergePageMeta(
      { title: 'Default', description: 'Default', ogType: 'website' },
      { title: 'Post title', description: 'Post desc', ogType: 'article', tags: ['frontend'] }
    )
  ).toMatchObject({
    title: 'Post title',
    description: 'Post desc',
    ogType: 'article',
    tags: ['frontend'],
  })
})
```

- [ ] **Step 3: Run the extended metadata test and confirm the new expectation fails if needed**

Run: `pnpm test tests/unit/seo.test.ts`

Expected: PASS if Task 1 merge logic already satisfies the new contract, otherwise FAIL and then update the merge logic before proceeding.

- [ ] **Step 4: Rebuild `src/layouts/Blog.astro` as a true reading template**

Implement a layout with:

- a page intro header
- summary/subtitle handling
- metadata row
- cover image block
- reading-width prose container
- integrated TOC behavior
- previous/next or recent-post navigation

Use the article frontmatter to create page-level metadata and pass `ogType: 'article'`.

- [ ] **Step 5: Update `src/pages/blogs/[slug].astro` to pass article metadata explicitly**

Keep the route simple, but make it responsible for gathering article data and passing the correct metadata fields into the layout contract.

- [ ] **Step 6: Verify article pages on build output**

Run: `pnpm build`

Expected: PASS and one generated article HTML file in `dist/blogs/` should contain `og:type` set to `article`.

- [ ] **Step 7: Commit the article template work**

```bash
git add src/layouts/Blog.astro src/pages/blogs/[slug].astro src/content.config.ts src/components/RecentPosts.astro src/components/TableOfContents.astro tests/unit/seo.test.ts
git commit -m "feat: redesign article reading template"
```

## Task 6: Redesign About, Tags, And Supporting Pages

**Files:**
- Modify: `src/pages/about.astro`
- Modify: `src/pages/tags/index.astro`
- Modify: `src/pages/tags/[tag].astro`
- Modify: `src/pages/techStack.astro`
- Modify: `src/i18n/common/zh.json`
- Modify: `src/i18n/common/en.json`

- [ ] **Step 1: Add localized content keys for the about-page structure**

Move the new about-page headings, intro, values, interests, and contact labels into the common locale JSON files so the page no longer hard-codes body copy.

- [ ] **Step 2: Rebuild `src/pages/about.astro` using shared primitives**

Implement the new single-page narrative:

1. Intro
2. Working style / values
3. Focus areas / interests
4. Contact links

- [ ] **Step 3: Simplify tags and tech stack as supporting surfaces**

Refactor `src/pages/tags/index.astro`, `src/pages/tags/[tag].astro`, and `src/pages/techStack.astro` to use the shared container and intro components while keeping them visually quieter than homepage and article pages.

- [ ] **Step 4: Verify supporting pages compile**

Run: `pnpm build`

Expected: PASS and the generated `/about`, `/tags`, and `/techStack` pages should share the new surface styles and navigation structure.

- [ ] **Step 5: Commit the supporting-page redesign**

```bash
git add src/pages/about.astro src/pages/tags/index.astro src/pages/tags/[tag].astro src/pages/techStack.astro src/i18n/common/zh.json src/i18n/common/en.json
git commit -m "feat: redesign about and supporting pages"
```

## Task 7: Wire Final SEO, OG, And Localization Details

**Files:**
- Modify: `src/components/Head.astro`
- Modify: `src/layouts/Main.astro`
- Modify: `src/layouts/Blog.astro`
- Modify: `src/data/site.ts`
- Create: `public/og/site-default.png`
- Create: `public/og/article-default.png`

- [ ] **Step 1: Add the default OG assets**

Create `public/og/site-default.png` and `public/og/article-default.png` with the final brand visuals used by the metadata contract.

- [ ] **Step 2: Point `src/data/site.ts` at absolute OG asset URLs**

Use the configured Astro `site` URL so metadata always renders absolute image URLs.

```ts
export const siteConfig = {
  url: 'https://www.ginlon.site',
  defaultOgImage: 'https://www.ginlon.site/og/site-default.png',
  articleOgImage: 'https://www.ginlon.site/og/article-default.png',
}
```

- [ ] **Step 3: Finish page-type metadata overrides**

Ensure:

- homepage uses `website`
- about can use `profile`
- article pages use `article`
- writing/tags/supporting pages use page-specific titles and descriptions

- [ ] **Step 4: Verify the deterministic metadata helpers still pass**

Run: `pnpm test tests/unit/seo.test.ts`

Expected: PASS.

- [ ] **Step 5: Verify the production build still passes**

Run: `pnpm build`

Expected: PASS and generated HTML should include canonical, alternate locale links, and OG image URLs.

- [ ] **Step 6: Commit the metadata wiring**

```bash
git add src/components/Head.astro src/layouts/Main.astro src/layouts/Blog.astro src/data/site.ts public/og/site-default.png public/og/article-default.png
git commit -m "feat: add page-level seo and og metadata"
```

## Task 8: Responsive QA And Final Verification

**Files:**
- Modify: `src/styles/styles.css`
- Modify: any page/component files adjusted during QA

- [ ] **Step 1: Run the full automated verification set**

Run:

```bash
pnpm test
pnpm build
```

Expected:

- `pnpm test`: PASS
- `pnpm build`: PASS

- [ ] **Step 2: Run responsive manual QA in the browser**

Check these breakpoints manually:

- 390px mobile
- 768px tablet
- 1280px desktop

Review these pages:

- `/`
- `/blogs`
- one article page under `/blogs/<slug>`
- `/about`
- `/tags`

Expected:

- no horizontal overflow
- hero copy remains readable
- cards stack cleanly
- article code blocks scroll safely
- navigation remains usable

- [ ] **Step 3: Fix any responsive regressions immediately**

Apply only the minimal CSS or component changes required to resolve issues discovered in Step 2.

- [ ] **Step 4: Re-run automated verification**

Run:

```bash
pnpm test
pnpm build
```

Expected: PASS after the responsive fixes.

- [ ] **Step 5: Commit the QA fixes**

```bash
git add src/styles/styles.css src/layouts/Main.astro src/layouts/Blog.astro src/pages/index.astro src/pages/blogs/index.astro src/pages/about.astro src/components/NavigationBar.astro src/components/BlogCard.astro
git commit -m "fix: polish responsive redesign details"
```
