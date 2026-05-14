'use client';
import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/app/lib/supabase';

export type SubStatus = 'active' | 'trialing' | 'canceled' | 'past_due' | 'incomplete' | 'none' | 'loading';

export function useSubscription(userId: string | undefined) {
  const [status, setStatus] = useState<SubStatus>('loading');
  const [trialEnd, setTrialEnd] = useState<Date | null>(null);
  const [periodEnd, setPeriodEnd] = useState<Date | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);

  useEffect(() => {
    if (!userId) { setStatus('none'); return; }
    // Reset to loading so callers never see a stale 'none' while the fetch is in-flight.
    setStatus('loading');
    const supabase = createSupabaseClient();
    supabase
      .from('subscriptions')
      .select('status, trial_end, current_period_end, cancel_at_period_end')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) { setStatus('none'); return; }
        setStatus(data.status as SubStatus);
        if (data.trial_end) setTrialEnd(new Date(data.trial_end));
        if (data.current_period_end) setPeriodEnd(new Date(data.current_period_end));
        setCancelAtPeriodEnd(data.cancel_at_period_end ?? false);
      });
  }, [userId]);

  const isActive = status === 'active' || status === 'trialing';
  const daysLeftInTrial = trialEnd && status === 'trialing'
    ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000))
    : null;
  const isTrialExpired = status === 'trialing' && trialEnd !== null && trialEnd < new Date();

  return { status, isActive, trialEnd, periodEnd, daysLeftInTrial, isTrialExpired, cancelAtPeriodEnd };
}
