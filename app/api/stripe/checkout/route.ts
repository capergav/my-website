export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { userId, userEmail, restaurantSlug } = await req.json();
    if (!userId || !userEmail) return NextResponse.json({ error: 'Missing user info' }, { status: 400 });

    const { data: existing } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id, trial_end')
      .eq('user_id', userId)
      .maybeSingle();

    let customerId = existing?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { supabase_user_id: userId }
      });
      customerId = customer.id;
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
