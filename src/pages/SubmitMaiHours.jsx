import React from 'react';
import { CheckCircle2, Lock, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import { useApp } from '../context/AppContext.jsx';
import { formatMinutes, getBeltRequirements, getTargetBelt } from '../data/mcmapReference.js';

export default function SubmitMaiHours() {
  const { maiUser, profile, maiDirectory, submitMaiLog } = useApp();
  const currentBelt = profile?.belt_level || 'Black 1st Degree';
  const targetBelt = getTargetBelt(currentBelt);
  const requirements = getBeltRequirements(targetBelt);
  const verifyingMais = maiDirectory.filter((mai) => mai.maiNumber !== maiUser.maiNumber);
  const [form, setForm] = React.useState({
    date: new Date().toISOString().slice(0, 10),
    techniqueId: requirements[0]?.id || '',
    hours: '',
    minutes: '',
    verifierMaiNumber: verifyingMais[0]?.maiNumber || ''
  });
  const [message, setMessage] = React.useState('');
  const [submittedLog, setSubmittedLog] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const selectedTechnique = requirements.find((item) => item.id === form.techniqueId) || requirements[0];
  const totalMinutes = Math.round(Math.max(0, Number(form.hours || 0) * 60 + Number(form.minutes || 0)));

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setMessage('');
  };

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');

    if (!selectedTechnique) {
      setMessage('Choose a technique or tie-in.');
      return;
    }

    if (totalMinutes <= 0) {
      setMessage('Enter training time greater than zero.');
      return;
    }

    if (!form.verifierMaiNumber || form.verifierMaiNumber === maiUser.maiNumber) {
      setMessage('Choose another MAI for verification. You cannot verify your own hours.');
      return;
    }

    setIsSubmitting(true);

    try {
      const savedLog = await submitMaiLog({
        date: form.date,
        hours: Number((totalMinutes / 60).toFixed(2)),
        minutes: totalMinutes,
        beltLevel: targetBelt,
        targetBelt,
        classCode: selectedTechnique.code,
        techniqueName: selectedTechnique.name,
        description: `${selectedTechnique.code}: ${selectedTechnique.name}`,
        maiNumber: form.verifierMaiNumber
      });
      setSubmittedLog(savedLog);
      setForm((current) => ({ ...current, hours: '', minutes: '' }));
    } catch (error) {
      setMessage(error.message || 'MAI hours could not be submitted.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell
      eyebrow="MAI"
      title="Submit MAI Training Hours"
      description="Submit your own MCMAP training hours to another MAI for verification."
    >
      {submittedLog ? (
        <section className="mx-auto max-w-4xl rounded-md border border-olive/20 bg-paper p-6 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-olive">
            <CheckCircle2 size={18} aria-hidden="true" />
            Submitted
          </p>
          <h2 className="mt-3 text-2xl font-bold text-ink">Sent to {submittedLog.maiNumber}</h2>
          <p className="mt-2 text-sm leading-6 text-ink/70">
            These hours are pending until the receiving MAI verifies them.
          </p>
          <Link
            to="/logbook/verified"
            className="focus-ring mt-5 inline-flex h-10 items-center rounded-md bg-olive px-4 text-sm font-bold text-white"
          >
            Open logbook
          </Link>
        </section>
      ) : (
        <form className="mx-auto max-w-4xl rounded-md border border-coyote/35 bg-paper p-5 shadow-sm sm:p-6" onSubmit={submit}>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Training date" name="date" type="date" value={form.date} onChange={updateField} />

            <label className="block">
              <span className="text-sm font-bold text-ink">Target Belt</span>
              <div className="mt-2 flex h-12 items-center gap-2 rounded-md border border-ink/15 bg-field px-3 text-base font-bold text-ink">
                <Lock size={17} aria-hidden="true" />
                {targetBelt}
              </div>
              <p className="mt-2 text-sm leading-6 text-ink/60">Current belt: {currentBelt}.</p>
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-bold text-ink">Technique / Tie-In</span>
              <select
                name="techniqueId"
                value={form.techniqueId}
                onChange={updateField}
                className="focus-ring mt-2 h-12 w-full rounded-md border border-ink/15 bg-paper px-3 text-base"
              >
                {requirements.map((technique) => (
                  <option key={technique.id} value={technique.id}>
                    {technique.code} - {technique.name} ({formatMinutes(technique.requiredMinutes)})
                  </option>
                ))}
              </select>
            </label>

            <Field label="Hours" name="hours" type="number" min="0" step="1" value={form.hours} onChange={updateField} placeholder="1" />
            <Field label="Minutes" name="minutes" type="number" min="0" step="1" value={form.minutes} onChange={updateField} placeholder="30" />

            <label className="block md:col-span-2">
              <span className="text-sm font-bold text-ink">Verifying MAI</span>
              <select
                name="verifierMaiNumber"
                value={form.verifierMaiNumber}
                onChange={updateField}
                className="focus-ring mt-2 h-12 w-full rounded-md border border-ink/15 bg-paper px-3 text-base"
              >
                {verifyingMais.map((mai) => (
                  <option key={mai.maiNumber} value={mai.maiNumber}>
                    {mai.name} | {mai.maiNumber}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm leading-6 text-ink/60">MAIs must select another MAI. Self-verification is blocked.</p>
            </label>
          </div>

          {message ? (
            <div className="mt-5 rounded-md border border-clay/20 bg-clay/10 p-4 text-sm font-semibold text-clay">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="focus-ring mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-olive px-4 text-sm font-bold text-white hover:bg-olive/90"
          >
            <Send size={17} aria-hidden="true" />
            {isSubmitting ? 'Submitting...' : 'Submit to MAI'}
          </button>
        </form>
      )}
    </PageShell>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink">{label}</span>
      <input className="focus-ring mt-2 h-12 w-full rounded-md border border-ink/15 px-3 text-base" {...props} />
    </label>
  );
}
