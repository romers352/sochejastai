# public/uploads

This folder is committed so you can host static assets (images/videos) with your site.

Notes:
- Files under `public/` are served statically by Next.js and will be deployed to Vercel.
- Runtime uploads to the filesystem on Vercel do not persist. Commit assets here or use external storage (S3/R2).
- Organize assets under `banners/`, `photos/`, and `videos/` as needed.
- If you want to exclude temporary runtime files, add `public/uploads/tmp/` to `.gitignore`.

Refer to `DEPLOYMENT.md` for storage guidance.