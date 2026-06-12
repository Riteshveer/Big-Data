<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import BlogSection from "./BlogSection.vue";
import ContributionsSection from "./ContributionsSection.vue";
import JourneyStory from "./JourneyStory.vue";

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
const activeTab = ref<"story" | "blog" | "contributions">("story");
const loading = ref(true);

const visibleTabs = computed(() => {
  const tabs: { id: string; label: string }[] = [];
  tabs.push({ id: "story", label: "My Story" });
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
        <!-- My Story -->
        <div v-if="activeTab === 'story'" class="journey-section">
          <JourneyStory />
        </div>

        <!-- Blog -->
        <div v-if="activeTab === 'blog' && showBlog" class="journey-section">
          <BlogSection :posts="blogPosts" />
        </div>

        <!-- Contributions -->
        <div v-if="activeTab === 'contributions' && showContributions" class="journey-section">
          <ContributionsSection :contributions="contributions" />
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
    gap: 12px;
    margin-bottom: 40px;
    flex-wrap: wrap;

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }
  }

  &-back {
    background: #3b6df0;
    border: none;
    color: #fff;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s, transform 0.2s;
    padding: 0;
    flex-shrink: 0;

    &:hover { background: #2a5ad4; transform: scale(1.05); }
  }

  &-title {
    font-size: 2rem;
    font-weight: 900;
    color: var(--color-text-400, #1a1a2e);

    @media (max-width: 768px) { font-size: 1.5rem; }
  }
  &-loading { color: var(--color-text-300, #666); }

  &-tabs {
    display: flex;
    gap: 4px;
    margin-left: auto;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50px;
    padding: 4px;
    box-shadow: 6px 6px 12px rgba(0, 0, 0, 0.08), -4px -4px 10px rgba(255, 255, 255, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.4);

    @media (max-width: 768px) {
      margin-left: 0;
      width: 100%;
      justify-content: center;
    }
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
    transition: background 0.2s, color 0.2s, box-shadow 0.2s;

    @media (max-width: 768px) {
      padding: 8px 16px;
      font-size: 0.8rem;
    }

    &:hover { color: var(--color-text-400, #1a1a2e); background: rgba(255, 255, 255, 0.3); }
    &-active {
      background: var(--color-text-400, #1a1a2e);
      color: #fff;
      box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.1);
      &:hover { color: #fff; }
    }
  }

  &-content {
    max-width: 100%;
    padding: 40px 0;
    min-height: 60vh;
  }

  &-section {
    /* All sections blend with the navy content area */
  }

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
