import React from 'react';
import { CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

export default function SubscriptionBanner() {
  const { activeRole, displaySubscription } = useApp();
  const isMai = activeRole === 'MAI';
  const hasActiveMaiPlan = isMai && displaySubscription.status === 'active';
  const hasTrialingMaiPlan = isMai && displaySubscription.status === 'trialing';
  const hasLifetimeMaiPlan = isMai && displaySubscription.status === 'lifetime_free';

  return (
    <div className="border-b border-coyote/30 bg-olive text-paper">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-4 py-3 text-sm sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <p className="font-semibold">
          {!isMai
            ? 'Belt User accounts are free.'
            : hasTrialingMaiPlan
              ? 'MAI 3-week free trial active. Then only $25 every 3 months.'
              : hasLifetimeMaiPlan
              ? 'Lifetime MAI access active. No payment required.'
              : hasActiveMaiPlan
              ? 'MAI subscription active: only $25 every 3 months.'
              : 'MAI access starts with a 3-week free trial, then only $25 every 3 months.'}
        </p>
        <Link
          to="/profile/subscription"
          className="focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-md bg-paper px-3 text-sm font-bold text-ink hover:bg-field"
        >
          <CreditCard size={16} aria-hidden="true" />
          Manage Subscription
        </Link>
      </div>
    </div>
  );
}
