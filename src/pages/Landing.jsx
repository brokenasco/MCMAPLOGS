import React from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Download,
  FileText,
  Layers3,
  RadioTower,
  ShieldCheck,
  Stamp,
  UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatMinutes } from '../data/mcmapReference.js';

const userPaths = [
  {
    title: "I'm a Belt User",
    badge: 'Free account',
    text: 'Log training hours, track belt progress, submit hours to an MAI, and preserve your records.',
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
    badge: '3-week free trial',
    text: 'Verify records quickly, manage submissions in one queue, and export clean documentation.',
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
  { icon: FileText, title: 'Log Hours', text: 'A Marine submits training time, technique, and MAI verifier.' },
  { icon: UserCheck, title: 'MAI Verifies', text: 'The assigned MAI verifies or returns the log for correction.' },
  { icon: BadgeCheck, title: 'Record Becomes Verified', text: 'Approved hours become protected verified records.' },
  { icon: Download, title: 'Export for Advancement', text: 'Export clean documentation for training and belt records.' }
];

const valueDrivers = [
  ['Save time', 'Less chasing paperwork and more time focused on training.'],
  ['Protect records', 'Verified logs stay organized and exportable.'],
  ['Reduce admin friction', 'Pending, returned, and verified records are clearly separated.'],
  ['Improve accountability', 'Every log shows status, verifier, and audit context.']
];

const queueRows = [
  ['LCpl Davis', 'Green sustainment', 'Pending'],
  ['Cpl Nguyen', 'Bayonet techniques', 'Ready'],
  ['Sgt Morales', 'Additional MCMAP Hours', 'Verified']
];

export default function Landing() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-coyote/30 bg-charcoal text-paper">
        <div className="absolute inset-x-0 top-0 h-px bg-brass/60" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <p className="inline-flex w-fit items-center gap-2 rounded-md border border-brass/30 bg-brass/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-brass">
              <RadioTower size={15} aria-hidden="true" />
              Operational MCMAP records
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-normal text-paper sm:text-6xl">
              Digitally log, verify, and export MCMAP training hours.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-paper/75">
              Less paperwork. Faster verification. Protected records for MAIs and Belt users.
            </p>
            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <Link
                to="/signup"
                className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-md bg-brass px-5 text-sm font-black text-ink shadow-sm transition hover:-translate-y-0.5 hover:bg-brass/90"
              >
                Create an account
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link
                to="/login"
                className="focus-ring inline-flex h-12 items-center justify-center rounded-md border border-paper/20 bg-paper/10 px-5 text-sm font-black text-paper transition hover:-translate-y-0.5 hover:bg-paper/15"
              >
                Log in
              </Link>
            </div>
            <div className="mt-5 inline-flex w-fit items-center gap-2 rounded-md border border-paper/15 bg-paper/10 px-3 py-2 text-sm font-bold text-paper/75">
              <ShieldCheck size={16} aria-hidden="true" />
              Built by Marines. Active Duty Owned & Operated.
            </div>
          </div>

          <HeroCommandMockup />
        </div>
      </section>

      <section className="border-b border-coyote/30 bg-field">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8 lg:py-16">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-clay">Choose your path</p>
            <h2 className="mt-2 text-3xl font-black text-ink sm:text-4xl">One workflow, two mission roles.</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-ink/65">
              Belt Users move fast when logging training. MAIs get a clean queue built for verification, recordkeeping, and exports.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {userPaths.map((path) => (
              <PathCard key={path.title} path={path} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-coyote/30 bg-paper">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-wide text-clay">Workflow</p>
            <h2 className="mt-2 text-3xl font-black text-ink sm:text-4xl">From training period to verified record.</h2>
            <p className="mt-3 text-base leading-7 text-ink/65">
              The platform guides Marines through the same operational chain every time: submit, verify, preserve, export.
            </p>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-4">
            {workflowSteps.map((step, index) => (
              <WorkflowCard key={step.title} step={step} showArrow={index < workflowSteps.length - 1} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-coyote/30 bg-charcoal text-paper">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-16">
          <OperationalPanel />
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-brass">Why MCMAP Logs exists</p>
            <h2 className="mt-2 text-3xl font-black text-paper sm:text-4xl">Paper logbooks get lost. Training records should not.</h2>
            <div className="mt-5 space-y-4 text-base leading-7 text-paper/72">
              <p>Training records become difficult to track when paperwork moves across units, courses, instructors, and time.</p>
              <p>MCMAP Logs was built to simplify accountability and preserve training records through a professional digital workflow.</p>
              <p className="font-bold text-paper">Built by Marines. Designed for operational use.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-coyote/30 bg-field">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8 lg:py-16">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-clay">Operational value</p>
            <h2 className="mt-2 text-3xl font-black text-ink sm:text-4xl">Most MAIs should spend more time teaching than managing paperwork.</h2>
            <p className="mt-4 text-base leading-7 text-ink/65">
              MCMAP Logs gives MAIs a verification queue, protected records, exportable history, and fewer administrative handoffs.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {valueDrivers.map(([title, text]) => (
              <ValueCard key={title} title={title} text={text} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brass/15">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-clay">Simple pricing</p>
            <h2 className="mt-1 text-3xl font-black text-ink">Belt Users are free. MAIs get 3 weeks free.</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/70">
              MAI access is only $25 every 3 months after the trial for verification tools, exportable records, and reduced admin work.
            </p>
          </div>
          <Link
            to="/signup"
            className="focus-ring inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-olive px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-olive/90 sm:w-auto"
          >
            Start with 3 weeks free
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}

function HeroCommandMockup() {
  return (
    <div className="rounded-md border border-paper/10 bg-paper/10 p-4 shadow-panel backdrop-blur">
      <div className="rounded-md border border-paper/10 bg-[#10140f] p-5">
        <div className="flex items-center justify-between gap-4 border-b border-paper/10 pb-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-brass">Live command center</p>
            <h2 className="mt-1 text-2xl font-black text-paper">Verification Queue</h2>
          </div>
          <span className="status-pulse rounded-md bg-brass px-3 py-1 text-xs font-black text-ink">4 pending</span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <MetricCard label="Verified Hours" value={formatMinutes(54 * 60 + 57)} icon={Clock3} />
          <MetricCard label="Belt Progress" value="62%" icon={BarChart3} />
          <MetricCard label="Exports Ready" value="PDF / Print" icon={Download} />
        </div>

        <div className="mt-5 rounded-md border border-paper/10 bg-paper/5 p-4">
          <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-paper/55">
            <span>Green Belt Progress</span>
            <span>62% complete</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-paper/15">
            <div className="progress-animate h-full rounded-full bg-brass" style={{ '--progress-width': '62%' }} />
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {['Tan', 'Gray', 'Green', 'Brown', 'Black'].map((belt, index) => (
              <span key={belt} className={`h-2 rounded-full ${index < 2 ? 'bg-olive' : index === 2 ? 'bg-brass' : 'bg-paper/20'}`} />
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {queueRows.map(([name, technique, status]) => (
            <div key={`${name}-${technique}`} className="interactive-row rounded-md border border-paper/10 bg-paper/10 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black text-paper">{name}</p>
                  <p className="mt-1 text-xs text-paper/55">{technique}</p>
                </div>
                <span className={`w-fit rounded-sm px-2 py-1 text-xs font-black ${status === 'Verified' ? 'bg-olive text-white' : 'bg-brass text-ink'}`}>
                  {status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PathCard({ path }) {
  return (
    <article className="interactive-card rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
      <span className="inline-flex rounded-md bg-brass px-2.5 py-1 text-xs font-black uppercase tracking-wide text-ink">
        {path.badge}
      </span>
      <h3 className="mt-4 text-2xl font-black text-ink">{path.title}</h3>
      <p className="mt-2 text-sm leading-6 text-ink/65">{path.text}</p>
      <ul className="mt-5 grid gap-2">
        {path.points.map((point) => (
          <li key={point} className="flex items-start gap-2 text-sm leading-6 text-ink/70">
            <CheckCircle2 size={16} className="mt-1 shrink-0 text-olive" aria-hidden="true" />
            {point}
          </li>
        ))}
      </ul>
      <Link
        to={path.to}
        className="focus-ring mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-olive px-4 text-sm font-black text-white transition hover:bg-olive/90"
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
    <article className="interactive-card relative rounded-md border border-coyote/35 bg-field p-5 shadow-sm">
      <span className="grid h-12 w-12 place-items-center rounded-md bg-olive/12 text-olive">
        <Icon size={24} aria-hidden="true" />
      </span>
      <h3 className="mt-5 text-xl font-black text-ink">{step.title}</h3>
      <p className="mt-2 text-sm leading-6 text-ink/65">{step.text}</p>
      {showArrow ? (
        <span className="absolute -right-3 top-1/2 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-coyote/35 bg-brass text-ink lg:grid">
          <ArrowRight size={17} aria-hidden="true" />
        </span>
      ) : null}
    </article>
  );
}

function OperationalPanel() {
  return (
    <div className="rounded-md border border-paper/10 bg-paper/10 p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <OperationalTile icon={ClipboardCheck} label="Pending Queue" value="Centralized review" />
        <OperationalTile icon={Stamp} label="Verification Stamp" value="Signed records" />
        <OperationalTile icon={Layers3} label="Audit History" value="Preserved logs" />
        <OperationalTile icon={BookOpenCheck} label="Logbook Export" value="PDF / Print" />
      </div>
      <div className="mt-5 rounded-md border border-paper/10 bg-[#10140f] p-4">
        <p className="text-xs font-black uppercase tracking-wide text-brass">Activity feed</p>
        <div className="mt-4 grid gap-3">
          {['Returned log corrected', 'MAI verified Green Belt chokes', 'PDF export generated'].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-md bg-paper/10 p-3">
              <span className="h-2.5 w-2.5 rounded-full bg-brass" />
              <p className="text-sm font-semibold text-paper/75">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ValueCard({ text, title }) {
  return (
    <article className="interactive-card rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
      <CheckCircle2 size={22} className="text-olive" aria-hidden="true" />
      <h3 className="mt-4 text-xl font-black text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-ink/65">{text}</p>
    </article>
  );
}

function MetricCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-md border border-paper/10 bg-paper/10 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-paper/50">{label}</p>
        <Icon size={17} className="text-brass" aria-hidden="true" />
      </div>
      <p className="mt-2 text-lg font-black text-paper">{value}</p>
    </div>
  );
}

function OperationalTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-md border border-paper/10 bg-paper/10 p-4">
      <Icon size={22} className="text-brass" aria-hidden="true" />
      <p className="mt-3 text-xs font-bold uppercase tracking-wide text-paper/50">{label}</p>
      <p className="mt-1 text-lg font-black text-paper">{value}</p>
    </div>
  );
}
