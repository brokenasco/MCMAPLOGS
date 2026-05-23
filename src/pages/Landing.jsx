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
      <section className="border-b border-coyote/30 bg-[linear-gradient(135deg,#171a16_0%,#2f3a24_52%,#4f5d3a_100%)] text-paper">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-bold uppercase tracking-wide text-brass">Field-ready logbook</p>
            <h1 className="mt-3 text-4xl font-bold tracking-normal text-paper sm:text-5xl">
              MCMAP Logbook
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-paper/75">
              Built for the warrior. Designed for the instructor.
              MCMAP hour tracking made simple. Belt users log and protect their hard-earned training hours,
              while MAIs verify, sign, and manage records with professional accountability. A digital platform
              that keeps training documented, organized, and mission-ready.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/belt/submit"
                className="focus-ring inline-flex h-11 items-center gap-2 rounded-md bg-brass px-5 text-sm font-bold text-ink shadow-sm hover:bg-brass/90"
              >
                I need to submit training hours
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link
                to="/logbook/verified"
                className="focus-ring inline-flex h-11 items-center rounded-md border border-paper/20 bg-paper/10 px-5 text-sm font-bold text-paper shadow-sm hover:bg-paper/15"
              >
                I&apos;m an MAI verifying logs
              </Link>
            </div>
          </div>

          <div className="rounded-md border border-coyote/30 bg-paper/10 p-5 shadow-panel backdrop-blur">
            <div className="rounded-md bg-charcoal p-4 text-paper">
              <div className="flex items-center justify-between border-b border-paper/10 pb-3">
                <span className="text-sm font-semibold text-paper/70">Today&apos;s queue</span>
                <span className="rounded-md bg-brass px-2 py-1 text-xs font-bold text-ink">4 pending</span>
              </div>
              <div className="space-y-3 pt-4">
                {['Green Belt sustainment', 'Tan Belt fundamentals', 'Gray Belt chokes'].map((item, index) => (
                  <div key={item} className="rounded-md border border-paper/10 bg-paper/10 p-3">
                    <p className="font-semibold">{item}</p>
                    <p className="mt-1 text-sm text-paper/60">{index + 1.5} hours awaiting MAI verification</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-coyote/30 bg-brass/15">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-clay">Simple pricing</p>
            <h2 className="mt-1 text-2xl font-bold text-ink">Belt Users are free. MAIs get 3 months free.</h2>
            <p className="mt-1 text-sm leading-6 text-ink/70">
              After the MAI trial, annual billing is $84.99/year for log review and verification tools.
            </p>
          </div>
          <Link
            to="/signup"
            className="focus-ring inline-flex h-11 items-center justify-center rounded-md bg-olive px-5 text-sm font-bold text-white"
          >
            Create an account
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <article key={feature.title} className="rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
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
        <div className="rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
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
