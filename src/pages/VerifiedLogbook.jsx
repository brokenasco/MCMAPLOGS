import React from 'react';
import EmptyState from '../components/EmptyState.jsx';
import LogDetailPanel from '../components/LogDetailPanel.jsx';
import LogTable from '../components/LogTable.jsx';
import PageShell from '../components/PageShell.jsx';
import StatCard from '../components/StatCard.jsx';
import { useApp } from '../context/AppContext.jsx';

const filters = ['All', 'Pending', 'Verified', 'Returned'];

export default function VerifiedLogbook() {
  const { logs } = useApp();
  const [activeFilter, setActiveFilter] = React.useState('Verified');
  const [selectedLog, setSelectedLog] = React.useState(null);
  const filteredLogs = activeFilter === 'All' ? logs : logs.filter((log) => log.status === activeFilter);
  const verifiedLogs = logs.filter((log) => log.status === 'Verified');
  const verifiedHours = verifiedLogs.reduce((total, log) => total + Number(log.hours), 0);

  return (
    <PageShell
      eyebrow="Records"
      title="Logbook"
      description="Review submitted, pending, returned, and MAI-verified MCMAP training records."
    >
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <StatCard label="Verified entries" value={verifiedLogs.length} detail="Signed records" />
        <StatCard label="Verified hours" value={verifiedHours} detail="Total approved hours" />
        <StatCard label="All records" value={logs.length} detail="Across every status" />
      </div>

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
              activeFilter === filter ? 'bg-olive text-white' : 'border border-ink/15 bg-white text-ink hover:bg-field'
            }`}
          >
            {filter}
          </button>
        ))}
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
