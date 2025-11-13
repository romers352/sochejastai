import { rm, readFile, writeFile, stat } from 'fs/promises';
import path from 'path';

async function safeRm(target) {
  try {
    await rm(target, { recursive: true, force: true });
    console.log('Removed', target);
  } catch (e) {
    console.warn('Skip remove (not found):', target);
  }
}

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function clearJson(file, emptyValue) {
  try {
    const full = path.resolve(process.cwd(), 'data', file);
    if (!(await exists(full))) {
      console.warn('Skip clear (not found):', full);
      return;
    }
    await writeFile(full, JSON.stringify(emptyValue, null, 2) + '\n', 'utf8');
    console.log('Cleared data/', file);
  } catch (e) {
    console.warn('Failed to clear', file, e?.message || e);
  }
}

async function main() {
  const uploadsRoot = path.resolve(process.cwd(), 'public', 'uploads');
  const targets = [
    path.join(uploadsRoot, 'banners'),
    path.join(uploadsRoot, 'home'),
    path.join(uploadsRoot, 'partners'),
    path.join(uploadsRoot, 'photos'),
    path.join(uploadsRoot, 'testimonials'),
    path.join(uploadsRoot, 'videos'),
  ];

  // Remove heavy asset directories
  for (const t of targets) {
    await safeRm(t);
  }

  // Optionally clear JSON data collections
  const doClearJson = process.argv.includes('--clear-json');
  if (doClearJson) {
    await clearJson('photos.json', []);
    await clearJson('videos.json', []);
    await clearJson('graphics.json', []);
    await clearJson('partner_logos.json', []);
  }

  console.log('Prune complete. To prevent recommitting assets, ensure .gitignore includes public/uploads/.');
}

main().catch((e) => {
  console.error('Prune failed:', e);
  process.exit(1);
});