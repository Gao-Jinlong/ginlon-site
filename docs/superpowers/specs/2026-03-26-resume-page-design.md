# Ginlon Site Resume Page Design

Date: 2026-03-26
Project: `ginlon-site`
Status: Drafted and user-approved in conversation

## 1. Goal

Create a hidden single-page resume page inside the existing site that:

- extracts and restructures the resume screenshot content into web-ready copy
- removes redundant and overly detailed information
- applies privacy-safe handling to sensitive data
- fits the content into a layout that can stay close to one A4 page when printed
- preserves enough hiring value to be used as a shareable resume page

Primary intent:

- Resume-first information efficiency
- Personal-site visual consistency
- Cleaner hierarchy than the original screenshot
- Reduced privacy exposure compared with a traditional resume export

Non-goals:

- Building a full downloadable resume system
- Adding PDF export or online editing
- Creating an English version in this phase
- Adding a public nav entry or strong SEO exposure

## 2. Constraints Confirmed With User

### 2.1 Audience and Positioning

Chosen direction: hybrid resume page

- usable for job sharing and resume review
- visually appropriate inside a personal-brand website
- less like a traditional dense table resume, but still optimized for hiring scans

### 2.2 Privacy Rules

User-confirmed privacy handling:

- keep real name
- keep email
- keep personal website link
- remove phone number entirely
- remove profile photo
- keep company names
- generalize project client names

Examples of accepted generalization:

- `网易地图效率工具` may stay tied to the employer context
- project clients or internal business lines should be generalized to phrases like `头部游戏业务` or `污染扩散可视化项目`

### 2.3 Language and Exposure

- Chinese only
- hidden page
- do not place in primary navigation
- weak SEO exposure by default

### 2.4 Content Density

- keep only a few core projects
- prioritize recent and highest-signal experience
- target approximately one A4 page of content

## 3. Source Resume Summary

The screenshot resume contains these major information groups:

- personal info: name, phone, email, blog, GitHub, keywords
- work history across three companies from 2022-08 to present
- multiple GIS / visualization / business-system projects
- repeated mentions of frontend stack, rendering performance, engineering tooling, and mini-program work

Current problems in the source material:

- too many repeated technology mentions across projects
- responsibilities and actions are mixed together without clear prioritization
- some project descriptions are too detailed for a one-page hiring scan
- sensitive contact information is too exposed
- the visual structure is table-heavy and not aligned with the current website style

## 4. Content Strategy

### 4.1 Keep / Remove Rules

Keep:

- name
- role title
- short professional positioning line
- email
- website link
- short professional summary
- core capability groups
- condensed work history
- three core projects

Remove:

- phone number
- profile photo
- education section
- repeated stack keywords across multiple sections
- fragmented supporting tasks that do not materially strengthen hiring value

Condense:

- product research / documentation / interview support should be merged into broader ownership statements unless they directly support outcomes
- duplicated performance optimization wording should be expressed once in the strongest matching project

### 4.2 Final Page Structure

The page should use a single-column vertical structure in this order:

1. Header block
2. Professional summary
3. Core capability groups
4. Work experience
5. Core projects

Education is intentionally excluded to preserve layout focus and page density.

## 5. Information Architecture

### 5.1 Header Block

Contents:

- `高金龙`
- primary title: `前端工程师`
- secondary positioning line: `聚焦 Web 可视化、地图应用与工程化交付`
- email link
- website link

Rules:

- compact and high-clarity
- no profile image
- no excess labels like age, residence, or phone
- contact info should be easy to scan but visually lightweight

### 5.2 Professional Summary

Purpose:

- replace the keyword-heavy top section in the source resume
- give hiring readers a quick understanding of experience range and strengths

Target content shape:

- 2 to 3 sentences
- mention frontend experience length only if phrased conservatively
- emphasize Web visualization, GIS-adjacent work, performance optimization, and engineering delivery
- avoid generic self-evaluation language

### 5.3 Core Capability Groups

Use 4 concise groups:

- frontend development: React, TypeScript, Vue 3, Vite
- visualization: map applications, GIS data presentation, Canvas / WebGL optimization
- performance and engineering: Web Worker, OffscreenCanvas, IndexedDB, rendering and bundle optimization
- collaboration and delivery: requirements understanding, solution implementation, complex business system delivery and refactoring

Rules:

- show as short grouped chips or compact cards
- do not render as a giant wall of badges
- prioritize clarity over exhaustiveness

### 5.4 Work Experience

Keep 3 roles:

1. `2024.09 - 至今` 网易（人力外包）｜高级数据研发工程师（Web 前端）
2. `2023.08 - 2024.09` 上海地听信息科技有限公司｜Web 开发工程师
3. `2022.08 - 2023.07` 青岛拓宇数字｜前端开发

Rules:

- one compact paragraph per role
- include company, role, time, and a short responsibility summary
- no long bullet expansion inside the experience section
- the experience section should support the projects section, not compete with it

### 5.5 Core Projects

Keep 3 projects only:

1. 地图效率工具
2. 污染物扩散 / 溯源模拟可视化项目
3. 风廓线温监测平台

Projects intentionally removed from the spotlight:

- 撒点作战
- 接龙管家
- 面训类小程序

Reason:

- lower signal for the current page goal
- weaker fit for recent capability positioning
- would create unnecessary density pressure

## 6. Proposed Copy Direction

### 6.1 Summary Draft Direction

Recommended tone:

`具备 3 年以上前端开发经验，持续参与 Web 可视化、GIS 应用与业务系统建设。近期工作聚焦地图工具产品、复杂图层渲染与性能优化，也有 Vue 重构、实时数据监测和小程序业务交付经验。擅长在复杂需求中平衡产品理解、工程实现与交付质量。`

This wording can be polished during implementation, but the information priorities should remain the same.

### 6.2 Work Experience Draft Direction

`2024.09 - 至今` 网易（人力外包）｜高级数据研发工程师（Web 前端）
负责地图效率工具相关产品的设计与研发，参与 BI 数据工具链能力建设，聚焦地图可视化与团队协作场景。

`2023.08 - 2024.09` 上海地听信息科技有限公司｜Web 开发工程师
参与多个 GIS 可视化项目与监测平台建设，负责地图应用开发、性能优化与前端架构迭代。

`2022.08 - 2023.07` 青岛拓宇数字｜前端开发
参与 H5、小程序与业务管理系统开发，覆盖表单流程、权限模型和业务功能交付。

### 6.3 Core Project Draft Direction

#### Project 1: 地图效率工具

Focus:

- map viewing, editing, and collaboration efficiency
- product design plus frontend development ownership
- AI-assisted information collection and requirement analysis
- large-scale point rendering optimization
- tree retrieval optimization
- exploratory Pixi.js / WebGL direction where relevant

Strong evidence to preserve:

- rendering optimization from about `3000ms` to `700ms`

#### Project 2: 污染物扩散 / 溯源模拟可视化项目

Focus:

- two-dimensional map visualization for pollution diffusion simulation
- IDW interpolation visualization
- Web Worker and OffscreenCanvas optimization
- IndexedDB large-file caching
- multi-layer query and rendering management
- dynamic time-based playback

#### Project 3: 风廓线温监测平台

Focus:

- Vue 2 to Vue 3 migration
- reduced historical coupling and maintenance burden
- WebSocket-based realtime state updates
- OpenLayers-based map performance work
- image preload, scheduling, and bundle optimization

## 7. Visual and Layout Design

### 7.1 Selected Layout

User-selected layout: `A` vertical single-column

Why this layout was chosen:

- closest to hiring-reader scan habits
- lowest risk for fitting within one A4 page
- strongest content control for a hidden resume page
- easiest to keep visually consistent with the existing site without becoming overly decorative

### 7.2 Visual Direction

Use the existing site redesign direction:

- soft product minimal
- light-first
- calm, professional, low-noise
- restrained borders and shadows
- strong typography over decoration

Do not introduce:

- heavy dashboard styling
- strong marketing language
- dense resume tables
- loud color accents

### 7.3 Layout Rules

- keep content width narrow enough for resume reading
- keep header compact
- use lightweight inline links for contact items
- render capability groups in a concise, low-noise block
- render work experience as brief stacked entries
- make the projects section the main visual focus
- preserve single-column structure on mobile, with tighter spacing and shorter text blocks

### 7.4 Printing

The page should also behave well as a printable resume surface.

Requirements:

- reasonable print spacing
- no unnecessary background effects in print mode
- avoid visual artifacts from decorative page chrome
- preserve content order and readability on paper

## 8. Routing, SEO, and Exposure

### 8.1 Route

Recommended route:

- `/resume`

This route should exist as a standalone hidden page and should not be added to the main navigation.

### 8.2 SEO Rules

Because the user wants low exposure:

- keep the page out of primary site discovery paths
- avoid aggressive internal linking
- use modest metadata
- implementation may choose to reduce indexing visibility if that fits the current SEO system

The exact metadata mechanism can be finalized during planning, but the intention must remain:

- accessible by direct URL
- not treated as a major public destination

## 9. Implementation Boundaries

Keep:

- existing Astro page architecture
- existing `Main` layout where practical
- current design tokens and shared styling direction

Add:

- one standalone resume page
- page-local content data or a small colocated data object
- lightweight print styles

Do not add:

- new CMS structures
- download flows
- PDF generation
- English localization in this phase
- new navigation items

## 10. Risks

- content may still overflow one page if project bullets are not aggressively edited
- keeping company names while generalizing project clients requires careful wording to avoid inconsistent privacy treatment
- the page could drift into either extreme: too plain like a raw resume, or too styled like a portfolio feature page
- if capability chips become too numerous, the top half of the page will lose scan efficiency

## 11. Acceptance Criteria

This design is successful when:

1. The page presents the resume as a clean hidden single-page site surface rather than a screenshot-like table.
2. Phone number and profile photo are removed, while name, email, and website remain visible.
3. Company names are retained, but project client naming is generalized where needed.
4. Only the three highest-signal recent projects are expanded.
5. The overall content can fit approximately within one A4 page when printed.
6. The page feels visually consistent with the rest of the site.
7. The page remains outside the main navigation and is treated as a low-exposure route.

## 12. Delivery Guidance for Planning

Recommended implementation order:

1. Create the hidden route and page metadata contract
2. Build the page structure and local content model
3. Apply privacy-safe copy rewriting and project condensation
4. Style the page for web reading and near-A4 density
5. Add print styles
6. Verify responsive and print behavior

The implementation plan should stay focused on a single page plus supporting styles only.
