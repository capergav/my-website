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
      .select('stripe_customer_id')
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

    // Trial runs 60 days from account creation, not from card addition.
    // This way signing up on day 1 and adding a card on day 10 gives 50 remaining days, not 60 fresh.
    const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(userId);
    const TRIAL_DAYS = 60;
    const now = Math.floor(Date.now() / 1000);
    let trialEnd: number | undefined;
    if (authUser?.created_at) {
      const createdAtSec = Math.floor(new Date(authUser.created_at).getTime() / 1000);
      const calculatedEnd = createdAtSec + TRIAL_DAYS * 86400;
      // Only set trial_end if it's in the future; otherwise no trial
      if (calculatedEnd > now) trialEnd = calculatedEnd;
    } else {
      // Fallback: grant 60 days from now if we can't determine account age
      trialEnd = now + TRIAL_DAYS * 86400;
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
