export interface Env {
  DB: D1Database;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
  JWT_SECRET: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  theme: string;
  tags: string;
  live_url: string | null;
  source_url: string | null;
  poster_url: string | null;
  sort_order: number;
  is_published: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectComponent {
  id: number;
  project_id: string;
  type: string;
  props: string;
  sort_order: number;
}

export interface Diagram {
  id: number;
  project_id: string;
  title: string;
  nodes: string;
  edges: string;
}

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  cover_image_url: string | null;
  tags: string;
  is_published: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  key: string;
  value: string;
}
