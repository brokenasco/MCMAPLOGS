import React from 'react';
import { AlertTriangle, CreditCard, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import StatCard from '../components/StatCard.jsx';
import { RoleBadge } from '../components/Header.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function Profile() {
  const navigate = useNavigate();
  const { activeRole, beltUser, maiUser, beltLogs, pendingLogs, verifiedLogs, displaySubscription, deleteAccount } = useApp();
  const [deleteText, setDeleteText] = React.useState('');
  const [deleteMessage, setDeleteMessage] = React.useState('');
  const [isDeleting, setIsDeleting] = React.useState(false);
  const isMai = activeRole === 'MAI';
  const user = isMai ? maiUser : beltUser;
  const canDelete = deleteText === 'DELETE';

  const handleDeleteAccount = async () => {
    if (!canDelete) return;

    setIsDeleting(true);
    setDeleteMessage('');

    try {
      await deleteAccount();
      navigate('/');
    } catch (error) {
      setDeleteMessage(error.message || 'Account could not be deleted. Try again.');
    } finally {
      setIsDeleting(false);
    }
  };

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
                activeRole === 'MAI'
                  ? displaySubscription.status === 'trialing'
                    ? '3-month free trial active'
                    : displaySubscription.status === 'active'
                    ? '$84.99/year active'
                    : '3-month trial checkout required'
                  : 'Free Belt User account'
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

          <div className="mt-5 rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
            <h2 className="text-xl font-bold">{isMai ? 'Manage Subscription' : 'Upgrade to MAI'}</h2>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              {isMai
                ? 'Review MAI trial status, annual billing, and Stripe checkout from one place.'
                : 'When you become an MAI, use this same account to start the MAI trial and unlock verification tools after checkout.'}
            </p>
            <Link
              to="/profile/subscription"
              className="focus-ring mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-olive px-4 text-sm font-bold text-white hover:bg-olive/90"
            >
              <CreditCard size={17} aria-hidden="true" />
              {isMai ? 'Manage Subscription' : 'Upgrade to MAI'}
            </Link>
          </div>

          <div className="mt-5 rounded-md border border-clay/30 bg-clay/10 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="mt-1 text-clay">
                <AlertTriangle size={20} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-ink">Delete account</h2>
                <p className="mt-2 text-sm leading-6 text-ink/70">
                  This removes your login, profile, and submitted training logs. If this is a paid MAI account,
                  the connected Stripe subscription is canceled during deletion.
                </p>
              </div>
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-bold text-ink">Type DELETE to confirm</span>
              <input
                value={deleteText}
                onChange={(event) => setDeleteText(event.target.value)}
                className="focus-ring mt-2 h-11 w-full rounded-md border border-clay/30 bg-paper px-3 text-sm"
                placeholder="DELETE"
              />
            </label>

            {deleteMessage ? (
              <div className="mt-4 rounded-md border border-clay/20 bg-paper p-4 text-sm font-semibold text-clay">
                {deleteMessage}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={!canDelete || isDeleting}
              className="focus-ring mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-clay px-4 text-sm font-bold text-white hover:bg-clay/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={17} aria-hidden="true" />
              {isDeleting ? 'Deleting account...' : 'Delete my account'}
            </button>
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
