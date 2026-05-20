import React from 'react';
import { CheckCircle2, CreditCard, RotateCcw } from 'lucide-react';
import PageShell from '../components/PageShell.jsx';
import StatCard from '../components/StatCard.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function Subscription() {
  const { subscription, startPaidSubscription, resetTrial } = useApp();
  const isTrial = subscription.status === 'trial';
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(`${subscription.trialEndsAt}T12:00:00`) - new Date()) / 86400000)
  );

  return (
    <PageShell
      eyebrow="Billing"
      title="Subscription"
      description="Every new account starts with a 1-month free trial. After the trial, access is $2 per month."
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="rounded-md border border-coyote/35 bg-paper p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-clay">Current plan</p>
          <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-3xl font-bold text-ink">{subscription.planName}</h2>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                Includes Belt User submissions, MAI verification queues, signed logbook records, and profile access.
              </p>
            </div>
            <div className="rounded-md bg-field px-4 py-3 text-right">
              <p className="text-3xl font-bold text-ink">$2</p>
              <p className="text-sm font-semibold text-ink/60">per month</p>
            </div>
          </div>

          <div className="mt-6 rounded-md border border-olive/20 bg-olive/10 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-olive">
              <CheckCircle2 size={17} aria-hidden="true" />
              {isTrial ? 'Free trial active' : 'Paid subscription active'}
            </p>
            <p className="mt-2 text-sm leading-6 text-ink/70">
              {isTrial
                ? `Your free trial ends on ${formatDate(subscription.trialEndsAt)}. After that, the plan is $2 per month.`
                : `Your subscription is active using ${subscription.paymentMethod}.`}
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={startPaidSubscription}
              className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-olive px-4 text-sm font-bold text-white hover:bg-olive/90"
            >
              <CreditCard size={17} aria-hidden="true" />
              Activate $2/month plan
            </button>
            <button
              type="button"
              onClick={resetTrial}
              className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md border border-ink/15 bg-field px-4 text-sm font-bold text-ink hover:bg-paper"
            >
              <RotateCcw size={17} aria-hidden="true" />
              Reset free trial
            </button>
          </div>
        </section>

        <aside className="grid gap-4">
          <StatCard label="Trial length" value="1 month" detail="Starts at account creation" />
          <StatCard label="Trial days left" value={isTrial ? daysLeft : 0} detail={isTrial ? 'Before billing starts' : 'Paid plan active'} />
          <StatCard label="Monthly price" value="$2" detail="After the free trial" />
        </aside>
      </div>

      <div className="mt-6 rounded-md border border-brass/30 bg-brass/10 p-4 text-sm leading-6 text-ink/70">
        To charge real cards, connect a payment processor such as Stripe and verify subscription status from a
        backend or Supabase edge function.
      </div>
    </PageShell>
  );
}

function formatDate(dateString) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString();
}
