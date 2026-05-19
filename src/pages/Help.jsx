import React from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';

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
      'In this mock app, verified logs are treated as signed records. A real version should only let admins correct verified entries with an audit trail.'
  }
];

const examples = [
  {
    label: 'Good entry',
    text: '2 hours Green Belt sustainment: counters to strikes, warrior study, and supervised practical application.'
  },
  {
    label: 'Good entry',
    text: '1.5 hours Tan Belt fundamentals: basic warrior stance, movement drills, and break falls.'
  },
  {
    label: 'Too vague',
    text: 'MCMAP training.'
  }
];

export default function Help() {
  return (
    <PageShell
      eyebrow="Help"
      title="How MCMAP Logbook Works"
      description="Simple answers for Belt Users and MAIs using the logbook."
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="grid gap-4">
          {faqs.map((item) => (
            <article key={item.question} className="rounded-md border border-ink/10 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-ink">{item.question}</h2>
              <p className="mt-2 text-sm leading-6 text-ink/70">{item.answer}</p>
            </article>
          ))}
        </section>

        <aside className="rounded-md border border-ink/10 bg-white p-5 shadow-sm">
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
