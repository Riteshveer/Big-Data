<script setup lang="ts">
import { ref } from "vue";

const activeTab = ref<"blog" | "contributions">("blog");
const goHome = () => { window.location.href = "/"; };
</script>

<template>
  <div class="journey">
    <header class="journey-header">
      <button class="journey-back" @click="goHome">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
      <h1 class="journey-title">My Journey</h1>
    </header>

    <div class="journey-tabs">
      <button :class="['journey-tab', activeTab === 'blog' && 'journey-tab-active']" @click="activeTab = 'blog'">Blog</button>
      <button :class="['journey-tab', activeTab === 'contributions' && 'journey-tab-active']" @click="activeTab = 'contributions'">Contributions</button>
    </div>

    <div class="journey-content">
      <div v-if="activeTab === 'blog'" class="journey-section">
        <p class="journey-empty">Blog posts coming soon...</p>
      </div>
      <div v-if="activeTab === 'contributions'" class="journey-section">
        <p class="journey-empty">Contributions coming soon...</p>
      </div>
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

    &:hover {
      background: #2a5ad4;
      transform: scale(1.05);
    }
  }

  &-title {
    font-size: 2rem;
    font-weight: 900;
    color: var(--color-text-400, #1a1a2e);
  }

  &-tabs {
    display: flex;
    gap: 0;
    margin-bottom: 32px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 50px;
    padding: 4px;
    width: fit-content;
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

    &:hover {
      color: var(--color-text-400, #1a1a2e);
    }

    &-active {
      background: var(--color-text-400, #1a1a2e);
      color: #fff;

      &:hover {
        color: #fff;
      }
    }
  }

  &-content {
    max-width: 800px;
  }

  &-section {
    min-height: 200px;
  }

  &-empty {
    color: var(--color-text-300, #666);
    font-size: 1rem;
    font-style: italic;
  }
}
</style>
