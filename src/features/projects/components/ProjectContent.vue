<script setup lang="ts">
import Layout from "../../../components/Layout.vue";
import ProjectHero from "./ProjectHero.vue";
import ProjectComponent from "./ProjectComponent.vue";
import ArchitectureDiagram from "./ArchitectureDiagram.vue";
import Link from "../../../components/Link.vue";
import NextProject from "./NextProject.vue";
import { locale } from "../../../i18n/store";
import { previews } from "../../../content/projects/previews";
import { ref, computed, watch, onMounted } from "vue";

import type { ProjectContent, ProjectPreview } from "../../../content/types";

interface SectionDescription {
  id: number;
  title: string | null;
  text: string;
  sort_order: number;
}

interface ProjectSection {
  id: number;
  url: string;
  alt: string | null;
  sort_order: number;
  descriptions: SectionDescription[];
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8787";

const { content, projectId } = defineProps<{
  content: ProjectContent;
  projectId: string;
}>();

const resolveUrl = (path: string): string => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
};

const loadedPreviews = ref<ProjectPreview[] | null>(null);
const sections = ref<ProjectSection[]>([]);
const hasDiagram = ref(false);

// Check if static content already has an architectureDiagram component
const hasStaticDiagram = computed(() =>
  content.components?.some(c => c.type === "architectureDiagram") ?? false
);

const loadPreviews = async () => {
  const module = await previews[locale.value as keyof typeof previews]();
  loadedPreviews.value = module.default;
};

const loadSections = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}`);
    if (res.ok) {
      const data = await res.json();
      const images = data.images || [];
      sections.value = images
        .map((img: any) => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
          sort_order: img.sort_order,
          descriptions: (img.descriptions || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
        }))
        .sort((a: ProjectSection, b: ProjectSection) => a.sort_order - b.sort_order);

      // Check if project has a diagram in DB
      hasDiagram.value = (data.diagrams || []).length > 0 && (data.diagrams[0].nodes || []).length > 0;
    }
  } catch {
    // Silently fail — sections are optional enhancement
  }
};

const nextProject = computed(() => {
  const previews = loadedPreviews.value;
  if (!previews) return null;

  const currentIndex = previews.findIndex((p) => p.slug === projectId);
  if (currentIndex === -1) return null;

  const nextIndex = (currentIndex + 1) % previews.length;

  return previews[nextIndex];
});

watch(locale, loadPreviews);

onMounted(() => {
  loadPreviews();
  loadSections();
});
</script>

<template>
  <Layout class="project-content">
    <ProjectHero :content="content" :projectId="projectId" />
    <div class="project-content-components">
      <!-- Dynamic diagram from API (only if not already in static components) -->
      <div v-if="hasDiagram && !hasStaticDiagram" class="grid project-content-grid">
        <ArchitectureDiagram />
      </div>

      <div
        v-for="(component, index) in content.components"
        :key="`${component.type}-${index}`"
        class="grid project-content-grid"
      >
        <ProjectComponent :type="component.type" :props="component.props" :index="index" />
      </div>

      <!-- Dynamic sections from API -->
      <div
        v-for="(section, idx) in sections"
        :key="`section-${section.id}`"
        class="project-section"
      >
        <div class="project-section-image-wrapper">
          <img :src="resolveUrl(section.url)" :alt="section.alt || ''" loading="lazy" class="project-section-image" />
          <div class="project-section-number">{{ idx + 1 }}</div>
        </div>
        <div class="project-section-body">
          <h3 v-if="section.alt" class="project-section-heading">{{ section.alt }}</h3>
          <div
            v-for="desc in section.descriptions"
            :key="desc.id"
            class="project-section-desc"
          >
            <h4 v-if="desc.title" class="project-section-desc-title">{{ desc.title }}</h4>
            <p class="project-section-desc-text">{{ desc.text }}</p>
          </div>
        </div>
      </div>
    </div>
    <div class="grid project-content-next-project-grid">
      <Link
        v-if="nextProject"
        :to="`/project/${nextProject.slug}`"
        replace
        class="project-content-next-project"
        data-cursor="arrow"
        data-sound="click"
      >
        <NextProject :project="nextProject" />
      </Link>
    </div>
  </Layout>
</template>

<style scoped lang="scss">
.project-content {
  color: var(--color-text-400);

  &-grid {
    row-gap: var(--space-sm);

    @include mixins.mq("md") {
      row-gap: var(--space-xxl);
    }
  }

  &-next-project {
    grid-column: 1 / 13;

    @include mixins.mq("md") {
      grid-column: 3 / 11;
    }

    @include mixins.mq("lg") {
      grid-column: 4 / 10;
    }

    @include mixins.mq("xl") {
      grid-column: 5 / 9;
    }

    &-grid {
      padding: 0 var(--space-outer);
      padding-top: var(--space-xl);
      padding-bottom: var(--space-xxxl);
    }
  }

  &-components {
    padding: 20px var(--space-outer);
    background-color: var(--color-background-400);
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-xxl);
    gap: var(--space-xxl);

    @include mixins.mq("md") {
      padding: 64px var(--space-outer);
    }
  }
}

.project-section {
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);

  &-image-wrapper {
    position: relative;
    width: 100%;
    border-radius: var(--radius-lg);
    overflow: hidden;
    background-color: var(--color-background-300);
  }

  &-image {
    width: 100%;
    height: auto;
    display: block;
  }

  &-number {
    position: absolute;
    top: 12px;
    left: 12px;
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    font-weight: 700;
    font-size: 0.85rem;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    @include mixins.mq("md") {
      top: 16px;
      left: 16px;
      width: 38px;
      height: 38px;
      font-size: 1rem;
    }
  }

  &-body {
    padding: 0 var(--space-xs);

    @include mixins.mq("md") {
      padding: 0 var(--space-sm);
    }
  }

  &-heading {
    font-size: var(--font-size-lg);
    font-weight: 700;
    margin-bottom: var(--space-sm);
    color: var(--color-text-400);

    @include mixins.mq("md") {
      font-size: var(--font-size-xl);
    }
  }

  &-desc {
    margin-bottom: var(--space-sm);

    &:last-child {
      margin-bottom: 0;
    }

    &-title {
      font-size: var(--font-size-md);
      font-weight: 600;
      color: var(--color-text-300);
      margin-bottom: var(--space-xxs);

      @include mixins.mq("md") {
        font-size: var(--font-size-lg);
      }
    }

    &-text {
      font-size: var(--font-size-sm);
      line-height: 1.7;
      color: var(--color-text-200);

      @include mixins.mq("md") {
        font-size: var(--font-size-md);
      }
    }
  }
}
</style>
