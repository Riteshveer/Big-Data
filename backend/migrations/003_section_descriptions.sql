-- Project section descriptions (multiple per image/section)
CREATE TABLE IF NOT EXISTS section_descriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_id INTEGER NOT NULL REFERENCES project_images(id) ON DELETE CASCADE,
  title TEXT,
  text TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
