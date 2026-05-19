import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import { useApp } from '../context/AppContext.jsx';
import { beltLevels } from '../data/mockData.js';

const initialForm = {
  date: new Date().toISOString().slice(0, 10),
  hours: '',
  beltLevel: 'Green Belt',
  maiNumber: '',
  description: ''
};

const steps = [
  'When did you train?',
  'How many hours?',
  'What belt level?',
  'What did you do?',
  'Who verifies it?'
];

const sampleDescriptions = [
  '2 hours Green Belt sustainment: counters to strikes, warrior study, and supervised practical application.',
  '1.5 hours Tan Belt fundamentals: basic warrior stance, movement drills, and break falls.',
  '3 hours Brown Belt sustainment: ground fighting, responsible use of force review, and practical evaluation.'
];

const beltSwatches = {
  'Tan Belt': '#c2a878',
  'Gray Belt': '#7a7d7d',
  'Green Belt': '#3f5f3b',
  'Brown Belt': '#6b4226',
  'Black Belt': '#111111'
};

export default function SubmitHours() {
  const { submitLog, setActiveRole } = useApp();
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState(initialForm);
  const [errors, setErrors] = React.useState({});
  const [submittedLog, setSubmittedLog] = React.useState(null);

  React.useEffect(() => {
    setActiveRole('Belt User');
  }, [setActiveRole]);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setErrors({});
  };

  const validateStep = (targetStep = step) => {
    const nextErrors = {};
    const hours = Number(form.hours);

    if (targetStep === 0 && !form.date) nextErrors.date = 'Choose a training date.';
    if (targetStep === 1 && (!hours || hours <= 0)) nextErrors.hours = 'Enter hours greater than zero.';
    if (targetStep === 2 && !form.beltLevel) nextErrors.beltLevel = 'Choose the belt level trained.';
    if (targetStep === 3 && !form.description.trim()) nextErrors.description = 'Add a short training description.';
    if (targetStep === 4 && !/^MAI-\d{4}$/i.test(form.maiNumber.trim())) nextErrors.maiNumber = 'Use the format MAI-1842.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep((current) => Math.min(current + 1, steps.length - 1));
    }
  };

  const submit = (event) => {
    event.preventDefault();

    const allValid = steps.every((_, index) => validateStep(index));
    if (!allValid) return;

    const savedLog = submitLog({
      date: form.date,
      hours: Number(form.hours),
      beltLevel: form.beltLevel,
      description: form.description.trim(),
      maiNumber: form.maiNumber.trim().toUpperCase()
    });

    setSubmittedLog(savedLog);
    setForm(initialForm);
    setStep(0);
  };

  return (
    <PageShell
      eyebrow="Belt User"
      title="Submit MCMAP Hours"
      description="Answer one question at a time. Ask your instructor for their assigned MAI number before submitting."
    >
      {submittedLog ? (
        <section className="mx-auto max-w-3xl rounded-md border border-olive/20 bg-paper p-6 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-olive">
            <CheckCircle2 size={18} aria-hidden="true" />
            Submitted
          </p>
          <h2 className="mt-3 text-2xl font-bold text-ink">Submitted to {submittedLog.maiNumber}</h2>
          <p className="mt-2 text-sm leading-6 text-ink/70">
            Status: Pending. You will see it in your logbook once an MAI signs and verifies it.
          </p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-3">
            <Summary label="Date" value={new Date(`${submittedLog.date}T12:00:00`).toLocaleDateString()} />
            <Summary label="Hours" value={submittedLog.hours} />
            <Summary label="Belt" value={submittedLog.beltLevel} />
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setSubmittedLog(null)}
              className="focus-ring inline-flex h-10 items-center rounded-md bg-olive px-4 text-sm font-bold text-white"
            >
              Submit another log
            </button>
            <Link
              to="/belt/dashboard"
              className="focus-ring inline-flex h-10 items-center rounded-md border border-ink/15 bg-field px-4 text-sm font-bold text-ink"
            >
              Back to dashboard
            </Link>
          </div>
        </section>
      ) : (
        <form className="mx-auto max-w-3xl rounded-md border border-coyote/35 bg-paper p-5 shadow-sm sm:p-6" onSubmit={submit}>
          <div className="mb-5">
            <p className="text-sm font-bold text-clay">
              Step {step + 1} of {steps.length}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-ink">{steps[step]}</h2>
          </div>

          <div className="rounded-md bg-field p-4">
            {step === 0 ? (
              <Field label="Training date" name="date" type="date" value={form.date} onChange={updateField} error={errors.date} />
            ) : null}

            {step === 1 ? (
              <Field
                label="Training hours"
                name="hours"
                type="number"
                min="0.25"
                step="0.25"
                value={form.hours}
                onChange={updateField}
                placeholder="2"
                error={errors.hours}
              />
            ) : null}

            {step === 2 ? (
              <label className="block">
                <span className="text-sm font-bold text-ink">Belt level trained</span>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {beltLevels.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, beltLevel: level }))}
                      className={`focus-ring flex h-12 items-center gap-3 rounded-md border px-3 text-left text-sm font-bold ${
                        form.beltLevel === level ? 'border-olive bg-paper shadow-sm' : 'border-coyote/35 bg-paper/70'
                      }`}
                    >
                      <span className="h-4 w-9 rounded-sm" style={{ backgroundColor: beltSwatches[level] }} />
                      {level}
                    </button>
                  ))}
                </div>
                <ErrorText message={errors.beltLevel} />
              </label>
            ) : null}

            {step === 3 ? (
              <div>
                <label className="block">
                  <span className="text-sm font-bold text-ink">Training description</span>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={updateField}
                    className="focus-ring mt-2 min-h-36 w-full rounded-md border border-ink/15 px-3 py-3 text-base"
                    placeholder="Example: 2 hours Green Belt sustainment: counters to strikes, warrior study, supervised practical application."
                  />
                  <ErrorText message={errors.description} />
                </label>
                <div className="mt-4">
                  <p className="text-sm font-bold text-ink">Example entries</p>
                  <div className="mt-2 grid gap-2">
                    {sampleDescriptions.map((sample) => (
                      <button
                        key={sample}
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, description: sample }))}
                        className="focus-ring rounded-md border border-coyote/35 bg-paper p-3 text-left text-sm leading-6 text-ink/70 hover:border-olive/40"
                      >
                        {sample}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <Field
                label="Verifying MAI number"
                name="maiNumber"
                value={form.maiNumber}
                onChange={updateField}
                placeholder="MAI-1842"
                error={errors.maiNumber}
                hint="This is the number assigned to your MAI account. Belt Users enter it so their log goes to the right instructor."
              />
            ) : null}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => setStep((current) => Math.max(current - 1, 0))}
              disabled={step === 0}
              className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md border border-ink/15 bg-field px-4 text-sm font-bold text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft size={17} aria-hidden="true" />
              Back
            </button>
            {step === steps.length - 1 ? (
              <button
                type="submit"
                className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-olive px-4 text-sm font-bold text-white hover:bg-olive/90"
              >
                <Send size={17} aria-hidden="true" />
                Submit for verification
              </button>
            ) : (
              <button
                type="button"
                onClick={nextStep}
                className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-olive px-4 text-sm font-bold text-white hover:bg-olive/90"
              >
                Continue
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            )}
          </div>
        </form>
      )}
    </PageShell>
  );
}

function Field({ label, error, hint, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink">{label}</span>
      <input className="focus-ring mt-2 h-12 w-full rounded-md border border-ink/15 px-3 text-base" {...props} />
      {hint ? <p className="mt-2 text-sm leading-6 text-ink/60">{hint}</p> : null}
      <ErrorText message={error} />
    </label>
  );
}

function ErrorText({ message }) {
  return message ? <p className="mt-2 text-sm font-semibold text-clay">{message}</p> : null;
}

function Summary({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-ink/50">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}
