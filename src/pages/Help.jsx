import React from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';

const lessons = [
  {
    title: 'How to Submit Hours',
    summary: 'Learn how Belt Users submit training time for MAI verification.',
    steps: [
      'Open Submit Hours from the dashboard or logbook navigation.',
      'Your target belt is selected automatically. It is always one belt above the belt you currently hold.',
      'Choose the technique or tie-in from the dropdown. The list only shows requirements for your current target belt.',
      'Enter hours and minutes separately. For example, 1 hour and 30 minutes should be entered as 1 and 30.',
      'Enter the MAI number for the instructor who should verify the log.',
      'After submission, the log is marked Pending. It does not count toward verified hours until an MAI signs it.'
    ]
  },
  {
    title: 'How Verification Works',
    summary: 'Learn what happens after a log is sent to an MAI.',
    steps: [
      'The log routes to the MAI number entered by the Belt User.',
      'A Pending log is waiting for MAI review and does not count toward verified hours.',
      'A Verified log has been approved and signed by an MAI. That time counts toward the selected class code.',
      'A Returned log needs correction. The Belt User should read the note, fix the issue, and resubmit.',
      'Returned logs do not count toward verified hours or Total MCMAP Hours.'
    ]
  },
  {
    title: 'Understanding Total MCMAP Hours',
    summary: 'Learn how the app calculates the overall MCMAP hour total.',
    steps: [
      'Total MCMAP Hours includes the required hours for belts the Marine has already completed.',
      'It also includes verified logs for the belt currently being attempted.',
      'The current target belt is one belt above the Marine’s current belt.',
      'Submitted but unverified logs are not included.',
      'Returned logs are not included.',
      'This keeps the total focused on completed belt work and MAI-approved current belt progress.'
    ]
  }
];

const faqs = [
  {
    question: 'What is an MAI number?',
    answer:
      'It is the number assigned to an MAI account. Belt Users enter it on a log so the right MAI can sign and verify the training.'
  },
  {
    question: 'Why is my log pending?',
    answer:
      'Pending means the log has been submitted and is waiting for an MAI to review it. It is not counted as verified yet.'
  },
  {
    question: 'What happens if my log is returned?',
    answer:
      'The MAI will include a short correction note. Open your Belt User dashboard, fix the returned log, and resubmit it.'
  },
  {
    question: 'Can I edit a verified log?',
    answer:
      'Verified logs are treated as signed records. Admin corrections should keep an audit trail.'
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
  const [activeLesson, setActiveLesson] = React.useState(lessons[0].title);
  const selectedLesson = lessons.find((lesson) => lesson.title === activeLesson) || lessons[0];

  return (
    <PageShell
      eyebrow="Help"
      title="How MCMAP Logbook Works"
      description="Simple answers for Belt Users and MAIs using the logbook."
    >
      <section className="mb-8 rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-clay">Learn</p>
        <h2 className="mt-1 text-2xl font-bold text-ink">Website classes</h2>
        <p className="mt-2 text-sm leading-6 text-ink/65">
          Select a lesson to learn one part of the logbook at a time.
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-[300px_1fr]">
          <div className="grid gap-2">
            {lessons.map((lesson) => (
              <button
                key={lesson.title}
                type="button"
                onClick={() => setActiveLesson(lesson.title)}
                className={`focus-ring rounded-md border px-4 py-3 text-left ${
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
            to="/belt/submit"
            className="focus-ring mt-5 inline-flex h-10 w-full items-center justify-center rounded-md bg-olive px-4 text-sm font-bold text-white"
          >
            Submit training hours
          </Link>
        </aside>
      </div>
    </PageShell>
  );
}
