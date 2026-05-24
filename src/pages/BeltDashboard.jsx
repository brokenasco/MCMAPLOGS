import React from 'react';
import { CheckCircle2, Clock3, Eye, Lock, Pencil, PlusCircle, RotateCcw, Trash2 } from 'lucide-react';
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

export default function BeltDashboard() {
  const { beltUser, beltLogs, cancelPendingLog, findMaiByNumber, resubmitLog, updatePendingLog } = useApp();
  const [selectedLog, setSelectedLog] = React.useState(null);
  const [editingLog, setEditingLog] = React.useState(null);
  const [editingMode, setEditingMode] = React.useState('edit');
  const [actionMessage, setActionMessage] = React.useState('');
  const progress = React.useMemo(() => buildBeltProgress({ beltUser, logs: beltLogs }), [beltLogs, beltUser]);
  const beltTrail = React.useMemo(() => getBeltTrail(beltUser.beltLevel, progress.percent), [beltUser.beltLevel, progress.percent]);
  const recentLogs = beltLogs.slice(0, 6);
  const hasNoLogs = beltLogs.length === 0;

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

  return (
    <PageShell
      eyebrow="Belt User"
      title={`Welcome, ${beltUser.name}`}
      description="Track your current belt progress and recent MCMAP training records."
      actions={<RoleBadge role="Belt User" />}
    >
      {hasNoLogs ? <NewUserStart beltUser={beltUser} targetBelt={progress.targetBelt} /> : null}

      <section className="rounded-md border border-coyote/35 bg-charcoal p-5 text-paper shadow-sm sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-brass">Progress Command Center</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <CommandDetail label="Current Belt" value={progress.currentBelt} />
              <CommandDetail label="Working Toward" value={progress.targetBelt} />
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
                {formatMinutes(progress.requiredMinutes - progress.completedMinutes)} remaining. {progress.totalCount - progress.completedCount} of {progress.totalCount} techniques left.
              </p>
            </div>
          </div>
          <Link
            to="/belt/submit"
            className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-md bg-brass px-5 text-sm font-black text-ink shadow-sm hover:bg-brass/90"
          >
            <PlusCircle size={19} aria-hidden="true" />
            Log Training Hours
          </Link>
        </div>
      </section>

      <section className="mt-6 rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-clay">Belt path</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {beltTrail.map((item) => (
            <BeltTrailItem key={item.belt} item={item} />
          ))}
        </div>
      </section>

      {actionMessage ? (
        <div className="mt-8 rounded-md border border-olive/25 bg-olive/10 p-4 text-sm font-semibold text-olive">
          {actionMessage}
        </div>
      ) : null}

      {editingLog ? (
        <div className="mt-8">
          <LogEditForm
            beltUser={beltUser}
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
    </PageShell>
  );
}

function NewUserStart({ beltUser, targetBelt }) {
  return (
    <section className="mb-6 rounded-md border border-brass/30 bg-brass/10 p-5">
      <h2 className="text-2xl font-bold text-ink">Welcome to your MCMAP Logbook</h2>
      <p className="mt-2 text-sm leading-6 text-ink/70">
        Current belt: {beltUser.beltLevel}. Your first target is {targetBelt}. Start by submitting your first training session.
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

function CommandDetail({ label, value }) {
  return (
    <div className="rounded-md border border-paper/10 bg-paper/10 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-paper/55">{label}</p>
      <p className="mt-1 text-2xl font-black text-paper">{value}</p>
    </div>
  );
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
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onEditPending(log)}
          className="focus-ring inline-flex h-9 items-center gap-2 rounded-md bg-olive px-3 text-sm font-bold text-white"
        >
          <Pencil size={16} aria-hidden="true" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onCancelPending(log)}
          className="focus-ring inline-flex h-9 items-center gap-2 rounded-md border border-clay/30 bg-paper px-3 text-sm font-bold text-clay"
        >
          <Trash2 size={16} aria-hidden="true" />
          Cancel
        </button>
      </div>
    );
  }

  if (log.status === 'Returned') {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSelectLog(log)}
          className="focus-ring inline-flex h-9 items-center gap-2 rounded-md border border-ink/15 bg-field px-3 text-sm font-bold text-ink"
        >
          <Eye size={16} aria-hidden="true" />
          View Reason
        </button>
        <button
          type="button"
          onClick={() => onEditReturned(log)}
          className="focus-ring inline-flex h-9 items-center gap-2 rounded-md bg-clay px-3 text-sm font-bold text-white"
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
      className="focus-ring inline-flex h-9 items-center gap-2 rounded-md border border-ink/15 bg-field px-3 text-sm font-bold text-ink"
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

function shortTechnique(log) {
  return log.techniqueName?.split('/')[0].trim() || log.description?.split(':').pop()?.trim() || 'Training log';
}

function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString();
}
