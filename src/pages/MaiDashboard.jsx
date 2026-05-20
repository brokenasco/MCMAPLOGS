import React from 'react';
import { AlertTriangle, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';
import LogTable from '../components/LogTable.jsx';
import PageShell from '../components/PageShell.jsx';
import StatCard from '../components/StatCard.jsx';
import { RoleBadge } from '../components/Header.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function MaiDashboard() {
  const { maiUser, pendingLogs, verifiedLogs, returnedLogs } = useApp();
  const oldestPending = pendingLogs
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  return (
    <PageShell
      eyebrow="MAI"
      title={`Verification queue for ${maiUser.name}`}
      description={`Unit: ${maiUser.unit}. Assigned MAI number: ${maiUser.maiNumber}.`}
      actions={<RoleBadge role="MAI" />}
    >
      <section className="mb-8 rounded-md border border-coyote/35 bg-charcoal p-5 text-paper shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-brass">Today</p>
            <h2 className="mt-1 text-2xl font-bold">
              {pendingLogs.length ? `${pendingLogs.length} logs need review` : 'No logs need review'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-paper/70">
              {returnedLogs.length
                ? `${returnedLogs.length} returned log is waiting for Belt User follow-up.`
                : 'No urgent issues in the queue.'}
            </p>
          </div>
          <Link
            to="/mai/pending"
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-brass px-4 text-sm font-bold text-ink"
          >
            <AlertTriangle size={18} aria-hidden="true" />
            Review pending logs
          </Link>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Pending logs" value={pendingLogs.length} detail="Need review" />
        <StatCard label="Verified logs" value={verifiedLogs.length} detail="Signed records" />
        <StatCard label="Returned logs" value={returnedLogs.length} detail="Need follow-up" />
        <StatCard label="Assigned MAI number" value={maiUser.maiNumber} detail="Used to verify logbooks" />
      </div>

      <div className="mt-8 flex flex-col justify-between gap-4 rounded-md border border-coyote/35 bg-paper p-5 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold">Pending verification</h2>
          <p className="mt-1 text-sm text-ink/65">
            Your MAI number is your verification identifier when you sign submitted logbooks.
          </p>
        </div>
        <Link
          to="/mai/pending"
          className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-clay px-4 text-sm font-bold text-white hover:bg-clay/90"
        >
          <ClipboardList size={18} aria-hidden="true" />
          Open pending logs
        </Link>
      </div>

      <div className="mt-8">
        {oldestPending ? (
          <div className="mb-4 rounded-md border border-brass/30 bg-brass/10 p-4 text-sm leading-6 text-ink/70">
            Oldest pending log: {oldestPending.marine}, submitted for {new Date(`${oldestPending.date}T12:00:00`).toLocaleDateString()}.
          </div>
        ) : null}
        {pendingLogs.length ? (
          <LogTable logs={pendingLogs} />
        ) : (
          <EmptyState title="No logs need review right now" text="When Belt Users submit hours to your MAI number, they will appear here." />
        )}
      </div>
    </PageShell>
  );
}
