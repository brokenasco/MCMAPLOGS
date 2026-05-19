import React from 'react';
import { X } from 'lucide-react';
import StatusBadge from './StatusBadge.jsx';

export default function LogDetailPanel({ log, onClose }) {
  if (!log) {
    return null;
  }

  return (
    <aside className="rounded-md border border-ink/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-clay">Log details</p>
          <h2 className="mt-1 text-2xl font-bold text-ink">{log.marine}</h2>
          <p className="mt-1 text-sm text-ink/60">{new Date(`${log.date}T12:00:00`).toLocaleDateString()}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="focus-ring grid h-9 w-9 place-items-center rounded-md border border-ink/15 text-ink/70 hover:bg-field"
        >
          <X size={17} aria-hidden="true" />
          <span className="sr-only">Close details</span>
        </button>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <Detail label="Status" value={<StatusBadge status={log.status} />} />
        <Detail label="Hours" value={log.hours} />
        <Detail label="Belt level" value={log.beltLevel} />
        <Detail label="MAI number" value={log.maiNumber} />
        <Detail label="Submitted" value={log.submittedAt || 'Mock record'} />
        <Detail label="Signed by" value={log.verifiedBy ? `${log.verifiedBy} | ${log.verifiedByMaiNumber}` : 'Not signed yet'} />
      </dl>

      <div className="mt-5 rounded-md bg-field p-4">
        <p className="text-sm font-bold text-ink">Training description</p>
        <p className="mt-2 text-sm leading-6 text-ink/70">{log.description}</p>
      </div>
    </aside>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-ink/50">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}
