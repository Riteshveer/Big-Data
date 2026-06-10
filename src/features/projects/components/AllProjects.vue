<script setup lang="ts">
import { ref, onMounted } from "vue";
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
const goToProject = (slug: string) => { window.location.href = `/project/${slug}`; };

onMounted(load);
</script>

<template>
  <div class="all-projects">
    <header class="all-projects-header">
      <button class="all-projects-back" @click="goHome">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
      <h1 class="all-projects-title">All Projects</h1>
    </header>
    <div v-if="loading" class="all-projects-loading">Loading...</div>
    <div v-else class="all-projects-grid">
      <div v-for="preview in projects" :key="preview.slug" class="all-projects-card" @click="goToProject(preview.slug)">
        <div class="all-projects-card-img">
          <img v-if="preview.thumbnail" :src="preview.thumbnail" :alt="preview.title" />
        </div>
        <div class="all-projects-card-info">
          <h3>{{ preview.title }}</h3>
          <p v-if="preview.description">{{ preview.description }}</p>
        </div>
      </div>
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
    background: #3b6df0 !important;
    border: none !important;
    color: #fff !important;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s, transform 0.2s;
    text-shadow: none !important;
    box-shadow: none !important;
    padding: 0;

    &:hover {
      background: #2a5ad4 !important;
      transform: scale(1.05);
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

  &-card {
    cursor: pointer;
    border-radius: 16px;
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
    background: rgba(255, 255, 255, 0.4);
    box-shadow: 8px 8px 16px rgba(0, 0, 0, 0.08), -4px -4px 12px rgba(255, 255, 255, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.5);
    padding: 10px;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 12px 12px 24px rgba(0, 0, 0, 0.1), -6px -6px 16px rgba(255, 255, 255, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.9);
    }

    &-img {
      aspect-ratio: 16/9;
      background: var(--color-beige-500, #e8ddd0);
      border-radius: 12px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    &-info {
      padding: 10px 4px;

      h3 {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--color-text-400, #1a1a2e);
      }

      p {
        font-size: 0.85rem;
        color: var(--color-text-300, #666);
        margin-top: 4px;
      }
    }
  }
}
</style>
