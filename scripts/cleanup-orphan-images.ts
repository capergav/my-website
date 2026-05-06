/**
 * cleanup-orphan-images.ts
 * Deletes files in the `menu-images` storage bucket that are no longer
 * referenced by any menu_item, restaurant hero image, or logo.
 *
 * Run manually:
 *   npx ts-node -r tsconfig-paths/register scripts/cleanup-orphan-images.ts
 *
 * Required Supabase storage bucket policies for `menu-images`:
 *   - service_role: full access (SELECT, INSERT, UPDATE, DELETE)
 *     Used by this script, the cleanup cron (/api/cron/cleanup-images),
 *     and the account deletion route (/api/account/delete).
 *   - anon / authenticated: SELECT only (public read for customer menu)
 *     INSERT/UPDATE/DELETE for authenticated users scoped to their own folder
 *     via RLS policy: (storage.foldername(name))[1] = auth.uid()
 */
import { createClient } from "@supabase/supabase-js";

const BUCKET = "menu-images";

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // ── 1. Collect all storage file paths ──────────────────────────────────────
  console.log("Listing storage files…");
  const allFiles: string[] = [];

  // List top-level "folders" (user ID prefixes)
  const { data: topLevel, error: topErr } = await supabase.storage.from(BUCKET).list("", { limit: 1000 });
  if (topErr) { console.error("Failed to list bucket root:", topErr.message); process.exit(1); }

  for (const entry of topLevel ?? []) {
    if (entry.id === null) {
      // It's a pseudo-folder — list its contents
      const { data: sub, error: subErr } = await supabase.storage.from(BUCKET).list(entry.name, { limit: 1000 });
      if (subErr) { console.warn(`Could not list ${entry.name}:`, subErr.message); continue; }

      for (const subEntry of sub ?? []) {
        if (subEntry.id === null) {
          // Nested subfolder (e.g. items/<slug>/)
          const { data: deep, error: deepErr } = await supabase.storage
            .from(BUCKET)
            .list(`${entry.name}/${subEntry.name}`, { limit: 1000 });
          if (deepErr) { console.warn(`Could not list ${entry.name}/${subEntry.name}:`, deepErr.message); continue; }
          for (const f of deep ?? []) {
            if (f.id !== null) allFiles.push(`${entry.name}/${subEntry.name}/${f.name}`);
          }
        } else {
          allFiles.push(`${entry.name}/${subEntry.name}`);
        }
      }
    } else {
      // File at root level (unusual but handle it)
      allFiles.push(entry.name);
    }
  }

  console.log(`Total files in storage: ${allFiles.length}`);

  // ── 2. Collect all referenced URLs from the database ───────────────────────
  console.log("Fetching referenced image URLs from database…");

  const [itemsRes, restaurantsRes] = await Promise.all([
    supabase.from("menu_items").select("image_url").not("image_url", "is", null),
    supabase.from("restaurants").select("hero_image_url, logo_url"),
  ]);

  if (itemsRes.error)       { console.error("Failed to query menu_items:", itemsRes.error.message); process.exit(1); }
  if (restaurantsRes.error) { console.error("Failed to query restaurants:", restaurantsRes.error.message); process.exit(1); }

  const referencedUrls = new Set<string>();
  for (const row of itemsRes.data ?? []) {
    if (row.image_url) referencedUrls.add(row.image_url as string);
  }
  for (const row of restaurantsRes.data ?? []) {
    if (row.hero_image_url) referencedUrls.add(row.hero_image_url as string);
    if (row.logo_url)       referencedUrls.add(row.logo_url as string);
  }

  // ── 3. Extract storage paths from referenced URLs ──────────────────────────
  // URL format: https://<project>.supabase.co/storage/v1/object/public/menu-images/<path>
  const referencedPaths = new Set<string>();
  const marker = `/object/public/${BUCKET}/`;
  for (const url of referencedUrls) {
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      referencedPaths.add(decodeURIComponent(url.slice(idx + marker.length)));
    }
  }

  console.log(`Referenced storage paths: ${referencedPaths.size}`);

  // ── 4. Find orphans ────────────────────────────────────────────────────────
  const orphans = allFiles.filter((p) => !referencedPaths.has(p));
  console.log(`Orphan files to delete: ${orphans.length}`);

  if (orphans.length === 0) {
    console.log("Nothing to clean up.");
    return;
  }

  // ── 5. Delete in batches of 100 ────────────────────────────────────────────
  const BATCH = 100;
  let deleted = 0;
  for (let i = 0; i < orphans.length; i += BATCH) {
    const batch = orphans.slice(i, i + BATCH);
    const { error } = await supabase.storage.from(BUCKET).remove(batch);
    if (error) {
      console.error(`Failed to delete batch starting at ${i}:`, error.message);
    } else {
      deleted += batch.length;
      console.log(`Deleted ${deleted}/${orphans.length}…`);
    }
  }

  console.log(`\nDone. Files found: ${allFiles.length} | Orphans: ${orphans.length} | Deleted: ${deleted}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
