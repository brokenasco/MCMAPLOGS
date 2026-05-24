import React from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Eye, Lock, Medal, PlusCircle, RotateCcw, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';
import LogDetailPanel from '../components/LogDetailPanel.jsx';
import PageShell from '../components/PageShell.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { RoleBadge } from '../components/Header.jsx';
import { useApp } from '../context/AppContext.jsx';
import { formatMinutes } from '../data/mcmapReference.js';
import { buildBeltProgress, buildTotalMcmapHours, getBeltTrail, sumLogMinutes } from '../lib/mcmapProgress.js';

export default function BeltDashboard() {
  const { beltUser, beltLogs, resubmitLog, savedDraft } = useApp();
  const [selectedLog, setSelectedLog] = React.useState(null);
  const [editingLog, setEditingLog] = React.useState(null);
  const [correctionText, setCorrectionText] = React.useState('');
  const progress = React.useMemo(() => buildBeltProgress({ beltUser, logs: beltLogs }), [beltLogs, beltUser]);
  const mcmapHourSummary = React.useMemo(() => buildTotalMcmapHours({ beltUser, logs: beltLogs }), [beltLogs, beltUser]);
  const beltTrail = React.useMemo(() => getBeltTrail(beltUser.beltLevel, progress.percent), [beltUser.beltLevel, progress.percent]);
  const totalSubmittedMinutes = sumLogMinutes(beltLogs);
  const verifiedCurrentBeltMinutes = mcmapHourSummary.targetBeltVerifiedMinutes;
  const pendingLogs = beltLogs.filter((log) => log.status === 'Pending');
  const returnedLogs = beltLogs.filter((log) => isReturnedOrRejected(log.status));
  const recentLogs = beltLogs.slice(0, 6);
  const nextRequirement = progress.rows.find((row) => !row.isComplete);
  const hasNoLogs = beltLogs.length === 0;

  return (
    <PageShell
      eyebrow="Belt User"
      title={`Welcome, ${beltUser.name}`}
      description="Track what matters next: current belt progress, action items, and your MCMAP record."
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

      <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-clay">
                <Target size={17} aria-hidden="true" />
                What&apos;s Next?
              </p>
              <h2 className="mt-2 text-2xl font-bold text-ink">{getNextHeadline({ returnedLogs, savedDraft, nextRequirement, progress })}</h2>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                {pendingLogs.length} logs pending MAI review. {returnedLogs.length} returned or rejected logs need correction.
              </p>
            </div>
            <Link
              to={returnedLogs.length ? '#returned-logs' : '/belt/submit'}
              className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-olive px-4 text-sm font-bold text-white hover:bg-olive/90"
            >
              <ArrowRight size={17} aria-hidden="true" />
              Continue Progress
            </Link>
          </div>
        </div>

        <ActionStats pendingCount={pendingLogs.length} returnedCount={returnedLogs.length} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <GroupedStat
          title="Progress Stats"
          items={[
            ['Verified Hours', formatMinutes(verifiedCurrentBeltMinutes), `For ${progress.targetBelt}`],
            ['Hours Remaining', formatMinutes(progress.requiredMinutes - progress.completedMinutes), 'Until target belt is complete'],
            ['Belt Completion', `${progress.percent}%`, `${progress.completedCount}/${progress.totalCount} requirements complete`]
          ]}
        />
        <GroupedStat
          title="Career Stats"
          items={[
            ['Total MCMAP Hours', formatMinutes(mcmapHourSummary.totalMinutes), 'Completed belts plus current verified time'],
            ['Completed Belts', mcmapHourSummary.completedBelts.length, mcmapHourSummary.completedBelts.join(', ') || 'None yet'],
            ['Lifetime Verified Logs', beltLogs.filter((log) => log.status === 'Verified').length, 'Approved records']
          ]}
        />
        <GroupedStat
          title="Action Stats"
          items={[
            ['Logs Pending Verification', pendingLogs.length, `${formatMinutes(sumLogMinutes(pendingLogs))} waiting on MAI review`],
            ['Returned Logs', returnedLogs.length, returnedLogs.length ? 'Action required' : 'No corrections needed'],
            ['Total Submitted', formatMinutes(totalSubmittedMinutes), 'All submitted account logs']
          ]}
          urgent={returnedLogs.length > 0}
        />
      </section>

      {returnedLogs.length ? (
        <section id="returned-logs" className="mt-8 rounded-md border border-clay/30 bg-clay/10 p-5">
          <h2 className="text-xl font-bold text-ink">Returned or rejected logs need correction</h2>
          <p className="mt-1 text-sm text-ink/65">These do not count toward verified hours until corrected and approved.</p>
          <div className="mt-4 grid gap-3">
            {returnedLogs.map((log) => (
              <ReturnedLogCard
                key={log.id}
                log={log}
                onCorrect={() => {
                  setEditingLog(log);
                  setCorrectionText(log.description);
                }}
              />
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

      <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_380px]">
        <div>
          <h2 className="mb-3 text-xl font-bold">My Recent Logs</h2>
          {recentLogs.length ? (
            <RecentLogs logs={recentLogs} onSelectLog={setSelectedLog} onCorrectLog={(log) => {
              setEditingLog(log);
              setCorrectionText(log.description);
            }} />
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

function ActionStats({ pendingCount, returnedCount }) {
  return (
    <div className={`rounded-md border p-5 shadow-sm ${returnedCount ? 'border-clay/40 bg-clay/10' : 'border-coyote/35 bg-paper'}`}>
      <p className="text-sm font-bold uppercase tracking-wide text-clay">Action Required</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <DashboardMetric label="Pending" value={pendingCount} />
        <DashboardMetric label="Returned" value={returnedCount} urgent={returnedCount > 0} />
      </div>
      {returnedCount ? (
        <a href="#returned-logs" className="focus-ring mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-clay px-4 text-sm font-bold text-white">
          <AlertTriangle size={17} aria-hidden="true" />
          Fix returned logs
        </a>
      ) : (
        <p className="mt-4 text-sm leading-6 text-ink/65">No returned logs need correction right now.</p>
      )}
    </div>
  );
}

function GroupedStat({ title, items, urgent = false }) {
  return (
    <section className={`rounded-md border p-5 shadow-sm ${urgent ? 'border-clay/35 bg-clay/10' : 'border-coyote/35 bg-paper'}`}>
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <div className="mt-4 grid gap-4">
        {items.map(([label, value, detail]) => (
          <DashboardMetric key={label} label={label} value={value} detail={detail} urgent={urgent && label === 'Returned Logs'} />
        ))}
      </div>
    </section>
  );
}

function DashboardMetric({ label, value, detail, urgent = false }) {
  return (
    <div>
      <p className={`text-xs font-bold uppercase tracking-wide ${urgent ? 'text-clay' : 'text-ink/50'}`}>{label}</p>
      <p className={`mt-1 text-2xl font-black ${urgent ? 'text-clay' : 'text-ink'}`}>{value}</p>
      {detail ? <p className="mt-1 text-sm leading-5 text-ink/60">{detail}</p> : null}
    </div>
  );
}

function RecentLogs({ logs, onSelectLog, onCorrectLog }) {
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
                  <button
                    type="button"
                    onClick={() => isReturnedOrRejected(log.status) ? onCorrectLog(log) : onSelectLog(log)}
                    className={`focus-ring inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-bold ${
                      isReturnedOrRejected(log.status) ? 'bg-clay text-white' : 'border border-ink/15 bg-field text-ink'
                    }`}
                  >
                    {isReturnedOrRejected(log.status) ? <RotateCcw size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                    {isReturnedOrRejected(log.status) ? 'Fix' : 'View'}
                  </button>
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
            <button
              type="button"
              onClick={() => isReturnedOrRejected(log.status) ? onCorrectLog(log) : onSelectLog(log)}
              className={`focus-ring mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md px-3 text-sm font-bold ${
                isReturnedOrRejected(log.status) ? 'bg-clay text-white' : 'border border-ink/15 bg-paper text-ink'
              }`}
            >
              {isReturnedOrRejected(log.status) ? <RotateCcw size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              {isReturnedOrRejected(log.status) ? 'Fix' : 'View'}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

function ReturnedLogCard({ log, onCorrect }) {
  return (
    <article className="rounded-md bg-paper p-4 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="font-bold">{formatDate(log.date)} | {formatMinutesFromLog(log)}</p>
          <p className="mt-1 text-sm font-semibold text-clay">{log.returnReason || log.status}</p>
          <p className="mt-1 text-sm leading-6 text-ink/65">{log.returnMessage}</p>
        </div>
        <button
          type="button"
          onClick={onCorrect}
          className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md bg-clay px-4 text-sm font-bold text-white"
        >
          <RotateCcw size={17} aria-hidden="true" />
          Fix
        </button>
      </div>
    </article>
  );
}

function RecentHeader({ children }) {
  return <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-paper/70">{children}</th>;
}

function RecentCell({ children, className = '' }) {
  return <td className={`px-4 py-4 text-sm text-ink/75 ${className}`}>{children}</td>;
}

function getNextHeadline({ returnedLogs, savedDraft, nextRequirement, progress }) {
  if (returnedLogs.length) return `${returnedLogs.length} log${returnedLogs.length === 1 ? '' : 's'} need correction`;
  if (savedDraft) return 'Finish your saved training draft';
  if (nextRequirement) return `Complete ${nextRequirement.name} (${formatMinutes(nextRequirement.remainingMinutes)} left)`;
  return `${progress.targetBelt} requirements complete`;
}

function shortTechnique(log) {
  return log.techniqueName?.split('/')[0].trim() || log.description?.split(':').pop()?.trim() || 'Training log';
}

function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString();
}

function formatMinutesFromLog(log) {
  return formatMinutes(Number(log.minutes ?? Math.round(Number(log.hours || 0) * 60)));
}

function isReturnedOrRejected(status) {
  return status === 'Returned' || status === 'Rejected';
}
