import React from 'react';
import StatusBadge from './StatusBadge.jsx';
import { formatMinutes } from '../data/mcmapReference.js';

const beltStyles = {
  'Tan Belt': 'bg-[#c2a878] text-ink',
  'Gray Belt': 'bg-[#7a7d7d] text-white',
  'Green Belt': 'bg-[#3f5f3b] text-white',
  'Brown Belt': 'bg-[#6b4226] text-white',
  'Black Belt': 'bg-[#111111] text-white',
  'Black 1st Degree': 'bg-[#111111] text-white'
};

export default function LogTable({ logs, showMarine = true, onSelectLog, renderActions }) {
  return (
    <div className="overflow-hidden rounded-md border border-coyote/35 bg-paper shadow-sm">
      <div className="hidden md:block">
        <table className="min-w-full divide-y divide-coyote/25">
          <thead className="bg-charcoal text-paper">
            <tr>
              {showMarine ? <HeaderCell>Marine</HeaderCell> : null}
              <HeaderCell>Date</HeaderCell>
              <HeaderCell>Class</HeaderCell>
              <HeaderCell>Hours</HeaderCell>
              <HeaderCell>Belt</HeaderCell>
              <HeaderCell>Sent To MAI</HeaderCell>
              <HeaderCell>Status</HeaderCell>
              {renderActions ? <HeaderCell>Action</HeaderCell> : null}
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
                <BodyCell>{formatLogTime(log)}</BodyCell>
                <BodyCell>
                  <span className={`inline-flex rounded-sm px-2.5 py-1 text-xs font-black uppercase tracking-wide ${beltStyles[log.beltLevel] || 'bg-field text-ink'}`}>
                    {log.beltLevel}
                  </span>
                </BodyCell>
                <BodyCell>{formatMaiDisplay(log)}</BodyCell>
                <BodyCell>
                  <StatusBadge status={log.status} />
                </BodyCell>
                {renderActions ? (
                  <BodyCell>
                    <div onClick={(event) => event.stopPropagation()}>
                      {renderActions(log)}
                    </div>
                  </BodyCell>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 p-3 md:hidden">
        {logs.map((log) => (
          <article
            key={log.id}
            className={`rounded-md border border-coyote/25 bg-field p-4 ${onSelectLog ? 'cursor-pointer' : ''}`}
            onClick={() => onSelectLog?.(log)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {showMarine ? <p className="text-sm font-black text-ink">{log.marine}</p> : null}
                <p className="mt-1 text-sm font-semibold text-ink">{log.classCode || 'General'}</p>
                {log.techniqueName ? <p className="mt-1 text-xs leading-5 text-ink/60">{log.techniqueName}</p> : null}
              </div>
              <StatusBadge status={log.status} />
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              <MobileDetail label="Date" value={new Date(`${log.date}T12:00:00`).toLocaleDateString()} />
              <MobileDetail label="Time" value={formatLogTime(log)} />
              <MobileDetail label="Belt" value={log.beltLevel} />
              <MobileDetail label="Sent To MAI" value={formatMaiDisplay(log)} />
            </dl>
            {renderActions ? (
              <div className="mt-4" onClick={(event) => event.stopPropagation()}>
                {renderActions(log)}
              </div>
            ) : null}
          </article>
        ))}
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

function MobileDetail({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-ink/45">{label}</dt>
      <dd className="mt-1 font-semibold text-ink">{value}</dd>
    </div>
  );
}

function formatMaiDisplay(log) {
  return `${log.maiNumber || ''} ${log.assignedMaiName || ''}`.trim() || 'Not assigned';
}

function formatLogTime(log) {
  return formatMinutes(Number(log.minutes ?? Math.round(Number(log.hours || 0) * 60)));
}
