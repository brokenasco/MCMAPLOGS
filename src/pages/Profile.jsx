import React from 'react';
import PageShell from '../components/PageShell.jsx';
import StatCard from '../components/StatCard.jsx';
import { RoleBadge } from '../components/Header.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function Profile() {
  const { activeRole, setActiveRole, beltUser, maiUser, beltLogs, pendingLogs, verifiedLogs, subscription } = useApp();
  const isMai = activeRole === 'MAI';
  const user = isMai ? maiUser : beltUser;

  return (
    <PageShell
      eyebrow="Settings"
      title="Profile"
      description="Review the mock account details that would eventually come from Supabase."
      actions={<RoleBadge role={activeRole} />}
    >
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <section className="rounded-md border border-ink/10 bg-white p-6 shadow-sm">
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
              value={subscription.status === 'trial' ? `Trial until ${subscription.trialEndsAt}` : '$2/month active'}
            />
          </dl>
        </section>

        <section>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="My logs" value={beltLogs.length} detail="Belt User submissions" />
            <StatCard label="Pending queue" value={pendingLogs.length} detail="MAI review" />
            <StatCard label="Verified logs" value={verifiedLogs.length} detail="Signed records" />
          </div>

          <div className="mt-5 rounded-md border border-ink/10 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">Demo role switch</h2>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              During the mock front-end phase, this lets you preview how navigation changes for each account type.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {['Belt User', 'MAI'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setActiveRole(role)}
                  className={`focus-ring h-10 rounded-md px-4 text-sm font-bold ${
                    activeRole === role ? 'bg-olive text-white' : 'border border-ink/15 bg-field text-ink hover:bg-white'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
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
