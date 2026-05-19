import React from 'react';
import { CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

export default function SubscriptionBanner() {
  const { subscription } = useApp();
  const isTrial = subscription.status === 'trial';
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(`${subscription.trialEndsAt}T12:00:00`) - new Date()) / 86400000)
  );

  return (
    <div className="border-b border-ink/10 bg-ink text-white">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-4 py-3 text-sm sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <p className="font-semibold">
          {isTrial
            ? `Free trial active: ${daysLeft} days left. Then $2/month.`
            : 'Subscription active: $2/month plan.'}
        </p>
        <Link
          to="/subscription"
          className="focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-md bg-white px-3 text-sm font-bold text-ink hover:bg-field"
        >
          <CreditCard size={16} aria-hidden="true" />
          Manage subscription
        </Link>
      </div>
    </div>
  );
}
