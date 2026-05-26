import React from 'react';

const styles = {
  Pending: 'bg-brass/20 text-ink ring-brass/50',
  Verified: 'bg-olive/20 text-olive ring-olive/40',
  Returned: 'bg-clay/15 text-clay ring-clay/40'
};

const labels = {
  Returned: 'Needs Correction'
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-sm px-2.5 py-1 text-xs font-black uppercase tracking-wide ring-1 ${styles[status] || styles.Pending}`}>
      {labels[status] || status}
    </span>
  );
}
