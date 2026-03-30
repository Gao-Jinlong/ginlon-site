# Ginlon Site Rebuild Spec

Date: 2026-03-27
Project: `ginlon-site`
Status: ✅ Phase A 已完成 (2026-03-30)

## 1. Objective

Rebuild the public-facing site as a new Chinese writing-first website rather than continuing to patch the existing presentation layer.

The current site has already proven that incremental redesign on top of the old page system creates too much drift between:

- visual language
- navigation structure
- article-reading layout
- page-level component behavior

This project therefore changes the approach from "unify the old site" to "build a new site and migrate the content into it."

The old site should be treated as a content source and utility source, not as the visual or structural foundation of the new experience.

## 2. Product Intent

The rebuilt site should present Ginlon as an engineer-writer with a calm editorial voice.

The intended impression is:

- restrained
- readable
- deliberate
- technically grounded
- content-first

This should feel like an author's website with engineering depth, not a personal dashboard, not a component playground, and not a portfolio homepage disguised as a blog.

## 3. Rebuild Decision

The team should stop optimizing around preserving the existing page implementations.

Decision:

- rebuild all public-facing pages
- migrate Chinese article content into the new presentation system
- allow the new site structure to redefine how content is grouped and surfaced
- retain only the lower-level capabilities that are still useful, such as content loading, route generation, date utilities, and selected SEO helpers

This is intentionally a "new display layer over existing content assets" project.

## 4. Scope

This rebuild includes:

- new site-level layouts
- new page-level layouts
- new visual system
- new navigation
- new article-listing experience
- new article-reading experience
- new About page
- Chinese article migration into the new experience
- content metadata normalization where needed for the new structure
- tags as a secondary discovery mechanism

This rebuild does not include:

- English-site delivery in this phase
- CMS or backend work
- content-authoring workflow changes
- rewriting article body content at scale
- productizing tags as a primary site section
- preserving the existing page/component hierarchy

## 5. Audience and Use Cases

Primary audience:

- readers discovering Ginlon through an article
- peers evaluating writing quality and technical taste
- people who want a quick sense of who Ginlon is and what he writes about

Primary use cases:

1. Understand the author quickly from the homepage
2. Browse writing in a simple chronological stream
3. Read a single long-form article comfortably
4. Learn more about the author through a focused About page
5. Use tags only when narrowing or exploring related content

## 6. Information Architecture

### 6.1 Top-Level Navigation

The rebuilt site keeps only three top-level destinations:

- Home
- Writing
- About

Rules:

- no tags in primary navigation
- no tech stack page
- no tabs or secondary top-level nav groups in the header
- no route whose only purpose is to preserve the old site's sitemap shape

### 6.2 Homepage Role

The homepage is a lightweight author-facing landing page.

It should answer:

- who is this person
- what kind of writing is here
- what should I read next

It should not try to be the full archive.

Recommended homepage sections:

- short author positioning statement
- selected writing
- current focus / themes
- short About preview

### 6.3 Writing Page Role

The Writing page is the main archive.

It should be:

- a chronological article stream first
- lightly filterable
- tag-aware but not tag-led

Rules:

- the default experience is a time-based list
- filters, if present, must be clearly secondary to the stream
- tags are support metadata, not primary structure

### 6.4 About Page Role

The About page is an author page, not a resume dump.

It should prioritize:

- point of view
- working style
- interests
- writing motivation

Experience and links can appear, but they should support the narrative instead of dominating it.

### 6.5 Article Page Role

The article page is the strongest reading surface in the product.

The article body must be the clear center of attention on every screen size.

Rules:

- desktop TOC is an auxiliary right rail
- mobile TOC is on-demand
- metadata is compact and not repeated excessively
- related content appears after reading, not before or beside the article body

## 7. Content Model

All migrated Chinese articles should conform to one shared content shape.

Required fields:

- title
- published date
- summary / description
- tags
- body

Optional fields:

- cover image
- updated date
- featured flag
- series marker

Migration rules:

- all currently published Chinese articles are migrated
- drafts and archived experiments are excluded from the required migration set unless explicitly promoted back into publication scope
- summaries may be rewritten for consistency
- tags may be normalized and regrouped
- ordering remains primarily date-based
- article body content should remain intact unless a specific cleanup is needed

## 8. Language Strategy

This phase delivers Chinese only.

Rules:

- English content and English pages are out of scope
- the new site should not spend implementation complexity on maintaining bilingual parity in this phase
- English can be reintroduced later as a separate follow-up project

Implication:

- new page UX, copywriting, and architecture should optimize for a single Chinese experience

## 9. Visual Direction

The rebuilt site should use an editorial visual language.

Core characteristics:

- large intentional whitespace
- strong typography hierarchy
- restrained green accent usage
- low-noise surfaces
- minimal decorative complexity

It should not feel like:

- a SaaS dashboard
- an app shell
- a portfolio full of panels
- a heavily cardified content grid

## 10. Theme System

### 10.1 Accent Use

Green remains the accent color family, but it should be used sparingly.

Use accent for:

- active navigation state
- primary links
- selected filter state
- TOC emphasis
- small emphasis surfaces

Avoid:

- broad tinted page sections
- large colored cards
- decorative gradients that overpower typography

### 10.2 Surface Language

The new site should rely more on spacing and layout rhythm than on stacked boxed panels.

Rules:

- article lists should feel editorial rather than dashboard-like
- page sections should be separated through hierarchy first, borders second
- cards may still exist, but only where they improve clarity

### 10.3 Dark Mode

Dark mode should remain supported, but should be designed as a quiet reading mode rather than a neon inversion.

Goals:

- preserve readability
- keep accent glare under control
- maintain the same hierarchy model as light mode

## 11. Page-Level Design

### 11.1 Home

The homepage should be short and confident.

Structure:

- navigation
- hero statement
- selected writing section
- current themes / current focus section
- About preview

Rules:

- do not turn the homepage into a second archive
- do not add tabs or multiple category systems
- one strong primary CTA should point to Writing

### 11.2 Writing

The Writing page should provide the complete archive view.

Structure:

- intro
- optional lightweight filters
- chronological list

Rules:

- no heavy tabs
- no dense multi-column archive grid
- list items should prioritize title, date, summary, and tags
- the page should feel stable and low-friction to scan

### 11.3 Article

Structure:

- compact article header
- main reading column
- right-side TOC on desktop
- mobile TOC drawer
- footer metadata / related reading after the article

Rules:

- reading column width must be controlled for long-form comfort
- TOC must never visually pull the article off-center
- mobile TOC must not sit inline above the article as a permanent block

### 11.4 About

Structure:

- concise personal introduction
- perspective / working style
- writing motivation
- selected links or contact points

Rules:

- keep the tone personal and editorial
- avoid oversized skill matrices or old-style portfolio modules

## 12. Interaction Rules

Global rules:

- top navigation remains constant across the site
- filters are always secondary controls
- tags are never promoted to primary navigation
- theme toggle can remain, but must stay visually lightweight

Writing-page rules:

- direct-link filters may exist, but should remain light-touch
- clearing the filter should return the reader to the full stream

Article-page rules:

- TOC on desktop behaves as support navigation
- TOC on mobile is hidden until invoked
- content-related navigation should not interrupt reading flow

## 13. Technical Design

### 13.1 Reuse Boundaries

Keep and reuse where still helpful:

- content files
- article-loading utilities
- date utilities
- selected SEO helpers
- route-generation utilities where they fit the new structure

Rewrite:

- public-facing pages
- public-facing layouts
- navigation and footer
- archive/list presentation components
- article layout and TOC UI
- About page presentation
- tags presentation surfaces

### 13.2 Architecture Direction

The new implementation should separate:

- content/data access
- page composition
- presentational components
- shared visual primitives

Pages should orchestrate data.

Components should render.

Utilities should transform data.

The rebuilt site should avoid carrying forward old components whose responsibilities are mixed across:

- layout
- interactivity
- content filtering
- styling

### 13.3 Migration Strategy

Recommended execution order:

1. Build the new site shell and layouts
2. Build the new Home / Writing / About / Article pages
3. Connect all Chinese article content
4. Normalize metadata and tags
5. Remove obsolete old-page implementations once the new pages are stable

### 13.4 URL Compatibility

The rebuild should preserve existing public article URLs wherever practical.

Rules:

- migrated published articles should keep their current public slugs if the new route structure allows it
- if a migrated article must move to a new canonical URL, the old public URL must redirect to the new one
- the planning phase must explicitly account for route validation and redirect coverage as part of cutover readiness
- acceptance should be based on published Chinese article accessibility, not on preserving obsolete page-section URLs from the old site

## 14. Testing Strategy

Testing should focus on user-visible behavior rather than implementation text checks.

### 14.1 Utility Tests

Validate:

- article sorting
- content querying
- tag grouping
- date formatting
- SEO helper behavior

### 14.2 Page Behavior Tests

Validate:

- Writing filters, if retained
- desktop article TOC behavior
- mobile article TOC behavior
- page-level metadata generation

### 14.3 Build and Acceptance Checks

Required verification:

- `pnpm test`
- `pnpm build`
- browser review of Home, Writing, About, and at least one long-form article

## 15. Acceptance Criteria

This rebuild is successful when all of the following are true:

1. The site is structurally a new Chinese writing-first site rather than a visual patch over the old page system.
2. The only top-level navigation items are Home, Writing, and About.
3. The homepage is a lightweight author landing page, not an archive clone.
4. The Writing page is the canonical archive and is organized as a chronological stream first.
5. Tags remain available only as secondary discovery.
6. The About page reads like an author page, not a resume-heavy portfolio page.
7. The article page provides a centered reading experience with desktop TOC support and mobile on-demand TOC.
8. All current Chinese articles are available in the new site.
9. The visual system reads as one editorial whole instead of a mix of old and new page styles.
10. English pages are not required for this delivery.
11. Migrated published articles preserve their current public URLs where possible, or provide redirects when canonical URLs change.

## 16. Risks

- The rebuild could accidentally keep too much old structure under the surface, reducing the benefit of the reset.
- Full article migration could become noisy if tag normalization and metadata cleanup are not handled deliberately.
- Homepage scope could expand into a marketing-style page if section count is not controlled.
- Reintroducing too many filters or content modes could weaken the simplicity of the Writing page.

## 17. Recommended Planning Boundaries

The implementation plan should treat this as one rebuild project with two delivery phases:

Phase A:

- new site shell
- new Home
- new Writing
- new About
- new Article
- all Chinese articles accessible
- current public article URL compatibility preserved or redirected

Phase B:

- metadata cleanup
- tag normalization
- featured-writing curation
- dark-mode polish
- reading-surface refinement

For Phase A content selection:

- homepage selected writing may be manually curated
- current focus / themes may start as manually curated editorial copy
- if no explicit curation is available at first launch, the implementation may temporarily fall back to latest published content, but the page structure should still assume future manual curation
