import React from 'react';
import { CheckCircle2, CreditCard } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import EmailNotice from '../components/EmailNotice.jsx';
import PageShell from '../components/PageShell.jsx';
import StatCard from '../components/StatCard.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function Subscription() {
  const { activeRole, profile, beltUser, maiUser, displaySubscription, subscriptionPlans, refreshAccount, getFreshAccessToken } = useApp();
  const [searchParams] = useSearchParams();
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = React.useState(false);
  const [billingMessage, setBillingMessage] = React.useState('');
  const [billingEmailNotice, setBillingEmailNotice] = React.useState(false);
  const billingEmail = activeRole === 'MAI' ? maiUser.email : beltUser.email;
  const isMai = activeRole === 'MAI';
  const isActiveMai = isMai && displaySubscription.status === 'active';
  const isTrialingMai = isMai && displaySubscription.status === 'trialing';
  const isOwnerMai = isMai && (displaySubscription.status === 'owner_free' || profile?.account_type === 'Owner/Developer');
  const isCanceledMai = isMai && ['canceled', 'cancelled'].includes(displaySubscription.status);
  const hasMaiAccess = isActiveMai || isTrialingMai || isOwnerMai;
  const isUpgradeFlow = activeRole === 'Belt User';
  const checkoutResult = searchParams.get('checkout');
  const subscriptionStatusLabel = getSubscriptionStatusLabel({ displaySubscription, isMai, isTrialingMai, isActiveMai, isOwnerMai, isCanceledMai });

  React.useEffect(() => {
    refreshAccount();
  }, []);

  React.useEffect(() => {
    if (checkoutResult === 'success') {
      setBillingMessage('Checkout finished. Stripe is confirming the MAI subscription now.');
      setBillingEmailNotice(true);
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

  const openBillingPortal = async () => {
    setIsOpeningPortal(true);
    setBillingMessage('');

    try {
      const accessToken = await getFreshAccessToken();

      if (!accessToken) {
        throw new Error('Log in again before opening billing settings.');
      }

      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to open Stripe billing settings.');
      }

      window.location.href = data.url;
    } catch (error) {
      setBillingMessage(error.message);
      setIsOpeningPortal(false);
    }
  };

  return (
    <PageShell
      eyebrow="Profile"
      title={isUpgradeFlow ? 'Upgrade to MAI' : 'Manage Subscription'}
      description={
        isUpgradeFlow
          ? 'Upgrade when you are ready to save time, verify records, reduce paperwork, and manage Marines from one account.'
          : 'Belt User accounts are free. MAIs use the annual plan to protect records, speed up verification, and export official documentation.'
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
                  ? isOwnerMai
                    ? 'Owner MAI access is unlocked without Stripe billing.'
                    : 'MAI accounts save time by reviewing, returning, signing, and exporting MCMAP records from one organized workspace.'
                  : 'Your Belt User account stays free. Upgrade this same account to MAI when you are ready to reduce paperwork and verify Marine training records.'}
              </p>
            </div>
            <div className="rounded-md bg-field px-4 py-3 text-right">
              <p className="text-3xl font-bold text-ink">{isUpgradeFlow ? '$69.99/year' : displaySubscription.monthlyDisplay}</p>
              <p className="text-sm font-semibold text-ink/60">
                {isOwnerMai ? 'owner access, no payment required' : isMai || isUpgradeFlow ? '$69.99 billed annually after 60-day trial' : 'no payment required'}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-md border border-olive/20 bg-olive/10 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-olive">
              <CheckCircle2 size={17} aria-hidden="true" />
              {subscriptionStatusLabel}
            </p>
            <p className="mt-2 text-sm leading-6 text-ink/70">
              {!isMai
                ? 'Start the 60-day MAI trial to unlock verification tools, protected records, exportable history, and faster documentation for belt advancement, JEPES, and FITREP support.'
                : isOwnerMai
                ? 'This owner MAI account can use verification tools for free. No checkout or Stripe billing is required.'
                : isTrialingMai
                  ? `Your MAI tools are unlocked during the trial${displaySubscription.currentPeriodEnd ? ` through ${formatDate(displaySubscription.currentPeriodEnd)}` : ''}. After the trial, billing is $69.99 per year for verification, exports, and reduced administrative work.`
                  : isActiveMai
                  ? `${displaySubscription.cancelAtPeriodEnd ? 'Your plan is set to cancel at the end of the billing period' : 'Your annual MAI plan is active'}${displaySubscription.currentPeriodEnd ? ` through ${formatDate(displaySubscription.currentPeriodEnd)}` : ''}.`
                  : isCanceledMai
                  ? 'This MAI subscription is canceled. Start checkout again to unlock verification tools.'
                  : 'Start the 60-day free trial to unlock MAI verification, exportable records, and paperwork-reduction tools. Annual billing is $69.99 after the trial.'}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {(isUpgradeFlow || (isMai && !hasMaiAccess)) ? (
              <button
                type="button"
                onClick={startStripeCheckout}
                disabled={isRedirecting}
                className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-olive px-4 text-sm font-bold text-white hover:bg-olive/90"
              >
                <CreditCard size={17} aria-hidden="true" />
                {isRedirecting ? 'Opening Stripe...' : isUpgradeFlow ? 'Upgrade to MAI' : 'Start 60-day free trial'}
              </button>
            ) : null}
            {isMai && hasMaiAccess && !isOwnerMai ? (
              <button
                type="button"
                onClick={openBillingPortal}
                disabled={isOpeningPortal}
                className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md border border-ink/15 bg-field px-4 text-sm font-bold text-ink hover:bg-paper"
              >
                <CreditCard size={17} aria-hidden="true" />
                {isOpeningPortal ? 'Opening billing...' : 'Manage billing in Stripe'}
              </button>
            ) : null}
          </div>
          {billingMessage ? (
            <div className="mt-4 rounded-md border border-clay/20 bg-clay/10 p-4 text-sm font-semibold text-clay">
              {billingMessage}
            </div>
          ) : null}
          {billingEmailNotice ? (
            <div className="mt-4">
              <EmailNotice
                title="Billing Email Sent"
                text="Stripe may send a checkout or billing email. Please check your inbox. If you do not see it within a few minutes, check your Spam/Junk folder in case it was filtered there."
              />
            </div>
          ) : null}
        </section>

        <aside className="grid gap-4">
          <StatCard label="Belt User accounts" value="Free" detail="No payment required" />
          <StatCard label="MAI trial" value="60 days" detail="Free before annual billing" />
          <StatCard label="MAI value" value="Less admin" detail="Verify, return, and export records faster" />
          <StatCard label="Records" value="Protected" detail="Keep verified MCMAP documentation organized" />
          <StatCard label="MAI annual price" value={`$${subscriptionPlans.MAI.annualPrice}`} detail="Charged once per year" />
          {isMai ? (
            <StatCard
              label="Subscription status"
              value={hasMaiAccess ? 'Unlocked' : 'Locked'}
              detail={subscriptionStatusLabel}
            />
          ) : null}
        </aside>
      </div>

      <div className="mt-6 rounded-md border border-brass/30 bg-brass/10 p-4 text-sm leading-6 text-ink/70">
        Stripe Checkout starts a 60-day MAI free trial. When Stripe confirms checkout, this account becomes an MAI account and unlocks faster verification, protected records, and exportable documentation while the subscription is trialing or active.
      </div>
    </PageShell>
  );
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString();
}

function getSubscriptionStatusLabel({ displaySubscription, isMai, isTrialingMai, isActiveMai, isOwnerMai, isCanceledMai }) {
  if (!isMai) return 'Free Belt User account';
  if (isOwnerMai) return 'Full Access';
  if (isTrialingMai) return 'Free Trial';
  if (isActiveMai && !displaySubscription.cancelAtPeriodEnd) return 'Full Access';
  if (isCanceledMai || displaySubscription.cancelAtPeriodEnd || displaySubscription.status === 'past_due') return 'Restricted Access';
  return 'Restricted Access';
}
