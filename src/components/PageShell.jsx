import React from 'react';

export default function PageShell({ eyebrow, title, description, actions, children }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="mb-6 flex flex-col justify-between gap-4 lg:mb-8 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          {eyebrow ? <p className="mb-2 text-sm font-black uppercase tracking-wide text-clay">{eyebrow}</p> : null}
          <h1 className="text-2xl font-bold tracking-normal text-ink sm:text-4xl">{title}</h1>
          {description ? <p className="mt-3 text-base leading-7 text-ink/70">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3 sm:justify-end">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
