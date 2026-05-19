import React from 'react';

export default function PageShell({ eyebrow, title, description, actions, children }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          {eyebrow ? <p className="mb-2 text-sm font-bold uppercase tracking-wide text-clay">{eyebrow}</p> : null}
          <h1 className="text-3xl font-bold tracking-normal text-ink sm:text-4xl">{title}</h1>
          {description ? <p className="mt-3 text-base leading-7 text-ink/70">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
