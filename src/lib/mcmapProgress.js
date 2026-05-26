import {
  additionalMcmapHoursTarget,
  beltProgression,
  earnedBeltProgression,
  getBeltRequirements,
  getTargetBelt,
  isAdditionalHoursTechnique,
  noMcmapBelt
} from '../data/mcmapReference.js';

export function buildBeltProgress({ beltUser, logs }) {
  const currentBelt = normalizeBeltName(beltUser.beltLevel);
  const targetBelt = getTargetBelt(currentBelt);
  const hasReachedBlackBelt = currentBelt === 'Black 1st Degree';
  const requirements = getBeltRequirements(targetBelt).filter((requirement) => !isAdditionalHoursTechnique(requirement));
  const completedByRequirement = new Map();

  logs
    .filter((log) => log.status === 'Verified' && matchesTargetBelt(log, targetBelt))
    .forEach((log) => {
      const key = getRequirementKey(log.classCode, log.techniqueName);
      const minutes = getAppliedLogMinutes(log);
      completedByRequirement.set(key, (completedByRequirement.get(key) || 0) + minutes);
    });

  const rows = requirements.map((requirement) => {
    const completedMinutes = completedByRequirement.get(getRequirementKey(requirement.code, requirement.name)) || 0;
    const cappedMinutes = requirement.requiredMinutes ? Math.min(completedMinutes, requirement.requiredMinutes) : completedMinutes;

    return {
      ...requirement,
      completedMinutes,
      remainingMinutes: requirement.requiredMinutes ? Math.max(requirement.requiredMinutes - completedMinutes, 0) : 0,
      isComplete: requirement.requiredMinutes ? completedMinutes >= requirement.requiredMinutes : completedMinutes > 0,
      cappedMinutes
    };
  });

  const requiredMinutes = rows.reduce((total, row) => total + row.requiredMinutes, 0);
  const completedMinutes = rows.reduce((total, row) => total + row.cappedMinutes, 0);

  return {
    currentBelt,
    targetBelt,
    hasReachedBlackBelt,
    rows,
    requiredMinutes,
    completedMinutes,
    completedCount: rows.filter((row) => row.isComplete).length,
    totalCount: rows.length,
    percent: hasReachedBlackBelt ? 100 : requiredMinutes ? Math.round((completedMinutes / requiredMinutes) * 100) : 0
  };
}

export function buildTotalMcmapHours({ beltUser, logs }) {
  const currentBelt = normalizeBeltName(beltUser.beltLevel);
  const targetBelt = getTargetBelt(currentBelt);
  const currentBeltIndex = earnedBeltProgression.indexOf(currentBelt);
  const completedBelts = currentBeltIndex >= 0 ? earnedBeltProgression.slice(0, currentBeltIndex + 1) : [];
  const completedBeltMinutes = completedBelts.reduce((total, belt) => total + getRequiredMinutesForBelt(belt), 0);
  const targetBeltVerifiedMinutes = sumLogMinutes(
    logs.filter((log) => log.status === 'Verified' && matchesTargetBelt(log, targetBelt))
  );
  const additionalVerifiedMinutes = targetBelt === additionalMcmapHoursTarget
    ? 0
    : sumLogMinutes(logs.filter((log) => log.status === 'Verified' && matchesTargetBelt(log, additionalMcmapHoursTarget)));

  return {
    targetBelt,
    completedBelts,
    completedBeltMinutes,
    targetBeltVerifiedMinutes,
    additionalVerifiedMinutes,
    totalMinutes: completedBeltMinutes + targetBeltVerifiedMinutes + additionalVerifiedMinutes
  };
}

export function getBeltTrail(currentBelt, progressPercent) {
  const normalizedCurrentBelt = normalizeBeltName(currentBelt);
  const hasReachedBlackBelt = normalizedCurrentBelt === 'Black 1st Degree';
  const targetBelt = getTargetBelt(normalizedCurrentBelt);
  const currentBeltIndex = beltProgression.indexOf(normalizedCurrentBelt);
  const targetBeltIndex = beltProgression.indexOf(targetBelt);

  return beltProgression.map((belt, index) => {
    if (index <= currentBeltIndex) {
      return { belt, status: 'Complete', label: hasReachedBlackBelt && belt === 'Black 1st Degree' ? '100%' : 'Complete' };
    }

    if (index === targetBeltIndex) {
      return { belt, status: 'Current', label: `${progressPercent}%` };
    }

    return { belt, status: 'Locked', label: 'Locked' };
  });
}

export function sumLogMinutes(logs) {
  return logs.reduce((total, log) => total + getLogMinutes(log), 0);
}

export function getLogMinutes(log) {
  return Number(log.minutes ?? Math.round(Number(log.hours || 0) * 60));
}

export function getAppliedLogMinutes(log) {
  return Number(log.appliedMinutes ?? log.minutes ?? Math.round(Number(log.hours || 0) * 60));
}

function getRequiredMinutesForBelt(belt) {
  return getBeltRequirements(belt)
    .filter((requirement) => !isAdditionalHoursTechnique(requirement))
    .reduce((total, requirement) => total + requirement.requiredMinutes, 0);
}

function getRequirementKey(code, name) {
  return `${code || ''}::${name || ''}`.toLowerCase();
}

function matchesTargetBelt(log, targetBelt) {
  const loggedTarget = log.targetBelt || log.beltLevel;
  if (targetBelt === additionalMcmapHoursTarget) return loggedTarget === additionalMcmapHoursTarget;
  return normalizeBeltName(loggedTarget) === targetBelt;
}

function normalizeBeltName(beltName = '') {
  const normalized = beltName.toLowerCase();
  if (normalized.includes('no mcmap') || normalized.includes('no belt') || normalized === 'none') return noMcmapBelt;
  if (normalized.includes('tan')) return 'Tan Belt';
  if (normalized.includes('gray') || normalized.includes('grey')) return 'Gray Belt';
  if (normalized.includes('green')) return 'Green Belt';
  if (normalized.includes('brown')) return 'Brown Belt';
  if (normalized.includes('black')) return 'Black 1st Degree';
  return noMcmapBelt;
}
