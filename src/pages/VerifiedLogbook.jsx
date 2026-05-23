import React from 'react';
import { CheckCircle2, Download, MessageSquare, Printer, XCircle } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import LogDetailPanel from '../components/LogDetailPanel.jsx';
import LogTable from '../components/LogTable.jsx';
import PageShell from '../components/PageShell.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useApp } from '../context/AppContext.jsx';

const filters = ['All', 'Pending', 'Verified', 'Returned'];

export default function VerifiedLogbook() {
  const { activeRole, logs, maiUser, pendingLogs, verifyLog, returnLog } = useApp();
  const [activeFilter, setActiveFilter] = React.useState(activeRole === 'MAI' ? 'Pending' : 'Verified');
  const [selectedLog, setSelectedLog] = React.useState(null);
  const [confirmationLog, setConfirmationLog] = React.useState(null);
  const [returningLog, setReturningLog] = React.useState(null);
  const [returnReason, setReturnReason] = React.useState('Missing detail');
  const [returnMessage, setReturnMessage] = React.useState('Add the techniques trained, who supervised the period, and resubmit.');
  const filteredLogs = activeFilter === 'All' ? logs : logs.filter((log) => log.status === activeFilter);
  const verifiedLogs = logs.filter((log) => log.status === 'Verified');
  const verifiedHours = verifiedLogs.reduce((total, log) => total + Number(log.hours), 0);
  const isMai = activeRole === 'MAI';

  React.useEffect(() => {
    setActiveFilter(activeRole === 'MAI' ? 'Pending' : 'Verified');
    setSelectedLog(null);
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
    await returnLog(returningLog.id, returnReason, returnMessage);
    setReturningLog(null);
    setSelectedLog(null);
  };

  const exportCsv = () => {
    const rows = [
      ['Marine', 'Date', 'Hours', 'Belt Level', 'MAI Number', 'Status', 'Signed By'],
      ...filteredLogs.map((log) => [
        log.marine,
        log.date,
        log.hours,
        log.beltLevel,
        log.maiNumber,
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

  return (
    <PageShell
      eyebrow="Records"
      title="Logbook"
      description="Review submitted, pending, returned, and MAI-verified MCMAP training records."
    >
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {isMai ? <StatCard label="Pending review" value={pendingLogs.length} detail="Awaiting MAI signature" /> : null}
        <StatCard label="Verified entries" value={verifiedLogs.length} detail="Signed records" />
        <StatCard label="Verified hours" value={verifiedHours} detail="Total approved hours" />
        <StatCard label="All records" value={logs.length} detail="Across every status" />
      </div>

      {isMai ? (
        <MaiPendingReview
          confirmationLog={confirmationLog}
          handleReturn={handleReturn}
          handleVerify={handleVerify}
          maiUser={maiUser}
          openConfirmation={openConfirmation}
          pendingLogs={pendingLogs}
          returnMessage={returnMessage}
          returnReason={returnReason}
          returningLog={returningLog}
          selectedLog={selectedLog}
          setConfirmationLog={setConfirmationLog}
          setReturnMessage={setReturnMessage}
          setReturnReason={setReturnReason}
          setReturningLog={setReturningLog}
          setSelectedLog={setSelectedLog}
        />
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
          <LogTable logs={filteredLogs} onSelectLog={setSelectedLog} />
        ) : (
          <EmptyState title={`No ${activeFilter.toLowerCase()} logs`} text="Change the filter or submit a new log to see records here." />
        )}
        <LogDetailPanel log={selectedLog} onClose={() => setSelectedLog(null)} />
      </div>
    </PageShell>
  );
}

function MaiPendingReview({
  confirmationLog,
  handleReturn,
  handleVerify,
  maiUser,
  openConfirmation,
  pendingLogs,
  returnMessage,
  returnReason,
  returningLog,
  selectedLog,
  setConfirmationLog,
  setReturnMessage,
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
          <p className="text-sm font-bold uppercase tracking-wide text-clay">Return for correction</p>
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
              Send correction message
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
                <p className="mt-3 text-sm font-semibold text-ink/65">Submitted for verification by MAI number {log.maiNumber}</p>
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
                    }}
                    className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-ink/15 bg-paper px-4 text-sm font-bold text-ink hover:bg-field"
                  >
                    <XCircle size={17} aria-hidden="true" />
                    Return with note
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
