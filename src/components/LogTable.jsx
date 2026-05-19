import React from 'react';
import StatusBadge from './StatusBadge.jsx';

export default function LogTable({ logs, showMarine = true, onSelectLog }) {
  return (
    <div className="overflow-hidden rounded-md border border-ink/10 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-ink/10">
          <thead className="bg-ink/[0.03]">
            <tr>
              {showMarine ? <HeaderCell>Marine</HeaderCell> : null}
              <HeaderCell>Date</HeaderCell>
              <HeaderCell>Hours</HeaderCell>
              <HeaderCell>Belt</HeaderCell>
              <HeaderCell>MAI Number</HeaderCell>
              <HeaderCell>Status</HeaderCell>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {logs.map((log) => (
              <tr
                key={log.id}
                className={`align-top ${onSelectLog ? 'cursor-pointer hover:bg-field/70' : ''}`}
                onClick={() => onSelectLog?.(log)}
              >
                {showMarine ? <BodyCell className="font-semibold text-ink">{log.marine}</BodyCell> : null}
                <BodyCell>{new Date(`${log.date}T12:00:00`).toLocaleDateString()}</BodyCell>
                <BodyCell>{log.hours}</BodyCell>
                <BodyCell>{log.beltLevel}</BodyCell>
                <BodyCell>{log.maiNumber}</BodyCell>
                <BodyCell>
                  <StatusBadge status={log.status} />
                </BodyCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HeaderCell({ children }) {
  return <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink/60">{children}</th>;
}

function BodyCell({ children, className = '' }) {
  return <td className={`px-4 py-4 text-sm text-ink/75 ${className}`}>{children}</td>;
}
