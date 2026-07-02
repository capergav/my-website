export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createSupabaseServerClient } from '@/app/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    // Identity ALWAYS comes from the session cookie — never trust a body-supplied
    // userId/userEmail. restaurantSlug (used only for return URLs) may still come
    // from the body and is harmless.
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = user.id;
    const userEmail = user.email;

    const { restaurantSlug } = await req.json().catch(() => ({}));

    const { data: existing } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id, status, trial_end')
      .eq('user_id', userId)
      .maybeSingle();

    // FIX 3 — guard against double subscriptions at the source. If this user
    // already holds a non-canceled subscription, never create a second live
    // checkout session — send them to the billing portal instead.
    if (
      existing?.stripe_subscription_id &&
      existing.status !== 'canceled' &&
      existing.stripe_customer_id
    ) {
      const portal = await stripe.billingPortal.sessions.create({
        customer: existing.stripe_customer_id,
        return_url: restaurantSlug
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/admin/${restaurantSlug}`
          : `${process.env.NEXT_PUBLIC_SITE_URL}/admin`,
      });
      return NextResponse.json({ url: portal.url });
    }

    let customerId = existing?.stripe_customer_id;
    if (!customerId) {
      // Backstop against duplicate customers: reuse an existing Stripe customer
      // with this email before creating a brand new one.
      const found = await stripe.customers.search({
        query: `email:'${userEmail.replace(/'/g, "\\'")}'`,
      });
      if (found.data.length > 0) {
        customerId = found.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: { supabase_user_id: userId }
        });
        customerId = customer.id;
      }

      // FIX 1 — persist the customer id back BEFORE creating the checkout
      // session so a retried/duplicate checkout never spawns a second customer.
      // CRITICAL: only ever write when the column is still null — the guarded
      // `.is('stripe_customer_id', null)` filter means we can never clobber an
      // already-populated real customer id (e.g. set by a concurrent request).
      const { data: updated } = await supabaseAdmin
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', userId)
        .is('stripe_customer_id', null)
        .select('user_id');

      // No row had a null id to fill — if the user has no subscriptions row at
      // all yet, create one. (If a row already has a real id, leave it alone.)
      if ((!updated || updated.length === 0) && !existing) {
        await supabaseAdmin
          .from('subscriptions')
          .insert({ user_id: userId, stripe_customer_id: customerId });
      }
    }

    // Use the trial_end stored in subscriptions (set at signup) so the user
    // keeps their remaining days instead of getting a fresh Stripe trial period.
    const now = Math.floor(Date.now() / 1000);
    let trialEnd: number | undefined;

    if (existing?.trial_end) {
      const storedTs = Math.floor(new Date(existing.trial_end).getTime() / 1000);
      if (storedTs > now) trialEnd = storedTs;
    } else {
      // Fallback: calculate from auth account creation date
      const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (authUser?.created_at) {
        const calculatedEnd = Math.floor(new Date(authUser.created_at).getTime() / 1000) + 60 * 86400;
        if (calculatedEnd > now) trialEnd = calculatedEnd;
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      subscription_data: {
        ...(trialEnd ? { trial_end: trialEnd } : {}),
        metadata: { supabase_user_id: userId }
      },
      success_url: restaurantSlug
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/admin/${restaurantSlug}?subscription=success`
        : `${process.env.NEXT_PUBLIC_SITE_URL}/admin?subscribed=true`,
      cancel_url: restaurantSlug
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/admin/${restaurantSlug}`
        : `${process.env.NEXT_PUBLIC_SITE_URL}/admin`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
