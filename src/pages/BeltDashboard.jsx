import React from 'react';
import { AlertTriangle, CheckCircle2, PlusCircle, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';
import LogDetailPanel from '../components/LogDetailPanel.jsx';
import LogTable from '../components/LogTable.jsx';
import PageShell from '../components/PageShell.jsx';
import StatCard from '../components/StatCard.jsx';
import { RoleBadge } from '../components/Header.jsx';
import { useApp } from '../context/AppContext.jsx';
import { formatMinutes, getBeltRequirements, getTargetBelt } from '../data/mcmapReference.js';

export default function BeltDashboard() {
  const { beltUser, beltLogs, resubmitLog, savedDraft } = useApp();
  const [selectedLog, setSelectedLog] = React.useState(null);
  const [editingLog, setEditingLog] = React.useState(null);
  const [correctionText, setCorrectionText] = React.useState('');
  const totalHours = beltLogs.reduce((total, log) => total + Number(log.hours), 0);
  const verifiedHours = beltLogs
    .filter((log) => log.status === 'Verified')
    .reduce((total, log) => total + Number(log.hours), 0);
  const pendingHours = beltLogs
    .filter((log) => log.status === 'Pending')
    .reduce((total, log) => total + Number(log.hours), 0);
  const returnedCount = beltLogs.filter((log) => log.status === 'Returned').length;
  const targetBelt = getTargetBelt(beltUser.beltLevel);
  const progress = React.useMemo(() => buildBeltProgress({ beltUser, beltLogs }), [beltLogs, beltUser]);

  return (
    <PageShell
      eyebrow="Belt User"
      title={`Welcome, ${beltUser.name}`}
      description="Track your submitted MCMAP hours, pending verification, and verified logbook progress."
      actions={<RoleBadge role="Belt User" />}
    >
      <section className="mb-8 rounded-md border border-coyote/35 bg-charcoal p-5 text-paper shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-brass">Today</p>
            <h2 className="mt-1 text-2xl font-bold">
              {returnedCount ? 'Fix your returned log first' : savedDraft ? 'Finish your saved draft' : 'Ready to submit training hours'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-paper/70">
              {returnedCount
                ? `${returnedCount} returned log needs correction before it can be verified.`
                : savedDraft
                  ? 'You have a saved log draft waiting in the submit flow.'
                  : 'No urgent issues. Submit hours after your next training period.'}
            </p>
          </div>
          <Link
            to="/belt/submit"
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-brass px-4 text-sm font-bold text-ink"
          >
            {returnedCount ? <AlertTriangle size={18} aria-hidden="true" /> : <CheckCircle2 size={18} aria-hidden="true" />}
            {returnedCount ? 'Review corrections' : savedDraft ? 'Resume draft' : 'Submit hours'}
          </Link>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total hours submitted" value={totalHours || beltUser.totalHours} detail={beltUser.beltLevel} />
        <StatCard label="Verified hours" value={verifiedHours || beltUser.verifiedHours} detail="Approved by an MAI" />
        <StatCard label="Returned logs" value={returnedCount} detail="Need correction" />
      </div>

      <div className="mt-8 rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold">Next goal</h2>
            <p className="mt-1 text-sm text-ink/65">
              Working toward {targetBelt}. Pending time waiting on MAI approval: {formatHoursAsTime(pendingHours || beltUser.pendingHours)}.
            </p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-field">
              <div className="h-full rounded-full bg-olive" style={{ width: `${progress.percent}%` }} />
            </div>
            <p className="mt-2 text-xs font-semibold text-ink/55">
              {progress.percent}% toward {targetBelt} | {progress.completedCount}/{progress.totalCount} requirements complete
            </p>
          </div>
          <Link
            to="/belt/submit"
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-clay px-4 text-sm font-bold text-white hover:bg-clay/90"
          >
            <PlusCircle size={18} aria-hidden="true" />
            Submit hours
          </Link>
        </div>
      </div>

      {beltLogs.some((log) => log.status === 'Returned') ? (
        <section className="mt-8 rounded-md border border-clay/20 bg-clay/10 p-5">
          <h2 className="text-xl font-bold text-ink">Returned logs need correction</h2>
          <p className="mt-1 text-sm text-ink/65">Fix the note from your MAI and resubmit the log for review.</p>
          <div className="mt-4 grid gap-3">
            {beltLogs
              .filter((log) => log.status === 'Returned')
              .map((log) => (
                <article key={log.id} className="rounded-md bg-paper p-4 shadow-sm">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <p className="font-bold">{new Date(`${log.date}T12:00:00`).toLocaleDateString()} | {log.hours} hours</p>
                      <p className="mt-1 text-sm font-semibold text-clay">{log.returnReason}</p>
                      <p className="mt-1 text-sm leading-6 text-ink/65">{log.returnMessage}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLog(log);
                        setCorrectionText(log.description);
                      }}
                      className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md bg-clay px-4 text-sm font-bold text-white"
                    >
                      <RotateCcw size={17} aria-hidden="true" />
                      Correct
                    </button>
                  </div>
                </article>
              ))}
          </div>
        </section>
      ) : null}

      {editingLog ? (
        <section className="mt-8 rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
          <h2 className="text-xl font-bold">Correct returned log</h2>
          <p className="mt-1 text-sm text-ink/65">{editingLog.returnMessage}</p>
          <label className="mt-4 block">
            <span className="text-sm font-bold text-ink">Updated training description</span>
            <textarea
              value={correctionText}
              onChange={(event) => setCorrectionText(event.target.value)}
              className="focus-ring mt-2 min-h-28 w-full rounded-md border border-ink/15 px-3 py-3 text-sm"
            />
          </label>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={async () => {
                await resubmitLog(editingLog.id, { description: correctionText });
                setEditingLog(null);
                setCorrectionText('');
              }}
              className="focus-ring inline-flex h-10 items-center rounded-md bg-olive px-4 text-sm font-bold text-white"
            >
              Resubmit log
            </button>
            <button
              type="button"
              onClick={() => setEditingLog(null)}
              className="focus-ring inline-flex h-10 items-center rounded-md border border-ink/15 bg-field px-4 text-sm font-bold text-ink"
            >
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_380px]">
        <div>
          <h2 className="mb-3 text-xl font-bold">My recent logs</h2>
          {beltLogs.length ? (
            <LogTable logs={beltLogs} showMarine={false} onSelectLog={setSelectedLog} />
          ) : (
            <EmptyState
              title="No logs submitted yet"
              text="Submit your first MCMAP training log and it will appear here while waiting for MAI verification."
              action={
                <Link
                  to="/belt/submit"
                  className="focus-ring inline-flex h-10 items-center rounded-md bg-olive px-4 text-sm font-bold text-white"
                >
                  Submit hours
                </Link>
              }
            />
          )}
        </div>
        <LogDetailPanel log={selectedLog} onClose={() => setSelectedLog(null)} />
      </div>
    </PageShell>
  );
}

function buildBeltProgress({ beltUser, beltLogs }) {
  const targetBelt = getTargetBelt(beltUser.beltLevel);
  const requirements = getBeltRequirements(targetBelt);
  const completedByRequirement = new Map();

  beltLogs
    .filter((log) => log.status === 'Verified' && (log.targetBelt || log.beltLevel) === targetBelt)
    .forEach((log) => {
      const key = getRequirementKey(log.classCode, log.techniqueName);
      const minutes = Number(log.minutes ?? Math.round(Number(log.hours || 0) * 60));
      completedByRequirement.set(key, (completedByRequirement.get(key) || 0) + minutes);
    });

  const rows = requirements.map((requirement) => {
    const completedMinutes = completedByRequirement.get(getRequirementKey(requirement.code, requirement.name)) || 0;
    return {
      completedMinutes: Math.min(completedMinutes, requirement.requiredMinutes),
      isComplete: completedMinutes >= requirement.requiredMinutes,
      requiredMinutes: requirement.requiredMinutes
    };
  });
  const requiredMinutes = rows.reduce((total, row) => total + row.requiredMinutes, 0);
  const completedMinutes = rows.reduce((total, row) => total + row.completedMinutes, 0);

  return {
    percent: requiredMinutes ? Math.round((completedMinutes / requiredMinutes) * 100) : 0,
    completedCount: rows.filter((row) => row.isComplete).length,
    totalCount: rows.length
  };
}

function getRequirementKey(code, name) {
  return `${code || ''}::${name || ''}`.toLowerCase();
}

function formatHoursAsTime(hours) {
  return formatMinutes(Math.round(Number(hours || 0) * 60));
}
