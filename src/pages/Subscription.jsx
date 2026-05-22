import React from 'react';
import { CheckCircle2, CreditCard, RotateCcw } from 'lucide-react';
import PageShell from '../components/PageShell.jsx';
import StatCard from '../components/StatCard.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function Subscription() {
  const { activeRole, beltUser, maiUser, displaySubscription, subscriptionPlans, resetTrial } = useApp();
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const [billingMessage, setBillingMessage] = React.useState('');
  const isTrial = displaySubscription.status === 'trial';
  const billingEmail = activeRole === 'MAI' ? maiUser.email : beltUser.email;
  const isMai = activeRole === 'MAI';
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(`${displaySubscription.trialEndsAt}T12:00:00`) - new Date()) / 86400000)
  );

  const startStripeCheckout = async () => {
    setIsRedirecting(true);
    setBillingMessage('');

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: activeRole,
          email: billingEmail
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to start Stripe Checkout.');
      }

      window.location.href = data.url;
    } catch (error) {
      setBillingMessage(error.message);
      setIsRedirecting(false);
    }
  };

  return (
    <PageShell
      eyebrow="Billing"
      title="Subscription"
      description="Belt User accounts are free. MAIs use the annual plan for verification and logbook signing."
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="rounded-md border border-coyote/35 bg-paper p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-clay">Current plan</p>
          <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-3xl font-bold text-ink">{displaySubscription.planName}</h2>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                {isMai
                  ? 'MAI accounts can review, return, and sign submitted MCMAP logbooks.'
                  : 'Belt Users can create a free account and submit training logs.'}
              </p>
            </div>
            <div className="rounded-md bg-field px-4 py-3 text-right">
              <p className="text-3xl font-bold text-ink">{displaySubscription.monthlyDisplay}</p>
              <p className="text-sm font-semibold text-ink/60">
                {isMai ? '$84.99 billed annually' : 'no payment required'}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-md border border-olive/20 bg-olive/10 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-olive">
              <CheckCircle2 size={17} aria-hidden="true" />
              {!isMai ? 'Free Belt User account' : isTrial ? 'Free trial active' : 'Paid annual subscription active'}
            </p>
            <p className="mt-2 text-sm leading-6 text-ink/70">
              {!isMai
                ? 'Belt Users can create accounts and submit logs without a subscription charge.'
                : isTrial
                  ? `Your free trial ends on ${formatDate(displaySubscription.trialEndsAt)}. After that, the MAI plan is $84.99 per year.`
                  : `Your annual MAI subscription is active using ${displaySubscription.paymentMethod}.`}
            </p>
          </div>

          {isMai ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={startStripeCheckout}
                disabled={isRedirecting}
                className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-olive px-4 text-sm font-bold text-white hover:bg-olive/90"
              >
                <CreditCard size={17} aria-hidden="true" />
                {isRedirecting ? 'Opening Stripe...' : 'Start MAI annual checkout'}
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
          ) : null}
          {billingMessage ? (
            <div className="mt-4 rounded-md border border-clay/20 bg-clay/10 p-4 text-sm font-semibold text-clay">
              {billingMessage}
            </div>
          ) : null}
        </section>

        <aside className="grid gap-4">
          <StatCard label="Belt User accounts" value="Free" detail="No payment required" />
          <StatCard label="MAI offer" value="$7/mo" detail="Billed annually" />
          <StatCard label="MAI annual price" value={`$${subscriptionPlans.MAI.annualPrice}`} detail="Charged once per year" />
          {isMai ? (
            <StatCard label="Trial days left" value={isTrial ? daysLeft : 0} detail={isTrial ? 'Before annual billing' : 'Annual plan active'} />
          ) : null}
        </aside>
      </div>

      <div className="mt-6 rounded-md border border-brass/30 bg-brass/10 p-4 text-sm leading-6 text-ink/70">
        Stripe Checkout is prepared for MAI annual billing. Add your Stripe secret key and MAI annual Price ID in Vercel, then redeploy.
        Webhooks are still needed to automatically update subscription status in Supabase.
      </div>
    </PageShell>
  );
}

function formatDate(dateString) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString();
}
