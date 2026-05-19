import React from 'react';
import { PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';
import LogDetailPanel from '../components/LogDetailPanel.jsx';
import LogTable from '../components/LogTable.jsx';
import PageShell from '../components/PageShell.jsx';
import StatCard from '../components/StatCard.jsx';
import { RoleBadge } from '../components/Header.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function BeltDashboard() {
  const { beltUser, beltLogs, setActiveRole } = useApp();
  const [selectedLog, setSelectedLog] = React.useState(null);
  const totalHours = beltLogs.reduce((total, log) => total + Number(log.hours), 0);
  const verifiedHours = beltLogs
    .filter((log) => log.status === 'Verified')
    .reduce((total, log) => total + Number(log.hours), 0);
  const pendingHours = beltLogs
    .filter((log) => log.status === 'Pending')
    .reduce((total, log) => total + Number(log.hours), 0);

  React.useEffect(() => {
    setActiveRole('Belt User');
  }, [setActiveRole]);

  return (
    <PageShell
      eyebrow="Belt User"
      title={`Welcome, ${beltUser.name}`}
      description="Track your submitted MCMAP hours, pending verification, and verified logbook progress."
      actions={<RoleBadge role="Belt User" />}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total hours submitted" value={totalHours || beltUser.totalHours} detail={beltUser.beltLevel} />
        <StatCard label="Verified hours" value={verifiedHours || beltUser.verifiedHours} detail="Approved by an MAI" />
        <StatCard label="Pending hours" value={pendingHours || beltUser.pendingHours} detail="Waiting for verification" />
      </div>

      <div className="mt-8 rounded-md border border-ink/10 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold">Next goal</h2>
            <p className="mt-1 text-sm text-ink/65">{beltUser.nextGoal}</p>
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
