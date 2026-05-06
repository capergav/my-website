export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/app/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { stripe } from '@/lib/stripe';

async function deleteAllFilesInFolder(folder: string): Promise<void> {
  const { data: entries, error } = await supabaseAdmin.storage
    .from('menu-images')
    .list(folder, { limit: 1000 });

  if (error || !entries) return;

  const filePaths: string[] = [];
  const subFolders: string[] = [];

  for (const entry of entries) {
    const fullPath = `${folder}/${entry.name}`;
    if (entry.id === null) {
      subFolders.push(fullPath);
    } else {
      filePaths.push(fullPath);
    }
  }

  for (const sub of subFolders) {
    await deleteAllFilesInFolder(sub);
  }

  for (let i = 0; i < filePaths.length; i += 100) {
    const batch = filePaths.slice(i, i + 100);
    await supabaseAdmin.storage.from('menu-images').remove(batch);
  }
}

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;

  try {
    // 1. Cancel any active Stripe subscription
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (sub?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(sub.stripe_subscription_id);
      } catch {
        // Subscription may already be cancelled — continue
      }
    }

    // 2. Get user's restaurants
    const { data: restaurants } = await supabaseAdmin
      .from('restaurants')
      .select('id, slug')
      .eq('owner_id', userId);

    const restaurantIds = (restaurants ?? []).map((r: { id: string }) => r.id);
    const restaurantSlugs = (restaurants ?? []).map((r: { slug: string }) => r.slug);

    if (restaurantIds.length > 0) {
      // 3. Delete restaurant_categories
      await supabaseAdmin.from('restaurant_categories').delete().in('restaurant_id', restaurantIds);
      // 4. Delete menu_items
      await supabaseAdmin.from('menu_items').delete().in('restaurant_id', restaurantIds);
      // 5. Delete category_notes
      await supabaseAdmin.from('category_notes').delete().in('restaurant_id', restaurantIds);
      // 6. Delete menu_analytics
      await supabaseAdmin.from('menu_analytics').delete().in('restaurant_id', restaurantIds);

      // 7. Delete storage objects in 'menu-images' bucket (recursive)
      for (const slug of restaurantSlugs) {
        await deleteAllFilesInFolder(slug);
      }

      // 8. Delete restaurants (cascade handles any remaining children)
      await supabaseAdmin.from('restaurants').delete().in('id', restaurantIds);
    }

    // 9. Delete subscriptions row
    await supabaseAdmin.from('subscriptions').delete().eq('user_id', userId);

    // 10. Delete the auth user
    await supabaseAdmin.auth.admin.deleteUser(userId);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
