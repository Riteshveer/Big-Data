<script setup lang="ts">
import { ref, computed } from "vue";
import { api } from "../composables/useApi";

interface DiagramNode {
  id: string;
  label: string;
  icon: string;
  col: number;
  row: number;
}

interface Diagram {
  id: number;
  project_id: string;
  title: string;
  nodes: DiagramNode[];
  edges: [string, string][];
}

const props = defineProps<{ projectId: string }>();
const emit = defineEmits<{ (e: "back"): void }>();

const diagram = ref<Diagram | null>(null);
const loading = ref(true);
const message = ref("");

// Form states
const diagramTitle = ref("");
const nodes = ref<DiagramNode[]>([]);
const edges = ref<[string, string][]>([]);

// Add node form
const newNodeLabel = ref("");
const newNodeIcon = ref("📦");
const newNodeCol = ref(0);
const newNodeRow = ref(0);

// Add edge form
const edgeFrom = ref("");
const edgeTo = ref("");

// Edit node
const editingNodeId = ref<string | null>(null);
const editNodeLabel = ref("");
const editNodeIcon = ref("");
const editNodeCol = ref(0);
const editNodeRow = ref(0);

const load = async () => {
  loading.value = true;
  try {
    const data = await api(`/api/projects/${props.projectId}`);
    const diagrams = data.diagrams || [];
    if (diagrams.length > 0) {
      diagram.value = diagrams[0];
      diagramTitle.value = diagrams[0].title;
      nodes.value = [...diagrams[0].nodes];
      edges.value = [...diagrams[0].edges];
    } else {
      diagram.value = null;
      diagramTitle.value = "Architecture Diagram";
      nodes.value = [];
      edges.value = [];
    }
  } catch (e: any) { showMsg(`Error: ${e.message}`); }
  loading.value = false;
};

const save = async () => {
  try {
    if (diagram.value) {
      // Update existing
      await api(`/api/admin/projects/${props.projectId}/diagrams/${diagram.value.id}`, {
        method: "PUT",
        body: JSON.stringify({ title: diagramTitle.value, nodes: nodes.value, edges: edges.value }),
      });
      showMsg("Diagram saved!");
    } else {
      // Create new
      await api(`/api/admin/projects/${props.projectId}/diagrams`, {
        method: "POST",
        body: JSON.stringify({ title: diagramTitle.value, nodes: nodes.value, edges: edges.value }),
      });
      showMsg("Diagram created!");
    }
    await load();
  } catch (e: any) { showMsg(`Error: ${e.message}`); }
};

const deleteDiagram = async () => {
  if (!diagram.value || !confirm("Delete this diagram?")) return;
  try {
    await api(`/api/admin/projects/${props.projectId}/diagrams/${diagram.value.id}`, { method: "DELETE" });
    showMsg("Diagram deleted");
    await load();
  } catch (e: any) { showMsg(`Error: ${e.message}`); }
};

// --- Nodes ---
const addNode = () => {
  if (!newNodeLabel.value.trim()) { showMsg("Error: Node label is required"); return; }
  const id = `n${Date.now()}`;
  nodes.value.push({ id, label: newNodeLabel.value.trim(), icon: newNodeIcon.value, col: newNodeCol.value, row: newNodeRow.value });
  newNodeLabel.value = "";
  newNodeIcon.value = "📦";
  newNodeCol.value = 0;
  newNodeRow.value = 0;
};

const startEditNode = (node: DiagramNode) => {
  editingNodeId.value = node.id;
  editNodeLabel.value = node.label;
  editNodeIcon.value = node.icon;
  editNodeCol.value = node.col;
  editNodeRow.value = node.row;
};

const saveEditNode = () => {
  if (!editingNodeId.value) return;
  const idx = nodes.value.findIndex(n => n.id === editingNodeId.value);
  if (idx !== -1) {
    nodes.value[idx] = { id: editingNodeId.value, label: editNodeLabel.value, icon: editNodeIcon.value, col: editNodeCol.value, row: editNodeRow.value };
  }
  editingNodeId.value = null;
};

const cancelEditNode = () => { editingNodeId.value = null; };

const deleteNode = (nodeId: string) => {
  nodes.value = nodes.value.filter(n => n.id !== nodeId);
  edges.value = edges.value.filter(e => e[0] !== nodeId && e[1] !== nodeId);
};

// --- Edges ---
const addEdge = () => {
  if (!edgeFrom.value || !edgeTo.value) { showMsg("Error: Select both From and To nodes"); return; }
  if (edgeFrom.value === edgeTo.value) { showMsg("Error: Cannot connect a node to itself"); return; }
  const exists = edges.value.some(e => e[0] === edgeFrom.value && e[1] === edgeTo.value);
  if (exists) { showMsg("Error: This connection already exists"); return; }
  edges.value.push([edgeFrom.value, edgeTo.value]);
  edgeFrom.value = "";
  edgeTo.value = "";
};

const deleteEdge = (idx: number) => { edges.value.splice(idx, 1); };

const getNodeLabel = (id: string) => nodes.value.find(n => n.id === id)?.label || id;

// Preview
const maxCol = computed(() => Math.max(...nodes.value.map(n => n.col), 1));
const maxRow = computed(() => Math.max(...nodes.value.map(n => n.row), 1));

const getPreviewLeft = (node: DiagramNode) => 8 + (node.col / maxCol.value) * 84;
const getPreviewTop = (node: DiagramNode, idx: number) => 8 + (node.row / maxRow.value) * 84;

const showMsg = (msg: string) => { message.value = msg; setTimeout(() => (message.value = ""), 4000); };

load();
</script>

<template>
  <div class="diagram-panel">
    <div class="panel-header">
      <button class="btn-secondary" @click="emit('back')">← Back</button>
      <h3>📊 Chart / Diagram</h3>
      <p v-if="message" :class="['msg', message.startsWith('Error') && 'msg-error']">{{ message }}</p>
    </div>

    <div v-if="loading" class="loading">Loading...</div>

    <template v-else>
      <!-- Title -->
      <div class="field full" style="margin-bottom: 20px;">
        <label>Diagram Title</label>
        <input v-model="diagramTitle" class="field-input" placeholder="e.g. End-to-End Data Pipeline Architecture" />
      </div>

      <!-- Preview -->
      <div class="preview-card" v-if="nodes.length">
        <h4>Preview</h4>
        <div class="preview-area">
          <svg class="preview-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              v-for="(edge, idx) in edges"
              :key="`prev-edge-${idx}`"
              :d="`M${getPreviewLeft(nodes.find(n => n.id === edge[0])!)},${getPreviewTop(nodes.find(n => n.id === edge[0])!, nodes.indexOf(nodes.find(n => n.id === edge[0])!))} L${getPreviewLeft(nodes.find(n => n.id === edge[1])!)},${getPreviewTop(nodes.find(n => n.id === edge[0])!, nodes.indexOf(nodes.find(n => n.id === edge[0])!))} L${getPreviewLeft(nodes.find(n => n.id === edge[1])!)},${getPreviewTop(nodes.find(n => n.id === edge[1])!, nodes.indexOf(nodes.find(n => n.id === edge[1])!))}`"
              stroke="#ff6b35"
              stroke-width="0.3"
              fill="none"
            />
          </svg>
          <div
            v-for="(node, idx) in nodes"
            :key="node.id"
            class="preview-node"
            :style="{ left: `${getPreviewLeft(node)}%`, top: `${getPreviewTop(node, idx)}%` }"
          >
            <span>{{ node.icon }}</span>
            <span class="preview-node-label">{{ node.label }}</span>
          </div>
        </div>
      </div>

      <!-- Nodes -->
      <div class="section-block">
        <h4>🟢 Nodes ({{ nodes.length }})</h4>
        <p class="hint">Each node is a block in the chart. Position it using Column (horizontal) and Row (vertical). Column 0 = leftmost, higher = more right.</p>

        <div class="items-list">
          <div v-for="node in nodes" :key="node.id" class="item-row">
            <template v-if="editingNodeId !== node.id">
              <span class="item-icon">{{ node.icon }}</span>
              <span class="item-label">{{ node.label }}</span>
              <span class="item-pos">col:{{ node.col }} row:{{ node.row }}</span>
              <div class="item-actions">
                <button class="btn-xs btn-edit-xs" @click="startEditNode(node)">✏️</button>
                <button class="btn-xs btn-danger-xs" @click="deleteNode(node.id)">✕</button>
              </div>
            </template>
            <template v-else>
              <div class="edit-node-form">
                <input v-model="editNodeIcon" class="field-input field-sm" style="width:50px" />
                <input v-model="editNodeLabel" class="field-input field-sm" style="flex:1" />
                <input v-model.number="editNodeCol" type="number" class="field-input field-sm" style="width:60px" placeholder="Col" />
                <input v-model.number="editNodeRow" type="number" step="0.5" class="field-input field-sm" style="width:60px" placeholder="Row" />
                <button class="btn-xs btn-save-xs" @click="saveEditNode">✓</button>
                <button class="btn-xs" @click="cancelEditNode">✕</button>
              </div>
            </template>
          </div>
        </div>

        <!-- Add node -->
        <div class="add-form">
          <input v-model="newNodeIcon" class="field-input field-sm" style="width:50px" placeholder="📦" />
          <input v-model="newNodeLabel" class="field-input field-sm" style="flex:1" placeholder="Node label" />
          <input v-model.number="newNodeCol" type="number" class="field-input field-sm" style="width:60px" placeholder="Col" />
          <input v-model.number="newNodeRow" type="number" step="0.5" class="field-input field-sm" style="width:60px" placeholder="Row" />
          <button class="btn-primary btn-sm-primary" @click="addNode">+ Add</button>
        </div>
      </div>

      <!-- Edges -->
      <div class="section-block">
        <h4>🔗 Connections ({{ edges.length }})</h4>
        <p class="hint">Connections define which nodes link together. Select a "From" and "To" node to create a line between them.</p>

        <div class="items-list">
          <div v-for="(edge, idx) in edges" :key="`edge-${idx}`" class="item-row">
            <span class="item-label">{{ getNodeLabel(edge[0]) }}</span>
            <span class="edge-arrow">→</span>
            <span class="item-label">{{ getNodeLabel(edge[1]) }}</span>
            <button class="btn-xs btn-danger-xs" @click="deleteEdge(idx)">✕</button>
          </div>
        </div>

        <!-- Add edge -->
        <div class="add-form">
          <select v-model="edgeFrom" class="field-input field-sm" style="flex:1">
            <option value="">From...</option>
            <option v-for="node in nodes" :key="node.id" :value="node.id">{{ node.icon }} {{ node.label }}</option>
          </select>
          <span class="edge-arrow">→</span>
          <select v-model="edgeTo" class="field-input field-sm" style="flex:1">
            <option value="">To...</option>
            <option v-for="node in nodes" :key="node.id" :value="node.id">{{ node.icon }} {{ node.label }}</option>
          </select>
          <button class="btn-primary btn-sm-primary" @click="addEdge">+ Connect</button>
        </div>
      </div>

      <!-- Save / Delete -->
      <div class="form-actions">
        <button class="btn-primary" @click="save">💾 Save Diagram</button>
        <button v-if="diagram" class="btn-sm btn-danger" @click="deleteDiagram">Delete Diagram</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.diagram-panel { color: #e0e0e0; }
.panel-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.panel-header h3 { color: #fff; margin: 0; }
.hint { font-size: 0.75rem; color: #6b7394; margin-bottom: 12px; line-height: 1.4; }

.preview-card { background: #1a1d2e; border: 1px solid #2e3250; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
.preview-card h4 { color: #c9d1e8; font-size: 0.85rem; margin-bottom: 12px; }
.preview-area { position: relative; width: 100%; height: 280px; background: #f0f2f8; border-radius: 8px; overflow: hidden; }
.preview-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.preview-node { position: absolute; transform: translate(-50%, -50%); background: #fff; border: 1px solid #d1d5e0; border-radius: 8px; padding: 4px 8px; display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 0.65rem; }
.preview-node-label { font-size: 0.55rem; color: #1a1a2e; white-space: nowrap; max-width: 70px; overflow: hidden; text-overflow: ellipsis; }

.section-block { background: #1a1d2e; border: 1px solid #2e3250; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
.section-block h4 { color: #fff; margin-bottom: 8px; font-size: 0.9rem; }

.items-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.item-row { display: flex; align-items: center; gap: 10px; background: #0f1117; border: 1px solid #2e3250; border-radius: 6px; padding: 8px 12px; }
.item-icon { font-size: 1rem; }
.item-label { font-size: 0.8rem; color: #fff; }
.item-pos { font-size: 0.7rem; color: #6b7394; margin-left: auto; }
.item-actions { display: flex; gap: 4px; margin-left: 8px; }
.edge-arrow { color: #ff6b35; font-weight: 700; font-size: 0.9rem; }

.edit-node-form { display: flex; gap: 6px; align-items: center; flex: 1; }

.add-form { display: flex; gap: 8px; align-items: center; }

.field { display: flex; flex-direction: column; gap: 5px; }
.field label { font-size: 0.75rem; color: #8892b0; text-transform: uppercase; letter-spacing: 0.04em; }
.field-input { background: #0f1117; border: 1px solid #2e3250; border-radius: 6px; padding: 9px 12px; color: #fff; font-size: 0.85rem; outline: none; font-family: inherit; }
.field-input:focus { border-color: #4fa3ff; }
.field-sm { padding: 6px 8px; font-size: 0.8rem; }

.form-actions { display: flex; gap: 12px; margin-top: 20px; }
.btn-primary { background: #4fa3ff; color: #fff; border: none; border-radius: 8px; padding: 9px 20px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
.btn-primary:hover { background: #3b8de6; }
.btn-sm-primary { padding: 7px 14px; font-size: 0.8rem; }
.btn-secondary { background: transparent; color: #8892b0; border: 1px solid #2e3250; border-radius: 8px; padding: 9px 20px; font-size: 0.85rem; cursor: pointer; }
.btn-sm { padding: 6px 12px; font-size: 0.75rem; border-radius: 6px; border: 1px solid #2e3250; background: transparent; color: #8892b0; cursor: pointer; }
.btn-sm:hover { background: #1e2235; color: #fff; }
.btn-danger { color: #ff4d6d; border-color: #5c1a2a; }
.btn-danger:hover { background: #3b1020; }
.btn-xs { padding: 4px 8px; font-size: 0.7rem; border-radius: 4px; border: 1px solid #2e3250; background: transparent; color: #8892b0; cursor: pointer; }
.btn-xs:hover { background: #1e2235; color: #fff; }
.btn-edit-xs { color: #fbbf24; border-color: #451a03; }
.btn-danger-xs { color: #ff4d6d; border-color: #5c1a2a; }
.btn-save-xs { color: #34d399; border-color: #064e3b; }
.msg { font-size: 0.85rem; color: #22c55e; }
.msg-error { color: #ff4d6d; }
.loading { color: #8892b0; }
</style>
