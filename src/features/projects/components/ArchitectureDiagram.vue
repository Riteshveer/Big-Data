<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from "vue";
import { recentProjectId } from "../../../composables/useRouteObserver";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8787";

interface DiagramNode {
  id: string;
  label: string;
  icon: string;
  col: number;
  row: number;
}

interface DiagramData {
  title: string;
  nodes: DiagramNode[];
  edges: [string, string][];
}

const wrapperRef = ref<HTMLDivElement | null>(null);
const animated = ref(false);
const isMobile = ref(false);
const diagramData = ref<DiagramData | null>(null);
const loaded = ref(false);

let observer: IntersectionObserver | null = null;
let timeouts: ReturnType<typeof setTimeout>[] = [];

const loadDiagram = async () => {
  const slug = recentProjectId.value;
  if (!slug) return;
  try {
    const res = await fetch(`${API_BASE}/api/projects/${slug}`);
    if (!res.ok) return;
    const data = await res.json();
    const diagrams = data.diagrams || [];
    if (diagrams.length > 0) {
      const d = diagrams[0];
      diagramData.value = {
        title: d.title || "Architecture",
        nodes: d.nodes || [],
        edges: (d.edges || []).map((e: any) => [e[0], e[1]]),
      };
    }
  } catch {
    // Use no diagram if API fails
  }
  loaded.value = true;
};

const maxCol = computed(() => {
  if (!diagramData.value || !diagramData.value.nodes.length) return 1;
  return Math.max(...diagramData.value.nodes.map(n => n.col), 1);
});

const maxRow = computed(() => {
  if (!diagramData.value || !diagramData.value.nodes.length) return 1;
  return Math.max(...diagramData.value.nodes.map(n => n.row), 1);
});

const getNodeLeft = (node: DiagramNode, index: number) => {
  if (isMobile.value) return 50;
  return 8 + (node.col / maxCol.value) * 84;
};

const getNodeTop = (node: DiagramNode, index: number) => {
  if (!diagramData.value) return 0;
  if (isMobile.value) return 4 + (index / Math.max(diagramData.value.nodes.length - 1, 1)) * 92;
  return 8 + (node.row / maxRow.value) * 84;
};

const getNodeStyle = (node: DiagramNode, index: number) => {
  return {
    left: `${getNodeLeft(node, index)}%`,
    top: `${getNodeTop(node, index)}%`,
  };
};

const getEdgePath = (edge: [string, string]) => {
  if (!diagramData.value) return "";
  const fromNode = diagramData.value.nodes.find(n => n.id === edge[0]);
  const toNode = diagramData.value.nodes.find(n => n.id === edge[1]);
  if (!fromNode || !toNode) return "";

  const fromIdx = diagramData.value.nodes.indexOf(fromNode);
  const toIdx = diagramData.value.nodes.indexOf(toNode);

  const x1 = getNodeLeft(fromNode, fromIdx);
  const y1 = getNodeTop(fromNode, fromIdx);
  const x2 = getNodeLeft(toNode, toIdx);
  const y2 = getNodeTop(toNode, toIdx);

  if (isMobile.value) {
    return `M${x1},${y1} L${x2},${y2}`;
  }
  return `M${x1},${y1} L${x2},${y1} L${x2},${y2}`;
};

const resetAnimation = () => {
  animated.value = false;
  timeouts.forEach(clearTimeout);
  timeouts = [];

  if (!wrapperRef.value) return;
  const nodes = wrapperRef.value.querySelectorAll(".graph-node");
  const edges = wrapperRef.value.querySelectorAll(".graph-edge");
  nodes.forEach(n => n.classList.remove("visible"));
  edges.forEach(e => e.classList.remove("drawn"));
};

const triggerAnimation = () => {
  if (animated.value || !wrapperRef.value || !diagramData.value) return;
  animated.value = true;

  const nodeEls = wrapperRef.value.querySelectorAll(".graph-node");
  const edgeEls = wrapperRef.value.querySelectorAll(".graph-edge") as NodeListOf<SVGPathElement>;

  edgeEls.forEach(path => {
    const len = path.getTotalLength();
    path.style.setProperty("--path-length", `${len}`);
    path.setAttribute("stroke-dasharray", `${len}`);
    path.setAttribute("stroke-dashoffset", `${len}`);
  });

  const columns = new Map<number, HTMLElement[]>();
  nodeEls.forEach(el => {
    const node = diagramData.value!.nodes.find(n => n.id === el.getAttribute("data-id"));
    if (!node) return;
    if (!columns.has(node.col)) columns.set(node.col, []);
    columns.get(node.col)!.push(el as HTMLElement);
  });

  const sortedCols = [...columns.keys()].sort((a, b) => a - b);
  let layerDelay = 0;

  sortedCols.forEach(col => {
    const colNodes = columns.get(col)!;
    colNodes.forEach(node => {
      const t = setTimeout(() => node.classList.add("visible"), layerDelay);
      timeouts.push(t);
    });

    const edgeDelay = layerDelay + 600;
    edgeEls.forEach((edgePath, edgeIndex) => {
      const edgeData = diagramData.value!.edges[edgeIndex];
      if (!edgeData) return;
      const sourceNode = diagramData.value!.nodes.find(n => n.id === edgeData[0]);
      if (!sourceNode || sourceNode.col !== col) return;
      const t = setTimeout(() => edgePath.classList.add("drawn"), edgeDelay);
      timeouts.push(t);
    });

    layerDelay += 1400;
  });
};

const checkMobile = () => { isMobile.value = window.innerWidth < 768; };

onMounted(async () => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
  await loadDiagram();

  nextTick(() => {
    observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) triggerAnimation();
        else resetAnimation();
      },
      { threshold: 0.1 },
    );
    if (wrapperRef.value) observer.observe(wrapperRef.value);
  });
});

onUnmounted(() => {
  observer?.disconnect();
  timeouts.forEach(clearTimeout);
  window.removeEventListener("resize", checkMobile);
});
</script>

<template>
  <div ref="wrapperRef" class="graph-wrapper" v-if="diagramData && diagramData.nodes.length">
    <h3 class="graph-title">{{ diagramData.title }}</h3>
    <div class="graph-container">
      <svg class="graph-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          v-for="(edge, idx) in diagramData.edges"
          :key="`edge-${idx}`"
          class="graph-edge"
          :d="getEdgePath(edge)"
        />
      </svg>
      <div
        v-for="(node, index) in diagramData.nodes"
        :key="node.id"
        class="graph-node"
        :data-id="node.id"
        :style="getNodeStyle(node, index)"
      >
        <span class="graph-node-icon">{{ node.icon }}</span>
        <span class="graph-node-label">{{ node.label }}</span>
      </div>
    </div>
  </div>
  <div v-else-if="loaded" class="graph-wrapper graph-empty">
    <!-- No diagram configured for this project -->
  </div>
</template>

<style scoped lang="scss">
.graph-wrapper {
  width: 100%;
  padding: 40px 16px;
  background: transparent;
  border-radius: var(--radius-xl, 16px);
  grid-column: 1 / 13;
  overflow: hidden;
}

.graph-empty { display: none; }

.graph-title {
  text-align: center;
  font-family: "IBM Plex Mono", "Space Mono", monospace;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-400, #1a1a2e);
  margin-bottom: 32px;
  letter-spacing: 0.02em;

  @media (min-width: 768px) {
    font-size: 1.15rem;
    margin-bottom: 40px;
  }
}

.graph-container {
  position: relative;
  width: 100%;
  height: 500px;

  @media (min-width: 768px) { height: 400px; }
  @media (min-width: 1200px) { height: 420px; }
}

.graph-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.graph-edge {
  stroke: #ff6b35;
  stroke-width: 0.15;
  fill: none;
  stroke-linecap: square;
  stroke-linejoin: miter;
  stroke-dasharray: var(--path-length);
  stroke-dashoffset: var(--path-length);
  transition: stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1);

  &.drawn { stroke-dashoffset: 0; }
}

.graph-node {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 90px;
  padding: 8px 6px;
  background: rgba(240, 242, 248, 0.95);
  border: 1px solid #d1d5e0;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  z-index: 1;
  opacity: 0;
  transform: translate(-50%, -50%) translateY(12px);
  transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.8s ease;

  @media (min-width: 768px) { width: 110px; padding: 10px 8px; gap: 4px; }
  @media (min-width: 1200px) { width: 125px; padding: 12px 10px; }

  &.visible {
    opacity: 1;
    transform: translate(-50%, -50%) translateY(0);
    animation: nodeGlow 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  &-icon {
    font-size: 1rem;
    line-height: 1;
    @media (min-width: 768px) { font-size: 1.2rem; }
  }

  &-label {
    font-family: "IBM Plex Mono", "Space Mono", monospace;
    font-size: 0.55rem;
    font-weight: 500;
    color: var(--color-text-400, #1a1a2e);
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 80px;

    @media (min-width: 768px) { font-size: 0.68rem; max-width: 100px; }
    @media (min-width: 1200px) { font-size: 0.72rem; max-width: 115px; }
  }
}

@keyframes nodeGlow {
  0% { box-shadow: 0 0 0px rgba(37, 99, 235, 0); }
  50% { box-shadow: 0 0 16px rgba(37, 99, 235, 0.2); }
  100% { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06); }
}
</style>
