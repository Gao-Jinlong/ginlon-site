<template>
  <div class="article-list-wrapper">
    <aside class="tag-sidebar">
      <button
        type="button"
        class="tag-toggle"
        :aria-expanded="tagsExpanded"
        @click="tagsExpanded = !tagsExpanded"
      >
        <span>标签筛选：{{ currentTagLabel }}</span>
        <span class="tag-toggle-icon">{{ tagsExpanded ? '⌃' : '⌄' }}</span>
      </button>
      <p class="tag-sidebar-title">标签筛选</p>
      <nav
        class="tag-filter-bar"
        :class="{ 'tag-filter-bar-collapsed': !tagsExpanded }"
        aria-label="文章标签筛选"
      >
        <a
          href="/writing"
          :class="['tag-link', { 'tag-link-active': !currentTag }]"
          @click.prevent="handleTagClick('')"
        >
          全部文章
        </a>
        <a
          v-for="tag in uniqueTags"
          :key="tag.slug"
          :href="`/writing?tag=${encodeURIComponent(tag.slug)}`"
          :class="['tag-link', { 'tag-link-active': currentTag === tag.slug }]"
          @click.prevent="handleTagClick(tag.slug)"
        >
          #{{ tag.name }}
          <span>{{ tag.count }}</span>
        </a>
      </nav>
    </aside>

    <div class="article-main">
      <!-- 文章列表 -->
      <div class="article-list">
        <article
          v-for="article in filteredArticles"
          :key="article.permalink"
          class="article-card"
          :data-slug="article.slug"
        >
          <a
            v-if="article.source === 'column' && article.columnSlug"
            :href="`/columns/${article.columnSlug}`"
            class="article-column-badge"
          >
            专栏 · {{ article.columnTitle }}
          </a>
          <a :href="article.permalink" class="article-main-link">
            <h3 class="article-card-title">{{ article.title }}</h3>
          </a>
          <time class="article-card-date" :datetime="article.publishedAt">
            {{ formatDate(article.publishedAt) }}
          </time>
          <p class="article-card-summary">{{ article.summary }}</p>
          <ul v-if="article.tags.length > 0" class="article-card-tags">
            <li v-for="(tag, index) in article.tags" :key="tag">
              <a
                href="#"
                class="article-tag"
                @click.prevent="handleTagClick(article.tagSlugs[index])"
              >
                {{ tag }}
              </a>
            </li>
          </ul>
        </article>
      </div>

      <!-- 空状态 -->
      <p v-show="filteredArticles.length === 0" class="empty-state">
        没有匹配的文章，试试切换到"全部文章"。
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

interface Article {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  tags: string[];
  tagSlugs: string[];
  permalink: string;
  source: 'blog' | 'column';
  columnTitle?: string;
  columnSlug?: string;
}

interface Tag {
  name: string;
  slug: string;
  count: number;
}

interface Props {
  articles: Article[];
  initialTag?: string;
}

const props = withDefaults(defineProps<Props>(), {
  initialTag: '',
});

// 当前选中的标签（使用 ref 响应式）
const currentTag = ref(props.initialTag);

// 窄屏标签折叠状态（桌面端由 CSS 强制展开）
const tagsExpanded = ref(false);

// 折叠按钮上显示的当前标签文案
const currentTagLabel = computed(() => {
  if (!currentTag.value) return '全部';
  const found = uniqueTags.value.find((t) => t.slug === currentTag.value);
  return found ? `#${found.name}` : `#${currentTag.value}`;
});

// 计算所有唯一标签及其数量
const uniqueTags = computed<Tag[]>(() => {
  const tagMap = new Map<string, { name: string; slug: string; count: number }>();

  props.articles.forEach((article) => {
    article.tags.forEach((tag, index) => {
      const slug = article.tagSlugs[index];
      const existing = tagMap.get(slug);
      if (existing) {
        existing.count++;
      } else {
        tagMap.set(slug, { name: tag, slug, count: 1 });
      }
    });
  });

  return Array.from(tagMap.values()).sort((a, b) => b.count - a.count);
});

// 筛选后的文章
const filteredArticles = computed(() => {
  if (!currentTag.value) {
    return props.articles;
  }
  return props.articles.filter((article) => article.tagSlugs.includes(currentTag.value));
});

// 格式化日期
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toISOString().slice(0, 10);
}

// 处理标签点击
function handleTagClick(tag: string) {
  const newUrl = tag
    ? `${window.location.pathname}?tag=${encodeURIComponent(tag)}`
    : window.location.pathname;
  history.pushState({ tag }, '', newUrl);
  currentTag.value = tag;
  updateDescription();
  tagsExpanded.value = false;
}

// 更新描述文字
function updateDescription() {
  const descriptionEl = document.querySelector('.section-description');
  if (descriptionEl) {
    if (currentTag.value) {
      descriptionEl.textContent = `当前标签：${currentTag.value}，共 ${filteredArticles.value.length} 篇。`;
    } else {
      descriptionEl.textContent = '按发布时间倒序排列，点击标签筛选文章。';
    }
  }
}

// 处理浏览器前进/后退
function handlePopState() {
  const params = new URLSearchParams(window.location.search);
  const tag = params.get('tag')?.trim() || '';
  currentTag.value = tag;
  updateDescription();
}

onMounted(() => {
  window.addEventListener('popstate', handlePopState);
  updateDescription();
});

onUnmounted(() => {
  window.removeEventListener('popstate', handlePopState);
});
</script>

<style scoped>
.article-list-wrapper {
  display: grid;
  gap: 1.5rem;
}

/* 折叠按钮：默认（窄屏）显示 */
.tag-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 0.5rem;
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-m);
  background: var(--surface-bg-strong);
  color: var(--text-strong);
  padding: 0.6rem 0.85rem;
  font-size: 0.9rem;
  cursor: pointer;
}

.tag-toggle-icon {
  color: var(--text-muted);
}

/* 侧栏标题：默认（窄屏）隐藏 */
.tag-sidebar-title {
  display: none;
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-strong);
}

.tag-filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: 0.75rem;
}

/* 窄屏折叠：收起时隐藏标签列表 */
.tag-filter-bar-collapsed {
  display: none;
}

/* 桌面端：两栏 + sticky 侧栏 */
@media (min-width: 768px) {
  .article-list-wrapper {
    grid-template-columns: 13rem 1fr;
    align-items: start;
    gap: 2rem;
  }

  .tag-sidebar {
    position: sticky;
    top: 5rem;
  }

  .tag-toggle {
    display: none;
  }

  .tag-sidebar-title {
    display: block;
  }

  .tag-filter-bar {
    flex-direction: column;
    align-items: flex-start;
    margin-top: 0;
  }

  /* 桌面端始终展开，忽略折叠状态 */
  .tag-filter-bar-collapsed {
    display: flex;
  }
}

.tag-link {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border: 1px solid var(--surface-border);
  border-radius: 999px;
  padding: 0.35rem 0.72rem;
  text-decoration: none;
  color: var(--text-muted);
  font-size: 0.84rem;
  transition: color 150ms ease, border-color 150ms ease, background-color 150ms ease;
}

.tag-link span {
  font-size: 0.72rem;
  opacity: 0.8;
}

.tag-link:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.tag-link-active {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-soft);
}

.article-list {
  display: grid;
  gap: 0.9rem;
}

.article-card {
  border: 1px solid var(--surface-border);
  background: var(--surface-bg-strong);
  border-radius: var(--radius-m);
  padding: 1rem 1rem 0.95rem;
  display: grid;
  gap: 0.58rem;
}

.article-main-link {
  text-decoration: none;
  width: fit-content;
}

.article-card-title {
  margin: 0;
  color: var(--text-strong);
  font-size: 1.16rem;
  line-height: 1.35;
}

.article-main-link:hover .article-card-title {
  color: var(--accent);
}

.article-card-date {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.article-card-summary {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.75;
  font-size: 0.95rem;
}

.article-card-tags {
  margin: 0.1rem 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.article-tag {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--surface-border);
  border-radius: 999px;
  padding: 0.2rem 0.58rem;
  font-size: 0.78rem;
  color: var(--text-muted);
  text-decoration: none;
}

.article-tag:hover {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-soft);
}

.empty-state {
  margin: 1rem 0 0;
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-m);
  padding: 1rem;
  color: var(--text-muted);
  background: var(--surface-bg);
}

.article-column-badge {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.18rem 0.6rem;
  font-size: 0.76rem;
  font-weight: 500;
  color: var(--accent);
  background: var(--accent-soft);
  text-decoration: none;
}

.article-column-badge:hover {
  text-decoration: underline;
}
</style>
