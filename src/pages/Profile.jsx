import React from 'react';
import PageShell from '../components/PageShell.jsx';
import StatCard from '../components/StatCard.jsx';
import { RoleBadge } from '../components/Header.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function Profile() {
  const { activeRole, beltUser, maiUser, beltLogs, pendingLogs, verifiedLogs, displaySubscription } = useApp();
  const isMai = activeRole === 'MAI';
  const user = isMai ? maiUser : beltUser;

  return (
    <PageShell
      eyebrow="Settings"
      title="Profile"
      description="Review your account details."
      actions={<RoleBadge role={activeRole} />}
    >
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <section className="rounded-md border border-coyote/35 bg-paper p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-clay">Account</p>
          <h2 className="mt-2 text-2xl font-bold text-ink">{user.name}</h2>
          <p className="mt-1 text-sm text-ink/60">{user.email}</p>
          <dl className="mt-6 space-y-4">
            <Detail label="Account type" value={activeRole} />
            <Detail label="Unit" value={user.unit || maiUser.unit} />
            <Detail label="Belt level" value={beltUser.beltLevel} />
            <Detail label="MAI number" value={isMai ? maiUser.maiNumber : 'Assigned only to MAI accounts'} />
            <Detail
              label="Subscription"
              value={
                displaySubscription.status === 'trial'
                  ? `Trial until ${displaySubscription.trialEndsAt}, then $${displaySubscription.monthlyPrice}/month`
                  : `$${displaySubscription.monthlyPrice}/month active`
              }
            />
          </dl>
        </section>

        <section>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="My logs" value={beltLogs.length} detail="Belt User submissions" />
            <StatCard label="Pending queue" value={pendingLogs.length} detail="MAI review" />
            <StatCard label="Verified logs" value={verifiedLogs.length} detail="Signed records" />
          </div>

          <div className="mt-5 rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
            <h2 className="text-xl font-bold">Account role</h2>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              Your role is controlled by your saved account profile. Belt Users submit logs. MAIs review and sign logs.
            </p>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-ink/50">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}
