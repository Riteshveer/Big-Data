<script setup lang="ts">
import { ref, onMounted, computed } from "vue";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8787";

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
}

interface Contribution {
  id: number;
  title: string;
  description: string | null;
  url: string | null;
  type: string;
  date: string | null;
}

const showBlog = ref(false);
const showContributions = ref(false);
const blogPosts = ref<BlogPost[]>([]);
const contributions = ref<Contribution[]>([]);
const activeTab = ref<"blog" | "contributions">("blog");
const loading = ref(true);

const visibleTabs = computed(() => {
  const tabs: { id: string; label: string }[] = [];
  if (showBlog.value) tabs.push({ id: "blog", label: "Blog" });
  if (showContributions.value) tabs.push({ id: "contributions", label: "Contributions" });
  return tabs;
});

const load = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/settings`);
    if (res.ok) {
      const settings = await res.json();
      showBlog.value = settings.journey_show_blog === "true";
      showContributions.value = settings.journey_show_contributions === "true";
      // Set default active tab
      if (showBlog.value) activeTab.value = "blog";
      else if (showContributions.value) activeTab.value = "contributions";
    }

    if (showBlog.value) {
      const blogRes = await fetch(`${API_BASE}/api/blog`);
      if (blogRes.ok) blogPosts.value = await blogRes.json();
    }

    if (showContributions.value) {
      const contribRes = await fetch(`${API_BASE}/api/contributions`);
      if (contribRes.ok) contributions.value = await contribRes.json();
    }
  } catch { /* */ }
  loading.value = false;
};

const goHome = () => { window.location.href = "/"; };

onMounted(load);
</script>

<template>
  <div class="journey">
    <header class="journey-header">
      <button class="journey-back" @click="goHome">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
      <h1 class="journey-title">My Journey</h1>
      <div v-if="visibleTabs.length" class="journey-tabs">
        <button
          v-for="tab in visibleTabs"
          :key="tab.id"
          :class="['journey-tab', activeTab === tab.id && 'journey-tab-active']"
          @click="activeTab = tab.id as any"
        >{{ tab.label }}</button>
      </div>
    </header>

    <div v-if="loading" class="journey-loading">Loading...</div>

    <template v-else-if="visibleTabs.length">
      <div class="journey-content">
        <!-- Blog -->
        <div v-if="activeTab === 'blog' && showBlog" class="journey-section">
          <div v-if="blogPosts.length" class="journey-posts">
            <a v-for="post in blogPosts" :key="post.id" :href="`/blog/${post.slug}`" class="journey-post">
              <img v-if="post.cover_image_url" :src="post.cover_image_url" class="journey-post-img" />
              <div class="journey-post-info">
                <h3>{{ post.title }}</h3>
                <p v-if="post.excerpt">{{ post.excerpt }}</p>
                <span v-if="post.published_at" class="journey-post-date">{{ post.published_at }}</span>
              </div>
            </a>
          </div>
          <p v-else class="journey-empty">No blog posts yet. Check back soon!</p>
        </div>

        <!-- Contributions -->
        <div v-if="activeTab === 'contributions' && showContributions" class="journey-section">
          <div v-if="contributions.length" class="journey-contributions">
            <a v-for="item in contributions" :key="item.id" :href="item.url || '#'" :target="item.url ? '_blank' : ''" class="journey-contrib">
              <div class="journey-contrib-type">{{ item.type }}</div>
              <div class="journey-contrib-info">
                <h3>{{ item.title }}</h3>
                <p v-if="item.description">{{ item.description }}</p>
              </div>
              <span v-if="item.date" class="journey-contrib-date">{{ item.date }}</span>
            </a>
          </div>
          <p v-else class="journey-empty">No contributions yet. Check back soon!</p>
        </div>
      </div>
    </template>

    <div v-else class="journey-empty-state">
      <p>Nothing here yet. Come back later!</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.journey {
  min-height: 100vh;
  background: var(--color-beige-400, #f5ede3);
  padding: 40px var(--space-outer, 24px);

  &-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 40px;
  }

  &-back {
    background: #3b6df0;
    border: none;
    color: #fff;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s, transform 0.2s;
    padding: 0;

    &:hover { background: #2a5ad4; transform: scale(1.05); }
  }

  &-title { font-size: 2rem; font-weight: 900; color: var(--color-text-400, #1a1a2e); }
  &-loading { color: var(--color-text-300, #666); }

  &-tabs {
    display: flex;
    gap: 0;
    margin-left: auto;
    background: rgba(0, 0, 0, 0.06);
    border-radius: 50px;
    padding: 4px;
  }

  &-tab {
    padding: 10px 28px;
    border: none;
    background: transparent;
    border-radius: 50px;
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--color-text-300, #555);
    cursor: pointer;
    transition: background 0.2s, color 0.2s;

    &:hover { color: var(--color-text-400, #1a1a2e); }
    &-active { background: var(--color-text-400, #1a1a2e); color: #fff; &:hover { color: #fff; } }
  }

  &-content { max-width: 100%; }

  &-posts { display: flex; flex-direction: column; gap: 16px; }
  &-post {
    display: flex; gap: 16px; align-items: center;
    background: rgba(255,255,255,0.5); border-radius: 12px; padding: 16px;
    text-decoration: none; color: inherit; transition: transform 0.2s;
    box-shadow: 4px 4px 12px rgba(0,0,0,0.06);
    &:hover { transform: translateY(-2px); }
    &-img { width: 80px; height: 56px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
    &-info { flex: 1; h3 { font-size: 1rem; font-weight: 700; color: var(--color-text-400, #1a1a2e); } p { font-size: 0.85rem; color: var(--color-text-300, #555); margin-top: 4px; } }
    &-date { font-size: 0.75rem; color: var(--color-text-300, #888); flex-shrink: 0; }
  }

  &-contributions { display: flex; flex-direction: column; gap: 12px; }
  &-contrib {
    display: flex; gap: 16px; align-items: center;
    background: rgba(255,255,255,0.5); border-radius: 12px; padding: 16px;
    text-decoration: none; color: inherit; transition: transform 0.2s;
    box-shadow: 4px 4px 12px rgba(0,0,0,0.06);
    &:hover { transform: translateY(-2px); }
    &-type { background: #e8f0fe; color: #1a56db; font-size: 0.7rem; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; white-space: nowrap; }
    &-info { flex: 1; h3 { font-size: 0.95rem; font-weight: 700; color: var(--color-text-400, #1a1a2e); } p { font-size: 0.8rem; color: var(--color-text-300, #555); margin-top: 4px; } }
    &-date { font-size: 0.75rem; color: var(--color-text-300, #888); flex-shrink: 0; }
  }

  &-empty, &-empty-state p { color: var(--color-text-300, #666); font-size: 1rem; font-style: italic; }
}
</style>
