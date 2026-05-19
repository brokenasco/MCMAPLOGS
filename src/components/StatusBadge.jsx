import React from 'react';

const styles = {
  Pending: 'bg-brass/20 text-ink ring-brass/30',
  Verified: 'bg-olive/15 text-olive ring-olive/25',
  Returned: 'bg-clay/15 text-clay ring-clay/25'
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold ring-1 ${styles[status] || styles.Pending}`}>
      {status}
    </span>
  );
}
