# Ginlon Site Unified Redesign Spec

Date: 2026-03-26
Project: `ginlon-site`
Status: Approved for planning

## 1. Objective

Rebuild the presentation layer of the site from the root so the public-facing experience reads as one coherent system instead of a partially redesigned collection of pages.

This redesign is specifically intended to fix three active problems:

1. Residual legacy blue styling still appears in some pages and components even though the site theme has already moved to green.
2. Navigation still exposes too many destinations and makes the site feel busier than necessary.
3. The article detail layout does not treat reading as the primary activity because the table of contents still competes with the article body for the center of the page.

The redesign must solve those issues at the system level rather than through isolated page patches.

## 2. Product Intent

The site should present Ginlon as a calm, modern engineer-writer whose writing is the strongest proof of depth.

The intended impression is:

- clear
- focused
- quietly technical
- consistent across pages
- designed with restraint rather than decoration

The site should feel simpler after the redesign, not more feature-rich.

## 3. Current-State Findings

The current codebase already contains a partially updated green token system in `src/styles/styles.css`, but the redesign is incomplete.

Observed issues from the current implementation:

- Several pages and components still hard-code legacy `blue-*` styles and blue-purple gradients, especially in tag-related surfaces, older page sections, and the current tabs UI.
- The navigation is split into primary and secondary groups, which visually promotes too many destinations.
- `techStack` still exists as a top-level concept even though it is no longer important to the desired site identity.
- The article layout still treats the table of contents as part of the main centered content flow instead of as an auxiliary navigation layer.
- Mobile article navigation is currently embedded in the reading flow instead of being a separate on-demand navigation affordance.
- Light mode has already moved toward the new palette, but dark mode still needs to be treated as a first-class redesign target rather than a follow-up color inversion pass.

## 4. Scope

This redesign covers the public-facing presentation layer:

- global visual tokens
- navigation
- homepage shell
- writing index page
- article detail layout
- about page
- tags pages
- shared content-display components
- light mode and dark mode parity

This redesign does not cover:

- Astro architecture changes
- MDX content model changes
- i18n routing model changes
- CMS or backend work
- content migration
- taxonomy redesign beyond navigation and presentation

## 5. Information Architecture

### 5.1 Top-Level Navigation

Top-level navigation must be reduced to:

- Home
- Writing
- About

Navigation principles:

- The main nav is a brand-entry mechanism, not a complete sitemap.
- Only the most important entry points should appear at the top level.
- Secondary discovery should happen inside content flows, not through a crowded header.

### 5.2 Tags

The tags system remains in the product, but its role changes.

Rules:

- Keep the tags routes and pages.
- Remove tags from the primary site navigation.
- Allow users to reach tags through article metadata, tag links, and lower-priority discovery surfaces.
- Treat tags as a support mechanism for exploration, not as part of the main identity of the site.

### 5.3 Tech Stack

The tech stack page is removed.

Required fallout cleanup:

- remove the Chinese route
- remove the English route
- remove all navigation references
- remove footer or internal links that point to it
- remove any page metadata references if present

## 6. Design-System Direction

This redesign should be implemented as a design-system refactor with three layers.

### 6.1 Layer 1: Design Tokens

The site must use semantic visual variables instead of page-level hard-coded colors.

Core token categories:

- page background
- content surface
- strong surface
- border
- primary text
- muted text
- accent
- accent-soft
- shadow

Rules:

- Green is the only accent family for emphasis and interaction.
- Legacy blue and blue-purple gradients must be removed from interactive states and decorative surfaces.
- Light and dark themes must use the same semantic token model.
- Dark mode must be intentionally tuned rather than mechanically mirrored from light mode.

### 6.2 Layer 2: Shell Components

Shared shell components should define the visual grammar of the site.

Examples:

- navigation bar
- page container
- page intro/header
- card surface
- section framing

Principle:

- Pages should inherit a common shell language instead of rebuilding their own visual identity locally.

### 6.3 Layer 3: Content Components

Content-specific interactions should be shared across page types.

Examples:

- article filter controls
- metadata rows
- tags and pills
- table of contents
- article body surface
- related-content blocks

Principle:

- Content interactions should feel related to each other, but clearly distinct from top-level site navigation.

## 7. Theme Rules

### 7.1 Accent System

Accent usage must be narrowed and made consistent.

Use accent tokens for:

- active navigation state
- link emphasis
- current table-of-contents item
- selected article filter
- inline article emphasis surfaces
- tag hover or active states where appropriate

Do not use accent tokens for:

- large decorative fills
- broad page backgrounds
- unrelated gradients

### 7.2 Light Mode

Light mode should feel airy, calm, and structured:

- soft atmospheric page background
- high-contrast reading surfaces
- subtle border definition
- restrained shadows
- low-noise interaction states

### 7.3 Dark Mode

Dark mode must remain fully supported and redesigned at the same time as light mode.

Rules:

- keep the same green accent family with reduced glare
- preserve reading comfort and hierarchy
- tune hover and selected states separately for dark surfaces
- avoid bright cyan-like states that feel detached from the rest of the interface

## 8. Navigation Design

### 8.1 Header Behavior

The header should become a single-layer navigation shell.

Required changes:

- remove the current secondary link group
- keep only the simplified primary destinations
- preserve current-page highlighting
- keep the theme toggle
- maintain a calm, compact, sticky header pattern

### 8.2 Mobile Navigation

Mobile navigation should stay simple.

Rules:

- do not introduce a heavy app-style menu system unless implementation makes it necessary
- preserve direct access to the three top-level destinations
- keep visual weight low so the header does not dominate the page

## 9. Writing Index Design

### 9.1 Page Role

The writing index is the structured archive and discovery page for the site.

It should feel like a stable content index, not an application dashboard.

### 9.2 Filtering Model

Article category switching should remain available, but the current tabs treatment should be replaced.

Required changes:

- remove the strong tab-strip mental model
- replace it with lightweight filter controls
- preserve URL-param-based filtering behavior if possible for shareability and refresh persistence
- place filters below the page intro and above the article list

Visual rules:

- filter controls should be lighter than top-level navigation
- selected state uses the green accent system
- controls should feel like content filters, not page routing

## 10. Article Detail Design

### 10.1 Primary Goal

The article detail page should become the strongest reading surface on the site.

The article body must be the true visual center of the page.

### 10.2 Desktop Layout

Desktop article behavior:

- center the reading column independently
- place the table of contents in a dedicated right-side support column
- ensure the table of contents does not shift the perceived center of the article body
- keep the table of contents narrower and visually lighter than the article surface
- allow the table of contents to behave like auxiliary navigation rather than a second article card

### 10.3 Mobile Layout

Mobile article behavior:

- remove the always-visible in-flow mobile table of contents block
- provide a drawer-based table of contents that can expand and collapse on demand
- keep the drawer available without interrupting continuous reading
- close the drawer after selecting a heading target

### 10.4 Article Surface Rules

Reading-surface rules:

- article header, body, metadata, and TOC should share the same token system
- code blocks must remain scrollable on mobile
- inline code, quotes, links, and heading anchors must all use the new accent and surface rules
- the article layout must work in both light and dark themes without visual drift

## 11. About and Tags Pages

### 11.1 About Page

The about page should be pulled fully into the shared site system.

Required outcome:

- remove residual legacy blue styling
- preserve content intent while aligning section hierarchy, spacing, and surfaces with the rest of the site

### 11.2 Tags Pages

Both the tags index and tag detail pages must stay available, but visually they should become clearly secondary to the main pages.

Rules:

- remove legacy blue and purple treatments
- align cards, typography, spacing, and hover states with the shared token system
- keep tag discovery useful without making these pages feel like separate products

## 12. Component Refactor Targets

The redesign should primarily be executed through shared components rather than page-by-page one-off styling.

Primary targets:

- `src/styles/styles.css`
- `src/components/NavigationBar.astro`
- existing tabs/filter UI
- `src/components/TableOfContents.astro`
- `src/layouts/Blog.astro`
- tag display and tag page components
- about page styling
- any shared metadata or content surface components needed to unify behavior

Recommended direction:

- convert the current tabs component into a lighter filter control or replace it with a dedicated filter component
- split table-of-contents presentation into shared content plus separate desktop and mobile containers if needed
- keep article layout logic in the blog layout rather than scattering it across pages

## 13. Implementation Constraints

Keep:

- Astro
- MDX content source
- locale-aware routes
- current blog retrieval approach

Do not introduce:

- new content storage systems
- backend dependencies
- unnecessary routing changes
- scope expansion into unrelated refactors

Compatibility expectations:

- if legacy article filter URL parameters exist, the new filter UI should continue to honor them where practical
- route removals for `techStack` must be accompanied by internal-link cleanup

## 14. Risks

- The redesign could drift into superficial recoloring if hard-coded component styles are not actually removed.
- Navigation simplification could feel incomplete if secondary links survive in the footer or other shell surfaces without reconsideration.
- The article page could still feel off-center if the layout is only adjusted at breakpoint level instead of structurally separating reading and navigation columns.
- Dark mode could lag behind light mode if token work is not treated as foundational.

## 15. Acceptance Criteria

The redesign is successful when all of the following are true:

1. No public-facing page relevant to this redesign still relies on legacy blue accent styling as its primary interaction language.
2. The top-level navigation contains only Home, Writing, and About.
3. The `techStack` page and its user-facing references are removed.
4. The tags pages remain available but are no longer linked from the main navigation.
5. The writing index uses lightweight filter controls instead of visually heavy tabs.
6. On desktop, the article body reads as centered while the table of contents sits clearly to the right as an auxiliary navigation layer.
7. On mobile, the article table of contents is available through a drawer-based expand/collapse interaction.
8. Light mode and dark mode both present a coherent green-centered theme with consistent surfaces, states, and hierarchy.
9. About, writing, article, and tags pages feel like parts of one system rather than partially matched templates.

## 16. Suggested Implementation Order

1. Finalize and normalize global tokens for both light and dark themes.
2. Simplify the navigation shell and remove `techStack`.
3. Replace the writing-page tabs treatment with lightweight filter controls.
4. Refactor the article layout and table-of-contents behavior for desktop and mobile.
5. Align about and tags pages with the shared system and remove residual legacy colors.
6. Run responsive and theme verification across the homepage, writing index, article detail, about, and tags pages.
