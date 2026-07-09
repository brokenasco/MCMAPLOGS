import React from 'react';
import { CheckCircle2, ClipboardList, Clock3, Eye, MessageSquare, PlusCircle, XCircle } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import LogDetailPanel from '../components/LogDetailPanel.jsx';
import PageShell from '../components/PageShell.jsx';
import ProfileBadges from '../components/ProfileBadges.jsx';
import { useApp } from '../context/AppContext.jsx';
import { formatMinutes } from '../data/mcmapReference.js';
import { buildBeltProgress, getBeltTrail } from '../lib/mcmapProgress.js';
import { SubmitMaiHoursForm } from './SubmitMaiHours.jsx';

export default function MaiDashboard() {
  const { displaySubscription, maiUser, pendingLogs, profile, verifiedLogs, returnedLogs, maiSubmittedLogs, verifyLog, returnLog } = useApp();
  const [selectedLog, setSelectedLog] = React.useState(null);
  const [returningLog, setReturningLog] = React.useState(null);
  const [returnReason, setReturnReason] = React.useState('Missing detail');
  const [returnMessage, setReturnMessage] = React.useState('Add the techniques trained, who supervised the period, and resubmit.');
  const [actionMessage, setActionMessage] = React.useState('');
  const [activePanel, setActivePanel] = React.useState('pending');
  const currentBelt = profile?.belt_level || maiUser.beltLevel;
  const progressUser = React.useMemo(() => ({ ...maiUser, beltLevel: currentBelt }), [currentBelt, maiUser]);
  const maiProgress = React.useMemo(() => buildBeltProgress({ beltUser: progressUser, logs: maiSubmittedLogs }), [maiSubmittedLogs, progressUser]);
  const beltTrail = React.useMemo(() => getBeltTrail(currentBelt, maiProgress.percent), [currentBelt, maiProgress.percent]);

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

  const scrollToSection = (sectionId) => {
    window.requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleStickyAction = () => {
    if (pendingLogs.length) {
      setActivePanel('pending');
      scrollToSection('pending-verification');
      return;
    }

    setActivePanel('log');
    scrollToSection('submit-my-hours');
  };

  return (
    <PageShell
      eyebrow="MAI"
      title={`Verification queue for ${maiUser.name}`}
      description={`Unit: ${maiUser.unit}. Assigned MAI number: ${maiUser.maiNumber}.`}
      actions={
        <ProfileBadges
          displaySubscription={displaySubscription}
          isMai
          maiCode={profile?.mai_number || maiUser.maiNumber}
          profile={profile}
        />
      }
    >
      <section className="mb-6 rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-clay">Belt path</p>
        <div className="mt-4 grid gap-3 sm:hidden">
          {getMobileBeltTrail(beltTrail, maiProgress.targetBelt).map((item) => (
            <BeltTrailItem key={item.belt} item={item} />
          ))}
        </div>
        <div className="mt-4 hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-5">
          {beltTrail.map((item) => (
            <BeltTrailItem key={item.belt} item={item} />
          ))}
        </div>
      </section>

      <section className="rounded-md border border-coyote/35 bg-charcoal p-5 text-paper shadow-sm sm:p-6">
        <p className="text-sm font-black uppercase tracking-wide text-brass">Command Center</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <CommandDetail label="Current Belt" value={maiProgress.currentBelt} />
          <CommandDetail label="Working Toward" value={maiProgress.targetBelt} />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
            <ProgressMessage progress={maiProgress} />
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
          <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={handleReturn}
              className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-clay px-4 text-sm font-bold text-white sm:h-10"
            >
              <MessageSquare size={17} aria-hidden="true" />
              Return log
            </button>
            <button
              type="button"
              onClick={() => setReturningLog(null)}
              className="focus-ring inline-flex h-11 items-center justify-center rounded-md border border-ink/15 bg-field px-4 text-sm font-bold text-ink sm:h-10"
            >
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      {activePanel === 'pending' ? (
        <section id="pending-verification" className="mt-5 scroll-mt-28">
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
        <section id="submit-my-hours" className="mt-8 scroll-mt-28">
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

      <MobileStickyAction
        label={pendingLogs.length ? 'Pending Verification' : 'Log My Hours'}
        onClick={handleStickyAction}
      />
    </PageShell>
  );
}

function MobileStickyAction({ label, onClick }) {
  return (
    <div className="fixed inset-x-0 bottom-[84px] z-20 border-t border-coyote/25 bg-paper/95 px-4 py-3 shadow-panel backdrop-blur sm:hidden">
      <button
        type="button"
        onClick={onClick}
        className="focus-ring inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-olive px-4 text-sm font-black text-white"
      >
        <PlusCircle size={18} aria-hidden="true" />
        {label}
      </button>
    </div>
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
        <div className="grid shrink-0 gap-2 sm:flex sm:flex-wrap">
          <button
            type="button"
            onClick={onView}
            className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md border border-ink/15 bg-field px-3 text-sm font-bold text-ink"
          >
            <Eye size={16} aria-hidden="true" />
            View
          </button>
          <button
            type="button"
            onClick={onVerify}
            className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md bg-olive px-3 text-sm font-bold text-white"
          >
            <CheckCircle2 size={16} aria-hidden="true" />
            Verify
          </button>
          <button
            type="button"
            onClick={onReturn}
            className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md border border-clay/30 bg-paper px-3 text-sm font-bold text-clay"
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
      className={`focus-ring flex min-h-20 items-center justify-between gap-4 rounded-md border p-4 text-left transition sm:min-h-24 ${
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

function ProgressMessage({ progress }) {
  if (progress.hasReachedBlackBelt) {
    return 'Congratulations on achieving Black 1st Degree. Continue logging your MCMAP hours to maintain growth, sharpen your skills, and keep leading from the front.';
  }

  return `${formatMinutes(Math.max(progress.requiredMinutes - progress.completedMinutes, 0))} remaining. ${Math.max(progress.totalCount - progress.completedCount, 0)} of ${progress.totalCount} techniques left.`;
}

function BeltTrailItem({ item }) {
  const styles = {
    Complete: 'border-olive/30 bg-olive/10 text-olive',
    Current: 'border-brass/50 bg-brass/15 text-ink',
    Locked: 'border-coyote/35 bg-field text-ink/55'
  };
  const Icon = item.status === 'Complete' ? CheckCircle2 : item.status === 'Current' ? Clock3 : XCircle;

  return (
    <div className={`rounded-md border p-4 ${styles[item.status]}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-black">{item.belt}</p>
        <Icon size={18} aria-hidden="true" />
      </div>
      <p className="mt-2 text-xs font-bold uppercase tracking-wide">{item.label}</p>
    </div>
  );
}

function getMobileBeltTrail(beltTrail, targetBelt) {
  if (targetBelt === 'Additional MCMAP Hours') {
    const blackBelt = beltTrail.find((item) => item.belt === 'Black 1st Degree') || beltTrail[beltTrail.length - 1];
    return [
      blackBelt,
      { belt: 'Additional MCMAP Hours', status: 'Current', label: 'Logging' }
    ].filter(Boolean);
  }

  const targetIndex = beltTrail.findIndex((item) => item.status === 'Current');
  const startIndex = Math.max(targetIndex - 1, 0);
  const mobileTrail = beltTrail.slice(startIndex, startIndex + 3);

  if (mobileTrail.length < 3 && mobileTrail.at(-1)?.belt === 'Black 1st Degree') {
    mobileTrail.push({ belt: 'Additional MCMAP Hours', status: 'Locked', label: 'Next' });
  }

  return mobileTrail;
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
