export const achievements = [
  {
    id: 'first-blood',
    name: 'First Blood',
    requirement: 'Verify first 10 hours.',
    icon: 'crossed-knives',
    hidden: false,
    progressTarget: 600
  },
  {
    id: 'iron',
    name: 'Iron',
    requirement: 'Log training for 12 consecutive weeks.',
    icon: 'crossed-knives',
    hidden: false,
    progressTarget: 12
  },
  {
    id: 'relentless',
    name: 'Relentless',
    requirement: 'Complete 100 verified hours.',
    icon: 'crossed-knives',
    hidden: false,
    progressTarget: 6000
  },
  {
    id: 'warrior-scholar',
    name: 'Warrior Scholar',
    requirement: 'Complete 5 Martial Culture Studies.',
    icon: 'crossed-knives',
    hidden: false,
    progressTarget: 5
  },
  {
    id: 'combat-athlete',
    name: 'Combat Athlete',
    requirement: 'Log 50 Combat Conditioning hours and 50 Free Sparring hours.',
    icon: 'crossed-knives',
    hidden: false,
    description: 'Develop both technical and athletic combat proficiency.',
    progressTarget: 6000
  },
  {
    id: 'warrior-of-many',
    name: 'A Warrior of Many',
    requirement: 'Train under 5 different MAIs.',
    icon: 'crossed-knives',
    hidden: false,
    progressTarget: 5
  },
  {
    id: 'mat-rat',
    name: 'Mat Rat',
    requirement: 'Log training on 30 separate days within a 60-day period.',
    icon: 'crossed-knives',
    hidden: false,
    progressTarget: 30
  },
  {
    id: 'battle-rhythm',
    name: 'Battle Rhythm',
    requirement: 'Log at least one training session every week for 8 consecutive weeks.',
    icon: 'crossed-knives',
    hidden: false,
    progressTarget: 8
  },
  {
    id: 'sparring-partner',
    name: 'Sparring Partner',
    requirement: 'Log 75 Free Sparring hours.',
    icon: 'crossed-knives',
    hidden: false,
    progressTarget: 4500
  },
  {
    id: 'tempered-steel',
    name: 'Tempered Steel',
    requirement: 'Complete 250 training hours.',
    icon: 'crossed-knives',
    hidden: false,
    progressTarget: 15000
  },
  {
    id: 'eternal-student',
    name: 'The Eternal Student',
    requirement: 'Log 10 different Warrior Studies.',
    icon: 'gold-star',
    hidden: true,
    progressTarget: 10
  },
  {
    id: 'never-rest',
    name: 'Never Rest',
    requirement: 'Log 100 hours through consecutive training days.',
    icon: 'gold-star',
    hidden: true,
    progressTarget: 6000
  },
  {
    id: 'chesty-proud',
    name: 'Chesty Would Be Proud',
    requirement: 'Log a cumulative 1 hour of training on November 10.',
    icon: 'gold-star',
    hidden: true,
    progressTarget: 60
  },
  {
    id: 'frozen-chosin',
    name: 'Frozen Chosin',
    requirement: 'Log 100 total hours during December and January.',
    icon: 'gold-star',
    hidden: true,
    progressTarget: 6000
  },
  {
    id: 'master-of-arms',
    name: 'Master of Arms',
    requirement: 'Complete 250 verified hours and 25 Martial Culture Studies.',
    icon: 'gold-star',
    hidden: true,
    progressTarget: 15000
  },
  {
    id: 'forged-by-many',
    name: 'Forged by Many',
    requirement: 'Train under 15 different MAIs.',
    icon: 'gold-star',
    hidden: true,
    progressTarget: 15
  },
  {
    id: 'belt-hunter',
    name: 'Belt Hunter',
    requirement: 'Log 15 hours toward the next belt within 30 days of completing the previous belt advancement.',
    icon: 'gold-star',
    hidden: true,
    progressTarget: 900
  },
  {
    id: 'weekend-warrior',
    name: 'Weekend Warrior',
    requirement: 'Log training on Saturday or Sunday 8 times.',
    icon: 'gold-star',
    hidden: true,
    progressTarget: 8
  },
  {
    id: 'hurry-up-wait',
    name: 'Hurry Up and Wait',
    requirement: 'Have a log remain pending verification for more than 7 days.',
    icon: 'gold-star',
    hidden: true,
    progressTarget: 1
  },
  {
    id: 'strategic-leader',
    name: 'The Strategic Leader',
    requirement: 'Complete 10 Martial Culture Studies before reaching Brown Belt.',
    icon: 'gold-star',
    hidden: true,
    progressTarget: 10
  },
  {
    id: 'no-days-off',
    name: 'No Days Off',
    requirement: 'Log training on 365 separate days.',
    icon: 'gold-star',
    hidden: true,
    progressTarget: 365
  },
  {
    id: 'last-man-standing',
    name: 'Last Man Standing',
    requirement: "Log training on Christmas Day, Thanksgiving, and New Year's Day.",
    icon: 'gold-star',
    hidden: true,
    progressTarget: 3
  },
  {
    id: 'passing-the-torch',
    name: 'Passing the Torch',
    requirement: 'Verify 100 hours of logs.',
    icon: 'mai',
    hidden: false,
    maiOnly: true,
    progressTarget: 6000
  },
  {
    id: 'martial-mentor',
    name: 'Martial Mentor',
    requirement: 'Verify 25 hours of logs.',
    icon: 'mai',
    hidden: false,
    maiOnly: true,
    progressTarget: 1500
  },
  {
    id: 'force-multiplier',
    name: 'Force Multiplier',
    requirement: 'Verify 30 logs from different Marines.',
    icon: 'mai',
    hidden: false,
    maiOnly: true,
    progressTarget: 30
  },
  {
    id: 'the-professor',
    name: 'The Professor',
    requirement: 'Verify 10 warrior studies.',
    icon: 'mai',
    hidden: false,
    maiOnly: true,
    progressTarget: 10
  },
  {
    id: 'combat-conditioner',
    name: 'Combat Conditioner',
    requirement: 'Verify 100 combat conditioning hours.',
    icon: 'mai',
    hidden: false,
    maiOnly: true,
    progressTarget: 6000
  }
];

const brownBeltIndex = 4;
const beltOrder = ['No MCMAP Belt', 'Tan Belt', 'Gray Belt', 'Green Belt', 'Brown Belt', 'Black 1st Degree'];

export function evaluateAchievements({ logs = [], profile = {} }) {
  const verifiedLogs = logs.filter((log) => log.status === 'Verified' && !isAccountCreationLog(log));
  const ownVerifiedLogs = getOwnVerifiedLogs(verifiedLogs, profile);
  const maiVerifiedLogs = getMaiVerifiedLogs(verifiedLogs, profile);
  const allVerifiedMinutes = sumMinutes(ownVerifiedLogs);
  const studyLogs = ownVerifiedLogs.filter(isStudyLog);
  const warriorStudies = new Set(studyLogs.map((log) => normalizeStudyName(log.techniqueName || log.description || log.classCode)));
  const combatConditioningMinutes = sumMinutes(ownVerifiedLogs.filter((log) => includesAny(log, ['combat conditioning'])));
  const freeSparringMinutes = sumMinutes(ownVerifiedLogs.filter((log) => includesAny(log, ['free sparring'])));
  const uniqueMais = new Set(
    ownVerifiedLogs
      .map((log) => log.verifiedByMaiNumber || log.maiNumber || log.assignedMaiUserId || log.assignedMaiName)
      .filter((value) => value && String(value).toLowerCase() !== 'upon account creation')
  );
  const trainingDates = getUniqueDates(ownVerifiedLogs);
  const weeklyStreak = getLongestWeeklyStreak(trainingDates);
  const sixtyDayDensity = getMaxDatesInWindow(trainingDates, 60);
  const consecutiveDayMinutes = getBestConsecutiveDayMinutes(ownVerifiedLogs);
  const nov10Minutes = sumMinutes(ownVerifiedLogs.filter((log) => getMonthDay(log.date) === '11-10'));
  const chosinMinutes = sumMinutes(ownVerifiedLogs.filter((log) => ['12', '01'].includes(getMonth(log.date))));
  const beltHunterMinutes = getBeltHunterMinutes(ownVerifiedLogs, profile?.belt_advanced_at || profile?.beltAdvancedAt);
  const weekendTrainingDays = getUniqueDates(ownVerifiedLogs.filter((log) => isWeekend(log.date))).length;
  const oldPendingCount = logs.filter((log) => log.status === 'Pending' && daysSince(log.submittedAt || log.date) > 7).length;
  const preBrownStudyCount = studyLogs.filter((log) => getBeltIndex(log.targetBelt || log.beltLevel) < brownBeltIndex).length;
  const lastManStandingCount = getHolidayTrainingCount(ownVerifiedLogs);
  const maiVerifiedMinutes = sumMinutes(maiVerifiedLogs);
  const maiUniqueStudents = getUniqueStudents(maiVerifiedLogs);
  const maiStudyLogs = maiVerifiedLogs.filter(isStudyLog);
  const maiCombatConditioningMinutes = sumMinutes(maiVerifiedLogs.filter((log) => includesAny(log, ['combat conditioning'])));

  const progress = {
    'first-blood': Math.min(allVerifiedMinutes, 600),
    iron: Math.min(weeklyStreak, 12),
    relentless: Math.min(allVerifiedMinutes, 6000),
    'warrior-scholar': Math.min(studyLogs.length, 5),
    'combat-athlete': Math.min(combatConditioningMinutes, 3000) + Math.min(freeSparringMinutes, 3000),
    'warrior-of-many': Math.min(uniqueMais.size, 5),
    'mat-rat': Math.min(sixtyDayDensity, 30),
    'battle-rhythm': Math.min(weeklyStreak, 8),
    'sparring-partner': Math.min(freeSparringMinutes, 4500),
    'tempered-steel': Math.min(allVerifiedMinutes, 15000),
    'eternal-student': Math.min(warriorStudies.size, 10),
    'never-rest': Math.min(consecutiveDayMinutes, 6000),
    'chesty-proud': Math.min(nov10Minutes, 60),
    'frozen-chosin': Math.min(chosinMinutes, 6000),
    'master-of-arms': Math.min(allVerifiedMinutes, 15000),
    'forged-by-many': Math.min(uniqueMais.size, 15),
    'belt-hunter': Math.min(beltHunterMinutes, 900),
    'weekend-warrior': Math.min(weekendTrainingDays, 8),
    'hurry-up-wait': Math.min(oldPendingCount, 1),
    'strategic-leader': Math.min(preBrownStudyCount, 10),
    'no-days-off': Math.min(trainingDates.length, 365),
    'last-man-standing': Math.min(lastManStandingCount, 3),
    'passing-the-torch': Math.min(maiVerifiedMinutes, 6000),
    'martial-mentor': Math.min(maiVerifiedMinutes, 1500),
    'force-multiplier': Math.min(maiUniqueStudents.size, 30),
    'the-professor': Math.min(maiStudyLogs.length, 10),
    'combat-conditioner': Math.min(maiCombatConditioningMinutes, 6000)
  };

  const isMaiProfile = hasMaiAccess(profile);
  const unlockedIds = achievements
    .filter((achievement) => {
      if (achievement.maiOnly && !isMaiProfile) return false;
      if (achievement.id === 'combat-athlete') return combatConditioningMinutes >= 3000 && freeSparringMinutes >= 3000;
      if (achievement.id === 'master-of-arms') return allVerifiedMinutes >= 15000 && studyLogs.length >= 25;
      return progress[achievement.id] >= achievement.progressTarget;
    })
    .map((achievement) => achievement.id);

  return { progress, unlockedIds };
}

export function getAchievementById(id) {
  return achievements.find((achievement) => achievement.id === id);
}

function isAccountCreationLog(log) {
  return (
    log.source === 'Account Creation' ||
    log.source === 'Account Creation Backfill' ||
    log.verificationSource === 'Account Creation' ||
    log.assignedMaiName?.trim().toLowerCase() === 'upon account creation' ||
    log.verifiedBy?.trim().toLowerCase() === 'upon account creation'
  );
}

function sumMinutes(logs) {
  return logs.reduce((total, log) => total + Number(log.minutes ?? Math.round(Number(log.hours || 0) * 60)), 0);
}

function getOwnVerifiedLogs(verifiedLogs, profile) {
  if (!profile?.id) return verifiedLogs;
  return verifiedLogs.filter((log) => log.beltUserId === profile.id || log.belt_user_id === profile.id);
}

function getMaiVerifiedLogs(verifiedLogs, profile) {
  if (!hasMaiAccess(profile)) return [];
  const profileId = profile?.id;
  const maiNumber = profile?.mai_number || profile?.maiNumber;

  return verifiedLogs.filter((log) => (
    (profileId && (log.assignedMaiUserId === profileId || log.verifiedBy === profileId || log.verified_by === profileId)) ||
    (maiNumber && String(log.verifiedByMaiNumber || log.maiNumber || '').toLowerCase() === String(maiNumber).toLowerCase())
  ));
}

function hasMaiAccess(profile = {}) {
  const accountType = String(profile.account_type || profile.accountType || '').toLowerCase();
  return (
    accountType.includes('mai') ||
    accountType.includes('martial arts instructor') ||
    accountType.includes('owner') ||
    Boolean(profile.mai_number || profile.maiNumber || profile.lifetime_mai_access || profile.dev_test_access)
  );
}

function getUniqueStudents(logs) {
  return new Set(logs.map((log) => log.beltUserId || log.belt_user_id || log.marine).filter(Boolean));
}

function includesAny(log, needles) {
  const haystack = `${log.techniqueName || ''} ${log.description || ''} ${log.classCode || ''}`.toLowerCase();
  return needles.some((needle) => haystack.includes(needle));
}

function isStudyLog(log) {
  return includesAny(log, ['martial culture', 'warrior study', 'warrior studies', 'study']);
}

function normalizeStudyName(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function getUniqueDates(logs) {
  return [...new Set(logs.map((log) => log.date).filter(Boolean))].sort();
}

function getLongestWeeklyStreak(dates) {
  const weeks = [...new Set(dates.map(getWeekKey))].sort();
  let best = 0;
  let current = 0;
  let previous = null;

  weeks.forEach((week) => {
    current = previous && weekToNumber(week) === weekToNumber(previous) + 1 ? current + 1 : 1;
    best = Math.max(best, current);
    previous = week;
  });

  return best;
}

function getMaxDatesInWindow(dates, windowDays) {
  const timestamps = dates.map((date) => new Date(`${date}T00:00:00`).getTime()).filter(Boolean);
  let best = 0;

  timestamps.forEach((start) => {
    const end = start + windowDays * 24 * 60 * 60 * 1000;
    best = Math.max(best, timestamps.filter((timestamp) => timestamp >= start && timestamp <= end).length);
  });

  return best;
}

function getBestConsecutiveDayMinutes(logs) {
  const minutesByDate = new Map();
  logs.forEach((log) => {
    if (!log.date) return;
    minutesByDate.set(log.date, (minutesByDate.get(log.date) || 0) + Number(log.minutes ?? Math.round(Number(log.hours || 0) * 60)));
  });

  const dates = [...minutesByDate.keys()].sort();
  let best = 0;
  let current = 0;
  let previous = null;

  dates.forEach((date) => {
    current = previous && daysBetween(previous, date) === 1 ? current + minutesByDate.get(date) : minutesByDate.get(date);
    best = Math.max(best, current);
    previous = date;
  });

  return best;
}

function getBeltHunterMinutes(logs, advancedAt) {
  if (!advancedAt) return 0;

  const start = new Date(`${advancedAt.slice(0, 10)}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 30);

  return sumMinutes(
    logs.filter((log) => {
      if (!log.date) return false;
      const logDate = new Date(`${log.date}T00:00:00`);
      return logDate >= start && logDate <= end;
    })
  );
}

function getMonthDay(date) {
  return date ? date.slice(5, 10) : '';
}

function getMonth(date) {
  return date ? date.slice(5, 7) : '';
}

function getHolidayTrainingCount(logs) {
  const holidays = new Set();

  logs.forEach((log) => {
    if (!log.date) return;
    if (getMonthDay(log.date) === '12-25') holidays.add('christmas');
    if (getMonthDay(log.date) === '01-01') holidays.add('new-year');
    if (isThanksgiving(log.date)) holidays.add('thanksgiving');
  });

  return holidays.size;
}

function isThanksgiving(date) {
  const value = new Date(`${date}T00:00:00`);
  return value.getMonth() === 10 && value.getDay() === 4 && value.getDate() >= 22 && value.getDate() <= 28;
}

function isWeekend(date) {
  if (!date) return false;
  const day = new Date(`${date}T00:00:00`).getDay();
  return day === 0 || day === 6;
}

function daysSince(date) {
  if (!date) return 0;
  const start = new Date(`${String(date).slice(0, 10)}T00:00:00`).getTime();
  return Math.floor((Date.now() - start) / (24 * 60 * 60 * 1000));
}

function daysBetween(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const end = new Date(`${endDate}T00:00:00`).getTime();
  return Math.round((end - start) / (24 * 60 * 60 * 1000));
}

function getWeekKey(date) {
  const value = new Date(`${date}T00:00:00`);
  const yearStart = new Date(value.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((value - yearStart) / (24 * 60 * 60 * 1000)) + 1;
  const week = Math.ceil((dayOfYear + yearStart.getDay()) / 7);
  return `${value.getFullYear()}-${String(week).padStart(2, '0')}`;
}

function weekToNumber(weekKey) {
  const [year, week] = weekKey.split('-').map(Number);
  return year * 60 + week;
}

function getBeltIndex(beltName) {
  return beltOrder.findIndex((belt) => belt.toLowerCase() === String(beltName || '').toLowerCase());
}
