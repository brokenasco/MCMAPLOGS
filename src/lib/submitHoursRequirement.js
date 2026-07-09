import { additionalMcmapHoursTarget, formatMinutes, isAdditionalHoursTechnique, noMcmapBelt } from '../data/mcmapReference.js';

export function getRequiredHoursDisplay({ logs = [], selectedTechnique, targetBelt }) {
  if (!selectedTechnique || !selectedTechnique.requiredMinutes || isAdditionalHoursTechnique(selectedTechnique)) {
    return 'No required hours';
  }

  const completedMinutes = logs
    .filter((log) =>
      log.status === 'Verified' &&
      getRequirementKey(log.classCode, log.techniqueName) === getRequirementKey(selectedTechnique.code, selectedTechnique.name) &&
      matchesTargetBelt(log, targetBelt)
    )
    .reduce((total, log) => total + getAppliedLogMinutes(log), 0);

  const remainingMinutes = Math.max(selectedTechnique.requiredMinutes - Math.min(completedMinutes, selectedTechnique.requiredMinutes), 0);

  if (remainingMinutes <= 0) return 'Completed required hours';
  return formatRequiredHours(remainingMinutes);
}

function formatRequiredHours(totalMinutes) {
  const text = formatMinutes(totalMinutes);
  const hours = Math.floor(Math.round(totalMinutes) / 60);
  const minutes = Math.round(totalMinutes) % 60;

  if (!hours && minutes) return `0 hours ${minutes} min`;
  return text.replace(' minutes', ' min').replace(' minute', ' min');
}

function getRequirementKey(code, name) {
  return `${code || ''}::${name || ''}`.toLowerCase();
}

function getAppliedLogMinutes(log) {
  return Number(log.appliedMinutes ?? log.minutes ?? Math.round(Number(log.hours || 0) * 60));
}

function matchesTargetBelt(log, targetBelt) {
  const loggedTarget = log.targetBelt || log.beltLevel;
  if (targetBelt === additionalMcmapHoursTarget) return loggedTarget === additionalMcmapHoursTarget;
  return normalizeBeltName(loggedTarget) === normalizeBeltName(targetBelt);
}

function normalizeBeltName(beltName = '') {
  const normalized = beltName.toLowerCase();
  if (normalized.includes('no mcmap') || normalized.includes('no belt') || normalized === 'none') return noMcmapBelt;
  if (normalized.includes('tan')) return 'Tan Belt';
  if (normalized.includes('gray') || normalized.includes('grey')) return 'Gray Belt';
  if (normalized.includes('green')) return 'Green Belt';
  if (normalized.includes('brown')) return 'Brown Belt';
  if (normalized.includes('black')) return 'Black 1st Degree';
  return beltName || noMcmapBelt;
}
