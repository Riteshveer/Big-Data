# Portfolio Backend — Cloudflare Workers

## Setup

### 1. Create Cloudflare resources

```bash
# Login to Cloudflare
npx wrangler login

# Create D1 database
npx wrangler d1 create portfolio-db
# Copy the database_id and paste it in wrangler.toml

# Create R2 bucket
npx wrangler r2 bucket create portfolio-assets
```

### 2. Update wrangler.toml

Replace `YOUR_DATABASE_ID_HERE` with the actual database ID from step 1.

### 3. Set secrets

```bash
npx wrangler secret put ADMIN_PASSWORD
# Enter your desired admin password

npx wrangler secret put JWT_SECRET
# Enter a random 32+ character string
```

### 4. Run migrations

```bash
# Local development
npm run db:migrate
npm run db:seed

# Remote (production)
npm run db:migrate:remote
```

### 5. Development

```bash
npm run dev
# API runs at http://localhost:8787
```

### 6. Deploy

```bash
npm run deploy
```

## API Endpoints

### Public (no auth)
- `GET /api/settings` — Site settings
- `GET /api/projects` — Published projects
- `GET /api/projects/:slug` — Single project with components
- `GET /api/blog` — Published blog posts
- `GET /api/blog/:slug` — Single blog post
- `GET /assets/*` — Uploaded files from R2

### Auth
- `POST /api/auth/login` — `{ username, password }` → `{ token }`

### Admin (requires Bearer token)
- `PUT /api/admin/settings` — Bulk update settings
- `PUT /api/admin/settings/:key` — Update single setting
- `GET /api/admin/projects/all` — All projects (inc. unpublished)
- `POST /api/admin/projects` — Create project
- `PUT /api/admin/projects/:id` — Update project
- `DELETE /api/admin/projects/:id` — Delete project
- `POST /api/admin/projects/:id/components` — Add component
- `PUT /api/admin/projects/:id/components/:compId` — Edit component
- `DELETE /api/admin/projects/:id/components/:compId` — Delete component
- `POST /api/admin/projects/:id/images` — Add image ref
- `DELETE /api/admin/projects/:id/images/:imgId` — Remove image
- `POST /api/admin/projects/:id/diagrams` — Add diagram
- `PUT /api/admin/projects/:id/diagrams/:diagId` — Edit diagram
- `DELETE /api/admin/projects/:id/diagrams/:diagId` — Delete diagram
- `POST /api/admin/uploads` — Upload file (multipart/form-data)
- `GET /api/admin/uploads` — List uploads
- `DELETE /api/admin/uploads/:id` — Delete upload
- `GET /api/admin/blog/all` — All posts (inc. drafts)
- `POST /api/admin/blog` — Create post
- `PUT /api/admin/blog/:slug` — Update post
- `DELETE /api/admin/blog/:slug` — Delete post

## Admin Credentials
- Username: `ritesh` (set in wrangler.toml)
- Password: set via `wrangler secret put ADMIN_PASSWORD`
