import React from 'react';
import { CheckCircle2, Lock, Search, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import { useApp } from '../context/AppContext.jsx';
import { formatMinutes, getBeltRequirements, getTargetBelt, getTargetBeltOptions, isAdditionalMcmapTarget } from '../data/mcmapReference.js';

function buildInitialForm(currentBelt) {
  const targetBelt = getTargetBeltOptions(currentBelt)[0] || getTargetBelt(currentBelt);
  const requirements = getBeltRequirements(targetBelt);

  return {
    date: new Date().toISOString().slice(0, 10),
    targetBelt,
    techniqueId: requirements[0]?.id || '',
    hours: '',
    minutes: '',
    verifierMaiNumber: ''
  };
}

export default function SubmitMaiHours() {
  return (
    <PageShell
      eyebrow="MAI"
      title="Submit MCMAP Hours"
      description="Select the technique or tie-in you trained. Your hours must be verified by another MAI before they count."
    >
      <SubmitMaiHoursForm />
    </PageShell>
  );
}

export function SubmitMaiHoursForm({ embedded = false }) {
  const { maiUser, profile, maiDirectory, submitMaiLog } = useApp();
  const currentBelt = profile?.belt_level || maiUser?.beltLevel || 'Black 1st Degree';
  const targetOptions = React.useMemo(() => getTargetBeltOptions(currentBelt), [currentBelt]);
  const [form, setForm] = React.useState(() => buildInitialForm(currentBelt));
  const [errors, setErrors] = React.useState({});
  const [submittedLog, setSubmittedLog] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const targetBelt = targetOptions.includes(form.targetBelt) ? form.targetBelt : targetOptions[0] || getTargetBelt(currentBelt);
  const targetRequirements = getBeltRequirements(targetBelt);
  const selectedTechnique = targetRequirements.find((technique) => technique.id === form.techniqueId) || targetRequirements[0];
  const verifyingMais = React.useMemo(
    () => maiDirectory.filter((mai) => mai.maiNumber && mai.maiNumber !== maiUser?.maiNumber),
    [maiDirectory, maiUser?.maiNumber]
  );
  const selectedMai = verifyingMais.find((mai) => mai.maiNumber === form.verifierMaiNumber);
  const totalMinutes = getTotalMinutes(form.hours, form.minutes);
  const normalizedTime = formatMinutes(totalMinutes);
  const showTargetSelect = targetOptions.length > 1 || isAdditionalMcmapTarget(targetBelt);

  React.useEffect(() => {
    setForm((current) => {
      const nextTargetBelt = targetOptions.includes(current.targetBelt) ? current.targetBelt : targetOptions[0] || getTargetBelt(currentBelt);
      const nextRequirements = getBeltRequirements(nextTargetBelt);

      if (
        current.targetBelt === nextTargetBelt &&
        nextRequirements.some((technique) => technique.id === current.techniqueId) &&
        (current.verifierMaiNumber || !verifyingMais[0])
      ) {
        return current;
      }

      return {
        ...current,
        targetBelt: nextTargetBelt,
        techniqueId: nextRequirements[0]?.id || '',
        verifierMaiNumber: current.verifierMaiNumber || verifyingMais[0]?.maiNumber || ''
      };
    });
  }, [currentBelt, targetOptions, verifyingMais]);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setErrors({});
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.date) nextErrors.date = 'Choose a training date.';
    if (!targetBelt) nextErrors.targetBelt = 'Target belt could not be calculated from your current belt.';
    if (!selectedTechnique) nextErrors.techniqueId = 'Choose a technique or tie-in.';
    if (totalMinutes <= 0) nextErrors.time = 'Enter training time greater than zero.';
    if (!form.verifierMaiNumber) nextErrors.verifierMaiNumber = 'Choose another MAI for verification.';
    if (form.verifierMaiNumber === maiUser?.maiNumber) nextErrors.verifierMaiNumber = 'You cannot verify your own hours.';
    if (form.verifierMaiNumber && !selectedMai) nextErrors.verifierMaiNumber = 'That MAI is not available for verification right now.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

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
      setForm(buildInitialForm(currentBelt));
    } catch (error) {
      setErrors({ form: error.message || 'MAI hours could not be submitted.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formClassName = embedded
    ? 'mx-auto max-w-4xl rounded-md border border-coyote/35 bg-paper p-5 shadow-sm sm:p-6'
    : 'mx-auto max-w-4xl rounded-md border border-coyote/35 bg-paper p-5 shadow-sm sm:p-6';
  const successClassName = embedded
    ? 'mx-auto max-w-4xl rounded-md border border-olive/20 bg-paper p-6 shadow-sm'
    : 'mx-auto max-w-4xl rounded-md border border-olive/20 bg-paper p-6 shadow-sm';

  return (
    <>
      {submittedLog ? (
        <section className={successClassName}>
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-olive">
            <CheckCircle2 size={18} aria-hidden="true" />
            Submitted
          </p>
          <h2 className="mt-3 text-2xl font-bold text-ink">Submitted to {formatMaiDisplay(submittedLog)}</h2>
          <p className="mt-2 text-sm leading-6 text-ink/70">
            Status: Pending. When the receiving MAI verifies it, {formatMinutes(submittedLog.minutes || 0)} will be applied to your total MCMAP hours.
          </p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-4">
            <Summary label="Target" value={submittedLog.targetBelt} />
            <Summary label="Class code" value={submittedLog.classCode} />
            <Summary label="Time" value={formatMinutes(submittedLog.minutes || 0)} />
            <Summary label="Status" value={submittedLog.status} />
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
              to="/logbook/verified"
              className="focus-ring inline-flex h-10 items-center rounded-md border border-ink/15 bg-field px-4 text-sm font-bold text-ink"
            >
              Open logbook
            </Link>
          </div>
        </section>
      ) : (
        <form className={formClassName} onSubmit={submit}>
          {errors.form ? (
            <div className="mb-4 rounded-md border border-clay/20 bg-clay/10 p-4 text-sm font-semibold text-clay">
              {errors.form}
            </div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Training date" name="date" type="date" value={form.date} onChange={updateField} error={errors.date} />

            <label className="block">
              <span className="text-sm font-bold text-ink">Target Belt</span>
              <div className="mt-2 flex h-12 items-center gap-2 rounded-md border border-ink/15 bg-field px-3 text-base font-bold text-ink">
                <Lock size={17} aria-hidden="true" />
                {showTargetSelect ? (
                  <select
                    name="targetBelt"
                    value={targetBelt}
                    onChange={updateField}
                    className="focus-ring h-10 flex-1 rounded-md border border-ink/15 bg-paper px-3 text-base font-bold text-ink"
                  >
                    {targetOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  targetBelt
                )}
              </div>
              <p className="mt-2 text-sm leading-6 text-ink/60">
                Current belt: {currentBelt}. {isAdditionalMcmapTarget(targetBelt) ? 'Additional verified hours count toward your total MCMAP hours.' : 'This is locked one belt above your current rank.'}
              </p>
              <ErrorText message={errors.targetBelt} />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-bold text-ink">Technique / Tie-In</span>
              <select
                name="techniqueId"
                value={form.techniqueId}
                onChange={updateField}
                className="focus-ring mt-2 h-12 w-full rounded-md border border-ink/15 bg-paper px-3 text-base"
              >
                {targetRequirements.map((technique) => (
                  <option key={technique.id} value={technique.id}>
                    {technique.code} - {technique.name}
                    {technique.requiredMinutes ? ` (${formatMinutes(technique.requiredMinutes)})` : ' (No progression requirement)'}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm leading-6 text-ink/60">
                Only {targetBelt} options are available in this dropdown.
              </p>
              <ErrorText message={errors.techniqueId} />
            </label>

            <Field
              label="Hours"
              name="hours"
              type="number"
              min="0"
              step="1"
              value={form.hours}
              onChange={updateField}
              placeholder="1"
              error={errors.time}
            />
            <Field
              label="Minutes"
              name="minutes"
              type="number"
              min="0"
              step="1"
              value={form.minutes}
              onChange={updateField}
              placeholder="30"
              hint={totalMinutes > 0 ? `Time will be saved as ${normalizedTime}.` : 'Example: 90 minutes will count as 1:30.'}
            />

            <div className="rounded-md border border-coyote/35 bg-field p-4 md:col-span-2">
              <p className="text-sm font-bold text-ink">Selected class requirement</p>
              {selectedTechnique ? (
                <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                  <Summary label="Class code" value={selectedTechnique.code} />
                  <Summary label="Required" value={selectedTechnique.requiredMinutes ? formatMinutes(selectedTechnique.requiredMinutes) : 'No progression requirement'} />
                  <Summary label="Logged now" value={normalizedTime} />
                </dl>
              ) : null}
            </div>

            <div className="md:col-span-2">
              <label className="block">
                <span className="text-sm font-bold text-ink">Verifying MAI</span>
                <select
                  name="verifierMaiNumber"
                  value={form.verifierMaiNumber}
                  onChange={updateField}
                  className="focus-ring mt-2 h-12 w-full rounded-md border border-ink/15 bg-paper px-3 text-base"
                >
                  <option value="">Select an MAI verifier</option>
                  {verifyingMais.map((mai) => (
                    <option key={mai.maiNumber} value={mai.maiNumber}>
                      {mai.maiNumber} {mai.name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm leading-6 text-ink/60">MAIs must select another MAI. Self-verification is blocked.</p>
              </label>
              <ErrorText message={errors.verifierMaiNumber} />

              <div className="mt-4 rounded-md border border-coyote/35 bg-field p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-ink">
                  <Search size={17} aria-hidden="true" />
                  MAI number confirmation
                </p>
                {selectedMai ? (
                  <p className="mt-2 text-sm leading-6 text-olive">
                    This log will go to {selectedMai.maiNumber} {selectedMai.name}, {selectedMai.unit}.
                  </p>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-clay">
                    Choose the MAI who will verify this log.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-olive px-4 text-sm font-bold text-white hover:bg-olive/90"
            >
              <Send size={17} aria-hidden="true" />
              {isSubmitting ? 'Submitting...' : 'Submit for verification'}
            </button>
          </div>
        </form>
      )}
    </>
  );
}

function getTotalMinutes(hours, minutes) {
  return Math.round(Math.max(0, Number(hours || 0) * 60 + Number(minutes || 0)));
}

function formatMaiDisplay(log) {
  return `${log.maiNumber || ''} ${log.assignedMaiName || ''}`.trim() || 'selected MAI';
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
