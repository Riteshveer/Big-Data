<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue";
import { locale } from "../../../i18n/store";
import PreviewCard from "../../projects/components/PreviewCard.vue";
import NotchSection from "../../../components/NotchSection.vue";
import { isFeatureEnabled } from "../../../utils/features";

import type { ProjectPreview } from "../../../content/types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8787";

const loadedPreviews = ref<ProjectPreview[] | null>(null);
const displayedPreviews = computed(() => {
  if (!loadedPreviews.value) return null;
  return loadedPreviews.value.slice(0, 5);
});
const hasMore = computed(() => {
  return (loadedPreviews.value?.length || 0) > 5;
});
const typewriterText = ref("");
const showCursor = ref(true);
const titleRef = ref<HTMLElement | null>(null);
let typingStarted = false;
let observer: IntersectionObserver | null = null;

const emit = defineEmits<{
  (e: "loaded", previews: ProjectPreview[]): void;
}>();

const goToAllProjects = () => {
  window.location.href = "/projects";
};

const loadPreviews = async () => {
  // Load all projects from API only — admin has full control
  try {
    const res = await fetch(`${API_BASE}/api/projects`);
    if (res.ok) {
      const apiProjects: any[] = await res.json();
      const allPreviews: ProjectPreview[] = apiProjects.map(proj => ({
        title: proj.title,
        slug: proj.slug,
        thumbnail: proj.poster_url || "",
        description: proj.description ? proj.description.slice(0, 80) : "",
      }));
      loadedPreviews.value = allPreviews;
      emit("loaded", allPreviews);
    }
  } catch {
    // API unavailable, show nothing
    loadedPreviews.value = [];
  }
};

const typeText = () => {
  if (typingStarted) return;
  typingStarted = true;
  typewriterText.value = "";
  const fullText = "My Projects";
  let i = 0;

  const type = () => {
    if (i < fullText.length) {
      typewriterText.value += fullText[i];
      i++;
      setTimeout(type, 80 + Math.random() * 40);
    }
  };

  setTimeout(type, 300);
};

watch(locale, loadPreviews);

onMounted(() => {
  loadPreviews();

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        typeText();
      }
    },
    { threshold: 0.2 },
  );

  if (titleRef.value) observer.observe(titleRef.value);
});
</script>

<template>
  <div class="projects">
    <NotchSection class="projects-notch-start" />
    <NotchSection class="projects-notch-end" />
    <div class="grid">
      <div ref="titleRef" class="projects-title">
        <h2 class="projects-title-copy">
          <span class="projects-title-typed">{{ typewriterText }}</span>
          <span class="projects-title-cursor" v-if="showCursor">|</span>
        </h2>
      </div>
    </div>
    <div class="grid">
      <div class="projects-cards">
        <PreviewCard v-for="preview in displayedPreviews" :key="preview.title" :preview="preview" />
        <PreviewCard v-if="isFeatureEnabled('startProject')" />
      </div>
    </div>
    <div v-if="hasMore" class="projects-see-more">
      <a href="/projects" class="projects-see-more-btn" @click.prevent="goToAllProjects">See More</a>
    </div>
  </div>
</template>

<style scoped lang="scss">
.projects {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
  gap: var(--space-xl);
  padding-left: var(--space-outer);
  padding-right: var(--space-outer);
  background-color: var(--color-beige-400);
  min-height: calc(var(--lvh) * 100 + var(--radius-xxl));
  padding-top: 96px;
  padding-bottom: 96px;

  @include mixins.mq("md") {
    padding-top: 144px;
    padding-bottom: 144px;
    gap: var(--space-xxl);
  }

  @include mixins.mq("lg") {
    gap: var(--space-xxxl);
  }

  &-title {
    position: relative;
    padding-top: var(--space-md);
    grid-column: 1 / 13;

    @include mixins.mq("md") {
      grid-column: 1 / 10;
    }

    @include mixins.mq("lg") {
      grid-column: 3 / 8;
    }

    &-copy {
      font-weight: 900;
      letter-spacing: 0.02em;
      font-size: var(--font-size-title-md);
      display: flex;
      align-items: baseline;

      @include mixins.mq("sm") {
        font-size: var(--font-size-title-lg);
      }

      @include mixins.mq("xl") {
        font-size: var(--font-size-title-xl);
      }
    }

    &-typed {
      white-space: pre;
    }

    &-cursor {
      font-weight: 300;
      color: #ff6b35;
      animation: cursorBlink 0.7s step-end infinite;
      margin-left: 2px;
    }
  }

  &-notch {
    &-start {
      position: absolute;
      top: 0;
      left: 0;
      transform: translateY(-100%);
      color: var(--color-beige-400);
      --icon-color: var(--color-beige-400);
    }

    &-end {
      position: absolute;
      bottom: 0;
      left: 0;
      color: var(--color-beige-600);
      --icon-color: var(--color-beige-600);
    }
  }

  &-cards {
    max-width: 100%;
    flex: 1;
    grid-column: 1 / span 12;
    display: grid;
    gap: var(--space-lg);
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));

    @include mixins.mq("md") {
      grid-column: 1 / span 12;
    }

    @include mixins.mq("lg") {
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      grid-column: 3 / span 8;
    }

    @include mixins.mq("xl") {
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
    }
  }
}

@keyframes cursorBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.projects-see-more {
  display: flex;
  justify-content: center;
  width: 100%;

  &-btn {
    display: inline-block;
    padding: 12px 32px;
    border: 2px solid var(--color-text-400);
    border-radius: var(--radius-md);
    color: var(--color-text-400);
    font-weight: 700;
    font-size: var(--font-size-md);
    text-decoration: none;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;

    &:hover {
      background: var(--color-text-400);
      color: var(--color-beige-400);
    }
  }
}
</style>
