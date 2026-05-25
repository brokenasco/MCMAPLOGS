import React from 'react';
import { CheckCircle2, Clock3, Download, Eye, Filter, Medal, Pencil, Printer, RotateCcw, Trash2 } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import LogDetailPanel from '../components/LogDetailPanel.jsx';
import LogEditForm from '../components/LogEditForm.jsx';
import LogTable from '../components/LogTable.jsx';
import PageShell from '../components/PageShell.jsx';
import StatCard from '../components/StatCard.jsx';
import { useApp } from '../context/AppContext.jsx';
import { formatMinutes } from '../data/mcmapReference.js';
import { buildBeltProgress, buildTotalMcmapHours, sumLogMinutes } from '../lib/mcmapProgress.js';

const filters = ['All', 'Pending', 'Verified', 'Returned'];

export default function VerifiedLogbook() {
  const {
    activeRole,
    assignedMaiLogs,
    beltLogs,
    beltUser,
    cancelPendingLog,
    findMaiByNumber,
    maiUser,
    maiSubmittedLogs,
    pendingLogs,
    profile,
    resubmitLog,
    updatePendingLog
  } = useApp();
  const [activeFilter, setActiveFilter] = React.useState(activeRole === 'MAI' ? 'Pending' : 'Verified');
  const [selectedLog, setSelectedLog] = React.useState(null);
  const [editingLog, setEditingLog] = React.useState(null);
  const [editingMode, setEditingMode] = React.useState('edit');
  const [actionMessage, setActionMessage] = React.useState('');
  const [activeMaiView, setActiveMaiView] = React.useState('entries');
  const [showMaiDateFilter, setShowMaiDateFilter] = React.useState(false);
  const [maiDateRange, setMaiDateRange] = React.useState({ from: '', to: '' });
  const visibleLogs = activeRole === 'MAI' ? mergeLogs(assignedMaiLogs, maiSubmittedLogs) : beltLogs;
  const filteredLogs = activeFilter === 'All' ? visibleLogs : visibleLogs.filter((log) => log.status === activeFilter);
  const verifiedLogs = visibleLogs.filter((log) => log.status === 'Verified');
  const dateFilteredVerifiedLogs = filterByVerifiedDate(verifiedLogs, maiDateRange);
  const isMai = activeRole === 'MAI';
  const emptyTitle = isMai && activeFilter === 'Verified' ? 'No verified logs yet' : `No ${activeFilter.toLowerCase()} logs`;
  const emptyText = isMai && activeFilter === 'Verified'
    ? 'New Belt User submissions appear under Pending first. Once you sign and verify them, they move here.'
    : 'Change the filter or submit a new log to see records here.';
  const verifiedMinutes = sumLogMinutes(verifiedLogs);
  const currentAccount = isMai ? maiUser : beltUser;
  const currentBelt = profile?.belt_level || currentAccount.beltLevel;
  const progressLogs = isMai ? maiSubmittedLogs : beltLogs;
  const progressUser = React.useMemo(() => ({ ...currentAccount, beltLevel: currentBelt }), [currentAccount, currentBelt]);
  const progress = React.useMemo(() => buildBeltProgress({ beltUser: progressUser, logs: progressLogs }), [progressLogs, progressUser]);
  const mcmapHourSummary = React.useMemo(() => buildTotalMcmapHours({ beltUser: progressUser, logs: progressLogs }), [progressLogs, progressUser]);

  React.useEffect(() => {
    setActiveFilter(activeRole === 'MAI' ? 'Pending' : 'Verified');
    setSelectedLog(null);
    setEditingLog(null);
    setActionMessage('');
  }, [activeRole]);

  const exportCsv = () => {
    const rows = [
      ['Marine', 'Date', 'Hours', 'Belt Level', 'Sent To MAI', 'Status', 'Signed By'],
      ...filteredLogs.map((log) => [
        log.marine,
        log.date,
        formatLogTime(log),
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

  const exportMaiCsv = () => {
    const rows = [
      ['Marine', 'Date Verified', 'Training Date', 'Time', 'Belt Level', 'Class Code', 'Verified By'],
      ...dateFilteredVerifiedLogs.map((log) => [
        log.marine,
        formatVerifiedDate(log),
        log.date,
        formatLogTime(log),
        log.targetBelt || log.beltLevel,
        log.classCode || 'General',
        log.verifiedBy ? `${log.verifiedBy} ${log.verifiedByMaiNumber || ''}`.trim() : ''
      ])
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mai-verified-logbook.csv';
    link.click();
    URL.revokeObjectURL(url);
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

  if (isMai) {
    return (
      <MaiLogbook
        activeView={activeMaiView}
        dateRange={maiDateRange}
        logs={dateFilteredVerifiedLogs}
        onDateRangeChange={setMaiDateRange}
        onExport={exportMaiCsv}
        onPrint={printLogbook}
        onSelectLog={setSelectedLog}
        onToggleFilter={() => setShowMaiDateFilter((current) => !current)}
        onViewChange={setActiveMaiView}
        selectedLog={selectedLog}
        showDateFilter={showMaiDateFilter}
        totalVisibleLogs={visibleLogs.length}
      />
    );
  }

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

      {!isMai && actionMessage ? (
        <div className="mb-5 rounded-md border border-olive/25 bg-olive/10 p-4 text-sm font-semibold text-olive">
          {actionMessage}
        </div>
      ) : null}

      {!isMai && editingLog ? (
        <div className="mb-8">
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

function MaiLogbook({
  activeView,
  dateRange,
  logs,
  onDateRangeChange,
  onExport,
  onPrint,
  onSelectLog,
  onToggleFilter,
  onViewChange,
  selectedLog,
  showDateFilter,
  totalVisibleLogs
}) {
  const verifiedMinutes = sumLogMinutes(logs);
  const latestVerified = logs
    .slice()
    .sort((a, b) => new Date(getVerifiedDateValue(b) || 0) - new Date(getVerifiedDateValue(a) || 0))[0];

  return (
    <PageShell
      eyebrow="Records"
      title="Logbook"
      description="Review MAI verified entries, verified hour totals, and historical MCMAP training records."
    >
      <section className="rounded-md border border-coyote/35 bg-charcoal p-5 text-paper shadow-sm sm:p-6">
        <p className="text-sm font-black uppercase tracking-wide text-brass">Logbook Command Center</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <CommandActionButton
            active={activeView === 'entries'}
            detail={`${logs.length} verified ${logs.length === 1 ? 'entry' : 'entries'}`}
            icon={CheckCircle2}
            label="Verified Entries"
            onClick={() => onViewChange('entries')}
          />
          <CommandActionButton
            active={activeView === 'hours'}
            detail={formatMinutes(verifiedMinutes)}
            icon={Clock3}
            label="Verified Hours"
            onClick={() => onViewChange('hours')}
          />
        </div>
      </section>

      <section className="mt-6 rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-clay">
              {activeView === 'entries' ? 'Verified Entries' : 'Verified Hours'}
            </p>
            <h2 className="mt-1 text-xl font-bold text-ink">
              {activeView === 'entries' ? 'Verified log history' : 'Verified hour totals'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              Filtered by date verified. Pending and returned logs are not included.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onToggleFilter}
              className="focus-ring inline-flex h-10 items-center gap-2 rounded-md bg-olive px-4 text-sm font-bold text-white"
            >
              <Filter size={17} aria-hidden="true" />
              Filter
            </button>
            <button
              type="button"
              onClick={onExport}
              className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-coyote/40 bg-field px-4 text-sm font-bold text-ink"
            >
              <Download size={17} aria-hidden="true" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={onPrint}
              className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-coyote/40 bg-field px-4 text-sm font-bold text-ink"
            >
              <Printer size={17} aria-hidden="true" />
              Print
            </button>
          </div>
        </div>

        {showDateFilter ? (
          <div className="mt-5 grid gap-4 rounded-md border border-coyote/30 bg-field p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="block">
              <span className="text-sm font-bold text-ink">From date verified</span>
              <input
                type="date"
                value={dateRange.from}
                onChange={(event) => onDateRangeChange((current) => ({ ...current, from: event.target.value }))}
                className="focus-ring mt-2 h-11 w-full rounded-md border border-ink/15 bg-paper px-3 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-ink">To date verified</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(event) => onDateRangeChange((current) => ({ ...current, to: event.target.value }))}
                className="focus-ring mt-2 h-11 w-full rounded-md border border-ink/15 bg-paper px-3 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={() => onDateRangeChange({ from: '', to: '' })}
              className="focus-ring h-11 rounded-md border border-ink/15 bg-paper px-4 text-sm font-bold text-ink"
            >
              Clear
            </button>
          </div>
        ) : null}
      </section>

      {activeView === 'entries' ? (
        <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_380px]">
          {logs.length ? <MaiVerifiedEntriesTable logs={logs} onSelectLog={onSelectLog} /> : <EmptyState title="No verified entries found" text="Change the date filter or verify logs to see entries here." />}
          <LogDetailPanel log={selectedLog} onClose={() => onSelectLog(null)} />
        </section>
      ) : (
        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <StatCard label="Verified hours" value={formatMinutes(verifiedMinutes)} detail="Within selected date range" />
          <StatCard label="Verified entries" value={logs.length} detail="Signed records" />
          <StatCard label="All records" value={totalVisibleLogs} detail="Historical records" />
          <StatCard label="Latest verified" value={latestVerified ? formatVerifiedDate(latestVerified) : 'None'} detail={latestVerified ? shortTechnique(latestVerified) : 'No verified entries yet'} />
        </section>
      )}
    </PageShell>
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

function MaiVerifiedEntriesTable({ logs, onSelectLog }) {
  return (
    <div className="overflow-hidden rounded-md border border-coyote/35 bg-paper shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-coyote/25">
          <thead className="bg-charcoal text-paper">
            <tr>
              <LogbookHeader>Marine</LogbookHeader>
              <LogbookHeader>Date Verified</LogbookHeader>
              <LogbookHeader>Training Date</LogbookHeader>
              <LogbookHeader>Class</LogbookHeader>
              <LogbookHeader>Time</LogbookHeader>
              <LogbookHeader>Belt</LogbookHeader>
              <LogbookHeader>Verified By</LogbookHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-coyote/20">
            {logs.map((log) => (
              <tr key={log.id} className="cursor-pointer align-top hover:bg-field/70" onClick={() => onSelectLog(log)}>
                <LogbookCell className="font-semibold text-ink">{log.marine}</LogbookCell>
                <LogbookCell>{formatVerifiedDate(log)}</LogbookCell>
                <LogbookCell>{formatDate(log.date)}</LogbookCell>
                <LogbookCell>
                  <span className="font-semibold text-ink">{log.classCode || 'General'}</span>
                  {log.techniqueName ? <span className="mt-1 block max-w-72 text-xs leading-5 text-ink/55">{log.techniqueName}</span> : null}
                </LogbookCell>
                <LogbookCell>{formatLogTime(log)}</LogbookCell>
                <LogbookCell>{log.targetBelt || log.beltLevel}</LogbookCell>
                <LogbookCell>{log.verifiedBy ? `${log.verifiedBy} ${log.verifiedByMaiNumber || ''}`.trim() : 'Verified'}</LogbookCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LogbookHeader({ children }) {
  return <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-paper/70">{children}</th>;
}

function LogbookCell({ children, className = '' }) {
  return <td className={`px-4 py-4 text-sm text-ink/75 ${className}`}>{children}</td>;
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

function formatMaiDisplay(log) {
  return `${log.maiNumber || ''} ${log.assignedMaiName || ''}`.trim() || 'Not assigned';
}

function formatLogTime(log) {
  return formatMinutes(Number(log.minutes ?? Math.round(Number(log.hours || 0) * 60)));
}

function filterByVerifiedDate(logs, dateRange) {
  const hasFilter = Boolean(dateRange.from || dateRange.to);
  if (!hasFilter) return logs;

  return logs.filter((log) => {
    const verifiedDate = getVerifiedDateValue(log);
    if (!verifiedDate) return false;
    if (dateRange.from && verifiedDate < dateRange.from) return false;
    if (dateRange.to && verifiedDate > dateRange.to) return false;
    return true;
  });
}

function getVerifiedDateValue(log) {
  return log.verifiedAt || '';
}

function formatVerifiedDate(log) {
  const verifiedDate = getVerifiedDateValue(log);
  return verifiedDate ? formatDate(verifiedDate) : 'Not recorded';
}

function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString();
}

function shortTechnique(log) {
  return log.techniqueName?.split('/')[0].trim() || log.description?.split(':').pop()?.trim() || 'Training log';
}
