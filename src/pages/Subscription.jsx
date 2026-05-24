import React from 'react';
import { CheckCircle2, CreditCard } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import StatCard from '../components/StatCard.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function Subscription() {
  const { activeRole, beltUser, maiUser, displaySubscription, subscriptionPlans, refreshAccount, getFreshAccessToken } = useApp();
  const [searchParams] = useSearchParams();
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const [billingMessage, setBillingMessage] = React.useState('');
  const billingEmail = activeRole === 'MAI' ? maiUser.email : beltUser.email;
  const isMai = activeRole === 'MAI';
  const isActiveMai = isMai && displaySubscription.status === 'active';
  const isTrialingMai = isMai && displaySubscription.status === 'trialing';
  const hasMaiAccess = isActiveMai || isTrialingMai;
  const isUpgradeFlow = activeRole === 'Belt User';
  const checkoutResult = searchParams.get('checkout');

  React.useEffect(() => {
    if (checkoutResult === 'success') {
      setBillingMessage('Checkout finished. Stripe is confirming the MAI subscription now.');
      refreshAccount();
    }

    if (checkoutResult === 'cancelled') {
      setBillingMessage('Checkout was cancelled. MAI verification access is still locked.');
    }
  }, [checkoutResult]);

  const startStripeCheckout = async () => {
    setIsRedirecting(true);
    setBillingMessage('');

    try {
      const accessToken = await getFreshAccessToken();

      if (!accessToken) {
        throw new Error('Log in again, then start checkout.');
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          role: 'MAI',
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
      eyebrow="Profile"
      title={isUpgradeFlow ? 'Upgrade to MAI' : 'Manage Subscription'}
      description={
        isUpgradeFlow
          ? 'Keep the same account and upgrade to MAI when you are ready to verify and sign logbooks.'
          : 'Belt User accounts are free. MAIs use the annual plan for verification and logbook signing.'
      }
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
                  : 'Your Belt User account stays free. Upgrade this same account to MAI when you complete checkout.'}
              </p>
            </div>
            <div className="rounded-md bg-field px-4 py-3 text-right">
              <p className="text-3xl font-bold text-ink">{isUpgradeFlow ? '$7/mo' : displaySubscription.monthlyDisplay}</p>
              <p className="text-sm font-semibold text-ink/60">
                {isMai || isUpgradeFlow ? '$84.99 billed annually after trial' : 'no payment required'}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-md border border-olive/20 bg-olive/10 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-olive">
              <CheckCircle2 size={17} aria-hidden="true" />
              {!isMai
                ? 'Free Belt User account'
                : isTrialingMai
                  ? '3-month free trial active'
                  : isActiveMai
                    ? 'Paid annual subscription active'
                    : 'MAI billing required'}
            </p>
            <p className="mt-2 text-sm leading-6 text-ink/70">
              {!isMai
                ? 'Start the 3-month MAI trial to convert this account to MAI after checkout. Belt User access remains free until you upgrade.'
                : isTrialingMai
                  ? `Your MAI tools are unlocked during the trial${displaySubscription.currentPeriodEnd ? ` through ${formatDate(displaySubscription.currentPeriodEnd)}` : ''}. After the trial, billing is $84.99 per year.`
                  : isActiveMai
                  ? `Your annual MAI plan is active${displaySubscription.currentPeriodEnd ? ` through ${formatDate(displaySubscription.currentPeriodEnd)}` : ''}.`
                  : 'Start the 3-month free trial to unlock MAI verification and signing tools. Annual billing is $84.99 after the trial.'}
            </p>
          </div>

          {(isUpgradeFlow || (isMai && !hasMaiAccess)) ? (
            <div className="mt-6">
              <button
                type="button"
                onClick={startStripeCheckout}
                disabled={isRedirecting}
                className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-olive px-4 text-sm font-bold text-white hover:bg-olive/90"
              >
                <CreditCard size={17} aria-hidden="true" />
                {isRedirecting ? 'Opening Stripe...' : isUpgradeFlow ? 'Upgrade to MAI' : 'Start 3-month free trial'}
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
          <StatCard label="MAI trial" value="3 months" detail="Free before annual billing" />
          <StatCard label="MAI offer" value="$7/mo" detail="Billed annually after trial" />
          <StatCard label="MAI annual price" value={`$${subscriptionPlans.MAI.annualPrice}`} detail="Charged once per year" />
          {isMai ? (
            <StatCard
              label="MAI status"
              value={hasMaiAccess ? 'Unlocked' : 'Locked'}
              detail={isTrialingMai ? 'Trial active' : isActiveMai ? 'Stripe confirmed' : 'Checkout required'}
            />
          ) : null}
        </aside>
      </div>

      <div className="mt-6 rounded-md border border-brass/30 bg-brass/10 p-4 text-sm leading-6 text-ink/70">
        Stripe Checkout starts a 3-month MAI free trial. When Stripe confirms checkout, this account becomes an MAI account and MAI tools unlock while the subscription is trialing or active.
      </div>
    </PageShell>
  );
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString();
}
