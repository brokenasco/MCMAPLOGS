import React from 'react';
import { Send } from 'lucide-react';
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

export default function SubmitHours() {
  const { submitLog, setActiveRole } = useApp();
  const [form, setForm] = React.useState(initialForm);
  const [errors, setErrors] = React.useState({});
  const [confirmation, setConfirmation] = React.useState('');

  React.useEffect(() => {
    setActiveRole('Belt User');
  }, [setActiveRole]);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setErrors((current) => ({ ...current, [event.target.name]: '' }));
    setConfirmation('');
  };

  const validate = () => {
    const nextErrors = {};
    const hours = Number(form.hours);

    if (!form.date) nextErrors.date = 'Choose a training date.';
    if (!hours || hours <= 0) nextErrors.hours = 'Enter hours greater than zero.';
    if (!form.beltLevel) nextErrors.beltLevel = 'Choose the belt level trained.';
    if (!/^MAI-\d{4}$/i.test(form.maiNumber.trim())) nextErrors.maiNumber = 'Use the format MAI-1842.';
    if (!form.description.trim()) nextErrors.description = 'Add a short training description.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const savedLog = submitLog({
      date: form.date,
      hours: Number(form.hours),
      beltLevel: form.beltLevel,
      description: form.description.trim(),
      maiNumber: form.maiNumber.trim().toUpperCase()
    });

    setConfirmation(`Your log was sent to ${savedLog.maiNumber} for verification.`);
    setForm(initialForm);
  };

  return (
    <PageShell
      eyebrow="Belt User"
      title="Submit MCMAP Hours"
      description="Ask your instructor for their assigned MAI number, then submit the training log for review."
    >
      <form
        className="mx-auto grid max-w-3xl gap-5 rounded-md border border-ink/10 bg-white p-6 shadow-sm sm:grid-cols-2"
        onSubmit={handleSubmit}
      >
        {confirmation ? (
          <div className="rounded-md border border-olive/20 bg-olive/10 p-4 text-sm font-semibold text-olive sm:col-span-2">
            {confirmation}
          </div>
        ) : null}

        <Field label="Date" name="date" type="date" value={form.date} onChange={updateField} error={errors.date} />
        <Field
          label="Hours"
          name="hours"
          type="number"
          min="0.25"
          step="0.25"
          value={form.hours}
          onChange={updateField}
          placeholder="2"
          error={errors.hours}
        />
        <label className="block">
          <span className="text-sm font-bold text-ink">Belt level</span>
          <select
            name="beltLevel"
            value={form.beltLevel}
            onChange={updateField}
            className="focus-ring mt-2 h-11 w-full rounded-md border border-ink/15 bg-white px-3 text-sm"
          >
            {beltLevels.map((level) => (
              <option key={level}>{level}</option>
            ))}
          </select>
          <ErrorText message={errors.beltLevel} />
        </label>
        <Field
          label="Verifying MAI number"
          name="maiNumber"
          value={form.maiNumber}
          onChange={updateField}
          placeholder="MAI-1842"
          error={errors.maiNumber}
          hint="Ask your instructor for their assigned MAI number."
        />
        <label className="block sm:col-span-2">
          <span className="text-sm font-bold text-ink">Training description</span>
          <textarea
            name="description"
            value={form.description}
            onChange={updateField}
            className="focus-ring mt-2 min-h-32 w-full rounded-md border border-ink/15 px-3 py-3 text-sm"
            placeholder="Describe techniques, sustainment training, discussion topics, or practical application."
          />
          <ErrorText message={errors.description} />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-olive px-4 text-sm font-bold text-white hover:bg-olive/90 sm:w-auto"
          >
            <Send size={17} aria-hidden="true" />
            Submit log for verification
          </button>
        </div>
      </form>
    </PageShell>
  );
}

function Field({ label, error, hint, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink">{label}</span>
      <input className="focus-ring mt-2 h-11 w-full rounded-md border border-ink/15 px-3 text-sm" {...props} />
      {hint ? <p className="mt-1 text-xs text-ink/55">{hint}</p> : null}
      <ErrorText message={error} />
    </label>
  );
}

function ErrorText({ message }) {
  return message ? <p className="mt-1 text-xs font-semibold text-clay">{message}</p> : null;
}
