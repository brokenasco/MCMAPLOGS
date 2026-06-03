import React from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Clock3, FileText, Filter, Printer, Target } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import LogDetailPanel from '../components/LogDetailPanel.jsx';
import PageShell from '../components/PageShell.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useApp } from '../context/AppContext.jsx';
import {
  additionalMcmapHoursTarget,
  beltProgression,
  formatMinutes,
  getBeltRequirements,
  isAdditionalHoursTechnique
} from '../data/mcmapReference.js';
import { buildBeltProgress, sumLogMinutes } from '../lib/mcmapProgress.js';

const desktopPageSize = 5;
const mobilePageSize = 2;

export default function VerifiedLogbook() {
  const { activeRole, assignedMaiLogs, beltLogs, beltUser, logs: allLogs, profile } = useApp();
  const isMai = activeRole === 'MAI';

  const [selectedLog, setSelectedLog] = React.useState(null);
  const [selectedStudent, setSelectedStudent] = React.useState(null);
  const [maiVerificationView, setMaiVerificationView] = React.useState('entries');
  const [maiStudentView, setMaiStudentView] = React.useState('entries');
  const [beltView, setBeltView] = React.useState('entries');
  const [showMaiVerificationFilter, setShowMaiVerificationFilter] = React.useState(false);
  const [showMaiStudentFilter, setShowMaiStudentFilter] = React.useState(false);
  const [showBeltFilter, setShowBeltFilter] = React.useState(false);
  const [maiVerificationRange, setMaiVerificationRange] = React.useState({ from: '', to: '' });
  const [maiStudentRange, setMaiStudentRange] = React.useState({ from: '', to: '' });
  const [beltRange, setBeltRange] = React.useState({ from: '', to: '' });
  const [maiVerificationStudentFilter, setMaiVerificationStudentFilter] = React.useState('');

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
    setSelectedStudent(null);
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
          dedupeTeachingHours
          logs={verifiedAsMai}
          allLogs={allLogs}
          onDateRangeChange={setMaiVerificationRange}
          onSelectLog={setSelectedLog}
          onSelectStudent={setSelectedStudent}
          onStudentFilterChange={setMaiVerificationStudentFilter}
          onToggleFilter={() => setShowMaiVerificationFilter((current) => !current)}
          onViewChange={setMaiVerificationView}
          selectedLog={selectedLog}
          showDateFilter={showMaiVerificationFilter}
          studentProgress={selectedStudent}
          studentFilter={maiVerificationStudentFilter}
          title="MAI Verification Command Center"
        />

        <VerifiedCommandCenter
          activeView={maiStudentView}
          dateRange={maiStudentRange}
          entriesLabel="Verified Entries as Student"
          extraLabel="Extra Verified Hours as Student"
          hoursLabel="Verified Hours as Student"
          logs={verifiedAsStudent}
          allLogs={allLogs}
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
        allLogs={allLogs}
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
  allLogs = [],
  dateRange,
  dedupeTeachingHours = false,
  entriesLabel,
  extraLabel,
  hoursLabel,
  hoursNeededRows = [],
  logs,
  onDateRangeChange,
  onSelectLog,
  onSelectStudent,
  onStudentFilterChange,
  onToggleFilter,
  onViewChange,
  selectedLog,
  showDateFilter,
  studentProgress,
  studentFilter = '',
  title
}) {
  const [page, setPage] = React.useState(0);
  const [expandedRecordId, setExpandedRecordId] = React.useState('');
  const isMobile = useIsMobileLogbook();
  const pageSize = isMobile ? mobilePageSize : desktopPageSize;
  const filteredLogs = dedupeTeachingHours ? filterByStudentName(logs, studentFilter) : logs;
  const teachingHourLogs = dedupeTeachingHours ? dedupeMaiInstructionPeriods(filteredLogs) : filteredLogs;
  const verifiedMinutes = sumLogMinutes(teachingHourLogs);
  const extraLogs = teachingHourLogs.filter((log) => getExtraMinutes(log) > 0);
  const extraMinutes = extraLogs.reduce((total, log) => total + getExtraMinutes(log), 0);
  const latestVerified = teachingHourLogs
    .slice()
    .sort((a, b) => new Date(getVerifiedDateValue(b) || 0) - new Date(getVerifiedDateValue(a) || 0))[0];
  const supportsHoursNeeded = hoursNeededRows.length > 0;
  const activeRecords = getActiveRecords({ activeView, extraLogs, hoursNeededRows, logs: filteredLogs, teachingHourLogs });
  const pagedRecords = activeRecords.slice(page * pageSize, page * pageSize + pageSize);
  const viewStats = getViewStats({ activeRecords, activeView, extraMinutes, latestVerified, logs: filteredLogs, verifiedMinutes });
  const individualStudentsVerified = dedupeTeachingHours ? countIndividualStudentsVerified(filteredLogs) : null;

  React.useEffect(() => {
    setPage(0);
    setExpandedRecordId('');
  }, [activeView, dateRange.from, dateRange.to, studentFilter, filteredLogs.length, extraLogs.length, hoursNeededRows.length]);

  const toggleExpandedRecord = (recordId) => {
    setExpandedRecordId((current) => (current === recordId ? '' : recordId));
  };

  const buttonCount = supportsHoursNeeded ? 4 : 3;

  return (
    <section className="mb-8">
      <div className="rounded-md border border-coyote/35 bg-charcoal p-5 text-paper shadow-sm sm:p-6">
        <p className="text-sm font-black uppercase tracking-wide text-brass">{title}</p>
        <div className={`mt-5 grid gap-3 ${buttonCount === 4 ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-3'}`}>
          <CommandActionButton
            active={activeView === 'entries'}
            detail={`${filteredLogs.length} verified ${filteredLogs.length === 1 ? 'entry' : 'entries'}`}
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
                : dedupeTeachingHours && activeView !== 'entries'
                  ? 'Filtered by date verified. Matching student submissions are combined into one instructional period for MAI teaching hours.'
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
          <div className={`mt-5 grid gap-4 rounded-md border border-coyote/30 bg-field p-4 sm:items-end ${
            dedupeTeachingHours ? 'sm:grid-cols-[1fr_1fr_1fr_auto]' : 'sm:grid-cols-[1fr_1fr_auto]'
          }`}>
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
            {dedupeTeachingHours ? (
              <label className="block">
                <span className="text-sm font-bold text-ink">Student Name</span>
                <input
                  type="search"
                  value={studentFilter}
                  onChange={(event) => onStudentFilterChange?.(event.target.value)}
                  className="focus-ring mt-2 h-11 w-full rounded-md border border-ink/15 bg-paper px-3 text-sm"
                  placeholder="Search Joseph"
                />
              </label>
            ) : null}
            <button
              type="button"
              onClick={() => {
                onDateRangeChange({ from: '', to: '' });
                onStudentFilterChange?.('');
              }}
              className="focus-ring h-11 rounded-md border border-ink/15 bg-paper px-4 text-sm font-bold text-ink"
            >
              Clear
            </button>
          </div>
        ) : null}

        {dedupeTeachingHours && activeView !== 'needed' ? (
          <div className="mt-5 rounded-md border border-olive/25 bg-olive/10 p-4">
            <p className="text-sm font-black uppercase tracking-wide text-olive">Filtered Results</p>
            <div className="mt-2 grid gap-2 text-sm font-semibold text-ink/75 sm:grid-cols-2">
              <p>Date Range: {formatDateRange(dateRange)}</p>
              <p>Individual Students Verified: {individualStudentsVerified}</p>
            </div>
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
              <VerifiedEntriesTable
                expandedRecordId={expandedRecordId}
                logs={pagedRecords}
                onSelectLog={onSelectLog}
                onSelectStudent={dedupeTeachingHours ? onSelectStudent : null}
                onToggleMobileRecord={toggleExpandedRecord}
              />
            ) : (
              <EmptyState title="No verified entries found" text="Change the date filter or verify logs to see entries here." />
            )
          ) : activeView === 'extra' ? (
            activeRecords.length ? (
              <ExtraHoursTable
                expandedRecordId={expandedRecordId}
                logs={pagedRecords}
                onSelectLog={onSelectLog}
                onSelectStudent={dedupeTeachingHours ? onSelectStudent : null}
                onToggleMobileRecord={toggleExpandedRecord}
              />
            ) : (
              <EmptyState title="No extra verified hours found" text="Overflow time appears here when verified logs exceed a requirement's remaining time." />
            )
          ) : activeView === 'needed' ? (
            activeRecords.length ? (
              <HoursNeededTable
                expandedRecordId={expandedRecordId}
                onToggleMobileRecord={toggleExpandedRecord}
                rows={pagedRecords}
              />
            ) : (
              <EmptyState title="No target-belt requirements found" text="Hours needed will appear when a target belt has structured requirements." />
            )
          ) : activeRecords.length ? (
            <VerifiedEntriesTable
              expandedRecordId={expandedRecordId}
              logs={pagedRecords}
              onSelectLog={onSelectLog}
              onSelectStudent={dedupeTeachingHours ? onSelectStudent : null}
              onToggleMobileRecord={toggleExpandedRecord}
            />
          ) : (
            <EmptyState title="No verified hours found" text="Change the date filter or verify logs to see hour records here." />
          )}
        </div>

        {activeView === 'entries' || activeView === 'extra' || activeView === 'hours' ? (
          <LogDetailPanel log={selectedLog} onClose={() => onSelectLog(null)} />
        ) : null}
        {studentProgress ? (
          <StudentProgressModal
            allLogs={allLogs}
            onClose={() => onSelectStudent(null)}
            student={studentProgress}
          />
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

function VerifiedEntriesTable({ expandedRecordId, logs, onSelectLog, onSelectStudent, onToggleMobileRecord }) {
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
                <LogbookCell className="font-semibold text-ink">
                  <StudentNameButton log={log} onSelectStudent={onSelectStudent} />
                  {log.instructionPeriodNote ? <span className="mt-1 block text-xs font-normal leading-5 text-ink/55">{log.instructionPeriodNote}</span> : null}
                  <StudentListToggle onSelectStudent={onSelectStudent} students={log.combinedStudents || log.combinedStudentNames} />
                </LogbookCell>
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
          <div
            key={log.id}
            role="button"
            tabIndex={0}
            onClick={() => onToggleMobileRecord(log.id)}
            onKeyDown={(event) => handleMobileRecordKeyDown(event, () => onToggleMobileRecord(log.id))}
            className="focus-ring rounded-md border border-coyote/25 bg-field p-4 text-left"
          >
            {renderMobileLogSummary(log, expandedRecordId === log.id, onSelectStudent)}
            {expandedRecordId === log.id ? (
              <dl className="mt-4 grid gap-3 border-t border-coyote/25 pt-4 text-sm">
                <MobileDetail label="Training Date" value={formatDate(log.date)} />
                <MobileDetail label="Verified Hours" value={formatLogTime(log)} />
                <MobileDetail label="Belt" value={log.targetBelt || log.beltLevel} />
                <MobileDetail label="Verified By" value={formatVerifier(log)} />
                <MobileDetail label="Time Applied" value={formatAppliedTime(log)} />
                <MobileDetail label="Extra Verified Hours" value={formatExtraTime(log)} />
                <MobileDetail label="Source" value={formatLogSource(log, 'Verified Entry')} />
                {log.instructionPeriodNote ? <MobileDetail label="Instruction Period" value={log.instructionPeriodNote} /> : null}
              </dl>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function ExtraHoursTable({ expandedRecordId, logs, onSelectLog, onSelectStudent, onToggleMobileRecord }) {
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
                <LogbookCell className="font-semibold text-ink">
                  <StudentNameButton log={log} onSelectStudent={onSelectStudent} />
                  {log.instructionPeriodNote ? <span className="mt-1 block text-xs font-normal leading-5 text-ink/55">{log.instructionPeriodNote}</span> : null}
                  <StudentListToggle onSelectStudent={onSelectStudent} students={log.combinedStudents || log.combinedStudentNames} />
                </LogbookCell>
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
          <div
            key={log.id}
            role="button"
            tabIndex={0}
            onClick={() => onToggleMobileRecord(log.id)}
            onKeyDown={(event) => handleMobileRecordKeyDown(event, () => onToggleMobileRecord(log.id))}
            className="focus-ring rounded-md border border-coyote/25 bg-field p-4 text-left"
          >
            {renderMobileLogSummary(log, expandedRecordId === log.id, onSelectStudent)}
            {expandedRecordId === log.id ? (
              <dl className="mt-4 grid gap-3 border-t border-coyote/25 pt-4 text-sm">
                <MobileDetail label="Original Belt" value={log.targetBelt || log.beltLevel} />
                <MobileDetail label="Original Time" value={formatLogTime(log)} />
                <MobileDetail label="Time Applied" value={formatAppliedTime(log)} />
                <MobileDetail label="Extra Verified Hours" value={formatExtraTime(log)} />
                <MobileDetail label="Verified By" value={formatVerifier(log)} />
                <MobileDetail label="Source" value={formatLogSource(log, 'Extra Verified Hours')} />
                {log.instructionPeriodNote ? <MobileDetail label="Instruction Period" value={log.instructionPeriodNote} /> : null}
              </dl>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function HoursNeededTable({ expandedRecordId, onToggleMobileRecord, rows }) {
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
          <button
            key={row.id}
            type="button"
            onClick={() => onToggleMobileRecord(row.id)}
            className="focus-ring rounded-md border border-coyote/25 bg-field p-4 text-left"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-black text-ink">Hours Needed</p>
                <p className="mt-1 text-sm font-semibold text-ink">{row.code}</p>
                <p className="mt-1 text-xs leading-5 text-ink/60">{row.name}</p>
              </div>
              <span className={`rounded-md px-2 py-1 text-xs font-black ${row.isComplete ? 'bg-olive text-white' : 'bg-brass text-ink'}`}>
                {row.isComplete ? 'Complete' : 'Needed'}
              </span>
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-ink/50">Progress requirement</p>
            {expandedRecordId === row.id ? (
              <dl className="mt-4 grid gap-3 border-t border-coyote/25 pt-4 text-sm">
                <MobileDetail label="Required Time" value={formatMinutes(row.requiredMinutes)} />
                <MobileDetail label="Completed" value={formatMinutes(Math.min(row.completedMinutes, row.requiredMinutes || row.completedMinutes))} />
                <MobileDetail label="Time Needed" value={row.isComplete ? 'Complete' : formatMinutes(row.remainingMinutes)} />
              </dl>
            ) : null}
          </button>
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

function renderMobileLogSummary(log, isExpanded, onSelectStudent) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <StudentNameButton log={log} onSelectStudent={onSelectStudent} />
          <p className="mt-1 text-sm font-semibold text-ink">{log.classCode || 'General'}</p>
          <p className="mt-1 text-xs leading-5 text-ink/60">{log.techniqueName || 'General training'}</p>
        </div>
        <StatusBadge status={log.status || 'Verified'} />
      </div>
      <p className="mt-3 text-xs font-bold uppercase tracking-wide text-ink/50">
        Verified: {formatVerifiedDate(log)}
      </p>
      <StudentListToggle onSelectStudent={onSelectStudent} students={log.combinedStudents || log.combinedStudentNames} />
      <p className="mt-3 text-sm font-black text-olive">
        {isExpanded ? '▲ Hide Details' : '▼ View Details'}
      </p>
    </div>
  );
}

function StudentNameButton({ log, onSelectStudent }) {
  const student = getStudentSummary(log);

  if (!onSelectStudent || !student.name || log.combinedStudentCount > 1) {
    return <span className="text-sm font-black text-ink">{log.marine || 'Training log'}</span>;
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onSelectStudent(student);
      }}
      className="focus-ring min-h-11 rounded-md text-left text-sm font-black text-olive underline-offset-4 hover:underline"
    >
      {student.name}
    </button>
  );
}

function MobileDetail({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-ink/45">{label}</dt>
      <dd className="mt-1 font-semibold text-ink">{value}</dd>
    </div>
  );
}

function StudentProgressModal({ allLogs, onClose, student }) {
  const progress = React.useMemo(
    () => buildStudentProgressDetails({ allLogs, student }),
    [allLogs, student]
  );

  return (
    <div className="fixed inset-0 z-50 grid items-end bg-ink/70 px-0 pt-10 backdrop-blur-sm sm:place-items-center sm:px-3 sm:py-6">
      <section className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-t-md border border-coyote/35 bg-paper pb-4 shadow-panel sm:max-h-[92vh] sm:rounded-md sm:pb-0">
        <div className="sticky top-0 z-10 flex flex-col gap-4 border-b border-coyote/25 bg-paper p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-clay">Student Progress</p>
            <h2 className="mt-1 text-2xl font-black text-ink">{progress.name}</h2>
            <p className="mt-2 text-sm font-semibold text-ink/65">
              Current belt: {progress.currentBelt}. Working toward: {progress.targetBelt}.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring h-11 w-full rounded-md border border-coyote/35 bg-field px-4 text-sm font-black text-ink sm:w-auto"
          >
            Close
          </button>
        </div>

        <div className="grid gap-5 p-4 sm:p-5">
          <div className="rounded-md border border-coyote/35 bg-charcoal p-5 text-paper">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ProgressMetric label="Current Belt" value={progress.currentBelt} />
              <ProgressMetric label="Working Toward" value={progress.targetBelt} />
              <ProgressMetric label="Target Verified" value={formatMinutes(progress.completedMinutes)} />
              <ProgressMetric label="Still Needed" value={formatMinutes(progress.remainingMinutes)} />
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-wide text-paper/65">
                <span>Overall Belt Progress</span>
                <span>{progress.percent}% Complete</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-paper/20">
                <div className="h-full rounded-full bg-brass" style={{ width: `${progress.percent}%` }} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Total required" value={formatMinutes(progress.requiredMinutes)} detail="Current target belt" />
            <StatCard label="Complete techniques" value={`${progress.completedCount} of ${progress.totalCount}`} detail="Verified hours only" />
            <StatCard label="Additional MCMAP Hours" value={formatMinutes(progress.additionalMinutes)} detail="Extra verified time kept separate" />
          </div>

          {progress.targetBelt === additionalMcmapHoursTarget ? (
            <div className="rounded-md border border-olive/25 bg-olive/10 p-4">
              <p className="font-black text-olive">Additional MCMAP Hours</p>
              <p className="mt-2 text-sm leading-6 text-ink/70">
                This student has achieved Black 1st Degree. Verified hours continue to count toward total MCMAP hours, but they are not tied to another belt requirement.
              </p>
            </div>
          ) : (
            <TechniqueProgressTable rows={progress.rows} />
          )}

          <div className="rounded-md border border-coyote/35 bg-field p-4">
            <p className="text-sm font-black uppercase tracking-wide text-clay">Additional MCMAP Hours</p>
            {progress.additionalEntries.length ? (
              <div className="mt-3 grid gap-3">
                {progress.additionalEntries.map((entry) => (
                  <div key={entry.id} className="rounded-md border border-coyote/25 bg-paper p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-black text-ink">{entry.techniqueName || 'Additional MCMAP Hours'}</p>
                        <p className="mt-1 text-sm font-semibold text-ink/60">{entry.classCode || 'ADDL-MCMAP'}</p>
                      </div>
                      <p className="text-sm font-black text-olive">{formatMinutes(entry.minutes)}</p>
                    </div>
                    <p className="mt-2 text-xs font-bold uppercase tracking-wide text-ink/45">
                      Verified: {formatVerifiedDate(entry)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm leading-6 text-ink/65">No additional verified hours found for this student yet.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ProgressMetric({ label, value }) {
  return (
    <div className="rounded-md border border-paper/10 bg-paper/10 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-paper/55">{label}</p>
      <p className="mt-2 text-xl font-black text-paper">{value}</p>
    </div>
  );
}

function TechniqueProgressTable({ rows }) {
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
              <LogbookHeader>Still Needed</LogbookHeader>
              <LogbookHeader>Status</LogbookHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-coyote/20">
            {rows.map((row) => (
              <tr key={row.id} className="align-top">
                <LogbookCell className="font-semibold text-ink">{row.code}</LogbookCell>
                <LogbookCell>{row.name}</LogbookCell>
                <LogbookCell>{formatMinutes(row.requiredMinutes)}</LogbookCell>
                <LogbookCell>{formatMinutes(row.cappedMinutes)}</LogbookCell>
                <LogbookCell className={row.isComplete ? 'font-bold text-olive' : 'font-bold text-clay'}>
                  {row.isComplete ? '0 minutes' : formatMinutes(row.remainingMinutes)}
                </LogbookCell>
                <LogbookCell>
                  <span className={`rounded-md px-2 py-1 text-xs font-black ${row.isComplete ? 'bg-olive text-white' : 'bg-brass text-ink'}`}>
                    {row.isComplete ? 'Complete' : 'In Progress'}
                  </span>
                </LogbookCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 p-3 md:hidden">
        {rows.map((row) => (
          <div key={row.id} className="rounded-md border border-coyote/25 bg-field p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-ink">{row.code}</p>
                <p className="mt-1 text-sm leading-5 text-ink/65">{row.name}</p>
              </div>
              <span className={`rounded-md px-2 py-1 text-xs font-black ${row.isComplete ? 'bg-olive text-white' : 'bg-brass text-ink'}`}>
                {row.isComplete ? 'Complete' : 'In Progress'}
              </span>
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              <MobileDetail label="Required Time" value={formatMinutes(row.requiredMinutes)} />
              <MobileDetail label="Completed" value={formatMinutes(row.cappedMinutes)} />
              <MobileDetail label="Still Needed" value={row.isComplete ? '0 minutes' : formatMinutes(row.remainingMinutes)} />
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentListToggle({ onSelectStudent, students = [] }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const normalizedStudents = students.map((student) =>
    typeof student === 'string' ? { name: student, belt: '' } : student
  );

  if (!normalizedStudents || normalizedStudents.length <= 1) return null;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((current) => !current);
        }}
        className="focus-ring inline-flex h-9 items-center justify-center rounded-md border border-coyote/35 bg-field px-3 text-xs font-black text-ink hover:bg-paper"
      >
        {isOpen ? 'Hide Students' : 'Show Students'}
      </button>
      {isOpen ? (
        <div className="mt-2 grid gap-2 rounded-md border border-coyote/25 bg-paper p-2">
          {normalizedStudents.map((student) => (
            <div key={`${student.id || student.name}-${student.belt}`} className="rounded-md bg-field px-3 py-2 text-xs font-bold text-ink">
              {onSelectStudent ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectStudent(student);
                  }}
                  className="focus-ring min-h-11 rounded-md text-left font-black text-olive underline-offset-4 hover:underline"
                >
                  {student.name}
                </button>
              ) : (
                <p>{student.name}</p>
              )}
              {student.belt ? <p className="mt-1 font-semibold text-ink/55">{student.belt}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function handleMobileRecordKeyDown(event, action) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  action();
}

function getActiveRecords({ activeView, extraLogs, hoursNeededRows, logs, teachingHourLogs }) {
  if (activeView === 'extra') return extraLogs;
  if (activeView === 'needed') return hoursNeededRows;
  if (activeView === 'hours') return teachingHourLogs;
  return logs;
}

function buildStudentProgressDetails({ allLogs, student }) {
  const studentLogs = getStudentLogsForProgress({ allLogs, student });
  const targetBelt = getStudentTargetBelt({ student, studentLogs });
  const currentBelt = getCurrentBeltFromTarget(targetBelt);
  const verifiedLogs = studentLogs.filter((log) => log.status === 'Verified' && !log.archived && !isAccountCreationLog(log));
  const requirements = targetBelt === additionalMcmapHoursTarget
    ? []
    : getBeltRequirements(targetBelt).filter((requirement) => !isAdditionalHoursTechnique(requirement));
  const completedByRequirement = new Map();
  const additionalEntries = [];

  verifiedLogs.forEach((log) => {
    const extraMinutes = getExtraMinutes(log);

    if (isAdditionalProgressLog(log)) {
      additionalEntries.push({
        ...log,
        id: `${log.id}-additional`,
        minutes: getLogMinutesValue(log)
      });
      return;
    }

    if (extraMinutes > 0) {
      additionalEntries.push({
        ...log,
        id: `${log.id}-extra`,
        minutes: extraMinutes,
        techniqueName: log.techniqueName || 'Extra verified hours'
      });
    }

    if (!matchesProgressTarget(log, targetBelt)) return;
    const key = getProgressRequirementKey(log.classCode, log.techniqueName);
    const appliedMinutes = Number(log.appliedMinutes ?? getLogMinutesValue(log));
    completedByRequirement.set(key, (completedByRequirement.get(key) || 0) + appliedMinutes);
  });

  const rows = requirements.map((requirement) => {
    const completedMinutes = completedByRequirement.get(getProgressRequirementKey(requirement.code, requirement.name)) || 0;
    const cappedMinutes = requirement.requiredMinutes ? Math.min(completedMinutes, requirement.requiredMinutes) : completedMinutes;
    const remainingMinutes = requirement.requiredMinutes ? Math.max(requirement.requiredMinutes - completedMinutes, 0) : 0;

    return {
      ...requirement,
      completedMinutes,
      cappedMinutes,
      remainingMinutes,
      isComplete: requirement.requiredMinutes ? completedMinutes >= requirement.requiredMinutes : completedMinutes > 0
    };
  });

  const requiredMinutes = rows.reduce((total, row) => total + row.requiredMinutes, 0);
  const completedMinutes = rows.reduce((total, row) => total + row.cappedMinutes, 0);
  const additionalMinutes = additionalEntries.reduce((total, entry) => total + getLogMinutesValue(entry), 0);

  return {
    additionalEntries: additionalEntries.sort((a, b) => new Date(getVerifiedDateValue(b) || 0) - new Date(getVerifiedDateValue(a) || 0)),
    additionalMinutes,
    completedCount: rows.filter((row) => row.isComplete).length,
    completedMinutes: targetBelt === additionalMcmapHoursTarget ? sumLogMinutes(verifiedLogs) : completedMinutes,
    currentBelt,
    name: student?.name || 'Student',
    percent: targetBelt === additionalMcmapHoursTarget || !requiredMinutes
      ? 100
      : Math.min(Math.round((completedMinutes / requiredMinutes) * 100), 100),
    remainingMinutes: targetBelt === additionalMcmapHoursTarget ? 0 : Math.max(requiredMinutes - completedMinutes, 0),
    requiredMinutes,
    rows,
    targetBelt,
    totalCount: rows.length
  };
}

function getStudentLogsForProgress({ allLogs, student }) {
  const studentId = student?.id;
  const studentName = student?.name?.trim().toLowerCase();

  return allLogs.filter((log) => {
    if (log.archived) return false;
    if (studentId && log.beltUserId) return log.beltUserId === studentId;
    return studentName && log.marine?.trim().toLowerCase() === studentName;
  });
}

function getStudentTargetBelt({ student, studentLogs }) {
  if (student?.belt === additionalMcmapHoursTarget) return additionalMcmapHoursTarget;

  const selectedBelt = normalizeProgressBelt(student?.belt);
  if (beltProgression.includes(selectedBelt) && selectedBelt !== beltProgression[0]) return selectedBelt;

  const latestTargetLog = studentLogs
    .filter((log) => log.status === 'Verified' && !isAccountCreationLog(log))
    .slice()
    .sort((a, b) => new Date(getVerifiedDateValue(b) || b.submittedAt || b.date || 0) - new Date(getVerifiedDateValue(a) || a.submittedAt || a.date || 0))
    .find((log) => log.targetBelt || log.beltLevel);

  if (latestTargetLog?.targetBelt === additionalMcmapHoursTarget) return additionalMcmapHoursTarget;

  const latestTarget = normalizeProgressBelt(latestTargetLog?.targetBelt || latestTargetLog?.beltLevel);
  return beltProgression.includes(latestTarget) && latestTarget !== beltProgression[0] ? latestTarget : 'Tan Belt';
}

function getCurrentBeltFromTarget(targetBelt) {
  if (targetBelt === additionalMcmapHoursTarget) return 'Black 1st Degree';
  const targetIndex = beltProgression.indexOf(targetBelt);
  if (targetIndex <= 0) return beltProgression[0];
  return beltProgression[targetIndex - 1];
}

function matchesProgressTarget(log, targetBelt) {
  if (targetBelt === additionalMcmapHoursTarget) return isAdditionalProgressLog(log);
  return normalizeProgressBelt(log.targetBelt || log.beltLevel) === targetBelt && !isAdditionalProgressLog(log);
}

function isAdditionalProgressLog(log) {
  const classCode = String(log.classCode || '').trim().toLowerCase();
  const techniqueName = String(log.techniqueName || '').trim().toLowerCase();

  return (
    log.targetBelt === additionalMcmapHoursTarget ||
    log.beltLevel === additionalMcmapHoursTarget ||
    classCode.startsWith('addl-mcmap') ||
    techniqueName === 'weapons-free sparring / integration'
  );
}

function getProgressRequirementKey(code, name) {
  return `${code || ''}::${name || ''}`.toLowerCase();
}

function normalizeProgressBelt(beltName = '') {
  const normalized = String(beltName).toLowerCase();
  if (normalized.includes('additional')) return additionalMcmapHoursTarget;
  if (normalized.includes('no mcmap') || normalized.includes('no belt') || normalized === 'none') return beltProgression[0];
  if (normalized.includes('tan')) return 'Tan Belt';
  if (normalized.includes('gray') || normalized.includes('grey')) return 'Gray Belt';
  if (normalized.includes('green')) return 'Green Belt';
  if (normalized.includes('brown')) return 'Brown Belt';
  if (normalized.includes('black')) return 'Black 1st Degree';
  return beltProgression[0];
}

function dedupeMaiInstructionPeriods(logs) {
  const periods = new Map();

  logs.forEach((log) => {
    const key = getInstructionPeriodKey(log);
    const current = periods.get(key);

    if (!current) {
      periods.set(key, {
        ...log,
        id: `instruction-period-${key}`,
        combinedStudentCount: 1,
        combinedStudents: [getStudentSummary(log)].filter((student) => student.name),
        combinedStudentNames: [log.marine].filter(Boolean)
      });
      return;
    }

    const currentMinutes = getLogMinutesValue(current);
    const nextMinutes = getLogMinutesValue(log);
    const currentAppliedMinutes = Number(current.appliedMinutes ?? currentMinutes);
    const nextAppliedMinutes = Number(log.appliedMinutes ?? nextMinutes);
    const currentExtraMinutes = getExtraMinutes(current);
    const nextExtraMinutes = getExtraMinutes(log);

    periods.set(key, {
      ...current,
      minutes: Math.max(currentMinutes, nextMinutes),
      hours: Number((Math.max(currentMinutes, nextMinutes) / 60).toFixed(2)),
      appliedMinutes: Math.max(currentAppliedMinutes, nextAppliedMinutes),
      extraMinutes: Math.max(currentExtraMinutes, nextExtraMinutes),
      combinedStudentCount: current.combinedStudentCount + 1,
      combinedStudents: dedupeStudents([...current.combinedStudents, getStudentSummary(log)]),
      combinedStudentNames: [...new Set([...current.combinedStudentNames, log.marine].filter(Boolean))]
    });
  });

  return [...periods.values()].map((period) => ({
    ...period,
    marine: period.combinedStudentCount > 1 ? `${period.combinedStudentCount} students` : period.marine,
    instructionPeriodNote: period.combinedStudentCount > 1
      ? 'Multiple student submissions combined into one instructional period.'
      : ''
  }));
}

function getStudentSummary(log) {
  return {
    id: log.beltUserId || '',
    name: log.marine || 'Unknown student',
    belt: log.targetBelt || log.beltLevel || ''
  };
}

function dedupeStudents(students) {
  const byStudent = new Map();

  students
    .filter((student) => student?.name)
    .forEach((student) => {
      const key = student.id || `${student.name}::${student.belt}`.toLowerCase();
      byStudent.set(key, student);
    });

  return [...byStudent.values()];
}

function getInstructionPeriodKey(log) {
  const verifier = (log.assignedMaiUserId || log.verifiedByMaiNumber || log.maiNumber || 'unknown-mai').toLowerCase();
  const classCode = (log.classCode || 'general').trim().toLowerCase();
  const trainingDate = (log.date || '').slice(0, 10);

  return `${verifier}::${classCode}::${trainingDate}`;
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

function filterByStudentName(logs, studentFilter) {
  const query = studentFilter.trim().toLowerCase();
  if (!query) return logs;

  return logs.filter((log) => {
    const names = [
      log.marine,
      ...(log.combinedStudents || []).map((student) => student.name),
      ...(log.combinedStudentNames || [])
    ];

    return names.some((name) => String(name || '').toLowerCase().includes(query));
  });
}

function countIndividualStudentsVerified(logs) {
  const students = new Set();

  logs
    .filter((log) => log.status === 'Verified' && !isAccountCreationLog(log))
    .forEach((log) => {
      const studentKey = log.beltUserId || log.marine;
      if (studentKey) students.add(String(studentKey).toLowerCase());
    });

  return students.size;
}

function isAccountCreationLog(log) {
  return (
    log.source === 'Account Creation' ||
    log.source === 'Account Creation Backfill' ||
    log.verificationSource === 'Account Creation' ||
    log.assignedMaiName?.trim().toLowerCase() === 'upon account creation' ||
    log.verifiedBy?.trim().toLowerCase() === 'upon account creation'
  );
}

function formatDateRange(dateRange) {
  if (dateRange.from && dateRange.to) return `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`;
  if (dateRange.from) return `${formatDate(dateRange.from)} - Present`;
  if (dateRange.to) return `Through ${formatDate(dateRange.to)}`;
  return 'All verified dates';
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

  const maiNumber = log.verifiedByMaiNumber || log.maiNumber || '';
  const maiName = log.verifiedBy === 'Verified MAI' ? '' : log.verifiedBy || log.assignedMaiName || '';
  const verifier = `${maiNumber} ${maiName}`.trim();

  return verifier || 'Verified';
}

function formatLogSource(log, fallback) {
  return log.source || log.verificationSource || fallback;
}

function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString();
}

function formatLogTime(log) {
  return formatMinutes(Number(log.minutes ?? Math.round(Number(log.hours || 0) * 60)));
}

function getLogMinutesValue(log) {
  return Number(log.minutes ?? Math.round(Number(log.hours || 0) * 60));
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
