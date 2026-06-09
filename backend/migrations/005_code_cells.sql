-- Code cells for project sections
CREATE TABLE IF NOT EXISTS section_code_cells (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_id INTEGER NOT NULL REFERENCES project_images(id) ON DELETE CASCADE,
  title TEXT,
  code TEXT NOT NULL,
  language TEXT DEFAULT 'python',
  output TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
