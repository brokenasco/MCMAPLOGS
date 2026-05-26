import React from 'react';
import { CheckCircle2, Lock, Search, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import { useApp } from '../context/AppContext.jsx';
import {
  additionalMcmapHoursTarget,
  formatMinutes,
  getBeltRequirements,
  getTargetBelt,
  getTargetBeltOptions,
  isAdditionalHoursTechnique,
  isAdditionalMcmapTarget
} from '../data/mcmapReference.js';

function buildInitialForm(currentBelt) {
  const targetBelt = getTargetBeltOptions(currentBelt)[0] || getTargetBelt(currentBelt);
  const requirements = getBeltRequirements(targetBelt);

  return {
    date: new Date().toISOString().slice(0, 10),
    targetBelt,
    techniqueId: requirements[0]?.id || '',
    hours: '',
    minutes: '',
    maiSelection: '',
    maiNumber: ''
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
  const { beltLogs, findMaiByNumber, maiUser, profile, submitMaiLog } = useApp();
  const currentBelt = profile?.belt_level || maiUser?.beltLevel || 'Black 1st Degree';
  const targetOptions = React.useMemo(() => getTargetBeltOptions(currentBelt), [currentBelt]);
  const [form, setForm] = React.useState(() => buildInitialForm(currentBelt));
  const [errors, setErrors] = React.useState({});
  const [submittedLog, setSubmittedLog] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [mobileStep, setMobileStep] = React.useState(1);
  const targetBelt = targetOptions.includes(form.targetBelt) ? form.targetBelt : targetOptions[0] || getTargetBelt(currentBelt);
  const targetRequirements = getBeltRequirements(targetBelt);
  const selectedTechnique = targetRequirements.find((technique) => technique.id === form.techniqueId) || targetRequirements[0];
  const logTargetBelt = isAdditionalHoursTechnique(selectedTechnique) ? additionalMcmapHoursTarget : targetBelt;
  const previousMais = React.useMemo(
    () => getPreviousMais(beltLogs, findMaiByNumber, maiUser?.maiNumber),
    [beltLogs, findMaiByNumber, maiUser?.maiNumber]
  );
  const isNewMaiEntry = form.maiSelection === 'new' || !previousMais.length;
  const selectedMaiNumber = isNewMaiEntry ? form.maiNumber.trim().toUpperCase() : form.maiSelection;
  const selectedMai = selectedMaiNumber ? findMaiByNumber(selectedMaiNumber) : null;
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
        current.maiSelection
      ) {
        return current;
      }

      return {
        ...current,
        targetBelt: nextTargetBelt,
        techniqueId: nextRequirements[0]?.id || '',
        maiSelection: current.maiSelection || previousMais[0]?.maiNumber || 'new'
      };
    });
  }, [currentBelt, targetOptions, previousMais]);

  React.useEffect(() => {
    setForm((current) => {
      if (current.maiSelection) return current;
      return {
        ...current,
        maiSelection: previousMais[0]?.maiNumber || 'new'
      };
    });
  }, [previousMais]);

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
    if (!selectedMaiNumber) nextErrors.maiNumber = 'Choose an MAI or enter a new MAI code.';
    if (selectedMaiNumber && !/^MAI-\d{4}$/i.test(selectedMaiNumber)) nextErrors.maiNumber = 'Use the format MAI-1842.';
    if (selectedMaiNumber?.toLowerCase() === maiUser?.maiNumber?.toLowerCase()) nextErrors.maiNumber = 'You cannot verify your own hours.';
    if (selectedMaiNumber && /^MAI-\d{4}$/i.test(selectedMaiNumber) && !selectedMai) {
      nextErrors.maiNumber = 'That MAI code does not match an active MAI account. Check the code and try again.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateMobileStep = () => {
    const nextErrors = {};

    if (mobileStep === 1) {
      if (!form.date) nextErrors.date = 'Choose a training date.';
      if (!targetBelt) nextErrors.targetBelt = 'Target belt could not be calculated from your current belt.';
      if (!selectedTechnique) nextErrors.techniqueId = 'Choose a technique or tie-in.';
    }

    if (mobileStep === 2 && totalMinutes <= 0) {
      nextErrors.time = 'Enter training time greater than zero.';
    }

    if (mobileStep === 3) {
      if (!selectedMaiNumber) nextErrors.maiNumber = 'Choose an MAI or enter a new MAI code.';
      if (selectedMaiNumber && !/^MAI-\d{4}$/i.test(selectedMaiNumber)) nextErrors.maiNumber = 'Use the format MAI-1842.';
      if (selectedMaiNumber?.toLowerCase() === maiUser?.maiNumber?.toLowerCase()) nextErrors.maiNumber = 'You cannot verify your own hours.';
      if (selectedMaiNumber && /^MAI-\d{4}$/i.test(selectedMaiNumber) && !selectedMai) {
        nextErrors.maiNumber = 'That MAI code does not match an active MAI account. Check the code and try again.';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goToNextMobileStep = () => {
    if (!validateMobileStep()) return;
    setMobileStep((current) => Math.min(current + 1, 4));
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
        beltLevel: logTargetBelt,
        targetBelt: logTargetBelt,
        classCode: selectedTechnique.code,
        techniqueName: selectedTechnique.name,
        description: `${selectedTechnique.code}: ${selectedTechnique.name}`,
        maiNumber: selectedMaiNumber
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
    ? 'w-full rounded-md border border-coyote/35 bg-paper p-5 shadow-sm sm:p-6'
    : 'mx-auto max-w-4xl rounded-md border border-coyote/35 bg-paper p-5 shadow-sm sm:p-6';
  const successClassName = embedded
    ? 'w-full rounded-md border border-olive/20 bg-paper p-6 shadow-sm'
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
          <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={() => setSubmittedLog(null)}
              className="focus-ring inline-flex h-11 items-center justify-center rounded-md bg-olive px-4 text-sm font-bold text-white sm:h-10"
            >
              Submit another log
            </button>
            <Link
              to="/logbook/verified"
              className="focus-ring inline-flex h-11 items-center justify-center rounded-md border border-ink/15 bg-field px-4 text-sm font-bold text-ink sm:h-10"
            >
              Open logbook
            </Link>
          </div>
        </section>
      ) : (
        <>
        <form className={`${formClassName} sm:hidden`} onSubmit={submit}>
          {errors.form ? (
            <div className="mb-4 rounded-md border border-clay/20 bg-clay/10 p-4 text-sm font-semibold text-clay">
              {errors.form}
            </div>
          ) : null}

          <MobileStepHeader currentStep={mobileStep} />

          {mobileStep === 1 ? (
            <div className="grid gap-5">
              <Field label="Training date" name="date" type="date" value={form.date} onChange={updateField} error={errors.date} />
              <label className="block">
                <span className="text-sm font-bold text-ink">Target Belt</span>
                <div className="mt-2 flex h-12 items-center gap-2 rounded-md border border-ink/15 bg-field px-3 text-base font-bold text-ink">
                  <Lock size={17} aria-hidden="true" />
                  {showTargetSelect ? (
                    <select name="targetBelt" value={targetBelt} onChange={updateField} className="focus-ring h-10 flex-1 rounded-md border border-ink/15 bg-paper px-3 text-base font-bold text-ink">
                      {targetOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : targetBelt}
                </div>
                <p className="mt-2 text-sm leading-6 text-ink/60">Current belt: {currentBelt}.</p>
                <ErrorText message={errors.targetBelt} />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-ink">Technique / Tie-In</span>
                <select name="techniqueId" value={form.techniqueId} onChange={updateField} className="focus-ring mt-2 h-12 w-full rounded-md border border-ink/15 bg-paper px-3 text-base">
                  {targetRequirements.map((technique) => <option key={technique.id} value={technique.id}>{technique.name}</option>)}
                </select>
                <ErrorText message={errors.techniqueId} />
              </label>
              {selectedTechnique ? (
                <div className="rounded-md border border-coyote/35 bg-field p-4">
                  <Summary label="Required" value={selectedTechnique.requiredMinutes ? formatMinutes(selectedTechnique.requiredMinutes) : 'No progression requirement'} />
                </div>
              ) : null}
            </div>
          ) : null}

          {mobileStep === 2 ? (
            <div className="grid gap-5">
              <Field label="Hours" name="hours" type="number" min="0" step="1" value={form.hours} onChange={updateField} placeholder="1" error={errors.time} />
              <Field label="Minutes" name="minutes" type="number" min="0" step="1" value={form.minutes} onChange={updateField} placeholder="30" hint={totalMinutes > 0 ? `Time will be saved as ${normalizedTime}.` : 'Example: 90 minutes will count as 1 hour 30 minutes.'} />
            </div>
          ) : null}

          {mobileStep === 3 ? (
            <div className="grid gap-5">
              <label className="block">
                <span className="text-sm font-bold text-ink">Verifying MAI</span>
                <select name="maiSelection" value={form.maiSelection || previousMais[0]?.maiNumber || 'new'} onChange={updateField} className="focus-ring mt-2 h-12 w-full rounded-md border border-ink/15 bg-paper px-3 text-base">
                  {previousMais.map((mai) => <option key={mai.maiNumber} value={mai.maiNumber}>{mai.maiNumber} - {mai.name}</option>)}
                  <option value="new">Enter New MAI Code</option>
                </select>
              </label>
              {isNewMaiEntry ? (
                <Field label="New MAI code" name="maiNumber" value={form.maiNumber} onChange={updateField} placeholder="MAI-0000" error={errors.maiNumber} />
              ) : (
                <ErrorText message={errors.maiNumber} />
              )}
              <div className="rounded-md border border-coyote/35 bg-field p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-ink"><Search size={17} aria-hidden="true" />MAI number confirmation</p>
                {selectedMai ? (
                  <p className="mt-2 text-sm leading-6 text-olive">This log will go to {selectedMai.maiNumber} {selectedMai.name}, {selectedMai.unit}.</p>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-clay">No MAI match found yet. Check the number before submitting.</p>
                )}
              </div>
            </div>
          ) : null}

          {mobileStep === 4 ? (
            <div className="rounded-md border border-coyote/35 bg-field p-4">
              <p className="text-sm font-black uppercase tracking-wide text-clay">Review and Submit</p>
              <dl className="mt-4 grid gap-4">
                <Summary label="Training date" value={form.date} />
                <Summary label="Target" value={logTargetBelt} />
                <Summary label="Technique" value={selectedTechnique?.name || 'Not selected'} />
                <Summary label="Time" value={normalizedTime} />
                <Summary label="Verifying MAI" value={selectedMai ? `${selectedMai.maiNumber} ${selectedMai.name}` : selectedMaiNumber || 'Not selected'} />
              </dl>
            </div>
          ) : null}

          <div className="sticky bottom-[136px] -mx-5 mt-6 grid gap-3 border-t border-coyote/25 bg-paper/95 px-5 py-3 backdrop-blur">
            {mobileStep < 4 ? (
              <button type="button" onClick={goToNextMobileStep} className="focus-ring inline-flex h-12 items-center justify-center rounded-md bg-olive px-4 text-sm font-black text-white">Next</button>
            ) : (
              <button type="submit" disabled={isSubmitting} className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-md bg-olive px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
                <Send size={17} aria-hidden="true" />
                {isSubmitting ? 'Submitting...' : 'Submit for verification'}
              </button>
            )}
            <button type="button" onClick={() => setMobileStep((current) => Math.max(current - 1, 1))} disabled={mobileStep === 1} className="focus-ring h-11 rounded-md border border-ink/15 bg-field px-4 text-sm font-bold text-ink disabled:cursor-not-allowed disabled:opacity-40">Back</button>
          </div>
        </form>

        <form className={`${formClassName} hidden sm:block`} onSubmit={submit}>
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
                    {technique.name}
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
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Summary label="Required" value={selectedTechnique.requiredMinutes ? formatMinutes(selectedTechnique.requiredMinutes) : 'No progression requirement'} />
                  <Summary label="Logged now" value={normalizedTime} />
                </dl>
              ) : null}
            </div>

            <div className="md:col-span-2">
              <label className="block">
                <span className="text-sm font-bold text-ink">Verifying MAI</span>
                <select
                  name="maiSelection"
                  value={form.maiSelection || previousMais[0]?.maiNumber || 'new'}
                  onChange={updateField}
                  className="focus-ring mt-2 h-12 w-full rounded-md border border-ink/15 bg-paper px-3 text-base"
                >
                  {previousMais.map((mai) => (
                    <option key={mai.maiNumber} value={mai.maiNumber}>
                      {mai.maiNumber} - {mai.name}
                    </option>
                  ))}
                  <option value="new">Enter New MAI Code</option>
                </select>
                <p className="mt-2 text-sm leading-6 text-ink/60">
                  Previously used MAIs come from your past submitted logs. MAIs must select another MAI.
                </p>
              </label>
              {isNewMaiEntry ? (
                <Field
                  label="New MAI code"
                  name="maiNumber"
                  value={form.maiNumber}
                  onChange={updateField}
                  placeholder="MAI-0000"
                  error={errors.maiNumber}
                  hint="Enter the MAI number for the instructor who will verify this log."
                />
              ) : (
                <ErrorText message={errors.maiNumber} />
              )}

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
                    No MAI match found yet. Check the number before submitting.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-stretch sm:justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-olive px-4 text-sm font-bold text-white hover:bg-olive/90 sm:w-auto"
            >
              <Send size={17} aria-hidden="true" />
              {isSubmitting ? 'Submitting...' : 'Submit for verification'}
            </button>
          </div>
        </form>
        </>
      )}
    </>
  );
}

function MobileStepHeader({ currentStep }) {
  const labels = ['Technique', 'Time', 'MAI Code', 'Review'];

  return (
    <div className="mb-5 rounded-md border border-coyote/35 bg-field p-4">
      <p className="text-xs font-black uppercase tracking-wide text-clay">Step {currentStep} of 4</p>
      <h2 className="mt-1 text-xl font-bold text-ink">{labels[currentStep - 1]}</h2>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {labels.map((label, index) => (
          <span key={label} className={`h-2 rounded-full ${index + 1 <= currentStep ? 'bg-olive' : 'bg-coyote/30'}`} />
        ))}
      </div>
    </div>
  );
}

function getTotalMinutes(hours, minutes) {
  return Math.round(Math.max(0, Number(hours || 0) * 60 + Number(minutes || 0)));
}

function getPreviousMais(logs, findMaiByNumber, currentMaiNumber) {
  const byNumber = new Map();

  logs
    .filter((log) => log.maiNumber)
    .forEach((log) => {
      if (isAccountCreationVerifier(log)) return;
      if (log.maiNumber?.toLowerCase() === currentMaiNumber?.toLowerCase()) return;

      const mai = findMaiByNumber(log.maiNumber);
      if (mai) {
        byNumber.set(mai.maiNumber, mai);
      } else if (log.assignedMaiName) {
        byNumber.set(log.maiNumber, {
          maiNumber: log.maiNumber,
          name: log.assignedMaiName,
          unit: ''
        });
      }
    });

  return [...byNumber.values()];
}

function isAccountCreationVerifier(log) {
  return (
    log.source === 'Account Creation' ||
    log.source === 'Account Creation Backfill' ||
    log.verificationSource === 'Account Creation' ||
    log.assignedMaiName?.trim().toLowerCase() === 'upon account creation' ||
    log.verifiedBy?.trim().toLowerCase() === 'upon account creation'
  );
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
