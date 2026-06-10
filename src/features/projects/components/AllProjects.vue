<script setup lang="ts">
import { ref, onMounted } from "vue";
import PreviewCard from "./PreviewCard.vue";
import type { ProjectPreview } from "../../../content/types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8787";
const projects = ref<ProjectPreview[]>([]);
const loading = ref(true);

const load = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/projects`);
    if (res.ok) {
      const data: any[] = await res.json();
      projects.value = data.map(p => ({
        title: p.title,
        slug: p.slug,
        thumbnail: p.poster_url || "",
        description: p.description ? p.description.slice(0, 80) : "",
      }));
    }
  } catch { /* */ }
  loading.value = false;
};

const goHome = () => { window.location.href = "/"; };

onMounted(load);
</script>

<template>
  <div class="all-projects">
    <header class="all-projects-header">
      <button class="all-projects-back" @click="goHome">← Back</button>
      <h1 class="all-projects-title">All Projects</h1>
    </header>
    <div v-if="loading" class="all-projects-loading">Loading...</div>
    <div v-else class="all-projects-grid">
      <PreviewCard v-for="preview in projects" :key="preview.slug" :preview="preview" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.all-projects {
  min-height: 100vh;
  background: var(--color-beige-400, #f5ede3);
  padding: 40px var(--space-outer, 24px);

  &-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 48px;
  }

  &-back {
    background: none;
    border: 2px solid var(--color-text-400, #1a1a2e);
    color: var(--color-text-400, #1a1a2e);
    padding: 8px 16px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;

    &:hover {
      background: var(--color-text-400, #1a1a2e);
      color: var(--color-beige-400, #f5ede3);
    }
  }

  &-title {
    font-size: 2rem;
    font-weight: 900;
    color: var(--color-text-400, #1a1a2e);
  }

  &-loading {
    text-align: center;
    color: var(--color-text-300, #666);
    font-size: 1rem;
  }

  &-grid {
    display: grid;
    gap: 24px;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    max-width: 1200px;
    margin: 0 auto;

    @media (min-width: 768px) {
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    }
  }
}
</style>
