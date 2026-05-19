import React from 'react';
import { ArrowRight, ClipboardCheck, Dumbbell, ShieldCheck, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: Dumbbell,
    title: 'Track training hours',
    text: 'Belt Users can record date, hours, belt level, training notes, and the MAI number tied to the session.'
  },
  {
    icon: ClipboardCheck,
    title: 'Review pending logs',
    text: 'MAIs get a clear queue of submitted hours that are waiting for verification.'
  },
  {
    icon: ShieldCheck,
    title: 'Keep a verified record',
    text: 'Verified entries are separated from pending work so Marines can see what counts toward progress.'
  }
];

export default function Landing() {
  return (
    <>
      <section className="border-b border-ink/10 bg-[linear-gradient(135deg,#f5f2ea_0%,#ffffff_48%,#dfe7d6_100%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-bold uppercase tracking-wide text-clay">Beginner-friendly mock app</p>
            <h1 className="mt-3 text-4xl font-bold tracking-normal text-ink sm:text-5xl">
              MCMAP Logbook
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/70">
              A simple front end for Marines to submit MCMAP hours and for MAIs to verify training logs.
              It is built with React, Vite, Tailwind CSS, and a Supabase-ready client.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/belt/submit"
                className="focus-ring inline-flex h-11 items-center gap-2 rounded-md bg-olive px-5 text-sm font-bold text-white shadow-sm hover:bg-olive/90"
              >
                I need to submit training hours
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link
                to="/mai/pending"
                className="focus-ring inline-flex h-11 items-center rounded-md border border-ink/15 bg-white px-5 text-sm font-bold text-ink shadow-sm hover:border-olive/40"
              >
                I&apos;m an MAI verifying logs
              </Link>
            </div>
          </div>

          <div className="rounded-md border border-ink/10 bg-white p-5 shadow-panel">
            <div className="rounded-md bg-ink p-4 text-white">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-sm font-semibold text-white/70">Today&apos;s queue</span>
                <span className="rounded-md bg-brass px-2 py-1 text-xs font-bold text-ink">4 pending</span>
              </div>
              <div className="space-y-3 pt-4">
                {['Green Belt sustainment', 'Tan Belt fundamentals', 'Gray Belt chokes'].map((item, index) => (
                  <div key={item} className="rounded-md bg-white/10 p-3">
                    <p className="font-semibold">{item}</p>
                    <p className="mt-1 text-sm text-white/60">{index + 1.5} hours awaiting MAI verification</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <article key={feature.title} className="rounded-md border border-ink/10 bg-white p-5 shadow-sm">
              <span className="grid h-11 w-11 place-items-center rounded-md bg-olive/12 text-olive">
                <Icon size={22} aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-lg font-bold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-ink/65">{feature.text}</p>
            </article>
          );
        })}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-md border border-ink/10 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-clay">Not sure what to do?</p>
              <h2 className="mt-1 text-2xl font-bold">Start with the job in front of you.</h2>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                Belt Users submit hours. MAIs sign or return logs. The app keeps the record organized.
              </p>
            </div>
            <Link
              to="/help"
              className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-field px-4 text-sm font-bold text-ink"
            >
              <UserCheck size={17} aria-hidden="true" />
              Open help page
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
