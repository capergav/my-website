export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createSupabaseServerClient } from '@/app/lib/supabase';

export async function POST(req: NextRequest) {
  // Identity ALWAYS comes from the session cookie — never from the request body.
  // Slugs are public, so trusting a body-supplied userId would let anyone open
  // any owner's billing portal (cancel subs, view invoices, see payment method).
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // restaurantSlug is only used to build the return URL. Body may be empty.
  const { restaurantSlug } = await req.json().catch(() => ({}));

  // If a slug was supplied, confirm the authenticated user actually owns that
  // restaurant before doing anything billing-related on its behalf.
  if (restaurantSlug) {
    const { data: rest } = await supabaseAdmin
      .from('restaurants')
      .select('owner_id')
      .eq('slug', restaurantSlug)
      .maybeSingle();
    if (!rest || rest.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!data?.stripe_customer_id) {
    return NextResponse.json({ redirect_to_checkout: true }, { status: 200 });
  }

  const returnUrl = restaurantSlug
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/admin/${restaurantSlug}`
    : `${process.env.NEXT_PUBLIC_SITE_URL}/admin`;

  const session = await stripe.billingPortal.sessions.create({
    customer: data.stripe_customer_id,
    return_url: returnUrl,
  });

  return NextResponse.json({ url: session.url });
}
