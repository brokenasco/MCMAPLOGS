import React from 'react';
import { CheckCircle2, ClipboardList, Clock3, Eye, Lock, Pencil, PlusCircle, RotateCcw, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';
import LogDetailPanel from '../components/LogDetailPanel.jsx';
import LogEditForm from '../components/LogEditForm.jsx';
import PageShell from '../components/PageShell.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { RoleBadge } from '../components/Header.jsx';
import { useApp } from '../context/AppContext.jsx';
import { formatMinutes } from '../data/mcmapReference.js';
import { buildBeltProgress, getBeltTrail } from '../lib/mcmapProgress.js';
import { SubmitHoursForm } from './SubmitHours.jsx';

const advancementReminderText = 'You must pass your belt advancement test to update your current belt and unlock the ability to log hours towards your next belt.';

export default function BeltDashboard() {
  const { advanceBeltUser, beltUser, beltLogs, cancelPendingLog, findMaiByNumber, profile, resubmitLog, updatePendingLog } = useApp();
  const [selectedLog, setSelectedLog] = React.useState(null);
  const [editingLog, setEditingLog] = React.useState(null);
  const [editingMode, setEditingMode] = React.useState('edit');
  const [actionMessage, setActionMessage] = React.useState('');
  const [activePanel, setActivePanel] = React.useState('pending');
  const [showAdvancementModal, setShowAdvancementModal] = React.useState(false);
  const [testBlocked, setTestBlocked] = React.useState(false);
  const [isAdvancingBelt, setIsAdvancingBelt] = React.useState(false);
  const currentBelt = profile?.belt_level || beltUser.beltLevel;
  const progressUser = React.useMemo(() => ({ ...beltUser, beltLevel: currentBelt }), [beltUser, currentBelt]);
  const progress = React.useMemo(() => buildBeltProgress({ beltUser: progressUser, logs: beltLogs }), [beltLogs, progressUser]);
  const beltTrail = React.useMemo(() => getBeltTrail(currentBelt, progress.percent), [currentBelt, progress.percent]);
  const pendingLogs = beltLogs.filter((log) => log.status === 'Pending');
  const returnedLogs = beltLogs.filter((log) => log.status === 'Returned');
  const recentLogs = beltLogs.slice(0, 6);
  const hasNoLogs = beltLogs.length === 0;
  const hasCompletedTargetBelt = isTargetBeltComplete(progress);
  const shouldShowCompletionBanner = hasCompletedTargetBelt && !progress.hasReachedBlackBelt;

  React.useEffect(() => {
    setTestBlocked(false);
  }, [currentBelt, progress.targetBelt]);

  const openPendingEdit = (log) => {
    setSelectedLog(log);
    setEditingLog(log);
    setEditingMode('edit');
    setActionMessage('');
  };

  const openReturnedEdit = (log) => {
    setSelectedLog(log);
    setEditingLog(log);
    setEditingMode('resubmit');
    setActionMessage('');
  };

  const handleSaveLogEdit = async (updates) => {
    if (editingMode === 'resubmit') {
      await resubmitLog(editingLog.id, updates);
      setActionMessage('Returned log corrected and resubmitted for MAI verification.');
    } else {
      await updatePendingLog(editingLog.id, updates);
      setActionMessage('Pending log updated. It remains pending for MAI verification.');
    }

    setEditingLog(null);
    setSelectedLog(null);
  };

  const handleCancelPendingLog = async (log) => {
    const confirmed = window.confirm('Cancel this pending log? It will be removed from your logbook and the MAI verification queue.');
    if (!confirmed) return;
    await cancelPendingLog(log.id);
    setSelectedLog(null);
    setActionMessage('Pending log canceled.');
  };

  const openLogMyHours = () => {
    setSelectedLog(null);

    if (hasCompletedTargetBelt) {
      setShowAdvancementModal(true);
      return;
    }

    setTestBlocked(false);
    setActivePanel('log');
  };

  const scrollToSection = (sectionId) => {
    window.requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleStickyAction = () => {
    if (returnedLogs.length) {
      openReturnedEdit(returnedLogs[0]);
      scrollToSection('returned-log-fix');
      return;
    }

    openLogMyHours();
    scrollToSection('submit-hours-section');
  };

  const handlePassedAdvancementTest = async () => {
    setIsAdvancingBelt(true);
    setActionMessage('');

    try {
      await advanceBeltUser(progress.targetBelt);
      setShowAdvancementModal(false);
      setTestBlocked(false);
      setActivePanel('log');
      setActionMessage(`Congratulations. Your account belt has been updated to ${progress.targetBelt}. You can now log hours toward the next belt.`);
    } catch (error) {
      setActionMessage(error.message || 'Your belt could not be updated. Try again.');
    } finally {
      setIsAdvancingBelt(false);
    }
  };

  const handleFailedAdvancementTest = () => {
    setShowAdvancementModal(false);
    setTestBlocked(true);
    setActivePanel('log');
  };

  return (
    <PageShell
      eyebrow="Belt User"
      title={`Welcome, ${beltUser.name}`}
      description="Track your current belt progress and recent MCMAP training records."
      actions={<RoleBadge role="Belt User" />}
    >
      {hasNoLogs ? <NewUserStart currentBelt={currentBelt} targetBelt={progress.targetBelt} /> : null}

      {shouldShowCompletionBanner ? (
        <BeltCompletionBanner targetBelt={progress.targetBelt} />
      ) : (
        <section className="mb-6 rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-clay">Belt path</p>
          <div className="mt-4 grid gap-3 sm:hidden">
            {getMobileBeltTrail(beltTrail, progress.targetBelt).map((item) => (
              <BeltTrailItem key={item.belt} item={item} />
            ))}
          </div>
          <div className="mt-4 hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-5">
            {beltTrail.map((item) => (
              <BeltTrailItem key={item.belt} item={item} />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-md border border-coyote/35 bg-charcoal p-5 text-paper shadow-sm sm:p-6">
        <p className="text-sm font-black uppercase tracking-wide text-brass">Progress Command Center</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <CommandDetail label="Current Belt" value={progress.currentBelt} />
          <CommandDetail label="Working Toward" value={progress.targetBelt} />
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
            onClick={openLogMyHours}
          />
        </div>
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-paper/60">
            <span>Overall belt progress</span>
            <span>{progress.percent}% complete</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-paper/15">
            <div className="h-full rounded-full bg-brass" style={{ width: `${progress.percent}%` }} />
          </div>
          <p className="mt-3 text-sm leading-6 text-paper/70">
            <ProgressMessage progress={progress} />
          </p>
        </div>
      </section>

      {showAdvancementModal ? (
        <AdvancementModal
          isSubmitting={isAdvancingBelt}
          targetBelt={progress.targetBelt}
          onNo={handleFailedAdvancementTest}
          onYes={handlePassedAdvancementTest}
        />
      ) : null}

      {activePanel === 'pending' ? (
        <section id="pending-logs-section" className="mt-6 scroll-mt-28 grid gap-5 lg:grid-cols-[1fr_380px]">
          <div>
            <h2 className="mb-3 text-xl font-bold">Logs Pending Verification</h2>
            {pendingLogs.length ? (
              <PendingBeltLogs
                logs={pendingLogs}
                onCancelPending={handleCancelPendingLog}
                onEditPending={openPendingEdit}
                onSelectLog={setSelectedLog}
              />
            ) : (
              <EmptyState title="No logs pending verification" text="When you submit training hours, pending logs will appear here until your MAI verifies them." />
            )}
          </div>
          <LogDetailPanel log={selectedLog} onClose={() => setSelectedLog(null)} />
        </section>
      ) : (
        <section id="submit-hours-section" className="mt-6 scroll-mt-28">
          <div className="mb-4">
            <p className="text-sm font-bold uppercase tracking-wide text-clay">Log My Hours</p>
            <h2 className="mt-1 text-xl font-bold">Submit MCMAP training hours</h2>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              Your target belt is calculated from your current belt rank. Submitted logs stay pending until an MAI verifies them.
            </p>
          </div>
          {testBlocked ? (
            <section className="rounded-md border border-clay/30 bg-clay/10 p-5 shadow-sm">
              <p className="text-sm font-black uppercase tracking-wide text-clay">Advancement test required</p>
              <h2 className="mt-1 text-xl font-bold text-ink">Belt test needed before logging next-belt hours</h2>
              <p className="mt-2 text-sm leading-6 text-ink/70">
                {advancementReminderText}
              </p>
            </section>
          ) : (
            <SubmitHoursForm embedded />
          )}
        </section>
      )}

      {actionMessage ? (
        <div className="mt-8 rounded-md border border-olive/25 bg-olive/10 p-4 text-sm font-semibold text-olive">
          {actionMessage}
        </div>
      ) : null}

      {editingLog ? (
        <div id={editingMode === 'resubmit' ? 'returned-log-fix' : 'pending-log-edit'} className="mt-8 scroll-mt-28">
          <LogEditForm
            beltUser={progressUser}
            findMaiByNumber={findMaiByNumber}
            log={editingLog}
            mode={editingMode}
            onCancel={() => setEditingLog(null)}
            onSubmit={handleSaveLogEdit}
          />
        </div>
      ) : null}

      <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_380px]">
        <div>
          <h2 className="mb-3 text-xl font-bold">My Recent Logs</h2>
          {recentLogs.length ? (
            <RecentLogs
              logs={recentLogs}
              onCancelPending={handleCancelPendingLog}
              onEditPending={openPendingEdit}
              onEditReturned={openReturnedEdit}
              onSelectLog={setSelectedLog}
            />
          ) : (
            <EmptyState
              title="Welcome to your MCMAP Logbook"
              text="Start by submitting your first training session. Once an MAI verifies it, your progress updates automatically."
              action={
                <Link
                  to="/belt/submit"
                  className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-olive px-5 text-sm font-bold text-white"
                >
                  <PlusCircle size={17} aria-hidden="true" />
                  Log Hours
                </Link>
              }
            />
          )}
        </div>
        <LogDetailPanel log={selectedLog} onClose={() => setSelectedLog(null)} />
      </section>

      <MobileStickyAction
        label={returnedLogs.length ? 'Fix Returned Log' : 'Submit Hours'}
        onClick={handleStickyAction}
      />
    </PageShell>
  );
}

function MobileStickyAction({ label, onClick }) {
  return (
    <div className="fixed inset-x-0 bottom-[120px] z-20 border-t border-coyote/25 bg-paper/95 px-4 py-3 shadow-panel backdrop-blur sm:hidden">
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

function NewUserStart({ currentBelt, targetBelt }) {
  return (
    <section className="mb-6 rounded-md border border-brass/30 bg-brass/10 p-5">
      <h2 className="text-2xl font-bold text-ink">Welcome to your MCMAP Logbook</h2>
      <p className="mt-2 text-sm leading-6 text-ink/70">
        Current belt: {currentBelt}. Your first target is {targetBelt}. Start by submitting your first training session.
      </p>
      <Link
        to="/belt/submit"
        className="focus-ring mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-olive px-5 text-sm font-bold text-white"
      >
        <PlusCircle size={17} aria-hidden="true" />
        Log Hours
      </Link>
    </section>
  );
}

function AdvancementModal({ isSubmitting, onNo, onYes, targetBelt }) {
  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-ink/50 px-4 py-8">
      <section className="w-full max-w-lg rounded-md border border-coyote/35 bg-paper p-6 shadow-panel">
        <p className="text-sm font-black uppercase tracking-wide text-clay">Belt Advancement Test</p>
        <h2 className="mt-2 text-2xl font-bold text-ink">Have you successfully passed your {targetBelt} advancement test?</h2>
        <p className="mt-3 text-sm leading-6 text-ink/65">
          {advancementReminderText}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onNo}
            disabled={isSubmitting}
            className="focus-ring inline-flex h-11 items-center justify-center rounded-md border border-ink/15 bg-field px-5 text-sm font-bold text-ink"
          >
            No
          </button>
          <button
            type="button"
            onClick={onYes}
            disabled={isSubmitting}
            className="focus-ring inline-flex h-11 items-center justify-center rounded-md bg-olive px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Updating...' : 'Yes'}
          </button>
        </div>
      </section>
    </div>
  );
}

function BeltCompletionBanner({ targetBelt }) {
  return (
    <section className="mb-6 rounded-md border border-brass/40 bg-brass/15 p-5 shadow-sm">
      <p className="text-sm font-black uppercase tracking-wide text-clay">Belt Completion</p>
      <h2 className="mt-1 text-2xl font-bold text-ink">
        Congratulations! You have completed the required hours for your {targetBelt} belt.
      </h2>
      <p className="mt-2 text-sm leading-6 text-ink/70">
        It is time to schedule your belt advancement test with an MAI.
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-ink/80">{advancementReminderText}</p>
    </section>
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
  const Icon = item.status === 'Complete' ? CheckCircle2 : item.status === 'Current' ? Clock3 : Lock;

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

function PendingBeltLogs({ logs, onCancelPending, onEditPending, onSelectLog }) {
  return (
    <div className="grid gap-4">
      {logs.map((log) => (
        <article key={log.id} className="rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
            <div>
              <h3 className="text-xl font-bold text-ink">{shortTechnique(log)}</h3>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <ReviewDetail label="Target belt" value={log.targetBelt || log.beltLevel} />
                <ReviewDetail label="Class code" value={log.classCode || 'General'} />
                <ReviewDetail label="Submitted time" value={formatLogTime(log)} />
                <ReviewDetail label="Date submitted" value={formatDate(log.date)} />
                <ReviewDetail label="Waiting on" value={formatMaiDisplay(log)} />
              </dl>
            </div>
            <RecentLogActions
              log={log}
              onCancelPending={onCancelPending}
              onEditPending={onEditPending}
              onSelectLog={onSelectLog}
            />
          </div>
        </article>
      ))}
    </div>
  );
}

function RecentLogs({ logs, onCancelPending, onEditPending, onEditReturned, onSelectLog }) {
  return (
    <div className="overflow-hidden rounded-md border border-coyote/35 bg-paper shadow-sm">
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-coyote/25">
          <thead className="bg-charcoal text-paper">
            <tr>
              <RecentHeader>Date</RecentHeader>
              <RecentHeader>Technique</RecentHeader>
              <RecentHeader>Belt</RecentHeader>
              <RecentHeader>Status</RecentHeader>
              <RecentHeader>Action</RecentHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-coyote/20">
            {logs.map((log) => (
              <tr key={log.id} className="align-top">
                <RecentCell>{formatDate(log.date)}</RecentCell>
                <RecentCell className="font-semibold text-ink">{shortTechnique(log)}</RecentCell>
                <RecentCell>{log.targetBelt || log.beltLevel}</RecentCell>
                <RecentCell><StatusBadge status={log.status} /></RecentCell>
                <RecentCell>
                  <RecentLogActions
                    log={log}
                    onCancelPending={onCancelPending}
                    onEditPending={onEditPending}
                    onEditReturned={onEditReturned}
                    onSelectLog={onSelectLog}
                  />
                </RecentCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 md:hidden">
        {logs.map((log) => (
          <article key={log.id} className="rounded-md border border-coyote/25 bg-field p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-ink">{shortTechnique(log)}</p>
                <p className="mt-1 text-xs text-ink/55">{formatDate(log.date)} | {log.targetBelt || log.beltLevel}</p>
              </div>
              <StatusBadge status={log.status} />
            </div>
            <div className="mt-4">
              <RecentLogActions
                log={log}
                onCancelPending={onCancelPending}
                onEditPending={onEditPending}
                onEditReturned={onEditReturned}
                onSelectLog={onSelectLog}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function RecentLogActions({ log, onCancelPending, onEditPending, onEditReturned, onSelectLog }) {
  if (log.status === 'Pending') {
    return (
      <div className="grid gap-2 sm:flex sm:flex-wrap">
        <button
          type="button"
          onClick={() => onEditPending(log)}
          className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md bg-olive px-3 text-sm font-bold text-white sm:h-9"
        >
          <Pencil size={16} aria-hidden="true" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onCancelPending(log)}
          className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md border border-clay/30 bg-paper px-3 text-sm font-bold text-clay sm:h-9"
        >
          <Trash2 size={16} aria-hidden="true" />
          Cancel
        </button>
      </div>
    );
  }

  if (log.status === 'Returned') {
    return (
      <div className="grid gap-2 sm:flex sm:flex-wrap">
        <button
          type="button"
          onClick={() => onSelectLog(log)}
          className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md border border-ink/15 bg-field px-3 text-sm font-bold text-ink sm:h-9"
        >
          <Eye size={16} aria-hidden="true" />
          View Reason
        </button>
        <button
          type="button"
          onClick={() => onEditReturned(log)}
          className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md bg-clay px-3 text-sm font-bold text-white sm:h-9"
        >
          <RotateCcw size={16} aria-hidden="true" />
          Edit & Resubmit
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelectLog(log)}
      className="focus-ring inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-ink/15 bg-field px-3 text-sm font-bold text-ink sm:h-9 sm:w-auto"
    >
      <Eye size={16} aria-hidden="true" />
      View
    </button>
  );
}

function RecentHeader({ children }) {
  return <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-paper/70">{children}</th>;
}

function RecentCell({ children, className = '' }) {
  return <td className={`px-4 py-4 text-sm text-ink/75 ${className}`}>{children}</td>;
}

function ReviewDetail({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-ink/50">{label}</dt>
      <dd className="mt-1 text-sm font-semibold leading-6 text-ink">{value}</dd>
    </div>
  );
}

function shortTechnique(log) {
  return log.techniqueName?.split('/')[0].trim() || log.description?.split(':').pop()?.trim() || 'Training log';
}

function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString();
}

function formatLogTime(log) {
  return formatMinutes(Number(log.minutes ?? Math.round(Number(log.hours || 0) * 60)));
}

function formatMaiDisplay(log) {
  if (!log.maiNumber && !log.assignedMaiName) return 'MAI verifier not assigned';
  return `${log.maiNumber || ''} ${log.assignedMaiName || ''}`.trim();
}

function isTargetBeltComplete(progress) {
  return Boolean(
    !progress.hasReachedBlackBelt &&
    progress.requiredMinutes > 0 &&
    progress.completedMinutes >= progress.requiredMinutes
  );
}
