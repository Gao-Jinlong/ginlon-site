# Ginlon Site Redesign Design

Date: 2026-03-26
Project: `ginlon-site`
Status: Approved for spec drafting

## 1. Goal

Refactor the site from a blog-first personal site into a personal-brand site with writing as proof of depth.

Primary intent:

- Personal brand first
- Modern product-oriented tone
- Simple, sharp, professional presentation
- Stronger mobile responsiveness
- Page-level SEO and OG strategy

Non-goals:

- Rewriting the content system
- Replacing Astro, MDX, or the current i18n structure
- Building a CMS or changing the content source format
- Adding aggressive sales or lead-generation behavior

## 2. Current State Summary

The current site already has:

- Astro-based static architecture
- Chinese and English routes
- Blog content in MDX
- Basic SEO and OG metadata in a shared `Head` component
- A lightweight visual language built around white cards, grid background, and a blog-style layout

Current problems:

- The site reads as a personal blog with scattered page styles rather than a unified personal brand system
- Homepage hierarchy is too light to establish identity quickly
- Navigation promotes too many equally weighted destinations
- About page is structurally weak and visually dated relative to the desired tone
- Blog list and article page experience are functional but not brand-defining
- SEO/OG metadata are too global and not sufficiently page-specific
- Responsive behavior is mostly layout compression, not priority-aware restructuring

## 3. Design Direction

Chosen direction: `Soft Product Minimal`

Reference interpretation:

- Keep the calm and approachable feel of the “Soft Tech Minimal” direction
- Preserve professional clarity and structural discipline
- Avoid heavy glassmorphism, flashy gradients, or startup-like sales energy
- Borrow some editorial restraint in spacing and typography so the site does not feel like a generic SaaS landing page

Desired impression:

- Modern
- Quietly confident
- Clear-headed
- Technical but not cold
- Designed, not decorated

## 4. Brand and Visual System

### 4.1 Visual Principles

- Soft, low-noise interface
- Strong typography and spacing over ornament
- Lightweight depth, subtle borders, restrained shadows
- Brand consistency across homepage, writing, about, and article pages
- Motion used for entrance and state feedback only

### 4.2 Color and Material

Base direction:

- Light-first interface
- Soft cool gray / mist green / desaturated slate palette
- Minimal gradient usage for page atmosphere only
- Surface cards should feel stable and readable, not translucent or decorative

Rules:

- Background may use a gentle atmospheric gradient
- Main reading surfaces remain high contrast and mostly solid
- Borders should be finer and more deliberate than the current card-heavy look
- Shadows should be weaker and cleaner than the current implementation

### 4.3 Typography

Typography should carry more of the brand feeling than it does now.

Rules:

- Headings should feel product-grade and modern
- Body text should optimize for reading comfort and scanability
- Large headings should be concise and declarative
- Metadata, tags, and small labels should use clear hierarchy rather than visual noise

### 4.4 Motion

Allowed motion:

- Hero fade/slide on initial page load
- Small hover lift for cards
- Smooth navigation state transitions
- Gentle section reveal where it helps orientation

Not allowed:

- Excessive staggered animation across every screen
- Decorative motion without informational value
- Motion that weakens perceived performance

## 5. Information Architecture

The site should move from “collection of pages” to “clear brand system.”

### 5.1 Top-Level Navigation

Recommended primary navigation:

- Home
- Writing
- About

De-emphasized or secondary destinations:

- Tags
- Tech Stack

Rationale:

- Primary navigation should answer what a new visitor expects first
- Tags and technical taxonomy are useful but should not compete with core brand entry points
- The top nav should feel curated rather than exhaustive

### 5.2 Content Model Positioning

Page roles:

- Homepage: brand establishment and guided entry
- Writing page: content index and credibility proof
- Article page: deepest trust-building surface
- About page: personal narrative and values
- Tags page: support navigation, not identity
- Tech stack page: optional supporting page, not top-level anchor

## 6. Page Design

### 6.1 Homepage

Purpose:

- Let a first-time visitor understand who Ginlon is
- Show focus areas without overexplaining
- Guide users into writing and about content

Structure:

1. Hero
2. Focus Areas
3. Selected Writing
4. About Snapshot
5. Contact / external links

Hero rules:

- One concise identity statement
- One supporting line
- Two restrained CTAs: `Read Writing` and `About`
- No overloaded badges, no noisy stats wall, no heavy self-description

Focus Areas:

- 3 short cards
- Each card represents a durable theme such as frontend engineering, architecture thinking, technical writing
- Copy should be compact and directional

Selected Writing:

- Curated content, not just latest posts
- Emphasize representative writing quality
- Card density lower than writing index page

About Snapshot:

- Short summary that gives personality without turning the homepage into the full about page

Contact area:

- Lightweight links only
- No hard “hire me” conversion framing

### 6.2 Writing Index Page

Purpose:

- Provide a stable content index
- Help visitors scan and choose content quickly

Structure:

- Compact page intro
- Lightweight category or filter control
- Dense but clean article list/grid

Rules:

- Reduce app-like loading state feeling
- Avoid over-styled tabs that feel like an admin UI
- Maintain consistent card treatment with homepage but optimized for higher density
- Metadata should be easier to scan than it is now

### 6.3 Article Page

Purpose:

- Be the strongest page type on the site
- Maximize long-form reading quality
- Carry article-level SEO and OG value

Structure:

- Article header
- Optional summary / subtitle
- Publish date and tags
- Main content
- Table of contents where useful
- Previous/next or related navigation

Rules:

- Article pages should not render as raw MDX-only output
- Reading width, heading rhythm, code blocks, images, and spacing should be standardized
- Mobile code blocks must scroll cleanly
- Header metadata should be integrated into the layout rather than implied by content only

### 6.4 About Page

Purpose:

- Turn scattered profile content into a clear narrative

Structure:

- Intro
- Working style / values
- Focus areas / interests
- Contact

Rules:

- Fewer sections, higher clarity
- Remove the feeling of a text dump
- Use strong section hierarchy and cleaner pacing

### 6.5 Tags and Supporting Pages

Purpose:

- Support discovery without competing with primary pages

Rules:

- Follow the same shared design system
- Stay simpler than homepage and article pages
- Avoid custom one-off visual language

## 7. Responsive Strategy

This redesign must be mobile-aware at the information level, not just at the CSS breakpoint level.

### 7.1 Mobile Principles

- Shorter hero copy
- Faster access to selected writing
- Reduced vertical waste
- Simplified nav presentation
- Cleaner card stacking rules

### 7.2 Desktop Principles

- More breathing room
- Better modular rhythm
- Potential two-column balance where useful
- Stronger visual pacing between sections

### 7.3 Article Responsiveness

Special care required for:

- Code blocks
- Images
- Heading spacing
- Table of contents behavior
- Paragraph width

## 8. SEO Strategy

The metadata system should move from “one shared default” to “layout default + page override.”

### 8.1 Required Metadata Model

Each page type should support:

- `title`
- `description`
- `canonical`
- `og:title`
- `og:description`
- `og:type`
- `og:image`

Article pages should additionally support:

- Publish date
- Tags
- Article-specific OG values
- Language-aware alternates

### 8.2 Page-Level SEO Rules

Homepage:

- Brand-oriented title and description
- Canonical root URL per locale

Writing page:

- Writing/archive-specific title and description

About page:

- Profile-oriented title and description

Tags page:

- Tag-specific title and description if practical

Article page:

- Article title as page title basis
- Article description or excerpt
- Canonical permalink
- Locale-specific alternate links

### 8.3 International SEO

Because the site has Chinese and English routes, the redesign should include:

- Locale-aware canonical handling
- `hreflang` alternates between corresponding localized routes when they exist
- Avoiding accidental duplication between localized pages with generic metadata

## 9. OG Strategy

Current OG support is too generic. The redesign should introduce page-type-aware social sharing behavior.

### 9.1 OG Types

- Homepage/static page OG image
- Article-specific OG image

### 9.2 OG Content Rules

Homepage/static page OG:

- Brand name
- Short positioning statement
- Stable visual template

Article OG:

- Article title
- Optional category/date
- Brand mark
- Consistent visual layout

Initial phase can use static assets if necessary, but the metadata system must be designed so dynamic generation can be added later without redesigning the interface contract.

## 10. Implementation Boundaries

Keep:

- Astro
- MDX content source
- Existing i18n routing structure
- Existing blog retrieval and content loading model where possible

Refactor:

- Main layout
- Navigation
- Shared page shell
- Shared content section patterns
- Blog cards and metadata presentation
- Article reading template
- Head/SEO API
- Global visual tokens and page-level layout styles

Do not expand scope into:

- CMS work
- Backend work
- Content migration
- Major taxonomy redesign

## 11. Component Strategy

The redesign should consolidate UI into reusable primitives instead of per-page styling.

Suggested shared pieces:

- Site shell / page container
- Section header
- Hero block
- Article card
- Metadata row
- Page intro/header block
- Reading layout
- SEO head interface

Principle:

- Shared visual language should come from tokens and reusable structures, not repeated custom CSS in each page

## 12. Risks

- The design may drift back toward a generic SaaS look if the product-style structure is not balanced with editorial restraint
- The homepage may become too soft and lose clarity if the typography hierarchy is not strong enough
- SEO work may stay superficial if metadata contracts are not redesigned alongside templates
- Article pages may remain visually disconnected if they are treated as content-only outputs

## 13. Acceptance Criteria

The redesign is successful when:

1. The site reads as a unified personal brand across homepage, writing, article, and about pages.
2. New visitors can understand identity, focus, and next step within a few seconds on the homepage.
3. Mobile layouts feel intentionally prioritized rather than merely compressed.
4. Article pages become the highest-quality reading surface on the site.
5. Each page type exposes appropriate page-level SEO and OG metadata.
6. The visual system feels modern, calm, and professional without becoming corporate or sales-heavy.

## 14. Delivery Plan for Implementation

Recommended implementation order:

1. Global visual tokens and shared layout shell
2. Navigation and homepage redesign
3. Writing index and article template redesign
4. About page redesign
5. Page-level SEO/OG API refactor
6. Responsive polish and verification

This sequencing keeps the visual foundation and metadata contract stable before page-by-page polish.
