import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ title, text, action }) {
  return (
    <div className="rounded-md border border-dashed border-ink/20 bg-white p-8 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-md bg-field text-olive">
        <Inbox size={24} aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-xl font-bold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink/65">{text}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
