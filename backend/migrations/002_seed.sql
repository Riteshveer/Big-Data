-- Seed initial settings
INSERT OR REPLACE INTO settings (key, value) VALUES
  ('hero_name_line1', 'Ritesh'),
  ('hero_name_line2', 'Veer'),
  ('hero_job_title', 'Big Data Engineer'),
  ('about_intro', 'Big Data Engineer specializing in scalable pipelines and high-performance data architectures. I turn complex raw data into actionable insights — backed by hands-on experience in Data Science and Analytics.'),
  ('about_tagline', 'Big Data Engineer specializing in scalable pipelines and high-performance data architectures. I turn complex raw data into actionable insights — backed by hands-on experience in Data Science and Analytics.'),
  ('location', 'Pune'),
  ('email', 'riteshveer0326@gmail.com'),
  ('github_url', 'https://github.com/Riteshveer'),
  ('linkedin_url', 'https://www.linkedin.com/in/riteshveer');

-- Seed initial project
INSERT OR REPLACE INTO projects (id, slug, title, description, theme, tags, source_url, sort_order) VALUES
  ('streakon', 'streakon', 'AI-Powered Customer Analytics Platform',
   'Modern enterprises generate millions of customer interactions daily across websites, mobile apps, CRM systems, and transaction platforms. Traditional analytics struggle with real-time processing, resulting in delayed reporting and missed opportunities.<br/><br/>This platform implements a scalable end-to-end big data and AI ecosystem capable of ingesting, processing, analyzing, and predicting customer behavior in real time.',
   'light',
   '["pyspark","kafka","airflow","databricks","snowflake","tensorflow","docker","kubernetes"]',
   'https://github.com/Riteshveer',
   0),
  ('cubewar', 'cubewar', 'CubeWar',
   'CubeWar is a real-time multiplayer strategy game where players compete on a shared 3D grid.',
   'dark',
   '["three","websockets","node","redis"]',
   NULL,
   1);
