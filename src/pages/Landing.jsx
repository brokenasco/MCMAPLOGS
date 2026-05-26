import React from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatMinutes } from '../data/mcmapReference.js';

const userPaths = [
  {
    title: "I'm a Belt User",
    badge: 'Free account',
    text: 'Log training hours, track belt progress, submit hours to an MAI, and protect your records.',
    cta: 'Create Free Belt User Account',
    to: '/signup',
    points: [
      'Free account',
      'Log MCMAP training hours',
      'Track belt progress',
      'Submit hours to an MAI for verification',
      'Protect and preserve training records'
    ]
  },
  {
    title: "I'm an MAI",
    badge: '60-day free trial',
    text: 'Verify records quickly, manage submissions in one queue, and export official documentation.',
    cta: 'Create MAI Account',
    to: '/signup',
    points: [
      'Verify training hours quickly',
      'See pending submissions in one place',
      'Manage Marines and student logs',
      'Export verified records',
      'Reduce paperwork and administrative burden',
      'Help log hours for JEPES/FITREP'
    ]
  }
];

const workflowSteps = [
  { icon: FileText, title: 'Log Hours', text: 'A Marine submits date, time, class code, and MAI verifier.' },
  { icon: UserCheck, title: 'MAI Verifies', text: 'The assigned MAI verifies or returns the log for correction.' },
  { icon: BadgeCheck, title: 'Record Becomes Verified', text: 'Approved hours become official verified records.' },
  { icon: Download, title: 'Export for Advancement', text: 'Export clean documentation for belt advancement records.' }
];

const valueDrivers = [
  'Save time',
  'Protect training records',
  'Reduce paperwork',
  'Keep verified records organized',
  'Make belt advancement documentation easier'
];

export default function Landing() {
  return (
    <>
      <section className="border-b border-coyote/30 bg-charcoal text-paper">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <p className="text-sm font-black uppercase tracking-wide text-brass">MCMAP Logbook</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-normal text-paper sm:text-5xl">
            Digitally log, verify, and export MCMAP training hours.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-paper/75">
            Less paperwork. Faster verification. Protected records for MAIs and Belt users.
          </p>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {userPaths.map((path) => (
              <PathCard key={path.title} path={path} />
            ))}
          </div>
          <div className="mt-5 inline-flex items-center gap-2 rounded-md border border-paper/15 bg-paper/10 px-3 py-2 text-sm font-bold text-paper/75">
            <ShieldCheck size={16} aria-hidden="true" />
            Built by Marines. Active Duty Owned & Operated.
          </div>
        </div>
      </section>

      <section className="border-b border-coyote/30 bg-brass/15">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-clay">Simple pricing</p>
            <h2 className="mt-1 text-2xl font-bold text-ink">Belt Users are free. MAIs get 60 days free.</h2>
            <p className="mt-1 text-sm leading-6 text-ink/70">
              MAI access is $69.99/year after the trial for verification tools, exportable records, and reduced admin work. That is only $5.83 a month!
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

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-5">
          <p className="text-sm font-black uppercase tracking-wide text-clay">Workflow</p>
          <h2 className="mt-1 text-3xl font-bold text-ink">How MCMAP hours become verified records</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/65">
            Marines log hours, MAIs verify them, and the record stays organized for advancement documentation.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          {workflowSteps.map((step, index) => (
            <WorkflowCard key={step.title} step={step} showArrow={index < workflowSteps.length - 1} />
          ))}
        </div>
      </section>

      <section className="border-y border-coyote/30 bg-field/70">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
          <DashboardPreview
            title="Belt User Dashboard Preview"
            subtitle="Track progress and protect submitted hours."
            stats={[
              ['Working Toward', 'Green Belt'],
              ['Progress', '62%'],
              ['Pending Logs', '2']
            ]}
            rows={[
              ['Green sustainment', 'Pending'],
              ['Bayonet techniques', 'Verified'],
              ['Chokes', 'Verified']
            ]}
            action="Log My Hours"
          />
          <DashboardPreview
            title="MAI Dashboard Preview"
            subtitle="Clear pending logs and manage verified history."
            stats={[
              ['Pending Verification', '4'],
              ['Quick Actions', 'Verify / Return'],
              ['Logbook', 'Export ready']
            ]}
            rows={[
              ['LCpl Davis', 'Verify'],
              ['Cpl Nguyen', 'Return'],
              ['Sgt Morales', 'Verify']
            ]}
            action="Review Pending Logs"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-clay">Why it matters</p>
            <h2 className="mt-1 text-3xl font-bold text-ink">Stop losing paper records.</h2>
            <p className="mt-3 text-sm leading-6 text-ink/65">
              Track, verify, and export MCMAP hours in one place so training records stay protected, organized, and ready when Marines need documentation.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {valueDrivers.map((driver) => (
              <div key={driver} className="flex items-center gap-3 rounded-md border border-coyote/35 bg-paper p-4 shadow-sm">
                <CheckCircle2 size={19} className="shrink-0 text-olive" aria-hidden="true" />
                <p className="text-sm font-bold text-ink">{driver}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function PathCard({ path }) {
  return (
    <article className="rounded-md border border-paper/15 bg-paper/10 p-5 shadow-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="inline-flex rounded-md bg-brass px-2.5 py-1 text-xs font-black uppercase tracking-wide text-ink">
            {path.badge}
          </span>
          <h2 className="mt-4 text-2xl font-bold text-paper">{path.title}</h2>
          <p className="mt-2 text-sm leading-6 text-paper/70">{path.text}</p>
        </div>
        <ShieldCheck size={30} className="text-brass" aria-hidden="true" />
      </div>
      <ul className="mt-5 grid gap-2">
        {path.points.map((point) => (
          <li key={point} className="flex items-start gap-2 text-sm leading-6 text-paper/75">
            <CheckCircle2 size={16} className="mt-1 shrink-0 text-brass" aria-hidden="true" />
            {point}
          </li>
        ))}
      </ul>
      <Link
        to={path.to}
        className="focus-ring mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-brass px-4 text-sm font-black text-ink hover:bg-brass/90"
      >
        {path.cta}
        <ArrowRight size={17} aria-hidden="true" />
      </Link>
    </article>
  );
}

function WorkflowCard({ step, showArrow }) {
  const Icon = step.icon;

  return (
    <article className="relative rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
      <span className="grid h-11 w-11 place-items-center rounded-md bg-olive/12 text-olive">
        <Icon size={22} aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-lg font-bold text-ink">{step.title}</h3>
      <p className="mt-2 text-sm leading-6 text-ink/65">{step.text}</p>
      {showArrow ? (
        <span className="absolute -right-3 top-1/2 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-coyote/35 bg-brass text-ink lg:grid">
          <ArrowRight size={17} aria-hidden="true" />
        </span>
      ) : null}
    </article>
  );
}

function DashboardPreview({ action, rows, stats, subtitle, title }) {
  return (
    <article className="rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-clay">{title}</p>
          <h2 className="mt-1 text-xl font-bold text-ink">{subtitle}</h2>
        </div>
        <BookOpenCheck size={24} className="text-olive" aria-hidden="true" />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-md border border-coyote/30 bg-field p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-ink/50">{label}</p>
            <p className="mt-1 text-lg font-black text-ink">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-md border border-coyote/30 bg-charcoal p-4 text-paper">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-paper/70">Recent activity</p>
          <span className="rounded-md bg-brass px-2 py-1 text-xs font-black text-ink">{action}</span>
        </div>
        <div className="grid gap-2">
          {rows.map(([name, status], index) => (
            <div key={name} className="flex items-center justify-between rounded-md bg-paper/10 p-3">
              <p className="text-sm font-semibold text-paper">{name}</p>
              <span className={`rounded-sm px-2 py-1 text-xs font-black ${status === 'Verified' || status === 'Verify' ? 'bg-olive text-white' : 'bg-brass text-ink'}`}>
                {status}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-paper/15">
          <div className="h-full rounded-full bg-brass" style={{ width: `${title.startsWith('Belt') ? 62 : 78}%` }} />
        </div>
        <p className="mt-2 text-xs text-paper/60">
          {title.startsWith('Belt') ? `${formatMinutes(8 * 60 + 25)} remaining toward current belt.` : 'Pending queue ready for quick MAI action.'}
        </p>
      </div>
    </article>
  );
}
