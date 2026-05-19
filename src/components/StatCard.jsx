import React from 'react';

export default function StatCard({ label, value, detail }) {
  return (
    <div className="rounded-md border border-ink/10 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-ink/60">{label}</p>
      <p className="mt-2 text-3xl font-bold text-ink">{value}</p>
      {detail ? <p className="mt-2 text-sm text-ink/60">{detail}</p> : null}
    </div>
  );
}
