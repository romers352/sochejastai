# Production Deployment Guide

This project is a Next.js 15 (App Router) application with a custom Node server option and a MySQL database. It reads and writes JSON files under `data/` and serves user-uploaded assets from `public/uploads/`. Follow this guide to deploy safely in production.

## Prerequisites

- Node.js LTS (v18+ recommended)
- MySQL 8.x (or compatible)
- A reverse proxy (Nginx/Apache) or a platform that terminates TLS
- Persistent storage for `data/` and `public/uploads/` if your app needs runtime writes

## Environment Configuration

1. Create `.env.production` based on `.env.production.example` and set secure values:
   - `ADMIN_PASSWORD_HASH` (preferred) or `ADMIN_PASSWORD`
   - `JWT_SECRET` (long, random, unique)
   - MySQL connection settings (`MYSQL_*`)
   - Optional: `ADMIN_TOKEN_TTL_MINUTES` or `ADMIN_TOKEN_TTL_HOURS`

2. Generate a bcrypt hash for your admin password:
   ```
   node scripts/generate-admin-password.js "your-strong-password"
   ```
   Copy the output into `ADMIN_PASSWORD_HASH` and remove `ADMIN_PASSWORD`.

## Build and Start Options

Choose one of these approaches (all assume Windows PowerShell or Linux shell):

- Built-in Next server (good default):
  ```
  npm ci
  npm run build
  npm run start
  ```

- Standalone output (for Docker or minimal Node runtime):
  ```
  npm ci
  npm run build
  npm run start:standalone
  ```
  This starts `.next/standalone/server.js` which includes only necessary files.

- Custom server file (simple Node HTTP server):
  ```
  npm ci
  npm run build
  npm run start:file
  ```

## CloudLinux / NodeJS Selector (Build OOM)

If you see `WebAssembly.instantiate(): Out of memory` during `next build`, CloudLinux may be running SWC in WebAssembly with tight LVE memory caps.

Try these steps in the NodeJS App UI (Environment Variables) or via SSH inside the Selector’s virtual env:

- Force native SWC bindings:
  - `NEXT_DISABLE_SWC_WASM=1`
  - Ensure native SWC package is installed. This repo includes `@next/swc-linux-x64-gnu@15.5.4` in `dependencies`. If your host is Alpine (musl), replace with `@next/swc-linux-x64-musl@15.5.4`.
- Increase Node heap (if allowed by limits):
  - `NODE_OPTIONS=--max-old-space-size=2048`
- Optionally disable minification to reduce memory (wired in `next.config.mjs`):
  - `DISABLE_MINIFY=1`

Then re-run: `npm ci` → `npm run build`.

If build still fails, build off-server on a compatible Linux x64 host and upload only runtime artifacts (`.next/standalone`, `.next/static`, `public/`, `data/`, and `.env.production`), then start:

```
node .next/standalone/server.js
```

Note: Do not upload `node_modules` when using NodeJS Selector; it creates a `node_modules` symlink into the virtual environment.

## Reverse Proxy (HTTPS)

Terminate TLS at a reverse proxy and forward to your app (example Nginx snippet):
```
server {
  listen 443 ssl http2;
  server_name your.domain;

  # ssl_certificate /path/to/fullchain.pem;
  # ssl_certificate_key /path/to/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## Security Notes

- Security headers are set globally via `next.config.ts`:
  - `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `X-XSS-Protection`, `Strict-Transport-Security`, `Permissions-Policy`
- Ensure you run behind HTTPS to activate HSTS (`Strict-Transport-Security`).
- Set `JWT_SECRET` to a strong value; never commit real secrets.
- Rate limiting is in-memory (`src/lib/rate-limiter.ts`). For multiple instances or distributed deployments, use Redis or a similar central store.
- If deploying to a serverless platform (e.g., Vercel), note that writes to `data/` are not persistent. Move these settings to a database or another persistent store.

## Persistence and Backups

- Backup `public/uploads/` regularly.
- If you rely on JSON files in `data/`, back them up or migrate settings to MySQL.

## MySQL

- Configure `MYSQL_*` variables and ensure the schema is applied (`db/schema.sql`).
- Verify connectivity from your app host to the database (firewall, SSL if needed).

## Operations

- Windows: run via PowerShell or use a service manager like NSSM.
- Linux: use a process manager (PM2 or systemd) and set environment variables for the service.
 - Monitor logs and health; consider an uptime monitor.

## Seeding Demo Content

To quickly populate example Testimonials and Services in MySQL:

1. Ensure your MySQL environment variables are set locally (or point to your target DB):
   - `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`
   - Optional: `MYSQL_SSL=1` and `MYSQL_CA` for SSL
2. Run:
   ```
   npm run seed:demo
   ```
   This script creates tables if needed and inserts demo rows only when the tables are empty.
3. Rerun your app and verify content under Admin.

## Ports

- Default port is `4000`. Adjust `PORT` in `.env.production` or your service definition.

## Caching

- Static Next assets are cached automatically.
- Uploads under `/uploads/*` are cached for 1 day by headers in `next.config.ts`. Adjust if your content changes more frequently.

## Vercel (GitHub) Deployment

Vercel is a great fit for Next.js, but note two key constraints when using your hosting provider's MySQL:

- Serverless filesystem is ephemeral: writes to `public/uploads/` and `data/` do not persist. Use a persistent storage service (Vercel Blob, S3, or your hosting server) for uploads and settings, or host the admin upload endpoints on your server.
- Outbound IPs are dynamic: firewall IP allowlists to your MySQL host may fail without a static egress IP. Ensure your MySQL server is reachable from the public internet with SSL and strong credentials, or use a proxy/API on your hosting.

### Steps

- Push to GitHub:
  - Initialize repository locally and commit (ensure no real secrets in `.env*`):
    ```
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin https://github.com/<your-username>/<repo>.git
    git push -u origin main
    ```
- Create a Vercel project:
  - Import the GitHub repo in Vercel.
  - Framework preset: Next.js.
  - Build command: `next build` (default). No CloudLinux flags are needed on Vercel.
  - Output: handled by Vercel automatically.
- Define Environment Variables in Vercel (Project → Settings → Environment Variables):
  - `NODE_ENV=production`
  - `JWT_SECRET=<strong-random-string>`
  - `ADMIN_PASSWORD_HASH=<bcrypt hash>` (recommended) or `ADMIN_PASSWORD=<plain password>`
  - `ADMIN_TOKEN_TTL_HOURS=3` (optional) and/or `ADMIN_TOKEN_TTL_MINUTES=30`
  - `MYSQL_HOST=<your hosting DB host>`
  - `MYSQL_PORT=3306`
  - `MYSQL_USER=<db user>`
  - `MYSQL_PASSWORD=<db password>`
  - `MYSQL_DATABASE=<db name>`
  - `MYSQL_SSL=1` (recommended)
  - `MYSQL_CA=<CA certificate PEM>` (optional; provide if your MySQL requires custom CA)

### Database Connectivity

- Verify your hosting firewall allows connections from Vercel and requires SSL.
- If your host uses Alpine (musl) or special SSL, ensure compatibility. The app uses `mysql2/promise` and can load a CA via `MYSQL_CA` if provided.
- If direct DB access is blocked, deploy a small API on your hosting that exposes the necessary endpoints and have the Vercel app call that API instead of the DB.

### Storage for Uploads

- Replace local filesystem writes in admin upload routes with an external storage service (S3/Vercel Blob) and store only URLs/metadata in MySQL.
- Alternatively, host the upload endpoints on your server (where disk is persistent) and keep the Vercel deployment for the frontend.