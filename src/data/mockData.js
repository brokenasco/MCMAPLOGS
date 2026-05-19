export const currentBeltUser = {
  name: 'LCpl Jordan Hayes',
  email: 'jordan.hayes@example.mil',
  unit: '2d Battalion Training Platoon',
  beltLevel: 'Green Belt',
  totalHours: 38.5,
  verifiedHours: 31,
  pendingHours: 7.5,
  nextGoal: 'Brown Belt sustainment package'
};

export const currentMai = {
  name: 'Sgt Avery Morgan',
  email: 'avery.morgan@example.mil',
  maiNumber: 'MAI-1842',
  unit: 'MCMAP Training Cell',
  pendingCount: 4,
  verifiedThisMonth: 12
};

export const trainingLogs = [
  {
    id: 1,
    marine: 'LCpl Jordan Hayes',
    date: '2026-05-12',
    hours: 2,
    beltLevel: 'Green Belt',
    description: 'Counters to strikes, warrior study discussion, and supervised practical application.',
    maiNumber: 'MAI-1842',
    submittedAt: '2026-05-12',
    status: 'Pending'
  },
  {
    id: 2,
    marine: 'Pfc Riley Chen',
    date: '2026-05-11',
    hours: 1.5,
    beltLevel: 'Tan Belt',
    description: 'Basic warrior stance, movement drills, and break falls.',
    maiNumber: 'MAI-1842',
    submittedAt: '2026-05-11',
    status: 'Pending'
  },
  {
    id: 3,
    marine: 'Cpl Sam Ortiz',
    date: '2026-05-08',
    hours: 3,
    beltLevel: 'Brown Belt',
    description: 'Ground fighting sustainment and responsible use of force review.',
    maiNumber: 'MAI-1842',
    submittedAt: '2026-05-08',
    verifiedAt: '2026-05-09',
    verifiedBy: 'Sgt Avery Morgan',
    verifiedByMaiNumber: 'MAI-1842',
    status: 'Verified'
  },
  {
    id: 4,
    marine: 'LCpl Jordan Hayes',
    date: '2026-05-05',
    hours: 2.5,
    beltLevel: 'Green Belt',
    description: 'Bayonet techniques, physical conditioning circuit, and after-action notes.',
    maiNumber: 'MAI-1842',
    submittedAt: '2026-05-05',
    verifiedAt: '2026-05-06',
    verifiedBy: 'Sgt Avery Morgan',
    verifiedByMaiNumber: 'MAI-1842',
    status: 'Verified'
  },
  {
    id: 5,
    marine: 'Pfc Taylor Brooks',
    date: '2026-05-02',
    hours: 2,
    beltLevel: 'Gray Belt',
    description: 'Chokes and counters under instructor supervision.',
    maiNumber: 'MAI-1842',
    submittedAt: '2026-05-02',
    status: 'Pending'
  },
  {
    id: 6,
    marine: 'LCpl Morgan Ellis',
    date: '2026-04-29',
    hours: 2,
    beltLevel: 'Tan Belt',
    description: 'Punches, counters, and values-based discussion.',
    maiNumber: 'MAI-1842',
    submittedAt: '2026-04-29',
    status: 'Pending'
  },
  {
    id: 7,
    marine: 'LCpl Jordan Hayes',
    date: '2026-04-25',
    hours: 1,
    beltLevel: 'Green Belt',
    description: 'MCMAP training.',
    maiNumber: 'MAI-1842',
    submittedAt: '2026-04-25',
    returnedAt: '2026-04-26',
    returnedBy: 'Sgt Avery Morgan',
    returnedByMaiNumber: 'MAI-1842',
    returnReason: 'Needs correction',
    returnMessage: 'Add the techniques trained and who supervised the period before resubmitting.',
    status: 'Returned'
  }
];

export const beltLevels = ['Tan Belt', 'Gray Belt', 'Green Belt', 'Brown Belt', 'Black Belt'];
