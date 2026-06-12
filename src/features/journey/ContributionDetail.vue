<script setup lang="ts">
import { ref, onMounted } from "vue";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8787";

const contribution = ref<any>(null);
const content = ref<any[]>([]);
const loading = ref(true);

const id = window.location.pathname.replace("/contribution/", "");

const goBack = () => { window.location.href = "/journey"; };

onMounted(async () => {
  try {
    const contribs = await (await fetch(`${API_BASE}/api/contributions`)).json();
    contribution.value = contribs.find((c: any) => c.id === parseInt(id));
    const contentRes = await fetch(`${API_BASE}/api/contributions/${id}/content`);
    if (contentRes.ok) content.value = await contentRes.json();
  } catch { /* */ }
  loading.value = false;
});
</script>

<template>
  <div class="contrib-detail">
    <div v-if="loading" class="contrib-detail-loading">Loading...</div>
    <template v-else-if="contribution">
      <header class="contrib-detail-header">
        <button class="contrib-detail-back" @click="goBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <div>
          <span class="contrib-detail-type">{{ contribution.type }}</span>
          <span class="contrib-detail-date" v-if="contribution.date">{{ contribution.date }}</span>
        </div>
      </header>

      <h1 class="contrib-detail-title">{{ contribution.title }}</h1>
      <p class="contrib-detail-desc" v-if="contribution.description">{{ contribution.description }}</p>

      <div class="contrib-detail-content" v-if="content.length">
        <div v-for="block in content" :key="block.id" class="contrib-detail-block">
          <img v-if="block.image_url" :src="block.image_url" class="contrib-detail-img" />
          <h3 v-if="block.title" class="contrib-detail-block-title">{{ block.title }}</h3>
          <p v-if="block.description" class="contrib-detail-block-text">{{ block.description }}</p>
        </div>
      </div>

      <a v-if="contribution.url" :href="contribution.url" target="_blank" class="contrib-detail-link">View on External Site →</a>
    </template>
    <div v-else class="contrib-detail-loading">Contribution not found.</div>
  </div>
</template>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&display=swap');

.contrib-detail {
  min-height: 100vh;
  background: #F0EBE0;
  color: #1A1A1A;
  padding: 40px var(--space-outer, 24px);
  max-width: 900px;
  margin: 0 auto;

  &-loading { color: #888; text-align: center; padding: 60px 0; }

  &-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
  &-back { background: #FF6B00; border: none; color: #fff; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
  &-type { font-family: "Poppins", sans-serif; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #FF6B00; background: rgba(255,107,0,0.08); padding: 4px 12px; border-radius: 20px; border: 1px solid #FF6B00; }
  &-date { font-size: 0.8rem; color: #888; margin-left: 12px; }

  &-title { font-family: "Poppins", sans-serif; font-weight: 900; font-size: 2.2rem; line-height: 1.2; margin-bottom: 16px; }
  &-desc { font-size: 1rem; color: #555; line-height: 1.7; margin-bottom: 32px; white-space: pre-line; }

  &-content { display: flex; flex-direction: column; gap: 32px; margin-bottom: 32px; }

  &-block {
    &-title { font-family: "Poppins", sans-serif; font-weight: 700; font-size: 1.2rem; margin-bottom: 8px; }
    &-text { font-size: 0.95rem; color: #444; line-height: 1.7; }
  }

  &-img { width: 100%; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }

  &-link {
    display: inline-block;
    background: #FF6B00;
    color: #fff;
    padding: 12px 28px;
    border-radius: 999px;
    font-family: "Poppins", sans-serif;
    font-weight: 700;
    text-decoration: none;
    font-size: 0.9rem;
    transition: background 0.2s, transform 0.2s;

    &:hover { background: #FF8C33; transform: translateY(-2px); }
  }
}
</style>
