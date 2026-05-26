import React from 'react';
import { Lock, Search, Send } from 'lucide-react';
import {
  additionalMcmapHoursTarget,
  formatMinutes,
  getBeltRequirements,
  getTargetBelt,
  getTargetBeltOptions,
  isAdditionalHoursTechnique,
  isAdditionalMcmapTarget
} from '../data/mcmapReference.js';

export default function LogEditForm({ beltUser, findMaiByNumber, log, mode = 'edit', onCancel, onSubmit }) {
  const targetOptions = React.useMemo(() => getTargetBeltOptions(beltUser.beltLevel), [beltUser.beltLevel]);
  const initialTargetBelt = targetOptions.includes(log.targetBelt || log.beltLevel)
    ? log.targetBelt || log.beltLevel
    : targetOptions[0] || getTargetBelt(beltUser.beltLevel);
  const [form, setForm] = React.useState(() => buildForm(log, initialTargetBelt));
  const [errors, setErrors] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const targetBelt = targetOptions.includes(form.targetBelt) ? form.targetBelt : initialTargetBelt;
  const requirements = getBeltRequirements(targetBelt);
  const selectedTechnique = requirements.find((technique) => technique.id === form.techniqueId) || requirements[0];
  const logTargetBelt = isAdditionalHoursTechnique(selectedTechnique) ? additionalMcmapHoursTarget : targetBelt;
  const selectedMaiNumber = form.maiNumber.trim().toUpperCase();
  const matchedMai = selectedMaiNumber ? findMaiByNumber(selectedMaiNumber) : null;
  const totalMinutes = getTotalMinutes(form.hours, form.minutes);
  const normalizedTime = formatMinutes(totalMinutes);
  const showTargetSelect = targetOptions.length > 1 || isAdditionalMcmapTarget(targetBelt);

  React.useEffect(() => {
    setForm((current) => {
      const nextRequirements = getBeltRequirements(current.targetBelt);
      if (nextRequirements.some((technique) => technique.id === current.techniqueId)) return current;
      return {
        ...current,
        techniqueId: nextRequirements[0]?.id || ''
      };
    });
  }, [targetBelt]);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setErrors({});
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!targetBelt) nextErrors.targetBelt = 'Target belt could not be calculated from your current belt.';
    if (!selectedTechnique) nextErrors.techniqueId = 'Choose a technique or tie-in.';
    if (totalMinutes <= 0) nextErrors.time = 'Enter training time greater than zero.';
    if (!selectedMaiNumber) nextErrors.maiNumber = 'Enter the MAI code for the verifier.';
    if (selectedMaiNumber && !/^MAI-\d{4}$/i.test(selectedMaiNumber)) nextErrors.maiNumber = 'Use the format MAI-1842.';
    if (selectedMaiNumber && /^MAI-\d{4}$/i.test(selectedMaiNumber) && !matchedMai) {
      nextErrors.maiNumber = 'That MAI code does not match an active MAI account. Check the code and try again.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await onSubmit({
        targetBelt: logTargetBelt,
        beltLevel: logTargetBelt,
        classCode: selectedTechnique.code,
        techniqueName: selectedTechnique.name,
        description: `${selectedTechnique.code}: ${selectedTechnique.name}`,
        hours: Number((totalMinutes / 60).toFixed(2)),
        minutes: totalMinutes,
        maiNumber: selectedMaiNumber
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="rounded-md border border-coyote/35 bg-paper p-5 shadow-sm" onSubmit={submit}>
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-clay">
          {mode === 'resubmit' ? 'Edit & Resubmit' : 'Edit Pending Log'}
        </p>
        <h2 className="mt-1 text-xl font-bold text-ink">
          {mode === 'resubmit' ? 'Correct returned log' : 'Update before MAI verification'}
        </h2>
      </div>

      {mode === 'resubmit' ? (
        <div className="mt-4 rounded-md border border-clay/25 bg-clay/10 p-4">
          <p className="text-sm font-bold text-clay">{log.returnReason || 'Returned for correction'}</p>
          <p className="mt-2 text-sm leading-6 text-ink/70">
            {log.returnMessage || 'Review the returned log, correct the details, and resubmit it.'}
          </p>
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 md:grid-cols-2">
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
            Current belt: {beltUser.beltLevel}. {isAdditionalMcmapTarget(targetBelt) ? 'Additional verified hours count toward your total MCMAP hours.' : 'This follows your current belt progression.'}
          </p>
          <ErrorText message={errors.targetBelt} />
        </label>

        <Field label="MAI verifier code" name="maiNumber" value={form.maiNumber} onChange={updateField} placeholder="MAI-0000" error={errors.maiNumber} />

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
                {technique.name}
              </option>
            ))}
          </select>
          <ErrorText message={errors.techniqueId} />
        </label>

        <Field label="Hours" name="hours" type="number" min="0" step="1" value={form.hours} onChange={updateField} placeholder="1" error={errors.time} />
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
          <p className="flex items-center gap-2 text-sm font-bold text-ink">
            <Search size={17} aria-hidden="true" />
            MAI number confirmation
          </p>
          {matchedMai ? (
            <p className="mt-2 text-sm leading-6 text-olive">
              This log will go to {matchedMai.maiNumber} {matchedMai.name}, {matchedMai.unit}.
            </p>
          ) : (
            <p className="mt-2 text-sm leading-6 text-clay">
              No MAI match found yet. Check the number before saving.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-olive px-4 text-sm font-bold text-white hover:bg-olive/90"
        >
          <Send size={17} aria-hidden="true" />
          {isSubmitting ? 'Saving...' : mode === 'resubmit' ? 'Resubmit for verification' : 'Save pending log'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="focus-ring inline-flex h-11 items-center justify-center rounded-md border border-ink/15 bg-field px-4 text-sm font-bold text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function buildForm(log, targetBelt) {
  const requirements = getBeltRequirements(targetBelt);
  const matchingTechnique = requirements.find(
    (technique) => technique.code === log.classCode && technique.name === log.techniqueName
  );
  const totalMinutes = getLogMinutes(log);

  return {
    targetBelt,
    techniqueId: matchingTechnique?.id || requirements[0]?.id || '',
    hours: String(Math.floor(totalMinutes / 60) || ''),
    minutes: String(totalMinutes % 60 || ''),
    maiNumber: log.maiNumber || ''
  };
}

function getTotalMinutes(hours, minutes) {
  return Math.round(Math.max(0, Number(hours || 0) * 60 + Number(minutes || 0)));
}

function getLogMinutes(log) {
  return Number(log.minutes ?? Math.round(Number(log.hours || 0) * 60));
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
