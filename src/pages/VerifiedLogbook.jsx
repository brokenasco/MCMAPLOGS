import React from 'react';
import { CheckCircle2, Clock3, Download, Filter, Printer } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import LogDetailPanel from '../components/LogDetailPanel.jsx';
import PageShell from '../components/PageShell.jsx';
import StatCard from '../components/StatCard.jsx';
import { useApp } from '../context/AppContext.jsx';
import { formatMinutes } from '../data/mcmapReference.js';
import { sumLogMinutes } from '../lib/mcmapProgress.js';

export default function VerifiedLogbook() {
  const { activeRole, assignedMaiLogs, beltLogs, maiSubmittedLogs } = useApp();
  const isMai = activeRole === 'MAI';

  const [selectedLog, setSelectedLog] = React.useState(null);
  const [maiVerificationView, setMaiVerificationView] = React.useState('entries');
  const [maiStudentView, setMaiStudentView] = React.useState('entries');
  const [beltView, setBeltView] = React.useState('entries');
  const [showMaiVerificationFilter, setShowMaiVerificationFilter] = React.useState(false);
  const [showMaiStudentFilter, setShowMaiStudentFilter] = React.useState(false);
  const [showBeltFilter, setShowBeltFilter] = React.useState(false);
  const [maiVerificationRange, setMaiVerificationRange] = React.useState({ from: '', to: '' });
  const [maiStudentRange, setMaiStudentRange] = React.useState({ from: '', to: '' });
  const [beltRange, setBeltRange] = React.useState({ from: '', to: '' });

  React.useEffect(() => {
    setSelectedLog(null);
  }, [activeRole, maiVerificationView, maiStudentView, beltView]);

  if (isMai) {
    const verifiedAsMai = filterByVerifiedDate(getVerifiedLogs(assignedMaiLogs), maiVerificationRange);
    const verifiedAsStudent = filterByVerifiedDate(getVerifiedLogs(maiSubmittedLogs), maiStudentRange);

    return (
      <PageShell
        eyebrow="Records"
        title="Logbook"
        description="Review verified MAI history and your own verified student training hours."
      >
        <VerifiedCommandCenter
          activeView={maiVerificationView}
          dateRange={maiVerificationRange}
          entriesLabel="Verified Entries as MAI"
          hoursLabel="Verified Hours as MAI"
          logs={verifiedAsMai}
          onDateRangeChange={setMaiVerificationRange}
          onSelectLog={setSelectedLog}
          onToggleFilter={() => setShowMaiVerificationFilter((current) => !current)}
          onViewChange={setMaiVerificationView}
          selectedLog={selectedLog}
          showDateFilter={showMaiVerificationFilter}
          title="MAI Verification Command Center"
        />

        <VerifiedCommandCenter
          activeView={maiStudentView}
          dateRange={maiStudentRange}
          entriesLabel="Verified Entries as Student"
          hoursLabel="Verified Hours as Student"
          logs={verifiedAsStudent}
          onDateRangeChange={setMaiStudentRange}
          onSelectLog={setSelectedLog}
          onToggleFilter={() => setShowMaiStudentFilter((current) => !current)}
          onViewChange={setMaiStudentView}
          selectedLog={selectedLog}
          showDateFilter={showMaiStudentFilter}
          title="Student Logbook Command Center"
        />
      </PageShell>
    );
  }

  const verifiedBeltLogs = filterByVerifiedDate(getVerifiedLogs(beltLogs), beltRange);

  return (
    <PageShell
      eyebrow="Records"
      title="Logbook"
      description="Review verified entries and verified MCMAP training hours."
    >
      <VerifiedCommandCenter
        activeView={beltView}
        dateRange={beltRange}
        entriesLabel="Verified Entries"
        hoursLabel="Verified Hours"
        logs={verifiedBeltLogs}
        onDateRangeChange={setBeltRange}
        onSelectLog={setSelectedLog}
        onToggleFilter={() => setShowBeltFilter((current) => !current)}
        onViewChange={setBeltView}
        selectedLog={selectedLog}
        showDateFilter={showBeltFilter}
        title="Logbook Command Center"
      />
    </PageShell>
  );
}

function VerifiedCommandCenter({
  activeView,
  dateRange,
  entriesLabel,
  hoursLabel,
  logs,
  onDateRangeChange,
  onSelectLog,
  onToggleFilter,
  onViewChange,
  selectedLog,
  showDateFilter,
  title
}) {
  const verifiedMinutes = sumLogMinutes(logs);
  const latestVerified = logs
    .slice()
    .sort((a, b) => new Date(getVerifiedDateValue(b) || 0) - new Date(getVerifiedDateValue(a) || 0))[0];

  const exportFilteredCsv = () => {
    const rows = [
      ['Marine', 'Date Verified', 'Training Date', 'Time', 'Target Belt', 'Class Code', 'Verified By'],
      ...logs.map((log) => [
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
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="mb-8">
      <div className="rounded-md border border-coyote/35 bg-charcoal p-5 text-paper shadow-sm sm:p-6">
        <p className="text-sm font-black uppercase tracking-wide text-brass">{title}</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <CommandActionButton
            active={activeView === 'entries'}
            detail={`${logs.length} verified ${logs.length === 1 ? 'entry' : 'entries'}`}
            icon={CheckCircle2}
            label={entriesLabel}
            onClick={() => onViewChange('entries')}
          />
          <CommandActionButton
            active={activeView === 'hours'}
            detail={formatMinutes(verifiedMinutes)}
            icon={Clock3}
            label={hoursLabel}
            onClick={() => onViewChange('hours')}
          />
        </div>
      </div>

      <div className="mt-5 rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-clay">
              {activeView === 'entries' ? entriesLabel : hoursLabel}
            </p>
            <h2 className="mt-1 text-xl font-bold text-ink">
              {activeView === 'entries' ? 'Verified log history' : 'Verified hour totals'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              Filtered by date verified. Pending, returned, and canceled logs are not included.
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
              onClick={exportFilteredCsv}
              className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-coyote/40 bg-field px-4 text-sm font-bold text-ink"
            >
              <Download size={17} aria-hidden="true" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => window.print()}
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
              <span className="text-sm font-bold text-ink">From Date</span>
              <input
                type="date"
                value={dateRange.from}
                onChange={(event) => onDateRangeChange((current) => ({ ...current, from: event.target.value }))}
                className="focus-ring mt-2 h-11 w-full rounded-md border border-ink/15 bg-paper px-3 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-ink">To Date</span>
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
      </div>

      {activeView === 'entries' ? (
        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_380px]">
          {logs.length ? (
            <VerifiedEntriesTable logs={logs} onSelectLog={onSelectLog} />
          ) : (
            <EmptyState title="No verified entries found" text="Change the date filter or verify logs to see entries here." />
          )}
          <LogDetailPanel log={selectedLog} onClose={() => onSelectLog(null)} />
        </section>
      ) : (
        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <StatCard label="Verified hours" value={formatMinutes(verifiedMinutes)} detail="Within selected date range" />
          <StatCard label="Verified entries" value={logs.length} detail="Signed records" />
          <StatCard
            label="Latest verified"
            value={latestVerified ? formatVerifiedDate(latestVerified) : 'None'}
            detail={latestVerified ? shortTechnique(latestVerified) : 'No verified entries yet'}
          />
        </section>
      )}
    </section>
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

function VerifiedEntriesTable({ logs, onSelectLog }) {
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
              <LogbookHeader>Target Belt</LogbookHeader>
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

function getVerifiedLogs(logs) {
  return logs.filter((log) => log.status === 'Verified');
}

function filterByVerifiedDate(logs, dateRange) {
  if (!dateRange.from && !dateRange.to) return logs;

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

function formatLogTime(log) {
  return formatMinutes(Number(log.minutes ?? Math.round(Number(log.hours || 0) * 60)));
}

function shortTechnique(log) {
  return log.techniqueName?.split('/')[0].trim() || log.description?.split(':').pop()?.trim() || 'Training log';
}
