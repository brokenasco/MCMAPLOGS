import React from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Clock3, FileText, Filter, Printer, Target } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import LogDetailPanel from '../components/LogDetailPanel.jsx';
import PageShell from '../components/PageShell.jsx';
import StatCard from '../components/StatCard.jsx';
import { useApp } from '../context/AppContext.jsx';
import { formatMinutes } from '../data/mcmapReference.js';
import { buildBeltProgress, sumLogMinutes } from '../lib/mcmapProgress.js';

const desktopPageSize = 5;
const mobilePageSize = 2;

export default function VerifiedLogbook() {
  const { activeRole, assignedMaiLogs, beltLogs, beltUser, profile } = useApp();
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

  const beltProgressUser = React.useMemo(
    () => ({ ...beltUser, beltLevel: profile?.belt_level || beltUser.beltLevel }),
    [beltUser, profile?.belt_level]
  );
  const beltProgress = React.useMemo(
    () => buildBeltProgress({ beltUser: beltProgressUser, logs: beltLogs }),
    [beltLogs, beltProgressUser]
  );

  React.useEffect(() => {
    setSelectedLog(null);
  }, [activeRole, maiVerificationView, maiStudentView, beltView]);

  if (isMai) {
    const verifiedAsMai = filterByVerifiedDate(getVerifiedLogs(assignedMaiLogs), maiVerificationRange);
    const verifiedAsStudent = filterByVerifiedDate(getVerifiedLogs(beltLogs), maiStudentRange);

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
          extraLabel="Extra Verified Hours as MAI"
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
          extraLabel="Extra Verified Hours as Student"
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
      description="Review verified entries, verified hours, extra verified hours, and hours still needed."
    >
      <VerifiedCommandCenter
        activeView={beltView}
        dateRange={beltRange}
        entriesLabel="Verified Entries"
        extraLabel="Extra Verified Hours"
        hoursLabel="Verified Hours"
        hoursNeededRows={beltProgress.rows}
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
  extraLabel,
  hoursLabel,
  hoursNeededRows = [],
  logs,
  onDateRangeChange,
  onSelectLog,
  onToggleFilter,
  onViewChange,
  selectedLog,
  showDateFilter,
  title
}) {
  const [page, setPage] = React.useState(0);
  const isMobile = useIsMobileLogbook();
  const pageSize = isMobile ? mobilePageSize : desktopPageSize;
  const verifiedMinutes = sumLogMinutes(logs);
  const extraLogs = logs.filter((log) => getExtraMinutes(log) > 0);
  const extraMinutes = extraLogs.reduce((total, log) => total + getExtraMinutes(log), 0);
  const latestVerified = logs
    .slice()
    .sort((a, b) => new Date(getVerifiedDateValue(b) || 0) - new Date(getVerifiedDateValue(a) || 0))[0];
  const supportsHoursNeeded = hoursNeededRows.length > 0;
  const activeRecords = getActiveRecords({ activeView, extraLogs, hoursNeededRows, logs });
  const pagedRecords = activeRecords.slice(page * pageSize, page * pageSize + pageSize);
  const viewStats = getViewStats({ activeRecords, activeView, extraMinutes, latestVerified, logs, verifiedMinutes });

  React.useEffect(() => {
    setPage(0);
  }, [activeView, dateRange.from, dateRange.to, logs.length, extraLogs.length, hoursNeededRows.length]);

  const buttonCount = supportsHoursNeeded ? 4 : 3;

  return (
    <section className="mb-8">
      <div className="rounded-md border border-coyote/35 bg-charcoal p-5 text-paper shadow-sm sm:p-6">
        <p className="text-sm font-black uppercase tracking-wide text-brass">{title}</p>
        <div className={`mt-5 grid gap-3 ${buttonCount === 4 ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-3'}`}>
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
          <CommandActionButton
            active={activeView === 'extra'}
            detail={formatMinutes(extraMinutes)}
            icon={Clock3}
            label={extraLabel}
            onClick={() => onViewChange('extra')}
          />
          {supportsHoursNeeded ? (
            <CommandActionButton
              active={activeView === 'needed'}
              detail={`${hoursNeededRows.filter((row) => !row.isComplete).length} left`}
              icon={Target}
              label="Hours Needed"
              onClick={() => onViewChange('needed')}
            />
          ) : null}
        </div>
      </div>

      <div className="mt-5 rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-clay">{getViewLabel(activeView, { entriesLabel, extraLabel, hoursLabel })}</p>
            <h2 className="mt-1 text-xl font-bold text-ink">{getViewTitle(activeView)}</h2>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              {activeView === 'needed'
                ? 'Shows what is still needed for the current target belt. Only verified hours count.'
                : 'Filtered by date verified. Pending, returned, and canceled logs are not included.'}
            </p>
          </div>
          <div className="grid gap-3 sm:flex sm:flex-wrap sm:justify-end">
            {activeView !== 'needed' ? (
              <button
                type="button"
                onClick={onToggleFilter}
                className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-olive px-4 text-sm font-bold text-white sm:h-10"
              >
                <Filter size={17} aria-hidden="true" />
                Filter
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => openPrintableReport({ activeView, records: activeRecords, title, exportMode: 'pdf' })}
              className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md border border-coyote/40 bg-field px-4 text-sm font-bold text-ink sm:h-10"
            >
              <FileText size={17} aria-hidden="true" />
              PDF
            </button>
            <button
              type="button"
              onClick={() => openPrintableReport({ activeView, records: activeRecords, title, exportMode: 'print' })}
              className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md border border-coyote/40 bg-field px-4 text-sm font-bold text-ink sm:h-10"
            >
              <Printer size={17} aria-hidden="true" />
              Print
            </button>
          </div>
        </div>

        {showDateFilter && activeView !== 'needed' ? (
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

      <section className="mt-5 min-h-[560px] space-y-5 rounded-md border border-coyote/20 bg-field/35 p-0 sm:min-h-[620px]">
        <div className="grid gap-4 md:grid-cols-3">
          {viewStats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} detail={stat.detail} />
          ))}
        </div>

        <div className="min-h-[360px]">
          {activeView === 'entries' ? (
            activeRecords.length ? (
              <VerifiedEntriesTable logs={pagedRecords} onSelectLog={onSelectLog} />
            ) : (
              <EmptyState title="No verified entries found" text="Change the date filter or verify logs to see entries here." />
            )
          ) : activeView === 'extra' ? (
            activeRecords.length ? (
              <ExtraHoursTable logs={pagedRecords} onSelectLog={onSelectLog} />
            ) : (
              <EmptyState title="No extra verified hours found" text="Overflow time appears here when verified logs exceed a requirement's remaining time." />
            )
          ) : activeView === 'needed' ? (
            activeRecords.length ? (
              <HoursNeededTable rows={pagedRecords} />
            ) : (
              <EmptyState title="No target-belt requirements found" text="Hours needed will appear when a target belt has structured requirements." />
            )
          ) : activeRecords.length ? (
            <VerifiedEntriesTable logs={pagedRecords} onSelectLog={onSelectLog} />
          ) : (
            <EmptyState title="No verified hours found" text="Change the date filter or verify logs to see hour records here." />
          )}
        </div>

        {activeView === 'entries' || activeView === 'extra' || activeView === 'hours' ? (
          <LogDetailPanel log={selectedLog} onClose={() => onSelectLog(null)} />
        ) : null}
      </section>

      <PaginationControls page={page} pageSize={pageSize} records={activeRecords} onPageChange={setPage} />
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

function PaginationControls({ page, pageSize, records, onPageChange }) {
  const totalPages = Math.max(Math.ceil(records.length / pageSize), 1);
  const canGoPrevious = page > 0;
  const canGoNext = page + 1 < totalPages;

  if (records.length <= pageSize) return null;

  return (
    <div className="mt-4 grid gap-3 rounded-md border border-coyote/30 bg-paper p-3 text-sm font-semibold text-ink/70 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <button
        type="button"
        disabled={!canGoPrevious}
        onClick={() => onPageChange((current) => Math.max(current - 1, 0))}
        className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md border border-coyote/40 bg-field px-3 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:justify-start"
      >
        <ChevronLeft size={17} aria-hidden="true" />
        Previous {pageSize}
      </button>
      <span className="text-center">
        Page {page + 1} of {totalPages}
      </span>
      <button
        type="button"
        disabled={!canGoNext}
        onClick={() => onPageChange((current) => Math.min(current + 1, totalPages - 1))}
        className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md border border-coyote/40 bg-field px-3 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:justify-end"
      >
        Next {pageSize}
        <ChevronRight size={17} aria-hidden="true" />
      </button>
    </div>
  );
}

function useIsMobileLogbook() {
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 639px)').matches;
  });

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 639px)');
    const updateMobileState = () => setIsMobile(mediaQuery.matches);

    updateMobileState();
    mediaQuery.addEventListener('change', updateMobileState);

    return () => mediaQuery.removeEventListener('change', updateMobileState);
  }, []);

  return isMobile;
}

function VerifiedEntriesTable({ logs, onSelectLog }) {
  return (
    <div className="overflow-hidden rounded-md border border-coyote/35 bg-paper shadow-sm">
      <div className="hidden md:block">
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
                <LogbookCell>{formatVerifier(log)}</LogbookCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 p-3 md:hidden">
        {logs.map((log) => (
          <button
            key={log.id}
            type="button"
            onClick={() => onSelectLog(log)}
            className="focus-ring rounded-md border border-coyote/25 bg-field p-4 text-left"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-black text-ink">{log.marine}</p>
                <p className="mt-1 text-sm font-semibold text-ink">{log.classCode || 'General'}</p>
                {log.techniqueName ? <p className="mt-1 text-xs leading-5 text-ink/60">{log.techniqueName}</p> : null}
              </div>
              <span className="rounded-md bg-olive px-2 py-1 text-xs font-black text-white">Verified</span>
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              <MobileDetail label="Date Verified" value={formatVerifiedDate(log)} />
              <MobileDetail label="Training Date" value={formatDate(log.date)} />
              <MobileDetail label="Time" value={formatLogTime(log)} />
              <MobileDetail label="Target Belt" value={log.targetBelt || log.beltLevel} />
              <MobileDetail label="Verified By" value={formatVerifier(log)} />
            </dl>
          </button>
        ))}
      </div>
    </div>
  );
}

function ExtraHoursTable({ logs, onSelectLog }) {
  return (
    <div className="overflow-hidden rounded-md border border-coyote/35 bg-paper shadow-sm">
      <div className="hidden md:block">
        <table className="min-w-full divide-y divide-coyote/25">
          <thead className="bg-charcoal text-paper">
            <tr>
              <LogbookHeader>User</LogbookHeader>
              <LogbookHeader>Date Verified</LogbookHeader>
              <LogbookHeader>Original Belt</LogbookHeader>
              <LogbookHeader>Technique / Tie-In</LogbookHeader>
              <LogbookHeader>Class Code</LogbookHeader>
              <LogbookHeader>Original Time</LogbookHeader>
              <LogbookHeader>Applied</LogbookHeader>
              <LogbookHeader>Extra Time</LogbookHeader>
              <LogbookHeader>MAI</LogbookHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-coyote/20">
            {logs.map((log) => (
              <tr key={log.id} className="cursor-pointer align-top hover:bg-field/70" onClick={() => onSelectLog(log)}>
                <LogbookCell className="font-semibold text-ink">{log.marine}</LogbookCell>
                <LogbookCell>{formatVerifiedDate(log)}</LogbookCell>
                <LogbookCell>{log.targetBelt || log.beltLevel}</LogbookCell>
                <LogbookCell>{log.techniqueName || 'General training'}</LogbookCell>
                <LogbookCell>{log.classCode || 'General'}</LogbookCell>
                <LogbookCell>{formatLogTime(log)}</LogbookCell>
                <LogbookCell>{formatAppliedTime(log)}</LogbookCell>
                <LogbookCell className="font-bold text-olive">{formatExtraTime(log)}</LogbookCell>
                <LogbookCell>{formatVerifier(log)}</LogbookCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 p-3 md:hidden">
        {logs.map((log) => (
          <button
            key={log.id}
            type="button"
            onClick={() => onSelectLog(log)}
            className="focus-ring rounded-md border border-coyote/25 bg-field p-4 text-left"
          >
            <p className="text-sm font-black text-ink">{log.marine}</p>
            <p className="mt-1 text-sm font-semibold text-ink">{log.classCode || 'General'}</p>
            <p className="mt-1 text-xs leading-5 text-ink/60">{log.techniqueName || 'General training'}</p>
            <dl className="mt-4 grid gap-3 text-sm">
              <MobileDetail label="Date Verified" value={formatVerifiedDate(log)} />
              <MobileDetail label="Original Belt" value={log.targetBelt || log.beltLevel} />
              <MobileDetail label="Original Time" value={formatLogTime(log)} />
              <MobileDetail label="Applied" value={formatAppliedTime(log)} />
              <MobileDetail label="Extra Time" value={formatExtraTime(log)} />
              <MobileDetail label="MAI" value={formatVerifier(log)} />
            </dl>
          </button>
        ))}
      </div>
    </div>
  );
}

function HoursNeededTable({ rows }) {
  return (
    <div className="overflow-hidden rounded-md border border-coyote/35 bg-paper shadow-sm">
      <div className="hidden md:block">
        <table className="min-w-full divide-y divide-coyote/25">
          <thead className="bg-charcoal text-paper">
            <tr>
              <LogbookHeader>Class Code</LogbookHeader>
              <LogbookHeader>Technique / Tie-In</LogbookHeader>
              <LogbookHeader>Required Time</LogbookHeader>
              <LogbookHeader>Completed</LogbookHeader>
              <LogbookHeader>Time Needed</LogbookHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-coyote/20">
            {rows.map((row) => (
              <tr key={row.id} className="align-top">
                <LogbookCell className="font-semibold text-ink">{row.code}</LogbookCell>
                <LogbookCell>{row.name}</LogbookCell>
                <LogbookCell>{formatMinutes(row.requiredMinutes)}</LogbookCell>
                <LogbookCell>{formatMinutes(Math.min(row.completedMinutes, row.requiredMinutes || row.completedMinutes))}</LogbookCell>
                <LogbookCell className={row.isComplete ? 'font-bold text-olive' : 'font-bold text-clay'}>
                  {row.isComplete ? 'Complete' : formatMinutes(row.remainingMinutes)}
                </LogbookCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 p-3 md:hidden">
        {rows.map((row) => (
          <article key={row.id} className="rounded-md border border-coyote/25 bg-field p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-black text-ink">{row.code}</p>
                <p className="mt-1 text-sm leading-6 text-ink/70">{row.name}</p>
              </div>
              <span className={`rounded-md px-2 py-1 text-xs font-black ${row.isComplete ? 'bg-olive text-white' : 'bg-brass text-ink'}`}>
                {row.isComplete ? 'Complete' : 'Needed'}
              </span>
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              <MobileDetail label="Required Time" value={formatMinutes(row.requiredMinutes)} />
              <MobileDetail label="Completed" value={formatMinutes(Math.min(row.completedMinutes, row.requiredMinutes || row.completedMinutes))} />
              <MobileDetail label="Time Needed" value={row.isComplete ? 'Complete' : formatMinutes(row.remainingMinutes)} />
            </dl>
          </article>
        ))}
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

function MobileDetail({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-ink/45">{label}</dt>
      <dd className="mt-1 font-semibold text-ink">{value}</dd>
    </div>
  );
}

function getActiveRecords({ activeView, extraLogs, hoursNeededRows, logs }) {
  if (activeView === 'extra') return extraLogs;
  if (activeView === 'needed') return hoursNeededRows;
  return logs;
}

function getViewLabel(activeView, labels) {
  if (activeView === 'entries') return labels.entriesLabel;
  if (activeView === 'extra') return labels.extraLabel;
  if (activeView === 'needed') return 'Hours Needed';
  return labels.hoursLabel;
}

function getViewTitle(activeView) {
  if (activeView === 'entries') return 'Verified log history';
  if (activeView === 'extra') return 'Extra verified hour history';
  if (activeView === 'needed') return 'Target belt hours needed';
  return 'Verified hour totals';
}

function getViewStats({ activeRecords, activeView, extraMinutes, latestVerified, logs, verifiedMinutes }) {
  if (activeView === 'extra') {
    const latestExtra = activeRecords
      .slice()
      .sort((a, b) => new Date(getVerifiedDateValue(b) || 0) - new Date(getVerifiedDateValue(a) || 0))[0];

    return [
      { label: 'Extra verified hours', value: formatMinutes(extraMinutes), detail: 'Overflow time preserved' },
      { label: 'Extra entries', value: activeRecords.length, detail: 'Verified overflow records' },
      {
        label: 'Latest extra',
        value: latestExtra ? formatVerifiedDate(latestExtra) : 'None',
        detail: latestExtra ? shortTechnique(latestExtra) : 'No extra verified hours yet'
      }
    ];
  }

  if (activeView === 'needed') {
    const completeRows = activeRecords.filter((row) => row.isComplete).length;
    const neededMinutes = activeRecords.reduce((total, row) => total + Math.max(row.remainingMinutes || 0, 0), 0);

    return [
      { label: 'Requirements', value: activeRecords.length, detail: 'Current target belt items' },
      { label: 'Complete', value: completeRows, detail: 'Requirements fully satisfied' },
      { label: 'Time still needed', value: formatMinutes(neededMinutes), detail: 'Verified hours only' }
    ];
  }

  return [
    { label: 'Verified hours', value: formatMinutes(verifiedMinutes), detail: 'Within selected date range' },
    { label: 'Verified entries', value: logs.length, detail: 'Signed records' },
    {
      label: 'Latest verified',
      value: latestVerified ? formatVerifiedDate(latestVerified) : 'None',
      detail: latestVerified ? shortTechnique(latestVerified) : 'No verified entries yet'
    }
  ];
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

function openPrintableReport({ activeView, records, title, exportMode }) {
  const printWindow = window.open('', '_blank', 'width=1100,height=800');
  if (!printWindow) return;

  const reportTitle = `${title} - ${getViewTitle(activeView)}`;
  const html = `
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(reportTitle)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #171a16; margin: 32px; }
          h1 { font-size: 22px; margin: 0 0 6px; }
          p { color: #4b5146; margin: 0 0 18px; }
          table { border-collapse: collapse; width: 100%; font-size: 12px; }
          th { background: #171a16; color: #fff; text-align: left; padding: 9px; }
          td { border-bottom: 1px solid #d8d0bb; padding: 9px; vertical-align: top; }
          .note { margin-top: 18px; font-size: 11px; color: #60685b; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(reportTitle)}</h1>
        <p>${exportMode === 'pdf' ? 'Use the print dialog to save this report as a PDF.' : 'Filtered report ready to print.'}</p>
        ${buildPrintableTable(activeView, records)}
        <p class="note">Generated from MCMAP Logbook. Pending, returned, canceled, and unverified logs are not included unless this is the Hours Needed view.</p>
        <script>
          window.onload = () => {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

function buildPrintableTable(activeView, records) {
  if (activeView === 'needed') {
    return buildTable(
      ['Class Code', 'Technique / Tie-In', 'Required Time', 'Completed', 'Time Needed'],
      records.map((row) => [
        row.code,
        row.name,
        formatMinutes(row.requiredMinutes),
        formatMinutes(Math.min(row.completedMinutes, row.requiredMinutes || row.completedMinutes)),
        row.isComplete ? 'Complete' : formatMinutes(row.remainingMinutes)
      ])
    );
  }

  if (activeView === 'extra') {
    return buildTable(
      ['User', 'Date Verified', 'Original Belt', 'Technique / Tie-In', 'Class Code', 'Original Time', 'Applied', 'Extra Time', 'MAI'],
      records.map((log) => [
        log.marine,
        formatVerifiedDate(log),
        log.targetBelt || log.beltLevel,
        log.techniqueName || 'General training',
        log.classCode || 'General',
        formatLogTime(log),
        formatAppliedTime(log),
        formatExtraTime(log),
        formatVerifier(log)
      ])
    );
  }

  return buildTable(
    ['Marine', 'Date Verified', 'Training Date', 'Class Code', 'Technique / Tie-In', 'Time', 'Target Belt', 'Verified By'],
    records.map((log) => [
      log.marine,
      formatVerifiedDate(log),
      formatDate(log.date),
      log.classCode || 'General',
      log.techniqueName || '',
      formatLogTime(log),
      log.targetBelt || log.beltLevel,
      formatVerifier(log)
    ])
  );
}

function buildTable(headers, rows) {
  if (!rows.length) return '<p>No records match this view.</p>';
  return `
    <table>
      <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>
      <tbody>
        ${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}
      </tbody>
    </table>
  `;
}

function getVerifiedDateValue(log) {
  return log.verifiedAt || '';
}

function formatVerifiedDate(log) {
  const verifiedDate = getVerifiedDateValue(log);
  return verifiedDate ? formatDate(verifiedDate) : 'Not recorded';
}

function formatVerifier(log) {
  if (log.source === 'Account Creation' || log.source === 'Account Creation Backfill') return 'Upon Account Creation';
  if (log.verificationSource === 'Account Creation') return 'Upon Account Creation';
  return log.verifiedBy ? `${log.verifiedBy} ${log.verifiedByMaiNumber || ''}`.trim() : 'Verified';
}

function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString();
}

function formatLogTime(log) {
  return formatMinutes(Number(log.minutes ?? Math.round(Number(log.hours || 0) * 60)));
}

function formatAppliedTime(log) {
  return formatMinutes(Number(log.appliedMinutes ?? log.minutes ?? Math.round(Number(log.hours || 0) * 60)));
}

function formatExtraTime(log) {
  return formatMinutes(getExtraMinutes(log));
}

function getExtraMinutes(log) {
  return Number(log.extraMinutes || 0);
}

function shortTechnique(log) {
  return log.techniqueName?.split('/')[0].trim() || log.description?.split(':').pop()?.trim() || 'Training log';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
