<template>
  <div class="writing-archive">
    <!-- 筛选工具栏 -->
    <div class="toolbar shell">
      <p class="count meta">共 {{ filteredArticles.length }} 篇文章</p>

      <div class="tag-select" :class="{ open: dropdownOpen }">
        <button
          type="button"
          class="tag-trigger"
          :aria-expanded="dropdownOpen"
          aria-haspopup="listbox"
          @click="dropdownOpen = !dropdownOpen"
        >
          <span class="tag-trigger-label">{{ currentTagLabel }}</span>
          <svg
            class="tag-trigger-icon"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        <div v-if="dropdownOpen" class="tag-popup" role="listbox">
          <button
            type="button"
            class="tag-option"
            :class="{ 'tag-option-active': !currentTag }"
            role="option"
            @click="handleTagClick('')"
          >
            <span>全部文章</span>
            <span class="tag-count">{{ articles.length }}</span>
          </button>
          <button
            v-for="tag in uniqueTags"
            :key="tag.slug"
            type="button"
            class="tag-option"
            :class="{ 'tag-option-active': currentTag === tag.slug }"
            role="option"
            @click="handleTagClick(tag.slug)"
          >
            <span>#{{ tag.name }}</span>
            <span class="tag-count">{{ tag.count }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 归档列表 -->
    <div class="archive shell">
      <hr class="hairline" />
      <article v-for="item in filteredArticles" :key="item.permalink" class="archive-row">
        <a :href="item.permalink" class="archive-main">
          <time class="archive-date meta" :datetime="item.publishedAt">
            {{ formatDate(item.publishedAt) }}
          </time>
          <div class="archive-body">
            <h3 class="archive-title">{{ item.title }}</h3>
            <p v-if="item.summary" class="archive-summary">{{ item.summary }}</p>
            <div class="archive-meta">
              <span
                v-if="item.source === 'column' && item.columnSlug"
                class="archive-source"
              >
                <a
                  :href="`/columns/${item.columnSlug}`"
                  @click.stop
                >专栏 · {{ item.columnTitle }}</a>
              </span>
              <span v-if="item.tags.length > 0" class="archive-tags">
                <span v-for="(tag, index) in item.tags" :key="tag" class="archive-tag">
                  #{{ tag }}
                </span>
              </span>
            </div>
          </div>
        </a>
        <hr class="hairline" />
      </article>

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

const currentTag = ref(props.initialTag);
const dropdownOpen = ref(false);

const currentTagLabel = computed(() => {
  if (!currentTag.value) return '全部标签';
  const found = uniqueTags.value.find((t) => t.slug === currentTag.value);
  return found ? `#${found.name}` : `#${currentTag.value}`;
});

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

const filteredArticles = computed(() => {
  if (!currentTag.value) return props.articles;
  return props.articles.filter((article) => article.tagSlugs.includes(currentTag.value));
});

function formatDate(dateStr: string): string {
  return new Date(dateStr).toISOString().slice(0, 10);
}

function handleTagClick(tag: string) {
  const newUrl = tag
    ? `${window.location.pathname}?tag=${encodeURIComponent(tag)}`
    : window.location.pathname;
  history.pushState({ tag }, '', newUrl);
  currentTag.value = tag;
  dropdownOpen.value = false;
  updateDescription();
}

function updateDescription() {
  const descriptionEl = document.querySelector('.writing-desc');
  if (descriptionEl) {
    if (currentTag.value) {
      descriptionEl.textContent = `当前标签：${currentTag.value}，共 ${filteredArticles.value.length} 篇。`;
    } else {
      descriptionEl.textContent = '按时间倒序归档的全部文章，可按标签过滤。';
    }
  }
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.tag-select')) {
    dropdownOpen.value = false;
  }
}

function handlePopState() {
  const params = new URLSearchParams(window.location.search);
  currentTag.value = params.get('tag')?.trim() || '';
  updateDescription();
}

onMounted(() => {
  window.addEventListener('popstate', handlePopState);
  document.addEventListener('click', handleClickOutside);
  updateDescription();
});

onUnmounted(() => {
  window.removeEventListener('popstate', handlePopState);
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.writing-archive {
  display: block;
}

/* 工具栏 */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 28px;
}

.count {
  margin: 0;
}

/* 标签下拉 */
.tag-select {
  position: relative;
  width: 216px;
}

.tag-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid var(--hairline);
  border-radius: 6px;
  background: var(--surface);
  color: var(--text-strong);
  font-family: var(--font-sans);
  font-size: 13px;
  cursor: pointer;
  transition: border-color 150ms ease;
}

.tag-trigger:hover {
  border-color: var(--accent);
}

.tag-trigger-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.tag-popup {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(26, 31, 28, 0.12);
  z-index: 30;
}

.tag-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  transition: background-color 150ms ease, color 150ms ease;
}

.tag-option:hover {
  color: var(--text-strong);
}

.tag-option-active {
  background: var(--accent-soft);
  color: var(--accent);
}

.tag-count {
  font-size: 12px;
  opacity: 0.7;
}

/* 归档列表 */
.archive {
  padding-bottom: 72px;
}

.archive-row {
  display: block;
}

.archive-main {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 32px;
  align-items: baseline;
  padding-block: 28px;
  text-decoration: none;
}

.archive-date {
  margin: 0;
  white-space: nowrap;
}

.archive-body {
  min-width: 0;
}

.archive-title {
  margin: 0 0 8px;
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 500;
  line-height: 1.35;
  color: var(--text-strong);
  transition: color 150ms ease;
}

.archive-main:hover .archive-title {
  color: var(--accent);
}

.archive-summary {
  margin: 0 0 8px;
  font-family: var(--font-serif);
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-muted);
}

.archive-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  font-family: var(--font-sans);
  font-size: 12px;
}

.archive-source a {
  color: var(--accent);
  text-decoration: none;
}

.archive-source a:hover {
  text-decoration: underline;
}

.archive-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.archive-tag {
  color: var(--text-muted);
}

.empty-state {
  margin: 28px 0 0;
  color: var(--text-muted);
  font-family: var(--font-serif);
}

/* 移动端（对照 UOUz7） */
@media (max-width: 720px) {
  .toolbar {
    padding-bottom: 24px;
  }

  .count {
    font-size: 12px;
  }

  .tag-select {
    width: auto;
    flex: 1;
  }

  .archive {
    padding-bottom: 36px;
  }

  .archive-main {
    grid-template-columns: 1fr;
    gap: 8px;
    padding-block: 20px;
  }
}
</style>
