import React from 'react';
import StatusBadge from './StatusBadge.jsx';

const beltStyles = {
  'Tan Belt': 'bg-[#c2a878] text-ink',
  'Gray Belt': 'bg-[#7a7d7d] text-white',
  'Green Belt': 'bg-[#3f5f3b] text-white',
  'Brown Belt': 'bg-[#6b4226] text-white',
  'Black Belt': 'bg-[#111111] text-white',
  'Black 1st Degree': 'bg-[#111111] text-white'
};

export default function LogTable({ logs, showMarine = true, onSelectLog }) {
  return (
    <div className="overflow-hidden rounded-md border border-coyote/35 bg-paper shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-coyote/25">
          <thead className="bg-charcoal text-paper">
            <tr>
              {showMarine ? <HeaderCell>Marine</HeaderCell> : null}
              <HeaderCell>Date</HeaderCell>
              <HeaderCell>Class</HeaderCell>
              <HeaderCell>Hours</HeaderCell>
              <HeaderCell>Belt</HeaderCell>
              <HeaderCell>MAI Number</HeaderCell>
              <HeaderCell>Status</HeaderCell>
            </tr>
          </thead>
          <tbody className="divide-y divide-coyote/20">
            {logs.map((log) => (
              <tr
                key={log.id}
                className={`align-top ${onSelectLog ? 'cursor-pointer hover:bg-field/70' : ''}`}
                onClick={() => onSelectLog?.(log)}
              >
                {showMarine ? <BodyCell className="font-semibold text-ink">{log.marine}</BodyCell> : null}
                <BodyCell>{new Date(`${log.date}T12:00:00`).toLocaleDateString()}</BodyCell>
                <BodyCell>
                  <span className="font-semibold text-ink">{log.classCode || 'General'}</span>
                  {log.techniqueName ? <span className="mt-1 block max-w-72 text-xs leading-5 text-ink/55">{log.techniqueName}</span> : null}
                </BodyCell>
                <BodyCell>{log.hours}</BodyCell>
                <BodyCell>
                  <span className={`inline-flex rounded-sm px-2.5 py-1 text-xs font-black uppercase tracking-wide ${beltStyles[log.beltLevel] || 'bg-field text-ink'}`}>
                    {log.beltLevel}
                  </span>
                </BodyCell>
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
  return <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-paper/70">{children}</th>;
}

function BodyCell({ children, className = '' }) {
  return <td className={`px-4 py-4 text-sm text-ink/75 ${className}`}>{children}</td>;
}
