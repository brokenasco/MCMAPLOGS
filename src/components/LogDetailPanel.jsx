import React from 'react';
import { X } from 'lucide-react';
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

export default function LogDetailPanel({ log, onClose }) {
  if (!log) {
    return null;
  }

  return (
    <aside className="rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
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
        <Detail label="Hours" value={formatLogTime(log)} />
        <Detail label="Applied to requirement" value={formatAppliedTime(log)} />
        <Detail label="Extra verified hours" value={formatExtraTime(log)} />
        <Detail label="Class code" value={log.classCode || 'General'} />
        <Detail label="Target belt" value={log.targetBelt || log.beltLevel} />
        <Detail
          label="Belt level"
          value={
            <span className={`inline-flex rounded-sm px-2.5 py-1 text-xs font-black uppercase tracking-wide ${beltStyles[log.beltLevel] || 'bg-field text-ink'}`}>
              {log.beltLevel}
            </span>
          }
        />
        <Detail label="Submitted" value={log.submittedAt || 'Saved record'} />
        <Detail label="Resubmitted" value={log.resubmittedAt ? new Date(log.resubmittedAt).toLocaleDateString() : 'Not resubmitted'} />
        <Detail label="Signed by" value={formatVerifier(log)} />
      </dl>

      <div className="mt-5 rounded-md bg-field p-4">
        <p className="text-sm font-bold text-ink">Technique / Tie-In</p>
        <p className="mt-2 text-sm leading-6 text-ink/70">{log.techniqueName || log.description}</p>
        {log.description && log.description !== log.techniqueName ? (
          <p className="mt-3 text-sm leading-6 text-ink/60">{log.description}</p>
        ) : null}
      </div>

      {log.status === 'Returned' ? (
        <div className="mt-4 rounded-md border border-clay/20 bg-clay/10 p-4">
          <p className="text-sm font-bold text-clay">{log.returnReason || 'Returned for correction'}</p>
          <p className="mt-2 text-sm leading-6 text-ink/70">
            {log.returnMessage || 'Review the returned log, correct the details, and resubmit it.'}
          </p>
        </div>
      ) : null}
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

function formatVerifier(log) {
  if (log.source === 'Account Creation' || log.source === 'Account Creation Backfill' || log.verificationSource === 'Account Creation') {
    return 'Upon Account Creation';
  }

  const maiNumber = log.verifiedByMaiNumber || log.maiNumber || '';
  const maiName = log.verifiedBy || log.assignedMaiName || '';
  const signedBy = `${maiNumber} ${maiName}`.trim();

  return signedBy || 'Not signed yet';
}

function formatLogTime(log) {
  return formatMinutes(Number(log.minutes ?? Math.round(Number(log.hours || 0) * 60)));
}

function formatAppliedTime(log) {
  return formatMinutes(Number(log.appliedMinutes ?? log.minutes ?? Math.round(Number(log.hours || 0) * 60)));
}

function formatExtraTime(log) {
  return formatMinutes(Number(log.extraMinutes || 0));
}
