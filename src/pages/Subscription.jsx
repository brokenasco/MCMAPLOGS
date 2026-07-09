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
  const isLifetimeMai = isMai && displaySubscription.status === 'lifetime_free';
  const isCanceledMai = isMai && ['canceled', 'cancelled'].includes(displaySubscription.status);
  const isPastDueMai = isMai && ['past_due', 'unpaid', 'incomplete', 'incomplete_expired'].includes(displaySubscription.status);
  const hasMaiAccess = isActiveMai || isTrialingMai || isOwnerMai || isLifetimeMai;
  const isUpgradeFlow = activeRole === 'Belt User';
  const checkoutResult = searchParams.get('checkout');
  const subscriptionStatus = getSubscriptionStatus({ displaySubscription, isMai, isTrialingMai, isActiveMai, isOwnerMai, isLifetimeMai, isCanceledMai, isPastDueMai });
  const subscriptionStatusLabel = subscriptionStatus.label;
  const renewalLabel = getRenewalLabel({ displaySubscription, isActiveMai, isCanceledMai, isTrialingMai });

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
          : 'Belt User accounts are free. MAIs use the discounted quarterly plan to protect records, speed up verification, and export official documentation.'
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
                    : isLifetimeMai
                    ? 'Lifetime MAI access is unlocked without Stripe billing.'
                    : 'MAI accounts save time by reviewing, returning, signing, and exporting MCMAP records from one organized workspace.'
                  : 'Your Belt User account stays free. Upgrade this same account to MAI when you are ready to reduce paperwork and verify Marine training records.'}
              </p>
            </div>
            <div className="rounded-md bg-field px-4 py-4 text-center sm:min-w-64">
              <p className="text-sm font-black uppercase tracking-wide text-clay">Limited MAI offer</p>
              <p className="mt-2 text-3xl font-black leading-tight text-ink">{isUpgradeFlow ? subscriptionPlans.MAI.priceDisplay : displaySubscription.priceDisplay}</p>
              <p className="mt-2 text-sm font-black uppercase tracking-wide text-olive">
                {isOwnerMai
                  ? 'owner access, no payment required'
                  : isLifetimeMai
                  ? 'lifetime access, no payment required'
                  : isMai || isUpgradeFlow
                  ? subscriptionPlans.MAI.billingDetail
                  : 'no payment required'}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-md border border-olive/20 bg-olive/10 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-olive">
              <CheckCircle2 size={17} aria-hidden="true" />
              {subscriptionStatusLabel}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink/70">{subscriptionStatus.detail}</p>
            <p className="mt-2 text-sm leading-6 text-ink/70">
              {!isMai
                ? 'Start the 3-week MAI trial to unlock verification tools, protected records, exportable history, and faster documentation for belt advancement, JEPES, and FITREP support.'
                : isOwnerMai
                ? 'This owner MAI account can use verification tools for free. No checkout or Stripe billing is required.'
                : isLifetimeMai
                ? 'This MAI account has lifetime access. No checkout, trial, or Stripe billing is required.'
                : isTrialingMai
                  ? `Your MAI tools are unlocked during the trial${displaySubscription.currentPeriodEnd ? ` through ${formatDate(displaySubscription.currentPeriodEnd)}` : ''}. After the trial, billing is only $25 every 3 months for verification, exports, and reduced administrative work.`
                  : isActiveMai
                  ? `${displaySubscription.cancelAtPeriodEnd ? 'Your plan is set to cancel at the end of the billing period' : 'Your discounted MAI plan is active'}${displaySubscription.currentPeriodEnd ? ` through ${formatDate(displaySubscription.currentPeriodEnd)}` : ''}.`
                  : isCanceledMai
                  ? 'This MAI subscription is canceled. Start checkout again to unlock verification tools.'
                  : isPastDueMai
                  ? 'Payment is missing or failed. Resume subscription to restore MAI premium features.'
                  : 'Start the 3-week free trial to unlock MAI verification, exportable records, and paperwork-reduction tools. Billing is only $25 every 3 months after the trial.'}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <SubscriptionDetail label="Billing cycle / renewal date" value={renewalLabel} />
              <SubscriptionDetail label="Data preservation" value="Account data, logs, messages, and history stay preserved." />
            </div>
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
                {isRedirecting ? 'Opening Stripe...' : isUpgradeFlow ? 'Upgrade to MAI' : 'Resume Subscription'}
              </button>
            ) : null}
            {isMai && hasMaiAccess && !isOwnerMai && !isLifetimeMai ? (
              <>
                <button
                  type="button"
                  onClick={openBillingPortal}
                  disabled={isOpeningPortal}
                  className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md border border-ink/15 bg-field px-4 text-sm font-bold text-ink hover:bg-paper"
                >
                  <CreditCard size={17} aria-hidden="true" />
                  {isOpeningPortal ? 'Opening billing...' : 'Manage Subscription'}
                </button>
                <button
                  type="button"
                  onClick={openBillingPortal}
                  disabled={isOpeningPortal}
                  className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md border border-clay/25 bg-clay/10 px-4 text-sm font-bold text-clay hover:bg-clay/15"
                >
                  <CreditCard size={17} aria-hidden="true" />
                  {displaySubscription.cancelAtPeriodEnd ? 'Resume Subscription' : 'Cancel Subscription'}
                </button>
              </>
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
          <StatCard label="MAI trial" value="3 weeks" detail="Free before discounted billing" />
          <StatCard label="MAI value" value="Less admin" detail="Verify, return, and export records faster" />
          <StatCard label="Records" value="Protected" detail="Keep verified MCMAP documentation organized" />
          <StatCard label="MAI discount price" value="ONLY $25" detail="Charged every 3 months after the 3-week trial" />
          <StatCard label="Billing date" value={renewalLabel} detail="From Stripe subscription records" />
          {isMai ? (
            <StatCard
              label="Subscription status"
              value={subscriptionStatusLabel}
              detail={subscriptionStatus.detail}
            />
          ) : null}
        </aside>
      </div>

      <div className="mt-6 rounded-md border border-brass/30 bg-brass/10 p-4 text-sm leading-6 text-ink/70">
        Stripe Checkout upgrades the existing account. Current belt, logbook history, verified hours, extra verified hours, messages, and profile data stay preserved. If an MAI cancels, access continues through the paid billing period and data stays preserved for future reactivation.
      </div>
    </PageShell>
  );
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString();
}

function SubscriptionDetail({ label, value }) {
  return (
    <div className="rounded-md bg-paper/70 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-ink/45">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function getSubscriptionStatus({ displaySubscription, isMai, isTrialingMai, isActiveMai, isOwnerMai, isLifetimeMai, isCanceledMai, isPastDueMai }) {
  if (!isMai) {
    return {
      label: 'Free Account',
      detail: 'Belt Users are free.'
    };
  }

  if (isOwnerMai) {
    return {
      label: 'Full Access',
      detail: 'Owner MAI access is active.'
    };
  }

  if (isLifetimeMai) {
    return {
      label: 'Lifetime MAI Access',
      detail: 'Permanent MAI access is active.'
    };
  }

  if (isTrialingMai) {
    return {
      label: 'Free Trial',
      detail: 'Trial active.'
    };
  }

  if (isActiveMai) {
    return {
      label: 'Full Access',
      detail: displaySubscription.cancelAtPeriodEnd
        ? 'Paid MAI subscription active until the billing period ends.'
        : 'Paid MAI subscription active.'
    };
  }

  if (isCanceledMai || isPastDueMai) {
    return {
      label: 'Restricted Access',
      detail: 'Trial expired and subscription canceled/failed.'
    };
  }

  return {
    label: 'Restricted Access',
    detail: 'Resume subscription to unlock MAI premium features.'
  };
}

function getRenewalLabel({ displaySubscription, isActiveMai, isCanceledMai, isTrialingMai }) {
  if (!displaySubscription.currentPeriodEnd) return 'Not available yet';
  if (isTrialingMai) return `Trial ends ${formatDate(displaySubscription.currentPeriodEnd)}`;
  if (isActiveMai && displaySubscription.cancelAtPeriodEnd) return `Access ends ${formatDate(displaySubscription.currentPeriodEnd)}`;
  if (isActiveMai) return `Renews ${formatDate(displaySubscription.currentPeriodEnd)}`;
  if (isCanceledMai) return `Ended ${formatDate(displaySubscription.currentPeriodEnd)}`;
  return formatDate(displaySubscription.currentPeriodEnd);
}
