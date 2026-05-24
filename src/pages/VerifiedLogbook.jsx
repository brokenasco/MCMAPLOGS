import React from 'react';
import { CheckCircle2, Download, Eye, Medal, MessageSquare, Pencil, Printer, RotateCcw, Trash2, XCircle } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import LogDetailPanel from '../components/LogDetailPanel.jsx';
import LogEditForm from '../components/LogEditForm.jsx';
import LogTable from '../components/LogTable.jsx';
import PageShell from '../components/PageShell.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useApp } from '../context/AppContext.jsx';
import { formatMinutes } from '../data/mcmapReference.js';
import { buildBeltProgress, buildTotalMcmapHours, sumLogMinutes } from '../lib/mcmapProgress.js';

const filters = ['All', 'Pending', 'Verified', 'Returned', 'Rejected'];

export default function VerifiedLogbook() {
  const {
    activeRole,
    assignedMaiLogs,
    beltLogs,
    beltUser,
    cancelPendingLog,
    findMaiByNumber,
    maiSubmittedLogs,
    maiUser,
    pendingLogs,
    resubmitLog,
    updatePendingLog,
    verifyLog,
    returnLog,
    rejectLog
  } = useApp();
  const [activeFilter, setActiveFilter] = React.useState(activeRole === 'MAI' ? 'Pending' : 'Verified');
  const [selectedLog, setSelectedLog] = React.useState(null);
  const [editingLog, setEditingLog] = React.useState(null);
  const [editingMode, setEditingMode] = React.useState('edit');
  const [actionMessage, setActionMessage] = React.useState('');
  const [confirmationLog, setConfirmationLog] = React.useState(null);
  const [returningLog, setReturningLog] = React.useState(null);
  const [returnAction, setReturnAction] = React.useState('return');
  const [returnReason, setReturnReason] = React.useState('Missing detail');
  const [returnMessage, setReturnMessage] = React.useState('Add the techniques trained, who supervised the period, and resubmit.');
  const visibleLogs = activeRole === 'MAI' ? mergeLogs(assignedMaiLogs, maiSubmittedLogs) : beltLogs;
  const filteredLogs = activeFilter === 'All' ? visibleLogs : visibleLogs.filter((log) => log.status === activeFilter);
  const verifiedLogs = visibleLogs.filter((log) => log.status === 'Verified');
  const isMai = activeRole === 'MAI';
  const emptyTitle = isMai && activeFilter === 'Verified' ? 'No verified logs yet' : `No ${activeFilter.toLowerCase()} logs`;
  const emptyText = isMai && activeFilter === 'Verified'
    ? 'New Belt User submissions appear under Pending first. Once you sign and verify them, they move here.'
    : 'Change the filter or submit a new log to see records here.';
  const verifiedMinutes = sumLogMinutes(verifiedLogs);
  const progress = React.useMemo(() => buildBeltProgress({ beltUser, logs: beltLogs }), [beltLogs, beltUser]);
  const mcmapHourSummary = React.useMemo(() => buildTotalMcmapHours({ beltUser, logs: beltLogs }), [beltLogs, beltUser]);

  React.useEffect(() => {
    setActiveFilter(activeRole === 'MAI' ? 'Pending' : 'Verified');
    setSelectedLog(null);
    setEditingLog(null);
    setActionMessage('');
  }, [activeRole]);

  const openConfirmation = (log) => {
    setSelectedLog(log);
    setConfirmationLog(log);
  };

  const handleVerify = async () => {
    await verifyLog(confirmationLog.id);
    setConfirmationLog(null);
    setSelectedLog(null);
  };

  const handleReturn = async () => {
    if (returnAction === 'reject') {
      await rejectLog(returningLog.id, returnReason || 'Rejected', returnMessage);
    } else {
      await returnLog(returningLog.id, returnReason, returnMessage);
    }
    setReturningLog(null);
    setSelectedLog(null);
  };

  const exportCsv = () => {
    const rows = [
      ['Marine', 'Date', 'Hours', 'Belt Level', 'Sent To MAI', 'Status', 'Signed By'],
      ...filteredLogs.map((log) => [
        log.marine,
        log.date,
        log.hours,
        log.beltLevel,
        formatMaiDisplay(log),
        log.status,
        log.verifiedBy ? `${log.verifiedBy} ${log.verifiedByMaiNumber}` : ''
      ])
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `mcmap-logbook-${activeFilter.toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printLogbook = () => {
    window.print();
  };

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
      eyebrow="Records"
      title="Logbook"
      description="Review submitted, pending, returned, and MAI-verified MCMAP training records."
    >
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {isMai ? <StatCard label="Pending review" value={pendingLogs.length} detail="Awaiting MAI signature" /> : null}
        <StatCard label="Verified entries" value={verifiedLogs.length} detail="Signed records" />
        <StatCard label="Verified hours" value={formatMinutes(verifiedMinutes)} detail="Total approved hours" />
        <StatCard label="All records" value={visibleLogs.length} detail="Across every status" />
      </div>

      {!isMai ? <TotalMcmapHoursPanel summary={mcmapHourSummary} /> : null}

      {!isMai ? <BeltProgressDashboard progress={progress} /> : null}

      {isMai ? (
        <MaiPendingReview
          confirmationLog={confirmationLog}
          handleReturn={handleReturn}
          handleVerify={handleVerify}
          maiUser={maiUser}
          openConfirmation={openConfirmation}
          pendingLogs={pendingLogs}
          returnMessage={returnMessage}
          returnAction={returnAction}
          returnReason={returnReason}
          returningLog={returningLog}
          selectedLog={selectedLog}
          setConfirmationLog={setConfirmationLog}
          setReturnMessage={setReturnMessage}
          setReturnAction={setReturnAction}
          setReturnReason={setReturnReason}
          setReturningLog={setReturningLog}
          setSelectedLog={setSelectedLog}
        />
      ) : null}

      {!isMai && actionMessage ? (
        <div className="mb-5 rounded-md border border-olive/25 bg-olive/10 p-4 text-sm font-semibold text-olive">
          {actionMessage}
        </div>
      ) : null}

      {!isMai && editingLog ? (
        <div className="mb-8">
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

      <div className="mb-5 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => {
              setActiveFilter(filter);
              setSelectedLog(null);
            }}
            className={`focus-ring h-10 rounded-md px-4 text-sm font-bold ${
              activeFilter === filter ? 'bg-olive text-white' : 'border border-ink/15 bg-paper text-ink hover:bg-field'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap gap-3 rounded-md border border-coyote/35 bg-paper p-4">
        <button
          type="button"
          onClick={exportCsv}
          className="focus-ring inline-flex h-10 items-center gap-2 rounded-md bg-olive px-4 text-sm font-bold text-white"
        >
          <Download size={17} aria-hidden="true" />
          Export CSV
        </button>
        <button
          type="button"
          onClick={printLogbook}
          className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-coyote/40 bg-field px-4 text-sm font-bold text-ink"
        >
          <Printer size={17} aria-hidden="true" />
          Print or save PDF
        </button>
        <p className="text-sm leading-6 text-ink/65">
          Exports use the records currently shown by the selected filter.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        {filteredLogs.length ? (
          <LogTable
            logs={filteredLogs}
            onSelectLog={setSelectedLog}
            renderActions={!isMai ? (log) => (
              <BeltLogActions
                log={log}
                onCancelPending={handleCancelPendingLog}
                onEditPending={openPendingEdit}
                onEditReturned={openReturnedEdit}
                onView={setSelectedLog}
              />
            ) : null}
          />
        ) : (
          <EmptyState title={emptyTitle} text={emptyText} />
        )}
        <LogDetailPanel log={selectedLog} onClose={() => setSelectedLog(null)} />
      </div>
    </PageShell>
  );
}

function TotalMcmapHoursPanel({ summary }) {
  return (
    <section className="mb-8 rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-clay">
            <Medal size={17} aria-hidden="true" />
            Total MCMAP Hours
          </p>
          <h2 className="mt-2 text-3xl font-black text-ink">{formatMinutes(summary.totalMinutes)}</h2>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            Completed belt hours plus verified {summary.targetBelt} hours. Pending and returned logs are not included.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-right">
          <ProgressBreakdown label="Completed belts" value={formatMinutes(summary.completedBeltMinutes)} />
          <ProgressBreakdown label={`${summary.targetBelt} verified`} value={formatMinutes(summary.targetBeltVerifiedMinutes)} />
        </div>
      </div>
    </section>
  );
}

function mergeLogs(...logGroups) {
  const byId = new Map();
  logGroups.flat().forEach((log) => byId.set(log.id, log));
  return [...byId.values()].sort((a, b) => new Date(b.date) - new Date(a.date));
}

function BeltLogActions({ log, onCancelPending, onEditPending, onEditReturned, onView }) {
  if (log.status === 'Pending') {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onEditPending(log)}
          className="focus-ring inline-flex h-9 items-center gap-2 rounded-md bg-olive px-3 text-xs font-bold text-white"
        >
          <Pencil size={15} aria-hidden="true" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onCancelPending(log)}
          className="focus-ring inline-flex h-9 items-center gap-2 rounded-md border border-clay/30 bg-paper px-3 text-xs font-bold text-clay"
        >
          <Trash2 size={15} aria-hidden="true" />
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
          onClick={() => onView(log)}
          className="focus-ring inline-flex h-9 items-center gap-2 rounded-md border border-ink/15 bg-field px-3 text-xs font-bold text-ink"
        >
          <Eye size={15} aria-hidden="true" />
          View Reason
        </button>
        <button
          type="button"
          onClick={() => onEditReturned(log)}
          className="focus-ring inline-flex h-9 items-center gap-2 rounded-md bg-clay px-3 text-xs font-bold text-white"
        >
          <RotateCcw size={15} aria-hidden="true" />
          Edit & Resubmit
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onView(log)}
      className="focus-ring inline-flex h-9 items-center gap-2 rounded-md border border-ink/15 bg-field px-3 text-xs font-bold text-ink"
    >
      <Eye size={15} aria-hidden="true" />
      View
    </button>
  );
}

function BeltProgressDashboard({ progress }) {
  return (
    <section className="mb-8 overflow-hidden rounded-md border border-coyote/35 bg-paper shadow-sm">
      <div className="border-b border-coyote/25 bg-charcoal p-5 text-paper">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-brass">Target belt progress</p>
            <h2 className="mt-1 text-2xl font-bold">{progress.targetBelt}</h2>
            <p className="mt-2 text-sm leading-6 text-paper/65">
              Current belt: {progress.currentBelt}. Only verified logs count toward this progress.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-right sm:grid-cols-3">
            <ProgressMetric label="Complete" value={`${progress.completedCount}/${progress.totalCount}`} />
            <ProgressMetric label="Logged" value={formatMinutes(progress.completedMinutes)} />
            <ProgressMetric label="Required" value={formatMinutes(progress.requiredMinutes)} />
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-paper/65">
            <span>Overall belt progress</span>
            <span>{progress.percent}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-paper/15">
            <div className="h-full rounded-full bg-brass" style={{ width: `${progress.percent}%` }} />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-coyote/25">
          <thead className="bg-field">
            <tr>
              <ProgressHeader>Technique / Tie-In</ProgressHeader>
              <ProgressHeader>Class Code</ProgressHeader>
              <ProgressHeader>Completed</ProgressHeader>
              <ProgressHeader>Remaining</ProgressHeader>
              <ProgressHeader>Required</ProgressHeader>
              <ProgressHeader>Status</ProgressHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-coyote/20">
            {progress.rows.map((row) => (
              <tr key={row.id} className={row.isComplete ? 'bg-olive/10' : 'bg-paper'}>
                <ProgressCell className="min-w-72 font-semibold text-ink">{row.name}</ProgressCell>
                <ProgressCell>{row.code}</ProgressCell>
                <ProgressCell>{formatMinutes(row.completedMinutes)}</ProgressCell>
                <ProgressCell>{formatMinutes(row.remainingMinutes)}</ProgressCell>
                <ProgressCell>{formatMinutes(row.requiredMinutes)}</ProgressCell>
                <ProgressCell>
                  <span
                    className={`inline-flex rounded-sm px-2.5 py-1 text-xs font-black uppercase tracking-wide ${
                      row.isComplete ? 'bg-olive text-white' : 'bg-field text-ink/70'
                    }`}
                  >
                    {row.isComplete ? 'Complete' : 'In progress'}
                  </span>
                </ProgressCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ProgressMetric({ label, value }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-paper/50">{label}</p>
      <p className="mt-1 text-lg font-black text-paper">{value}</p>
    </div>
  );
}

function ProgressBreakdown({ label, value }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-ink/50">{label}</p>
      <p className="mt-1 text-lg font-black text-ink">{value}</p>
    </div>
  );
}

function ProgressHeader({ children }) {
  return <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink/55">{children}</th>;
}

function ProgressCell({ children, className = '' }) {
  return <td className={`px-4 py-4 text-sm text-ink/75 ${className}`}>{children}</td>;
}

function MaiPendingReview({
  confirmationLog,
  handleReturn,
  handleVerify,
  maiUser,
  openConfirmation,
  pendingLogs,
  returnMessage,
  returnAction,
  returnReason,
  returningLog,
  selectedLog,
  setConfirmationLog,
  setReturnMessage,
  setReturnAction,
  setReturnReason,
  setReturningLog,
  setSelectedLog
}) {
  return (
    <section className="mb-8 rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-clay">Pending logs</p>
          <h2 className="mt-1 text-2xl font-bold">MAI verification queue</h2>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            Signing with {maiUser.maiNumber} verifies your MAI account on the logbook record.
          </p>
        </div>
        <StatusBadge status="Pending" />
      </div>

      {confirmationLog ? (
        <div className="mb-6 rounded-md border border-olive/20 bg-olive/10 p-5">
          <p className="text-sm font-bold uppercase tracking-wide text-clay">Confirm MAI signature</p>
          <h3 className="mt-2 text-xl font-bold">{confirmationLog.marine}</h3>
          <p className="mt-2 text-sm leading-6 text-ink/70">
            You are about to sign {confirmationLog.hours} hours of {confirmationLog.beltLevel} training using MAI number {maiUser.maiNumber}.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleVerify}
              className="focus-ring inline-flex h-10 items-center gap-2 rounded-md bg-olive px-4 text-sm font-bold text-white hover:bg-olive/90"
            >
              <CheckCircle2 size={17} aria-hidden="true" />
              Confirm signature
            </button>
            <button
              type="button"
              onClick={() => setConfirmationLog(null)}
              className="focus-ring inline-flex h-10 items-center rounded-md border border-ink/15 bg-field px-4 text-sm font-bold text-ink hover:bg-paper"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {returningLog ? (
        <div className="mb-6 rounded-md border border-clay/20 bg-clay/10 p-5">
          <p className="text-sm font-bold uppercase tracking-wide text-clay">
            {returnAction === 'reject' ? 'Reject log' : 'Return for correction'}
          </p>
          <h3 className="mt-2 text-xl font-bold">{returningLog.marine}</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-ink">Reason</span>
              <select
                value={returnReason}
                onChange={(event) => setReturnReason(event.target.value)}
                className="focus-ring mt-2 h-11 w-full rounded-md border border-ink/15 bg-paper px-3 text-sm"
              >
                <option>Missing detail</option>
                <option>Incorrect hours</option>
                <option>Wrong MAI number</option>
                <option>Needs correction</option>
                <option>Rejected</option>
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
              {returnAction === 'reject' ? 'Reject log' : 'Send correction message'}
            </button>
            <button
              type="button"
              onClick={() => setReturningLog(null)}
              className="focus-ring inline-flex h-10 items-center rounded-md border border-ink/15 bg-field px-4 text-sm font-bold text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {pendingLogs.length ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
          <div className="grid gap-4">
            {pendingLogs.map((log) => (
              <article key={log.id} className="rounded-md border border-coyote/35 bg-field p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold">{log.marine}</h3>
                    <p className="mt-1 text-sm text-ink/60">
                      {new Date(`${log.date}T12:00:00`).toLocaleDateString()} | {log.hours} hours | {log.beltLevel}
                    </p>
                  </div>
                  <StatusBadge status={log.status} />
                </div>
                <p className="mt-4 text-sm leading-6 text-ink/70">{log.description}</p>
                <p className="mt-3 text-sm font-semibold text-ink/65">Sent to {formatMaiDisplay(log)}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => openConfirmation(log)}
                    className="focus-ring inline-flex h-10 items-center gap-2 rounded-md bg-olive px-4 text-sm font-bold text-white hover:bg-olive/90"
                  >
                    <CheckCircle2 size={17} aria-hidden="true" />
                    Sign and verify
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReturningLog(log);
                      setSelectedLog(log);
                      setReturnAction('return');
                      setReturnReason('Missing detail');
                      setReturnMessage('Add the techniques trained, who supervised the period, and resubmit.');
                    }}
                    className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-ink/15 bg-paper px-4 text-sm font-bold text-ink hover:bg-field"
                  >
                    <XCircle size={17} aria-hidden="true" />
                    Return with note
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReturningLog(log);
                      setSelectedLog(log);
                      setReturnAction('reject');
                      setReturnReason('Rejected');
                      setReturnMessage('This log was rejected. Review the note and submit a new corrected log if needed.');
                    }}
                    className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-clay/30 bg-paper px-4 text-sm font-bold text-clay hover:bg-clay/10"
                  >
                    <XCircle size={17} aria-hidden="true" />
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLog(log)}
                    className="focus-ring inline-flex h-10 items-center rounded-md border border-ink/15 bg-paper px-4 text-sm font-bold text-ink hover:bg-field"
                  >
                    Details
                  </button>
                </div>
              </article>
            ))}
          </div>
          <LogDetailPanel log={selectedLog} onClose={() => setSelectedLog(null)} />
        </div>
      ) : (
        <EmptyState title="No logs need review right now" text="When Belt Users submit hours to your assigned MAI number, their logs will appear here for signature." />
      )}
    </section>
  );
}

function formatMaiDisplay(log) {
  return `${log.maiNumber || ''} ${log.assignedMaiName || ''}`.trim() || 'Not assigned';
}
