import React from 'react';
import { CheckCircle2, MessageSquare, XCircle } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import LogDetailPanel from '../components/LogDetailPanel.jsx';
import PageShell from '../components/PageShell.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function PendingLogs() {
  const { maiUser, pendingLogs, verifyLog, returnLog, setActiveRole } = useApp();
  const [selectedLog, setSelectedLog] = React.useState(null);
  const [confirmationLog, setConfirmationLog] = React.useState(null);
  const [returningLog, setReturningLog] = React.useState(null);
  const [returnReason, setReturnReason] = React.useState('Missing detail');
  const [returnMessage, setReturnMessage] = React.useState('Add the techniques trained, who supervised the period, and resubmit.');

  React.useEffect(() => {
    setActiveRole('MAI');
  }, [setActiveRole]);

  const openConfirmation = (log) => {
    setSelectedLog(log);
    setConfirmationLog(log);
  };

  const handleVerify = () => {
    verifyLog(confirmationLog.id);
    setConfirmationLog(null);
    setSelectedLog(null);
  };

  const handleReturn = () => {
    returnLog(returningLog.id, returnReason, returnMessage);
    setReturningLog(null);
    setSelectedLog(null);
  };

  return (
    <PageShell
      eyebrow="MAI"
      title="Pending logs"
      description={`Signing with ${maiUser.maiNumber} verifies your MAI account on the logbook record.`}
    >
      {confirmationLog ? (
        <div className="mb-6 rounded-md border border-olive/20 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-clay">Confirm MAI signature</p>
          <h2 className="mt-2 text-2xl font-bold">{confirmationLog.marine}</h2>
          <p className="mt-2 text-sm leading-6 text-ink/70">
            You are about to sign {confirmationLog.hours} hours of {confirmationLog.beltLevel} training using
            MAI number {maiUser.maiNumber}.
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
              className="focus-ring inline-flex h-10 items-center rounded-md border border-ink/15 bg-field px-4 text-sm font-bold text-ink hover:bg-white"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {returningLog ? (
        <div className="mb-6 rounded-md border border-clay/20 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-clay">Return for correction</p>
          <h2 className="mt-2 text-2xl font-bold">{returningLog.marine}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-ink">Reason</span>
              <select
                value={returnReason}
                onChange={(event) => setReturnReason(event.target.value)}
                className="focus-ring mt-2 h-11 w-full rounded-md border border-ink/15 bg-white px-3 text-sm"
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
              <article key={log.id} className="rounded-md border border-ink/10 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">{log.marine}</h2>
                    <p className="mt-1 text-sm text-ink/60">
                      {new Date(`${log.date}T12:00:00`).toLocaleDateString()} | {log.hours} hours | {log.beltLevel}
                    </p>
                  </div>
                  <StatusBadge status={log.status} />
                </div>
                <p className="mt-4 text-sm leading-6 text-ink/70">{log.description}</p>
                <p className="mt-3 text-sm font-semibold text-ink/65">
                  Submitted for verification by MAI number {log.maiNumber}
                </p>
                <div className="mt-5 rounded-md bg-field p-3 text-sm text-ink/70">
                  MAI signature will be recorded as {maiUser.name} | {maiUser.maiNumber}
                </div>
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
                    className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-ink/15 bg-field px-4 text-sm font-bold text-ink hover:bg-white"
                  >
                    <XCircle size={17} aria-hidden="true" />
                    Return with note
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLog(log)}
                    className="focus-ring inline-flex h-10 items-center rounded-md border border-ink/15 bg-white px-4 text-sm font-bold text-ink hover:bg-field"
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
        <EmptyState
          title="No logs need review right now"
          text="When Belt Users submit hours to your assigned MAI number, their logs will appear here for signature."
        />
      )}
    </PageShell>
  );
}
