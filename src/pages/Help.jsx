import React from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import { useApp } from '../context/AppContext.jsx';

const mobileLessons = [
  {
    title: 'Using the Mobile Dashboard',
    summary: 'Use the phone dashboard without hunting through the page.',
    steps: [
      'Use the bottom navigation bar to move between Dashboard, Logbook, Messages, Profile, and Help.',
      'The dashboard places the most important action first, such as Submit Hours, Fix Returned Log, or Pending Verification.',
      'Use the sticky action button near the bottom of the screen to jump directly to the matching section.',
      'Use the mobile command center buttons to switch between pending logs and Log My Hours.',
      'Belt Path is shortened on phones so you only see your current belt, next belt, and the belt after that.'
    ]
  },
  {
    title: 'Submitting Hours on Mobile',
    summary: 'Submit MCMAP hours using the step-by-step phone form.',
    steps: [
      'Step 1: Choose the technique or tie-in. The app shows only the items for your current target belt.',
      'Step 2: Enter hours and minutes separately.',
      'Step 3: Select a previously used MAI or enter a new MAI code.',
      'Step 4: Review the summary, then submit for verification.',
      'After submitting, the log stays pending until an MAI verifies it.'
    ]
  },
  {
    title: 'Viewing Logs on Mobile',
    summary: 'Read logbook records as compact cards.',
    steps: [
      'Mobile logbooks use cards instead of wide tables.',
      'Each card shows the Marine name, class code, technique or tie-in, date verified, and status badge.',
      'Tap View Details to expand a card and see hours, verifier, MAI code, signature, source, and extra details.',
      'Tap Hide Details to collapse the card again.',
      'Mobile logbooks show fewer records per page so you do not have to scroll as far.'
    ]
  },
  {
    title: 'Using Messages on Mobile',
    summary: 'Open conversations one at a time on a phone.',
    steps: [
      'Open Messages from the bottom navigation bar.',
      'Tap a name in the inbox to open that conversation.',
      'Use Start New Message to enter an MAI code and begin a conversation.',
      'Inside a thread, each message shows when it was sent and whether it has been seen.',
      'Unread message badges disappear after you open the conversation.'
    ]
  },
  {
    title: 'Using Mobile Filters',
    summary: 'Filter logbook records by verified date on a phone.',
    steps: [
      'Open Logbook from the bottom navigation bar.',
      'Choose the command center view you want, such as Verified Entries, Verified Hours, Extra Verified Hours, or Hours Needed.',
      'Tap Filter to open the date controls.',
      'Select a From Date and To Date.',
      'Use PDF or Print after filtering if you need a copy of the selected records.'
    ]
  },
  {
    title: 'Achievements',
    summary: 'Understand badges, hidden achievements, and unlock messages.',
    steps: [
      'Achievements reward consistent training, martial development, education, and participation in the MCMAP community.',
      'Some achievements are visible from the start, while others remain hidden until earned.',
      'Achievements unlock automatically after verified logs, belt advancement, study completion, login checks, and recalculations.',
      'When you unlock an achievement, you receive a notification and an internal achievement message.',
      'Open Profile, then Achievements, to view unlocked badges, locked badge progress, and unlock dates.'
    ]
  }
];

const desktopLessons = [
  {
    title: 'Using the Desktop Dashboard',
    summary: 'Use the full dashboard command center.',
    steps: [
      'Use the top navigation to move between Dashboard, Logbook, Messages, Profile, and Help.',
      'The Dashboard command center shows your current belt, working-toward belt, and progress.',
      'Use Logs Pending Verification to review pending logs.',
      'Use Log My Hours to open the hour submission area.',
      'Desktop pages show more information at once, so records and details may appear side by side.'
    ]
  },
  {
    title: 'Submitting Hours on Desktop',
    summary: 'Use the full-page Submit Hours form.',
    steps: [
      'Open Log My Hours from the dashboard command center.',
      'Confirm the target belt shown by the app.',
      'Choose the technique or tie-in from the dropdown.',
      'Enter hours and minutes.',
      'Select a previously used MAI or choose Enter New MAI Code, then submit for verification.'
    ]
  },
  {
    title: 'Using the Desktop Logbook',
    summary: 'Understand the Logbook command center tabs.',
    steps: [
      'Verified Entries shows signed log records.',
      'Verified Hours shows totals for verified records.',
      'Extra Verified Hours shows overflow time that was preserved after a requirement was completed.',
      'Hours Needed shows what remains for the current target belt.',
      'Use Filter to select a verified-date range, then use PDF or Print if you need an export.'
    ]
  },
  {
    title: 'Using Messages on Desktop',
    summary: 'Use the inbox and conversation layout.',
    steps: [
      'Open Messages from the top navigation.',
      'The inbox list appears on the left.',
      'The selected conversation opens on the right.',
      'Each message shows sent and seen timestamps.',
      'Unread badges only show when a message has not been opened by you.'
    ]
  },
  {
    title: 'Managing Account and Subscription',
    summary: 'Find profile, billing, and access controls.',
    steps: [
      'Open Profile from the top navigation.',
      'Review your account details, belt level, MAI number, and subscription status.',
      'Use Manage Subscription to upgrade, cancel, or resume MAI access when available.',
      'Belt Users can upgrade to MAI without creating a new account.',
      'Account deletion is available from Edit Account Details and requires confirmation.'
    ]
  },
  {
    title: 'Achievements',
    summary: 'Understand badges, hidden achievements, and unlock messages.',
    steps: [
      'Achievements reward consistent training, martial development, education, and participation in the MCMAP community.',
      'Some achievements are visible from the start, while others remain hidden until earned.',
      'Achievements unlock automatically after verified logs, belt advancement, study completion, login checks, and recalculations.',
      'When you unlock an achievement, you receive a notification and an internal achievement message.',
      'Open Profile, then Achievements, to view unlocked badges, locked badge progress, and unlock dates.'
    ]
  }
];

const roleLessons = {
  'Belt User': [
    'Log training hours and submit them to an MAI for verification.',
    'Track your current belt progress from the dashboard.',
    'Fix returned logs from the dashboard when correction is required.',
    'Use the Logbook to review verified entries, verified hours, extra hours, and hours still needed.',
    'After completing required verified hours, schedule your belt advancement test with an MAI.'
  ],
  MAI: [
    'Review pending logs from the dashboard and quickly verify or return them.',
    'Return logs with a clear correction note when something needs to be fixed.',
    'Submit your own MCMAP hours to another MAI for verification.',
    'Use the MAI Logbook as verifier to track logs you signed for others.',
    'Use the Student Logbook to track your own submitted and verified training hours.'
  ]
};

const faqs = [
  {
    question: 'What is an MAI number?',
    answer: 'It is the number assigned to an MAI account. Belt Users enter it on a log so the right MAI can sign and verify the training.'
  },
  {
    question: 'Why is my log pending?',
    answer: 'Pending means the log has been submitted and is waiting for an MAI to review it. It is not counted as verified yet.'
  },
  {
    question: 'What happens if my log needs correction?',
    answer: 'The MAI will include a short correction note. Open your dashboard, fix the returned log, and resubmit it.'
  }
];

const examples = [
  {
    label: 'Good entry',
    text: '2 hours Green Belt sustainment: counters to strikes, warrior study, and supervised practical application.'
  },
  {
    label: 'Good entry',
    text: '1 hour 30 minutes Tan Belt fundamentals: basic warrior stance, movement drills, and break falls.'
  },
  {
    label: 'Too vague',
    text: 'MCMAP training.'
  }
];

export default function Help() {
  const { activeRole, session } = useApp();
  const isMobile = useIsMobileHelp();
  const lessons = isMobile ? mobileLessons : desktopLessons;
  const heading = isMobile ? 'Mobile Help Guide' : 'Desktop Help Guide';
  const [activeLesson, setActiveLesson] = React.useState(lessons[0].title);
  const selectedLesson = lessons.find((lesson) => lesson.title === activeLesson) || lessons[0];
  const roleTips = roleLessons[activeRole] || roleLessons['Belt User'];

  React.useEffect(() => {
    setActiveLesson(lessons[0].title);
  }, [lessons]);

  return (
    <PageShell
      eyebrow="Help"
      title={heading}
      description="Simple lessons based on the layout you are using right now."
    >
      <section className="mb-8 rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-clay">Learn</p>
        <h2 className="mt-1 text-2xl font-bold text-ink">{heading}</h2>
        <p className="mt-2 text-sm leading-6 text-ink/65">
          These lessons match the {isMobile ? 'mobile' : 'desktop'} layout currently shown on your screen.
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-[300px_1fr]">
          <div className="grid gap-2">
            {lessons.map((lesson) => (
              <button
                key={lesson.title}
                type="button"
                onClick={() => setActiveLesson(lesson.title)}
                className={`focus-ring min-h-12 rounded-md border px-4 py-3 text-left ${
                  activeLesson === lesson.title
                    ? 'border-olive bg-olive text-white'
                    : 'border-coyote/35 bg-field text-ink hover:bg-paper'
                }`}
              >
                <span className="block text-sm font-bold">{lesson.title}</span>
                <span className={`mt-1 block text-xs leading-5 ${activeLesson === lesson.title ? 'text-white/75' : 'text-ink/60'}`}>
                  {lesson.summary}
                </span>
              </button>
            ))}
          </div>

          <article className="rounded-md border border-coyote/35 bg-field p-5">
            <h3 className="text-xl font-bold text-ink">{selectedLesson.title}</h3>
            <ol className="mt-4 space-y-3">
              {selectedLesson.steps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-6 text-ink/75">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-olive text-xs font-black text-white">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </article>
        </div>
      </section>

      {session ? (
        <section className="mb-8 rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-clay">{activeRole} guide</p>
          <h2 className="mt-1 text-2xl font-bold text-ink">What matters for your account</h2>
          <div className="mt-4 grid gap-3">
            {roleTips.map((tip) => (
              <div key={tip} className="rounded-md border border-coyote/25 bg-field p-4 text-sm font-semibold leading-6 text-ink/75">
                {tip}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="grid gap-4">
          {faqs.map((item) => (
            <article key={item.question} className="rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
              <h2 className="text-xl font-bold text-ink">{item.question}</h2>
              <p className="mt-2 text-sm leading-6 text-ink/70">{item.answer}</p>
            </article>
          ))}
        </section>

        <aside className="rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
          <h2 className="text-xl font-bold text-ink">Sample entry examples</h2>
          <div className="mt-4 grid gap-3">
            {examples.map((example, index) => (
              <div key={`${example.label}-${index}`} className="rounded-md bg-field p-3">
                <p className="text-sm font-bold text-clay">{example.label}</p>
                <p className="mt-1 text-sm leading-6 text-ink/70">{example.text}</p>
              </div>
            ))}
          </div>
          <Link
            to={activeRole === 'MAI' ? '/mai/dashboard' : '/belt/dashboard'}
            className="focus-ring mt-5 inline-flex h-11 w-full items-center justify-center rounded-md bg-olive px-4 text-sm font-bold text-white"
          >
            Open dashboard
          </Link>
        </aside>
      </div>
    </PageShell>
  );
}

function useIsMobileHelp() {
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 639px)').matches;
  });

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 639px)');
    const updateMobileState = () => setIsMobile(mediaQuery.matches);

    updateMobileState();
    mediaQuery.addEventListener('change', updateMobileState);

    return () => mediaQuery.removeEventListener('change', updateMobileState);
  }, []);

  return isMobile;
}
