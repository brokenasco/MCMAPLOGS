import React from 'react';
import { CheckCircle2, ClipboardList, Eye, MessageSquare, PlusCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';
import LogDetailPanel from '../components/LogDetailPanel.jsx';
import PageShell from '../components/PageShell.jsx';
import StatCard from '../components/StatCard.jsx';
import { RoleBadge } from '../components/Header.jsx';
import { useApp } from '../context/AppContext.jsx';
import { formatMinutes } from '../data/mcmapReference.js';

export default function MaiDashboard() {
  const { maiUser, pendingLogs, verifiedLogs, returnedLogs, maiSubmittedLogs, verifyLog, returnLog } = useApp();
  const [selectedLog, setSelectedLog] = React.useState(null);
  const [returningLog, setReturningLog] = React.useState(null);
  const [returnReason, setReturnReason] = React.useState('Missing detail');
  const [returnMessage, setReturnMessage] = React.useState('Add the techniques trained, who supervised the period, and resubmit.');
  const [actionMessage, setActionMessage] = React.useState('');
  const pendingMaiSubmissions = maiSubmittedLogs.filter((log) => log.status === 'Pending').length;
  const verifiedMaiSubmissions = maiSubmittedLogs.filter((log) => log.status === 'Verified').length;
  const oldestPending = pendingLogs
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  const handleVerify = async (log) => {
    await verifyLog(log.id);
    setSelectedLog(null);
    setActionMessage(`${log.marine}'s log was verified.`);
  };

  const handleReturn = async () => {
    await returnLog(returningLog.id, returnReason, returnMessage);
    setActionMessage(`${returningLog.marine}'s log was returned for correction.`);
    setReturningLog(null);
    setSelectedLog(null);
  };

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
            to="#pending-verification"
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-brass px-4 text-sm font-bold text-ink"
          >
            <ClipboardList size={18} aria-hidden="true" />
            Review pending logs
          </Link>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Pending logs" value={pendingLogs.length} detail="Need review" />
        <StatCard label="Verified logs" value={verifiedLogs.length} detail="Signed records" />
        <StatCard label="Returned logs" value={returnedLogs.length} detail="Need follow-up" />
        <StatCard label="Assigned MAI number" value={maiUser.maiNumber} detail="Used to verify logbooks" />
        <StatCard label="My submitted hours" value={maiSubmittedLogs.length} detail="Sent to other MAIs" />
        <StatCard label="My pending MAI hours" value={pendingMaiSubmissions} detail="Awaiting verification" />
        <StatCard label="My verified MAI hours" value={verifiedMaiSubmissions} detail="Approved by another MAI" />
        <StatCard label="Awaiting my MAI review" value={pendingLogs.length} detail="Belt User or MAI submissions" />
      </div>

      <div id="pending-verification" className="mt-8 flex flex-col justify-between gap-4 rounded-md border border-coyote/35 bg-paper p-5 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold">Pending verification</h2>
          <p className="mt-1 text-sm text-ink/65">
            New submissions appear here while they are Pending. After you sign them, they move to Verified.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/mai/submit"
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-olive px-4 text-sm font-bold text-white hover:bg-olive/90"
          >
            <PlusCircle size={18} aria-hidden="true" />
            Submit my hours
          </Link>
        </div>
      </div>

      {actionMessage ? (
        <div className="mt-5 rounded-md border border-olive/25 bg-olive/10 p-4 text-sm font-semibold text-olive">
          {actionMessage}
        </div>
      ) : null}

      {returningLog ? (
        <section className="mt-5 rounded-md border border-clay/25 bg-clay/10 p-5">
          <p className="text-sm font-bold uppercase tracking-wide text-clay">Return log</p>
          <h2 className="mt-1 text-xl font-bold text-ink">{returningLog.marine}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-ink">Return reason</span>
              <select
                value={returnReason}
                onChange={(event) => setReturnReason(event.target.value)}
                className="focus-ring mt-2 h-11 w-full rounded-md border border-ink/15 bg-paper px-3 text-sm"
              >
                <option>Missing detail</option>
                <option>Incorrect hours</option>
                <option>Wrong MAI number</option>
                <option>Needs correction</option>
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-bold text-ink">Message to Belt User</span>
              <textarea
                value={returnMessage}
                onChange={(event) => setReturnMessage(event.target.value)}
                className="focus-ring mt-2 min-h-24 w-full rounded-md border border-ink/15 px-3 py-3 text-sm"
              />
            </label>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleReturn}
              className="focus-ring inline-flex h-10 items-center gap-2 rounded-md bg-clay px-4 text-sm font-bold text-white"
            >
              <MessageSquare size={17} aria-hidden="true" />
              Return log
            </button>
            <button
              type="button"
              onClick={() => setReturningLog(null)}
              className="focus-ring inline-flex h-10 items-center rounded-md border border-ink/15 bg-field px-4 text-sm font-bold text-ink"
            >
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      <div className="mt-8">
        {oldestPending ? (
          <div className="mb-4 rounded-md border border-brass/30 bg-brass/10 p-4 text-sm leading-6 text-ink/70">
            Oldest pending log: {oldestPending.marine}, submitted for {new Date(`${oldestPending.date}T12:00:00`).toLocaleDateString()}.
          </div>
        ) : null}
        {pendingLogs.length ? (
          <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
            <div className="grid gap-4">
              {pendingLogs.map((log) => (
                <PendingReviewCard
                  key={log.id}
                  log={log}
                  onReturn={() => {
                    setReturningLog(log);
                    setSelectedLog(log);
                    setReturnReason('Missing detail');
                    setReturnMessage('Add the techniques trained, who supervised the period, and resubmit.');
                  }}
                  onVerify={() => handleVerify(log)}
                  onView={() => setSelectedLog(log)}
                />
              ))}
            </div>
            <LogDetailPanel log={selectedLog} onClose={() => setSelectedLog(null)} />
          </div>
        ) : (
          <EmptyState title="No logs need review right now" text="When Belt Users submit hours to your MAI number, they will appear here." />
        )}
      </div>
    </PageShell>
  );
}

function PendingReviewCard({ log, onReturn, onVerify, onView }) {
  return (
    <article className="rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
        <div>
          <h3 className="text-xl font-bold text-ink">{log.marine}</h3>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <ReviewDetail label="Belt attempted" value={log.targetBelt || log.beltLevel} />
            <ReviewDetail label="Technique / tie-in" value={log.techniqueName || log.description || 'Not listed'} />
            <ReviewDetail label="Class code" value={log.classCode || 'General'} />
            <ReviewDetail label="Submitted time" value={formatLogTime(log)} />
            <ReviewDetail label="Date submitted" value={formatDate(log.date)} />
          </dl>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={onView}
            className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-ink/15 bg-field px-3 text-sm font-bold text-ink"
          >
            <Eye size={16} aria-hidden="true" />
            View
          </button>
          <button
            type="button"
            onClick={onVerify}
            className="focus-ring inline-flex h-10 items-center gap-2 rounded-md bg-olive px-3 text-sm font-bold text-white"
          >
            <CheckCircle2 size={16} aria-hidden="true" />
            Verify
          </button>
          <button
            type="button"
            onClick={onReturn}
            className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-clay/30 bg-paper px-3 text-sm font-bold text-clay"
          >
            <XCircle size={16} aria-hidden="true" />
            Return
          </button>
        </div>
      </div>
    </article>
  );
}

function ReviewDetail({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-ink/50">{label}</dt>
      <dd className="mt-1 text-sm font-semibold leading-6 text-ink">{value}</dd>
    </div>
  );
}

function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString();
}

function formatLogTime(log) {
  return formatMinutes(Number(log.minutes ?? Math.round(Number(log.hours || 0) * 60)));
}
