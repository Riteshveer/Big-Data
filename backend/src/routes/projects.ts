import { Hono } from "hono";
import type { Env, Project } from "../types";

const projects = new Hono<{ Bindings: Env }>();

// GET /api/projects — public (only published)
projects.get("/", async (c) => {
  const result = await c.env.DB.prepare(
    "SELECT * FROM projects WHERE is_published = 1 ORDER BY sort_order ASC"
  ).all();
  
  const projectsList = result.results.map((p: any) => ({
    ...p,
    tags: JSON.parse(p.tags || "[]"),
  }));

  return c.json(projectsList);
});

// GET /api/projects/all — admin (includes unpublished)
projects.get("/all", async (c) => {
  const result = await c.env.DB.prepare(
    "SELECT * FROM projects ORDER BY sort_order ASC"
  ).all();

  const projectsList = result.results.map((p: any) => ({
    ...p,
    tags: JSON.parse(p.tags || "[]"),
  }));

  return c.json(projectsList);
});

// GET /api/projects/:slug — public
projects.get("/:slug", async (c) => {
  const slug = c.req.param("slug");

  const project = await c.env.DB.prepare(
    "SELECT * FROM projects WHERE slug = ?"
  ).bind(slug).first();

  if (!project) return c.json({ error: "Not found" }, 404);

  const components = await c.env.DB.prepare(
    "SELECT * FROM project_components WHERE project_id = ? ORDER BY sort_order ASC"
  ).bind((project as any).id).all();

  const images = await c.env.DB.prepare(
    "SELECT * FROM project_images WHERE project_id = ? ORDER BY sort_order ASC"
  ).bind((project as any).id).all();

  // Load descriptions for each image/section
  const imagesWithDescriptions = await Promise.all(
    images.results.map(async (img: any) => {
      const descriptions = await c.env.DB.prepare(
        "SELECT * FROM section_descriptions WHERE image_id = ? ORDER BY sort_order ASC"
      ).bind(img.id).all();
      const codeCells = await c.env.DB.prepare(
        "SELECT * FROM section_code_cells WHERE image_id = ? ORDER BY sort_order ASC"
      ).bind(img.id).all();
      return { ...img, descriptions: descriptions.results, codeCells: codeCells.results };
    })
  );

  const diagrams = await c.env.DB.prepare(
    "SELECT * FROM diagrams WHERE project_id = ?"
  ).bind((project as any).id).all();

  return c.json({
    ...(project as any),
    tags: JSON.parse((project as any).tags || "[]"),
    components: components.results.map((comp: any) => ({
      ...comp,
      props: JSON.parse(comp.props || "{}"),
    })),
    images: imagesWithDescriptions,
    diagrams: diagrams.results.map((d: any) => ({
      ...d,
      nodes: JSON.parse(d.nodes || "[]"),
      edges: JSON.parse(d.edges || "[]"),
    })),
  });
});

// POST /api/projects — admin (create)
projects.post("/", async (c) => {
  const body = await c.req.json();
  const id = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  await c.env.DB.prepare(
    `INSERT INTO projects (id, slug, title, description, theme, tags, live_url, source_url, poster_url, sort_order, is_published, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  ).bind(
    id,
    body.slug || id,
    body.title,
    body.description || null,
    body.theme || "light",
    JSON.stringify(body.tags || []),
    body.live_url || null,
    body.source_url || null,
    body.poster_url || null,
    body.sort_order || 0,
    body.is_published !== undefined ? (body.is_published ? 1 : 0) : 1,
  ).run();

  return c.json({ id, success: true }, 201);
});

// PUT /api/projects/:id — admin (update)
projects.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  await c.env.DB.prepare(
    `UPDATE projects SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      theme = COALESCE(?, theme),
      tags = COALESCE(?, tags),
      live_url = ?,
      source_url = ?,
      poster_url = ?,
      sort_order = COALESCE(?, sort_order),
      is_published = COALESCE(?, is_published),
      updated_at = datetime('now')
    WHERE id = ?`
  ).bind(
    body.title || null,
    body.description || null,
    body.theme || null,
    body.tags ? JSON.stringify(body.tags) : null,
    body.live_url !== undefined ? body.live_url : null,
    body.source_url !== undefined ? body.source_url : null,
    body.poster_url !== undefined ? body.poster_url : null,
    body.sort_order !== undefined ? body.sort_order : null,
    body.is_published !== undefined ? (body.is_published ? 1 : 0) : null,
    id,
  ).run();

  return c.json({ success: true });
});

// DELETE /api/projects/:id — admin
projects.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM projects WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// --- Project Components ---

// POST /api/projects/:id/components
projects.post("/:id/components", async (c) => {
  const projectId = c.req.param("id");
  const body = await c.req.json();

  const result = await c.env.DB.prepare(
    "INSERT INTO project_components (project_id, type, props, sort_order) VALUES (?, ?, ?, ?)"
  ).bind(projectId, body.type, JSON.stringify(body.props || {}), body.sort_order || 0).run();

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
});

// PUT /api/projects/:id/components/:compId
projects.put("/:id/components/:compId", async (c) => {
  const compId = c.req.param("compId");
  const body = await c.req.json();

  await c.env.DB.prepare(
    "UPDATE project_components SET type = ?, props = ?, sort_order = ? WHERE id = ?"
  ).bind(body.type, JSON.stringify(body.props || {}), body.sort_order || 0, compId).run();

  return c.json({ success: true });
});

// DELETE /api/projects/:id/components/:compId
projects.delete("/:id/components/:compId", async (c) => {
  const compId = c.req.param("compId");
  await c.env.DB.prepare("DELETE FROM project_components WHERE id = ?").bind(compId).run();
  return c.json({ success: true });
});

// --- Project Images ---

// POST /api/projects/:id/images
projects.post("/:id/images", async (c) => {
  const projectId = c.req.param("id");
  const body = await c.req.json();

  const result = await c.env.DB.prepare(
    "INSERT INTO project_images (project_id, url, alt, caption, sort_order) VALUES (?, ?, ?, ?, ?)"
  ).bind(projectId, body.url, body.alt || null, body.caption || null, body.sort_order || 0).run();

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
});

// DELETE /api/projects/:id/images/:imgId
projects.delete("/:id/images/:imgId", async (c) => {
  const imgId = c.req.param("imgId");
  await c.env.DB.prepare("DELETE FROM project_images WHERE id = ?").bind(imgId).run();
  return c.json({ success: true });
});

// PUT /api/projects/:id/images/:imgId (update sort order, alt, caption, url)
projects.put("/:id/images/:imgId", async (c) => {
  const imgId = c.req.param("imgId");
  const body = await c.req.json();

  const sets: string[] = [];
  const values: any[] = [];

  if (body.sort_order !== undefined) { sets.push("sort_order = ?"); values.push(body.sort_order); }
  if (body.alt !== undefined) { sets.push("alt = ?"); values.push(body.alt); }
  if (body.caption !== undefined) { sets.push("caption = ?"); values.push(body.caption); }
  if (body.url !== undefined) { sets.push("url = ?"); values.push(body.url); }

  if (sets.length === 0) return c.json({ success: true });

  values.push(imgId);
  await c.env.DB.prepare(`UPDATE project_images SET ${sets.join(", ")} WHERE id = ?`).bind(...values).run();
  return c.json({ success: true });
});

// --- Section Descriptions ---

// GET /api/projects/:id/images/:imgId/descriptions
projects.get("/:id/images/:imgId/descriptions", async (c) => {
  const imgId = c.req.param("imgId");
  const result = await c.env.DB.prepare(
    "SELECT * FROM section_descriptions WHERE image_id = ? ORDER BY sort_order ASC"
  ).bind(imgId).all();
  return c.json(result.results);
});

// POST /api/projects/:id/images/:imgId/descriptions
projects.post("/:id/images/:imgId/descriptions", async (c) => {
  const imgId = c.req.param("imgId");
  const body = await c.req.json();

  const result = await c.env.DB.prepare(
    "INSERT INTO section_descriptions (image_id, title, text, sort_order) VALUES (?, ?, ?, ?)"
  ).bind(imgId, body.title || null, body.text || "", body.sort_order || 0).run();

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
});

// PUT /api/projects/:id/images/:imgId/descriptions/:descId
projects.put("/:id/images/:imgId/descriptions/:descId", async (c) => {
  const descId = c.req.param("descId");
  const body = await c.req.json();

  const sets: string[] = [];
  const values: any[] = [];

  if (body.title !== undefined) { sets.push("title = ?"); values.push(body.title); }
  if (body.text !== undefined) { sets.push("text = ?"); values.push(body.text); }
  if (body.sort_order !== undefined) { sets.push("sort_order = ?"); values.push(body.sort_order); }

  if (sets.length === 0) return c.json({ success: true });

  values.push(descId);
  await c.env.DB.prepare(`UPDATE section_descriptions SET ${sets.join(", ")} WHERE id = ?`).bind(...values).run();
  return c.json({ success: true });
});

// DELETE /api/projects/:id/images/:imgId/descriptions/:descId
projects.delete("/:id/images/:imgId/descriptions/:descId", async (c) => {
  const descId = c.req.param("descId");
  await c.env.DB.prepare("DELETE FROM section_descriptions WHERE id = ?").bind(descId).run();
  return c.json({ success: true });
});

// --- Section Code Cells ---

// POST /api/projects/:id/images/:imgId/code-cells
projects.post("/:id/images/:imgId/code-cells", async (c) => {
  const imgId = c.req.param("imgId");
  const body = await c.req.json();

  const result = await c.env.DB.prepare(
    "INSERT INTO section_code_cells (image_id, title, code, language, output, sort_order) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(imgId, body.title || null, body.code || "", body.language || "python", body.output || null, body.sort_order || 0).run();

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
});

// PUT /api/projects/:id/images/:imgId/code-cells/:cellId
projects.put("/:id/images/:imgId/code-cells/:cellId", async (c) => {
  const cellId = c.req.param("cellId");
  const body = await c.req.json();

  const sets: string[] = [];
  const values: any[] = [];

  if (body.title !== undefined) { sets.push("title = ?"); values.push(body.title); }
  if (body.code !== undefined) { sets.push("code = ?"); values.push(body.code); }
  if (body.language !== undefined) { sets.push("language = ?"); values.push(body.language); }
  if (body.output !== undefined) { sets.push("output = ?"); values.push(body.output); }
  if (body.sort_order !== undefined) { sets.push("sort_order = ?"); values.push(body.sort_order); }

  if (sets.length === 0) return c.json({ success: true });

  values.push(cellId);
  await c.env.DB.prepare(`UPDATE section_code_cells SET ${sets.join(", ")} WHERE id = ?`).bind(...values).run();
  return c.json({ success: true });
});

// DELETE /api/projects/:id/images/:imgId/code-cells/:cellId
projects.delete("/:id/images/:imgId/code-cells/:cellId", async (c) => {
  const cellId = c.req.param("cellId");
  await c.env.DB.prepare("DELETE FROM section_code_cells WHERE id = ?").bind(cellId).run();
  return c.json({ success: true });
});

// --- Diagrams ---

// POST /api/projects/:id/diagrams
projects.post("/:id/diagrams", async (c) => {
  const projectId = c.req.param("id");
  const body = await c.req.json();

  const result = await c.env.DB.prepare(
    "INSERT INTO diagrams (project_id, title, nodes, edges, updated_at) VALUES (?, ?, ?, ?, datetime('now'))"
  ).bind(projectId, body.title, JSON.stringify(body.nodes || []), JSON.stringify(body.edges || [])).run();

  return c.json({ id: result.meta.last_row_id, success: true }, 201);
});

// PUT /api/projects/:id/diagrams/:diagId
projects.put("/:id/diagrams/:diagId", async (c) => {
  const diagId = c.req.param("diagId");
  const body = await c.req.json();

  await c.env.DB.prepare(
    "UPDATE diagrams SET title = ?, nodes = ?, edges = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(body.title, JSON.stringify(body.nodes || []), JSON.stringify(body.edges || []), diagId).run();

  return c.json({ success: true });
});

// DELETE /api/projects/:id/diagrams/:diagId
projects.delete("/:id/diagrams/:diagId", async (c) => {
  const diagId = c.req.param("diagId");
  await c.env.DB.prepare("DELETE FROM diagrams WHERE id = ?").bind(diagId).run();
  return c.json({ success: true });
});

export { projects };
