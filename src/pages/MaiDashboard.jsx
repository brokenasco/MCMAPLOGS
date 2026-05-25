import React from 'react';
import { CheckCircle2, ClipboardList, Eye, MessageSquare, PlusCircle, XCircle } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import LogDetailPanel from '../components/LogDetailPanel.jsx';
import PageShell from '../components/PageShell.jsx';
import StatCard from '../components/StatCard.jsx';
import { RoleBadge } from '../components/Header.jsx';
import { useApp } from '../context/AppContext.jsx';
import { formatMinutes } from '../data/mcmapReference.js';
import { buildBeltProgress } from '../lib/mcmapProgress.js';
import { SubmitMaiHoursForm } from './SubmitMaiHours.jsx';

export default function MaiDashboard() {
  const { maiUser, pendingLogs, profile, verifiedLogs, returnedLogs, maiSubmittedLogs, verifyLog, returnLog } = useApp();
  const [selectedLog, setSelectedLog] = React.useState(null);
  const [returningLog, setReturningLog] = React.useState(null);
  const [returnReason, setReturnReason] = React.useState('Missing detail');
  const [returnMessage, setReturnMessage] = React.useState('Add the techniques trained, who supervised the period, and resubmit.');
  const [actionMessage, setActionMessage] = React.useState('');
  const [activePanel, setActivePanel] = React.useState('pending');
  const pendingMaiSubmissions = maiSubmittedLogs.filter((log) => log.status === 'Pending').length;
  const verifiedMaiSubmissions = maiSubmittedLogs.filter((log) => log.status === 'Verified').length;
  const pendingMaiMinutes = maiSubmittedLogs
    .filter((log) => log.status === 'Pending')
    .reduce((total, log) => total + getLogMinutes(log), 0);
  const currentBelt = profile?.belt_level || maiUser.beltLevel;
  const progressUser = React.useMemo(() => ({ ...maiUser, beltLevel: currentBelt }), [currentBelt, maiUser]);
  const maiProgress = React.useMemo(() => buildBeltProgress({ beltUser: progressUser, logs: maiSubmittedLogs }), [maiSubmittedLogs, progressUser]);
  const lastSubmittedMaiLog = React.useMemo(() => {
    return maiSubmittedLogs
      .slice()
      .sort((a, b) => new Date(b.submittedAt || b.date) - new Date(a.submittedAt || a.date))[0];
  }, [maiSubmittedLogs]);

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
      <section className="rounded-md border border-coyote/35 bg-charcoal p-5 text-paper shadow-sm sm:p-6">
        <p className="text-sm font-black uppercase tracking-wide text-brass">Command Center</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <CommandDetail label="Current Belt" value={maiProgress.currentBelt} />
          <CommandDetail label="Working Toward" value={maiProgress.targetBelt} />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <CommandActionButton
            active={activePanel === 'pending'}
            detail={`${pendingLogs.length} pending ${pendingLogs.length === 1 ? 'log' : 'logs'}`}
            icon={ClipboardList}
            label="Logs Pending Verification"
            onClick={() => setActivePanel('pending')}
          />
          <CommandActionButton
            active={activePanel === 'log'}
            detail="Submit MCMAP hours"
            icon={PlusCircle}
            label="Log My Hours"
            onClick={() => setActivePanel('log')}
          />
        </div>
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-paper/60">
            <span>Overall belt progress</span>
            <span>{maiProgress.percent}% complete</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-paper/15">
            <div className="h-full rounded-full bg-brass" style={{ width: `${maiProgress.percent}%` }} />
          </div>
          <p className="mt-3 text-sm leading-6 text-paper/70">
            {formatMinutes(Math.max(maiProgress.requiredMinutes - maiProgress.completedMinutes, 0))} remaining. {Math.max(maiProgress.totalCount - maiProgress.completedCount, 0)} of {maiProgress.totalCount} techniques left.
          </p>
        </div>
      </section>

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

      {activePanel === 'pending' ? (
        <section id="pending-verification" className="mt-5">
          <div className="mb-3 flex items-center gap-2">
            <ClipboardList size={20} className="text-clay" aria-hidden="true" />
            <h2 className="text-xl font-bold">Pending Logs</h2>
          </div>
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
        </section>
      ) : (
        <section id="submit-my-hours" className="mt-8 scroll-mt-24">
          <div className="mb-5">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-clay">Log My Hours</p>
              <h2 className="mt-1 text-xl font-bold">Track your own MCMAP training</h2>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                Submit your training hours to another MAI for verification. MAIs cannot verify their own hours.
              </p>
            </div>
          </div>
          <SubmitMaiHoursForm embedded />
        </section>
      )}

      <section className="mt-8">
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <MiniSummary label="Current target belt" value={maiProgress.targetBelt} />
          <MiniSummary
            label="Last submitted MAI log"
            value={lastSubmittedMaiLog ? formatDate(lastSubmittedMaiLog.date) : 'None yet'}
            detail={lastSubmittedMaiLog ? shortTechnique(lastSubmittedMaiLog) : 'Submit your first MAI training log'}
          />
          <MiniSummary label="Hours pending verification" value={formatMinutes(pendingMaiMinutes)} detail={`${pendingMaiSubmissions} pending ${pendingMaiSubmissions === 1 ? 'log' : 'logs'}`} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-bold">Other Statistics / Career Data</h2>
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
      </section>

      <section className="mt-8 rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-clay">Recent Activity</p>
        <h2 className="mt-1 text-xl font-bold">Latest MAI log activity</h2>
        <div className="mt-4 grid gap-3">
          {getRecentActivity([...pendingLogs, ...verifiedLogs, ...returnedLogs, ...maiSubmittedLogs]).length ? (
            getRecentActivity([...pendingLogs, ...verifiedLogs, ...returnedLogs, ...maiSubmittedLogs]).map((log) => (
              <div key={`${log.id}-${log.status}`} className="rounded-md border border-coyote/30 bg-field p-4">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-bold text-ink">{log.marine || log.submitterName || 'Training log'}</p>
                    <p className="mt-1 text-sm text-ink/60">
                      {shortTechnique(log)} | {log.targetBelt || log.beltLevel} | {formatLogTime(log)}
                    </p>
                  </div>
                  <p className="text-sm font-black text-ink">{log.status}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm leading-6 text-ink/65">No recent activity yet.</p>
          )}
        </div>
      </section>
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

function CommandDetail({ label, value }) {
  return (
    <div className="rounded-md border border-paper/10 bg-paper/10 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-paper/55">{label}</p>
      <p className="mt-1 text-2xl font-black text-paper">{value}</p>
    </div>
  );
}

function CommandActionButton({ active, detail, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`focus-ring flex min-h-24 items-center justify-between gap-4 rounded-md border p-4 text-left transition ${
        active
          ? 'border-brass bg-brass text-ink shadow-sm'
          : 'border-paper/10 bg-paper/10 text-paper hover:bg-paper/15'
      }`}
    >
      <span>
        <span className={`block text-xs font-bold uppercase tracking-wide ${active ? 'text-ink/65' : 'text-paper/55'}`}>
          {label}
        </span>
        <span className="mt-1 block text-lg font-black">{detail}</span>
      </span>
      <Icon size={22} aria-hidden="true" />
    </button>
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

function MiniSummary({ label, value, detail }) {
  return (
    <div className="rounded-md border border-coyote/30 bg-field p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-ink/50">{label}</p>
      <p className="mt-1 text-lg font-black text-ink">{value}</p>
      {detail ? <p className="mt-1 text-sm leading-5 text-ink/60">{detail}</p> : null}
    </div>
  );
}

function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString();
}

function formatLogTime(log) {
  return formatMinutes(getLogMinutes(log));
}

function getLogMinutes(log) {
  return Number(log.minutes ?? Math.round(Number(log.hours || 0) * 60));
}

function shortTechnique(log) {
  return log.techniqueName?.split('/')[0].trim() || log.description?.split(':').pop()?.trim() || 'Training log';
}

function getRecentActivity(logs) {
  return logs
    .filter(Boolean)
    .slice()
    .sort((a, b) => new Date(b.submittedAt || b.date) - new Date(a.submittedAt || a.date))
    .slice(0, 5);
}
