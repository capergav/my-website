export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const BUCKET = "menu-images";

// Recursively collect all file paths under a folder prefix.
async function listAllFiles(prefix: string): Promise<string[]> {
  const { data: entries, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .list(prefix, { limit: 1000 });

  if (error || !entries) return [];

  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id === null) {
      // Pseudo-folder — recurse
      const nested = await listAllFiles(fullPath);
      files.push(...nested);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const errors: string[] = [];

  // ── 1. Collect all storage file paths ──────────────────────────────────────
  const { data: topLevel, error: topErr } = await supabaseAdmin.storage
    .from(BUCKET)
    .list('', { limit: 1000 });

  if (topErr) {
    return NextResponse.json({ error: `Failed to list bucket root: ${topErr.message}` }, { status: 500 });
  }

  const allFiles: string[] = [];
  for (const entry of topLevel ?? []) {
    if (entry.id === null) {
      const nested = await listAllFiles(entry.name);
      allFiles.push(...nested);
    } else {
      allFiles.push(entry.name);
    }
  }

  // ── 2. Collect all referenced URLs from the database ───────────────────────
  const [itemsRes, restaurantsRes] = await Promise.all([
    supabaseAdmin.from('menu_items').select('image_url').not('image_url', 'is', null),
    supabaseAdmin.from('restaurants').select('hero_image_url, logo_url'),
  ]);

  if (itemsRes.error) {
    return NextResponse.json({ error: `Failed to query menu_items: ${itemsRes.error.message}` }, { status: 500 });
  }
  if (restaurantsRes.error) {
    return NextResponse.json({ error: `Failed to query restaurants: ${restaurantsRes.error.message}` }, { status: 500 });
  }

  const referencedUrls = new Set<string>();
  for (const row of itemsRes.data ?? []) {
    if (row.image_url) referencedUrls.add(row.image_url as string);
  }
  for (const row of restaurantsRes.data ?? []) {
    if (row.hero_image_url) referencedUrls.add(row.hero_image_url as string);
    if (row.logo_url)       referencedUrls.add(row.logo_url as string);
  }

  // ── 3. Extract storage paths from referenced URLs ──────────────────────────
  const referencedPaths = new Set<string>();
  const marker = `/object/public/${BUCKET}/`;
  for (const url of referencedUrls) {
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      referencedPaths.add(decodeURIComponent(url.slice(idx + marker.length)));
    }
  }

  // ── 4. Find orphans ────────────────────────────────────────────────────────
  const orphans = allFiles.filter((p) => !referencedPaths.has(p));

  // ── 5. Delete in batches of 100 ────────────────────────────────────────────
  let orphansDeleted = 0;
  const BATCH = 100;
  for (let i = 0; i < orphans.length; i += BATCH) {
    const batch = orphans.slice(i, i + BATCH);
    const { error } = await supabaseAdmin.storage.from(BUCKET).remove(batch);
    if (error) {
      errors.push(`Batch ${i}–${i + batch.length}: ${error.message}`);
    } else {
      orphansDeleted += batch.length;
    }
  }

  return NextResponse.json({
    totalFiles: allFiles.length,
    referencedPaths: referencedPaths.size,
    orphansFound: orphans.length,
    orphansDeleted,
    errors,
  });
}
