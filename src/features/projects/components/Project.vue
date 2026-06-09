<script setup lang="ts">
import { projectId, projectVisible, recentProjectId } from "../../../composables/useRouteObserver";
import { isTransitioning } from "../../../composables/useProjectTransition";
import { ref, watch } from "vue";
import { projectModules } from "../../../content/projects";
import ProjectContent from "./ProjectContent.vue";
import Footer from "../../../components/Footer.vue";
import { locale } from "../../../i18n/store";
import { lenis } from "../../../composables/useScroll";

import type { Locale } from "../../../i18n/types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8787";

const loading = ref(true);
const content = ref(null);
const error = ref<Error | null>(null);

const fetchProject = async (project: string | undefined) => {
  if (!project) return;
  loading.value = true;
  content.value = null;

  // Always fetch from API — admin has full control
  try {
    const res = await fetch(`${API_BASE}/api/projects/${project}`);
    if (res.ok) {
      const data = await res.json();
      content.value = {
        title: data.title,
        theme: data.theme || "light",
        tags: data.tags || [],
        description: data.description || "",
        source: data.source_url || undefined,
        live: data.live_url || undefined,
        poster_url: data.poster_url || undefined,
        components: [],
      } as any;
      loading.value = false;
      return;
    }
  } catch {
    // API failed
  }

  // Fallback to static content if API doesn't have it
  try {
    const localeModules = projectModules[locale.value as Locale];
    if (localeModules && localeModules[project]) {
      const module = await localeModules[project].default;
      content.value = module;
      loading.value = false;
      return;
    }
  } catch {
    // Static not found either
  }

  error.value = new Error(`Project not found: ${project}`);
  loading.value = false;
};

watch(
  [recentProjectId, locale],
  () => {
    if (recentProjectId.value) {
      fetchProject(recentProjectId.value);
    }
  },
  { immediate: true },
);

watch(
  [projectId, isTransitioning, locale],
  () => {
    if (!projectId.value || isTransitioning.value) return;
    lenis.value?.scrollTo(0, { immediate: true });
  },
  { immediate: true },
);
</script>

<template>
  <div
    ref="projectRef"
    :class="[
      'project',
      recentProjectId !== null && `project-${recentProjectId}`,
      isTransitioning && `project-transitioning`,
      projectVisible && `project-visible`,
    ]"
  >
    <div :class="['project-content-wrapper', projectVisible && `project-content-wrapper-visible`]">
      <ProjectContent
        v-if="content && recentProjectId && projectVisible"
        :content="content"
        :projectId="recentProjectId"
      />
      <Footer :class="['project-footer', `project-${recentProjectId}`]"></Footer>
    </div>
  </div>
</template>

<style scoped lang="scss">
.project {
  min-height: calc(var(--lvh) * 100);
  background-color: var(--color-background-300);
  max-width: calc(var(--lvw) * 100);
  overflow: hidden;

  &-content-wrapper {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    width: 100%;
    opacity: 0;
    transition: opacity 0.4s ease-out;

    &-visible {
      opacity: 1;
    }
  }

  &-footer {
    position: relative;
    margin-top: auto;
    color: var(--color-text-400);
  }

  ::selection {
    background: var(--color-accent-400);
    color: var(--color-accent-text-400);
    text-shadow: none;
  }

  ::-moz-selection {
    background: var(--color-accent-400);
    color: var(--color-accent-text-400);
    text-shadow: none;
  }
}
</style>
