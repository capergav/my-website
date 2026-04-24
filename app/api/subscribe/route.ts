// TODO: Replace RESEND_AUDIENCE_ID with your real Resend audience ID from resend.com/audiences
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const res = await fetch('https://api.resend.com/audiences/RESEND_AUDIENCE_ID/contacts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, unsubscribed: false }),
  });

  if (!res.ok) return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  return NextResponse.json({ success: true });
}
