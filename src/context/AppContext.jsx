import React from 'react';
import { currentBeltUser, currentMai, messageThreads as mockMessageThreads, trainingLogs } from '../data/mockData.js';
import { additionalMcmapHoursTarget, beltProgression, earnedBeltProgression, getBeltRequirements, noMcmapBelt } from '../data/mcmapReference.js';
import { supabase, supabaseConfigStatus } from '../lib/supabaseClient.js';

const AppContext = React.createContext(null);

const subscriptionPlans = {
  'Belt User': {
    planName: 'MCMAP Logbook Belt User',
    label: 'Free',
    requiresPayment: false,
    annualPrice: 0,
    monthlyDisplay: 'Free'
  },
  MAI: {
    planName: 'MCMAP Logbook MAI Annual',
    label: '$69.99/year',
    requiresPayment: true,
    annualPrice: 69.99,
    trialDays: 60,
    monthlyDisplay: '$69.99/year'
  }
};

const devTestMaiUserId = '18a9842e-84f8-46a8-806c-c2276a46c6f0';
const paidMaiAccessStatuses = ['active', 'trialing', 'owner_free', 'lifetime_free'];
const ownerMaiAccount = {
  id: '8c5a14d7-5f97-4020-ade5-de534b315287',
  name: 'Keaton Permenter (OWNER)',
  email: 'keatonray99@gmail.com',
  unit: 'Owner / Developer',
  maiNumber: 'MAI-0000'
};
const fallbackMaiDirectory = [
  ownerMaiAccount,
  currentMai,
  { name: 'SSgt Cameron Reed', maiNumber: 'MAI-2497', unit: 'Weapons Training Detachment' }
];

export function AppProvider({ children }) {
  const [activeRole, setActiveRole] = React.useState('Belt User');
  const [beltUser, setBeltUser] = React.useState(currentBeltUser);
  const [maiUser, setMaiUser] = React.useState(currentMai);
  const [maiDirectory, setMaiDirectory] = React.useState(fallbackMaiDirectory);
  const [profile, setProfile] = React.useState(null);
  const [session, setSession] = React.useState(null);
  const [logs, setLogs] = React.useState(trainingLogs);
  const [messageThreads, setMessageThreads] = React.useState(mockMessageThreads);
  const [loading, setLoading] = React.useState(Boolean(supabase));
  const [authMessage, setAuthMessage] = React.useState('');
  const [savedDraft, setSavedDraft] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mcmap-log-draft')) || null;
    } catch {
      return null;
    }
  });
  const [subscription, setSubscription] = React.useState({
    status: 'free',
    planName: subscriptionPlans['Belt User'].planName,
    annualPrice: subscriptionPlans['Belt User'].annualPrice,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    paymentMethod: null
  });

  const isSupabaseEnabled = Boolean(supabase);
  const isProductionBuild = import.meta.env.PROD;
  const currentUserId = session?.user?.id;
  const currentMessageKey = activeRole === 'MAI' ? maiUser.maiNumber : beltUser.email;
  const currentReadKeys = React.useMemo(
    () => [currentUserId, currentMessageKey].filter(Boolean),
    [currentUserId, currentMessageKey]
  );
  const beltLogs = currentUserId
    ? logs.filter((log) => log.beltUserId === currentUserId)
    : logs.filter((log) => log.marine === beltUser.name);
  const assignedMaiLogs = logs.filter((log) =>
    (currentUserId && log.assignedMaiUserId === currentUserId) || log.maiNumber?.toLowerCase() === maiUser.maiNumber?.toLowerCase()
  );
  const maiSubmittedLogs = logs.filter((log) =>
    (currentUserId ? log.beltUserId === currentUserId : log.marine === maiUser.name) && log.submitterRole === 'MAI'
  );
  const pendingLogs = activeRole === 'MAI'
    ? assignedMaiLogs.filter((log) => log.status === 'Pending')
    : beltLogs.filter((log) => log.status === 'Pending');
  const verifiedLogs = activeRole === 'MAI'
    ? assignedMaiLogs.filter((log) => log.status === 'Verified')
    : beltLogs.filter((log) => log.status === 'Verified');
  const returnedLogs = activeRole === 'MAI'
    ? assignedMaiLogs.filter((log) => log.status === 'Returned')
    : beltLogs.filter((log) => log.status === 'Returned');
  const urgentCount = beltLogs.filter((log) => log.status === 'Returned').length;
  const visibleMessageThreads = getVisibleMessageThreads({ activeRole, beltUser, maiUser, messageThreads });
  const unreadMessageCount = visibleMessageThreads.reduce(
    (total, thread) =>
      total +
      thread.messages.filter(
        (message) => isMessageUnreadForCurrentUser(message, currentUserId)
      ).length,
    0
  );
  const currentPlan = subscriptionPlans[activeRole] || subscriptionPlans['Belt User'];
  const displaySubscription = {
    ...subscription,
    planName: currentPlan.planName,
    annualPrice: currentPlan.annualPrice,
    monthlyDisplay: currentPlan.monthlyDisplay,
    requiresPayment: currentPlan.requiresPayment,
    trialDays: currentPlan.trialDays || 0,
    label: currentPlan.label
  };
  const hasPaidMaiAccess = activeRole !== 'MAI' || hasLifetimeMaiAccess(profile) || paidMaiAccessStatuses.includes(displaySubscription.status);

  React.useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    async function loadInitialSession() {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setSession(data.session);
      if (data.session?.user) {
        await loadProfileAndLogs(data.session.user.id);
      }
      setLoading(false);
    }

    loadInitialSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        loadProfileAndLogs(nextSession.user.id);
    } else {
      setProfile(null);
      setLogs(trainingLogs);
      setMessageThreads(mockMessageThreads);
      setSubscription(getProfileSubscription({ account_type: 'Belt User' }));
      setMaiDirectory(fallbackMaiDirectory);
    }
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function loadProfileAndLogs(userId) {
    if (!supabase) return;

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      setAuthMessage(profileError.message);
      throw profileError;
    }

    applyProfile(profileData);
    await loadMaiDirectory(profileData);
    await seedPriorBeltLogs(profileData);
    await loadLogs(profileData);
    await loadMessages(profileData);
    return profileData;
  }

  async function seedPriorBeltLogs(profileData) {
    if (!supabase || !profileData?.id || profileData.prior_belt_logs_seeded) return;

    if (profileData.belt_level === noMcmapBelt) {
      await supabase
        .from('profiles')
        .update({ prior_belt_logs_seeded: true })
        .eq('id', profileData.id);
      return;
    }

    const currentBeltIndex = earnedBeltProgression.findIndex(
      (belt) => belt.toLowerCase() === (profileData.belt_level || '').toLowerCase()
    );
    const beltsToSeed = earnedBeltProgression.slice(0, Math.max(0, currentBeltIndex) + 1);
    if (!beltsToSeed.length) return;

    const { data: existingRecords } = await supabase
      .from('training_logs')
      .select('id')
      .eq('belt_user_id', profileData.id)
      .eq('source', 'Account Creation')
      .limit(1);

    if (existingRecords?.length) {
      await supabase
        .from('profiles')
        .update({ prior_belt_logs_seeded: true })
        .eq('id', profileData.id);
      return;
    }

    const createdAt = new Date().toISOString();
    const records = beltsToSeed.flatMap((beltName) =>
      getBeltRequirements(beltName).map((requirement) => ({
        belt_user_id: profileData.id,
        marine_name: profileData.full_name,
        date: createdAt.slice(0, 10),
        hours: Number((requirement.requiredMinutes / 60).toFixed(2)),
        minutes: requirement.requiredMinutes,
        belt_level: beltName,
        target_belt: beltName,
        class_code: requirement.code,
        technique_name: requirement.name,
        submitter_role: profileData.account_type,
        assigned_mai_user_id: null,
        assigned_mai_name: 'Upon Account Creation',
        description: `${requirement.code}: ${requirement.name}`,
        mai_number: null,
        status: 'Verified',
        verified_by: null,
        verified_at: createdAt,
        applied_minutes: requirement.requiredMinutes,
        extra_minutes: 0,
        source: 'Account Creation',
        verification_source: 'Account Creation',
        created_at: createdAt
      }))
    );

    const { error: insertError } = await supabase
      .from('training_logs')
      .insert(records);

    if (insertError) {
      setAuthMessage(insertError.message);
      return;
    }

    const { data: updatedProfile, error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ prior_belt_logs_seeded: true })
      .eq('id', profileData.id)
      .select()
      .single();

    if (profileUpdateError) {
      setAuthMessage(profileUpdateError.message);
      return;
    }

    applyProfile(updatedProfile);
  }

  async function loadLogs(profileData = profile) {
    if (!supabase || !profileData) return;

    const { data, error } = await supabase
      .from('training_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setAuthMessage(error.message);
      setMaiDirectory(fallbackMaiDirectory);
      return;
    }

    let loadedLogs = data.map(mapLogFromSupabase);

    if (getEffectiveAccountRole(profileData.account_type) === 'MAI' && profileData.mai_number) {
      const { data: assignedData, error: assignedError } = await supabase
        .from('training_logs')
        .select('*')
        .or(`assigned_mai_user_id.eq.${profileData.id},mai_number.eq.${profileData.mai_number}`)
        .order('created_at', { ascending: false });

      if (!assignedError && assignedData) {
        loadedLogs = mergeLogsById(loadedLogs, assignedData.map(mapLogFromSupabase));
      }
    }

    setLogs(loadedLogs);
  }

  async function loadMessages(profileData = profile) {
    if (!supabase || !profileData) return;

    const { data, error } = await supabase
      .from('message_threads')
      .select('*, messages(*)')
      .order('created_at', { ascending: false });

    if (error) {
      return;
    }

    setMessageThreads(data.map(mapThreadFromSupabase));
  }

  async function loadMaiDirectory(profileData = profile) {
    if (!supabase) return;

    const { data: lookupData, error: lookupError } = await supabase
      .from('mai_code_lookup')
      .select('mai_user_id,full_name,first_name,last_name,email,unit,mai_code,account_status,access_status,is_lookup_active,created_at')
      .eq('is_lookup_active', true);

    if (!lookupError && lookupData) {
      const directory = lookupData.map((item) => ({
        id: item.mai_user_id,
        name: item.full_name || `${item.first_name || ''} ${item.last_name || ''}`.trim(),
        firstName: item.first_name,
        lastName: item.last_name,
        email: item.email,
        unit: item.unit,
        maiNumber: item.mai_code,
        accountStatus: item.account_status,
        accessStatus: item.access_status,
        isActive: item.is_lookup_active,
        createdAt: item.created_at
      }));

      setMaiDirectory(mergeMaiDirectory(directory));
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id,full_name,email,unit,mai_number,account_type,subscription_status,lifetime_mai_access,dev_test_access,created_at')
      .not('mai_number', 'is', null);

    if (error) {
      const { data: basicData, error: basicError } = await supabase
        .from('profiles')
        .select('id,full_name,email,unit,mai_number,account_type,created_at')
        .not('mai_number', 'is', null);

      if (basicError) return;

      const basicDirectory = basicData
        .filter((item) => ['MAI', 'Owner/Developer'].includes(item.account_type))
        .map((item) => ({
          id: item.id,
          name: item.full_name,
          email: item.email,
          unit: item.unit,
          maiNumber: item.mai_number,
          accountStatus: item.account_type,
          accessStatus: item.account_type === 'Owner/Developer' ? 'owner_free' : 'unknown',
          isActive: true,
          createdAt: item.created_at
        }));

      setMaiDirectory(mergeMaiDirectory(basicDirectory));
      return;
    }

    const directory = data
      .filter((item) => isActiveMaiLookupProfile(item))
      .map((item) => ({
        id: item.id,
        name: item.full_name,
        email: item.email,
        unit: item.unit,
        maiNumber: item.mai_number,
        accountStatus: item.account_type,
        accessStatus: getMaiAccessStatus(item),
        isActive: true,
        createdAt: item.created_at
      }));

    setMaiDirectory(mergeMaiDirectory(directory));
  }

  function applyProfile(profileData) {
    const accountRole = getEffectiveAccountRole(profileData.account_type);
    setProfile(profileData);
    setActiveRole(accountRole);
    setSubscription(getProfileSubscription(profileData));

    if (accountRole === 'MAI') {
      setMaiUser({
        ...currentMai,
        name: profileData.full_name,
        email: profileData.email,
        unit: profileData.unit || currentMai.unit,
        maiNumber: profileData.mai_number
      });
    } else {
      setBeltUser({
        ...currentBeltUser,
        name: profileData.full_name,
        email: profileData.email,
        unit: profileData.unit || currentBeltUser.unit,
        beltLevel: profileData.belt_level || currentBeltUser.beltLevel
      });
    }
  }

  const submitLog = async (log) => {
    const matchedMai = findMaiByNumber(log.maiNumber);

    if (!matchedMai?.id && supabase) {
      throw new Error('That MAI code does not match an active MAI account. Check the code and try again.');
    }

    if (!matchedMai && !supabase) {
      throw new Error('That MAI code does not match an active MAI account. Check the code and try again.');
    }

    const newLog = {
      id: crypto.randomUUID?.() || Date.now(),
      beltUserId: currentUserId,
      marine: beltUser.name,
      submittedAt: new Date().toISOString().slice(0, 10),
      status: 'Pending',
      assignedMaiUserId: matchedMai?.id || null,
      assignedMaiName: matchedMai?.name || '',
      ...log
    };

    if (!supabase || !currentUserId) {
      setLogs((currentLogs) => [newLog, ...currentLogs]);
      return newLog;
    }

    const { data, error } = await supabase
      .from('training_logs')
      .insert({
        belt_user_id: currentUserId,
        marine_name: beltUser.name,
        date: log.date,
        hours: log.hours,
        minutes: log.minutes,
        belt_level: log.beltLevel,
        target_belt: log.targetBelt,
        class_code: log.classCode,
        technique_name: log.techniqueName,
        submitter_role: log.submitterRole || activeRole,
        assigned_mai_user_id: matchedMai.id,
        assigned_mai_name: matchedMai.name,
        description: log.description,
        mai_number: log.maiNumber,
        status: 'Pending'
      })
      .select()
      .single();

    if (error) {
      setAuthMessage(error.message);
      throw error;
    }

    const savedLog = mapLogFromSupabase(data);
    setLogs((currentLogs) => [savedLog, ...currentLogs]);
    return savedLog;
  };

  const submitMaiLog = async (log) => {
    const matchedMai = findMaiByNumber(log.maiNumber);

    if (log.maiNumber?.toLowerCase() === maiUser.maiNumber?.toLowerCase()) {
      throw new Error('Choose another MAI for verification. MAIs cannot verify their own hours.');
    }

    if (!matchedMai?.id && supabase) {
      throw new Error('That MAI code does not match an active MAI account. Check the code and try again.');
    }

    const newLog = {
      id: crypto.randomUUID?.() || Date.now(),
      beltUserId: currentUserId,
      marine: maiUser.name,
      submittedAt: new Date().toISOString().slice(0, 10),
      status: 'Pending',
      submitterRole: 'MAI',
      assignedMaiUserId: matchedMai?.id || null,
      assignedMaiName: matchedMai?.name || '',
      ...log
    };

    if (!supabase || !currentUserId) {
      setLogs((currentLogs) => [newLog, ...currentLogs]);
      return newLog;
    }

    const { data, error } = await supabase
      .from('training_logs')
      .insert({
        belt_user_id: currentUserId,
        marine_name: maiUser.name,
        date: log.date,
        hours: log.hours,
        minutes: log.minutes,
        belt_level: log.beltLevel,
        target_belt: log.targetBelt,
        class_code: log.classCode,
        technique_name: log.techniqueName,
        submitter_role: 'MAI',
        assigned_mai_user_id: matchedMai.id,
        assigned_mai_name: matchedMai.name,
        description: log.description,
        mai_number: log.maiNumber,
        status: 'Pending'
      })
      .select()
      .single();

    if (error) {
      setAuthMessage(error.message);
      throw error;
    }

    const savedLog = mapLogFromSupabase(data);
    setLogs((currentLogs) => [savedLog, ...currentLogs]);
    return savedLog;
  };

  const updatePendingLog = async (logId, updates) => {
    const existingLog = logs.find((log) => log.id === logId);
    if (!existingLog) throw new Error('This log could not be found.');
    if (existingLog.status !== 'Pending') throw new Error('Only pending logs can be edited.');
    if (currentUserId && existingLog.beltUserId !== currentUserId) throw new Error('You can only edit your own logs.');

    const matchedMai = findMaiByNumber(updates.maiNumber);
    if (!matchedMai?.id && supabase) {
      throw new Error('That MAI code does not match an active MAI account. Check the code and try again.');
    }
    if (!matchedMai && !supabase) {
      throw new Error('That MAI code does not match an active MAI account. Check the code and try again.');
    }

    const nextLog = {
      ...existingLog,
      ...updates,
      status: 'Pending',
      assignedMaiUserId: matchedMai?.id || null,
      assignedMaiName: matchedMai?.name || '',
      editHistory: [
        ...(existingLog.editHistory || []),
        buildLogHistoryEntry('pending_edit', existingLog, updates)
      ]
    };

    if (!supabase || !currentUserId) {
      setLogs((currentLogs) => currentLogs.map((log) => (log.id === logId ? nextLog : log)));
      return nextLog;
    }

    const { data, error } = await supabase
      .from('training_logs')
      .update({
        belt_level: updates.beltLevel,
        target_belt: updates.targetBelt,
        class_code: updates.classCode,
        technique_name: updates.techniqueName,
        hours: updates.hours,
        minutes: updates.minutes,
        description: updates.description,
        mai_number: updates.maiNumber,
        assigned_mai_user_id: matchedMai.id,
        assigned_mai_name: matchedMai.name,
        status: 'Pending',
        edit_history: nextLog.editHistory
      })
      .eq('id', logId)
      .eq('belt_user_id', currentUserId)
      .eq('status', 'Pending')
      .select()
      .single();

    if (error) {
      setAuthMessage(error.message);
      throw error;
    }

    const savedLog = mapLogFromSupabase(data);
    setLogs((currentLogs) => currentLogs.map((log) => (log.id === logId ? savedLog : log)));
    return savedLog;
  };

  const cancelPendingLog = async (logId) => {
    const existingLog = logs.find((log) => log.id === logId);
    if (!existingLog) throw new Error('This log could not be found.');
    if (existingLog.status !== 'Pending') throw new Error('Only pending logs can be canceled.');
    if (currentUserId && existingLog.beltUserId !== currentUserId) throw new Error('You can only cancel your own logs.');

    if (!supabase || !currentUserId) {
      setLogs((currentLogs) => currentLogs.filter((log) => log.id !== logId));
      return;
    }

    const { error } = await supabase
      .from('training_logs')
      .delete()
      .eq('id', logId)
      .eq('belt_user_id', currentUserId)
      .eq('status', 'Pending');

    if (error) {
      setAuthMessage(error.message);
      throw error;
    }

    setLogs((currentLogs) => currentLogs.filter((log) => log.id !== logId));
  };

  const verifyLog = async (logId) => {
    const logToVerify = logs.find((log) => log.id === logId);
    if (logToVerify?.submitterRole === 'MAI' && logToVerify?.beltUserId === currentUserId) {
      setAuthMessage('MAIs cannot verify their own submitted hours.');
      throw new Error('MAIs cannot verify their own submitted hours.');
    }

    const logsForOverflow = supabase && logToVerify?.beltUserId
      ? await loadSubmitterVerifiedLogsForOverflow(logToVerify.beltUserId)
      : logs;
    const overflow = calculateVerificationOverflow(logToVerify, logsForOverflow);

    if (!supabase || !currentUserId) {
      setLogs((currentLogs) =>
        currentLogs.map((log) =>
          log.id === logId
            ? {
                ...log,
                status: 'Verified',
                verifiedAt: new Date().toISOString().slice(0, 10),
                verifiedBy: maiUser.name,
                verifiedByMaiNumber: maiUser.maiNumber,
                appliedMinutes: overflow.appliedMinutes,
                extraMinutes: overflow.extraMinutes
              }
            : log
        )
      );
      return;
    }

    const { error } = await supabase
      .from('training_logs')
      .update({
        status: 'Verified',
        verified_by: currentUserId,
        verified_at: new Date().toISOString(),
        applied_minutes: overflow.appliedMinutes,
        extra_minutes: overflow.extraMinutes
      })
      .eq('id', logId);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    await loadLogs();
  };

  async function loadSubmitterVerifiedLogsForOverflow(submitterId) {
    const { data, error } = await supabase
      .from('training_logs')
      .select('*')
      .eq('belt_user_id', submitterId)
      .eq('status', 'Verified');

    if (error || !data) return logs;
    return mergeLogsById(logs, data.map(mapLogFromSupabase));
  }

  const returnLog = async (logId, reason = 'Needs correction', message = 'Please add more detail and resubmit this log.') => {
    if (!supabase || !currentUserId) {
      setLogs((currentLogs) =>
        currentLogs.map((log) =>
          log.id === logId
            ? {
                ...log,
                status: 'Returned',
                returnedAt: new Date().toISOString().slice(0, 10),
                returnedBy: maiUser.name,
                returnedByMaiNumber: maiUser.maiNumber,
                returnReason: reason,
                returnMessage: message
              }
            : log
        )
      );
      return;
    }

    const { error } = await supabase
      .from('training_logs')
      .update({
        status: 'Returned',
        return_reason: reason,
        return_message: message
      })
      .eq('id', logId);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    await loadLogs();
  };

  const resubmitLog = async (logId, updates) => {
    const existingLog = logs.find((log) => log.id === logId);
    if (!existingLog) throw new Error('This log could not be found.');
    if (existingLog.status !== 'Returned') throw new Error('Only returned logs can be resubmitted.');
    if (currentUserId && existingLog.beltUserId !== currentUserId) throw new Error('You can only resubmit your own logs.');

    const matchedMai = findMaiByNumber(updates.maiNumber || existingLog.maiNumber);
    if (!matchedMai?.id && supabase) {
      throw new Error('That MAI code does not match an active MAI account. Check the code and try again.');
    }
    if (!matchedMai && !supabase) {
      throw new Error('That MAI code does not match an active MAI account. Check the code and try again.');
    }

    const nextLog = {
      ...existingLog,
      ...updates,
      status: 'Pending',
      assignedMaiUserId: matchedMai?.id || null,
      assignedMaiName: matchedMai?.name || '',
      resubmittedAt: new Date().toISOString(),
      editHistory: [
        ...(existingLog.editHistory || []),
        buildLogHistoryEntry('returned_resubmit', existingLog, updates)
      ]
    };

    if (!supabase || !currentUserId) {
      setLogs((currentLogs) => currentLogs.map((log) => (log.id === logId ? nextLog : log)));
      return nextLog;
    }

    const { data, error } = await supabase
      .from('training_logs')
      .update({
        belt_level: updates.beltLevel,
        target_belt: updates.targetBelt,
        class_code: updates.classCode,
        technique_name: updates.techniqueName,
        hours: updates.hours,
        minutes: updates.minutes,
        description: updates.description,
        mai_number: updates.maiNumber,
        assigned_mai_user_id: matchedMai.id,
        assigned_mai_name: matchedMai.name,
        status: 'Pending',
        resubmitted_at: nextLog.resubmittedAt,
        edit_history: nextLog.editHistory
      })
      .eq('id', logId)
      .eq('belt_user_id', currentUserId)
      .eq('status', 'Returned')
      .select()
      .single();

    if (error) {
      setAuthMessage(error.message);
      throw error;
    }

    const savedLog = mapLogFromSupabase(data);
    setLogs((currentLogs) => currentLogs.map((log) => (log.id === logId ? savedLog : log)));
    return savedLog;
  };

  const findMaiByNumber = (maiNumber = '') =>
    maiDirectory.find((mai) =>
      mai.isActive !== false &&
      isRealMaiOption(mai) &&
      mai.maiNumber?.trim().toLowerCase() === maiNumber.trim().toLowerCase()
    ) || null;

  const saveDraft = (draft) => {
    setSavedDraft(draft);
    localStorage.setItem('mcmap-log-draft', JSON.stringify(draft));
  };

  const clearDraft = () => {
    setSavedDraft(null);
    localStorage.removeItem('mcmap-log-draft');
  };

  const createAccount = async ({ role, name, email, password, beltLevel }) => {
    setAuthMessage('');
    const maiNumber = role === 'MAI' ? `MAI-${Math.floor(2000 + Math.random() * 7000)}` : null;

    if (!supabase) {
      if (import.meta.env.PROD) {
        throw new Error('Supabase is not configured for this deployment.');
      }
      return createMockAccount({ role, name, email, beltLevel, maiNumber });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          account_type: role,
          belt_level: beltLevel,
          unit: role === 'MAI' ? currentMai.unit : currentBeltUser.unit,
          mai_number: maiNumber
        },
        emailRedirectTo: `${window.location.origin}/login`
      }
    });

    if (error) {
      setAuthMessage(error.message);
      throw error;
    }

    const profilePayload = {
      ...(data.user?.id ? { id: data.user.id } : {}),
      full_name: name,
      email,
      account_type: role,
      belt_level: beltLevel,
      unit: role === 'MAI' ? currentMai.unit : currentBeltUser.unit,
      mai_number: maiNumber,
      subscription_status: role === 'MAI' ? 'unpaid' : 'free',
      welcome_seen: false
    };

    if (data.session) {
      if (!data.user?.id) {
        const signupError = new Error('Account creation did not return a user ID. Please try again.');
        setAuthMessage(signupError.message);
        throw signupError;
      }

      await supabase.from('profiles').upsert(profilePayload);
      applyProfile(profilePayload);
    }

    return {
      ...profilePayload,
      needsEmailConfirmation: !data.session
    };
  };

  const signIn = async ({ email, password }) => {
    setAuthMessage('');

    if (!supabase) {
      if (import.meta.env.PROD) {
        throw new Error('Supabase is not configured for this deployment.');
      }
      setActiveRole('Belt User');
      return { account_type: 'Belt User' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setAuthMessage(error.message);
      throw error;
    }

    setSession(data.session);
    const signedInProfile = await loadProfileAndLogs(data.user.id);
    return signedInProfile;
  };

  const markWelcomeSeen = async () => {
    if (!profile) return;

    const updatedProfile = {
      ...profile,
      welcome_seen: true
    };

    if (!supabase || !currentUserId) {
      applyProfile(updatedProfile);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ welcome_seen: true })
      .eq('id', currentUserId);

    if (error) {
      setAuthMessage(error.message);
      throw error;
    }

    applyProfile(updatedProfile);
  };

  const requestPasswordReset = async (email) => {
    setAuthMessage('');

    if (!supabase) {
      if (import.meta.env.PROD) {
        throw new Error('Supabase is not configured for this deployment.');
      }
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      setAuthMessage(error.message);
      throw error;
    }
  };

  const updatePassword = async (password) => {
    setAuthMessage('');

    if (!supabase) {
      if (import.meta.env.PROD) {
        throw new Error('Supabase is not configured for this deployment.');
      }
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setAuthMessage(error.message);
      throw error;
    }
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setProfile(null);
    setLogs(trainingLogs);
    setMessageThreads(mockMessageThreads);
    setActiveRole('Belt User');
    setSubscription(getProfileSubscription({ account_type: 'Belt User' }));
    setMaiDirectory(fallbackMaiDirectory);
  };

  const deleteAccount = async () => {
    const accessToken = await getFreshAccessToken();

    if (!accessToken) {
      throw new Error('Log in before deleting your account.');
    }

    const response = await fetch('/api/delete-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      }
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'Unable to delete this account.');
    }

    await signOut();
    return data;
  };

  const updateAccount = async ({ email, unit }) => {
    setAuthMessage('');

    const trimmedEmail = email.trim();
    const trimmedUnit = unit.trim();
    const accountUpdate = {
      email: trimmedEmail,
      unit: trimmedUnit
    };

    if (!supabase || !currentUserId) {
      if (activeRole === 'MAI') {
        const updatedMai = { ...maiUser, ...accountUpdate };
        setMaiUser(updatedMai);
        return { emailConfirmationRequired: false };
      }

      const updatedBeltUser = { ...beltUser, ...accountUpdate };
      setBeltUser(updatedBeltUser);
      return { emailConfirmationRequired: false };
    }

    const currentEmail = profile?.email || session?.user?.email || '';
    let emailConfirmationRequired = false;

    if (trimmedEmail && trimmedEmail.toLowerCase() !== currentEmail.toLowerCase()) {
      const { data, error } = await supabase.auth.updateUser(
        { email: trimmedEmail },
        { emailRedirectTo: `${window.location.origin}/profile` }
      );

      if (error) {
        setAuthMessage(error.message);
        throw error;
      }

      emailConfirmationRequired = Boolean(data.user?.new_email);
    }

    const updatedProfile = {
      ...profile,
      email: trimmedEmail,
      unit: trimmedUnit
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        email: trimmedEmail,
        unit: trimmedUnit
      })
      .eq('id', currentUserId);

    if (profileError) {
      setAuthMessage(profileError.message);
      throw profileError;
    }

    applyProfile(updatedProfile);
    return { emailConfirmationRequired };
  };

  const advanceBeltUser = async (nextBelt) => {
    const advancedAt = new Date().toISOString();

    if (!supabase || !currentUserId) {
      const updatedBeltUser = {
        ...beltUser,
        beltLevel: nextBelt
      };
      setBeltUser(updatedBeltUser);
      setProfile((currentProfile) => currentProfile
        ? { ...currentProfile, belt_level: nextBelt, belt_advanced_at: advancedAt }
        : currentProfile
      );
      return updatedBeltUser;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        belt_level: nextBelt,
        belt_advanced_at: advancedAt
      })
      .eq('id', currentUserId);

    if (error) {
      if (!error.message?.toLowerCase().includes('belt_advanced_at')) {
        setAuthMessage(error.message);
        throw error;
      }

      const { error: fallbackError } = await supabase
        .from('profiles')
        .update({ belt_level: nextBelt })
        .eq('id', currentUserId);

      if (fallbackError) {
        setAuthMessage(fallbackError.message);
        throw fallbackError;
      }
    }

    const updatedProfile = {
      ...profile,
      belt_level: nextBelt,
      belt_advanced_at: advancedAt
    };

    applyProfile(updatedProfile);
    return updatedProfile;
  };

  const createMockAccount = ({ role, name, email, beltLevel, maiNumber }) => {
    setActiveRole(role);

    if (role === 'MAI') {
      const assignedNumber = maiNumber || `MAI-${Math.floor(2000 + Math.random() * 7000)}`;
      const updatedMai = {
        ...maiUser,
        name: name || maiUser.name,
        email: email || 'avery.morgan@example.mil',
        maiNumber: assignedNumber
      };
      setMaiUser(updatedMai);
      return updatedMai;
    }

    const updatedBeltUser = {
      ...beltUser,
      name: name || beltUser.name,
      email: email || beltUser.email,
      beltLevel: beltLevel || beltUser.beltLevel
    };
    setBeltUser(updatedBeltUser);
    return updatedBeltUser;
  };

  const sendMessage = async ({ threadId, body, targetMaiNumber }) => {
    const cleanBody = body.trim();
    if (!cleanBody) return null;

    const existingMaiThread = !threadId && activeRole === 'MAI'
      ? findExistingMaiToMaiThread({ currentMaiNumber: maiUser.maiNumber, targetMaiNumber, threads: messageThreads })
      : null;
    const existingBeltThread = !threadId && activeRole === 'Belt User'
      ? findExistingBeltToMaiThread({ beltUserEmail: beltUser.email, targetMaiNumber, threads: messageThreads })
      : null;
    const thread = threadId
      ? messageThreads.find((item) => item.id === threadId)
      : existingMaiThread
        ? existingMaiThread
      : existingBeltThread
        ? existingBeltThread
      : activeRole === 'MAI'
        ? buildMaiToMaiThread({ targetMaiNumber, maiUser, maiDirectory })
        : buildThreadForMai({ targetMaiNumber, beltUser, maiDirectory });

    if (!thread) {
      throw new Error('That MAI code does not match an active MAI account.');
    }

    const message = {
      id: crypto.randomUUID?.() || `msg-${Date.now()}`,
      senderKey: currentMessageKey,
      senderId: currentUserId,
      recipientKey: getThreadRecipientKey({ activeRole, thread, senderKey: currentMessageKey }),
      recipientId: getThreadRecipientId({ activeRole, maiDirectory, thread, senderKey: currentMessageKey }),
      senderName: activeRole === 'MAI' ? maiUser.name : beltUser.name,
      body: cleanBody,
      createdAt: new Date().toISOString(),
      seenAt: null,
      readBy: currentReadKeys
    };

    if (!supabase || !currentUserId) {
      setMessageThreads((currentThreads) => {
        const existingThread = currentThreads.find((item) => item.id === thread.id);
        if (existingThread) {
          return currentThreads.map((item) =>
            item.id === thread.id ? { ...item, messages: [...item.messages, message] } : item
          );
        }

        return [{ ...thread, messages: [message] }, ...currentThreads];
      });

      return { message, threadId: thread.id };
    }

    let savedThread = thread;

    if (!threadId) {
      const threadPayload = thread.threadType === 'mai_mai'
        ? {
            thread_type: 'mai_mai',
            initiating_mai_user_id: currentUserId,
            initiating_mai_name: maiUser.name,
            initiating_mai_number: maiUser.maiNumber,
            recipient_mai_user_id: thread.recipientMaiUserId,
            recipient_mai_name: thread.recipientMaiName,
            recipient_mai_number: thread.recipientMaiNumber,
            belt_user_name: maiUser.name,
            belt_user_email: maiUser.maiNumber,
            mai_number: thread.recipientMaiNumber,
            mai_name: thread.recipientMaiName
          }
        : {
            thread_type: 'belt_mai',
            belt_user_id: currentUserId,
            belt_user_name: beltUser.name,
            belt_user_email: beltUser.email,
            mai_number: thread.maiNumber,
            mai_name: thread.maiName
          };

      const { data: threadData, error: threadError } = await supabase
        .from('message_threads')
        .insert(threadPayload)
        .select()
        .single();

      if (threadError) {
        setAuthMessage(threadError.message);
        throw threadError;
      }

      savedThread = mapThreadFromSupabase({ ...threadData, messages: [] });
    }

    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        thread_id: savedThread.id,
        sender_id: currentUserId,
        sender_key: currentMessageKey,
        recipient_id: getThreadRecipientId({ activeRole, maiDirectory, thread: savedThread, senderKey: currentMessageKey }),
        recipient_key: getThreadRecipientKey({ activeRole, thread: savedThread, senderKey: currentMessageKey }),
        sender_name: activeRole === 'MAI' ? maiUser.name : beltUser.name,
        body: cleanBody,
        read_by: currentReadKeys
      })
      .select()
      .single();

    if (messageError) {
      setAuthMessage(messageError.message);
      throw messageError;
    }

    const savedMessage = mapMessageFromSupabase(messageData);

    setMessageThreads((currentThreads) => {
      const existingThread = currentThreads.find((item) => item.id === thread.id);
      if (existingThread) {
        return currentThreads.map((item) =>
          item.id === thread.id ? { ...item, messages: [...item.messages, savedMessage] } : item
        );
      }

      return [{ ...savedThread, messages: [savedMessage] }, ...currentThreads];
    });

    return { message: savedMessage, threadId: savedThread.id };
  };

  const markThreadRead = React.useCallback(async (threadId) => {
    const thread = messageThreads.find((item) => item.id === threadId);
    if (!thread) return;

    const unreadMessages = thread.messages.filter(
      (message) => isMessageUnreadForCurrentUser(message, currentUserId)
    );
    if (!unreadMessages.length) return;

    const seenAt = new Date().toISOString();
    const updatedMessages = unreadMessages.map((message) => ({
      ...message,
      seenAt: message.seenAt || seenAt,
      readBy: mergeReadKeys(message.readBy, currentReadKeys)
    }));

    setMessageThreads((currentThreads) =>
      currentThreads.map((currentThread) =>
        currentThread.id === threadId
          ? {
              ...currentThread,
              messages: currentThread.messages.map((message) =>
                !isMessageUnreadForCurrentUser(message, currentUserId)
                  ? message
                  : { ...message, seenAt: message.seenAt || seenAt, readBy: mergeReadKeys(message.readBy, currentReadKeys) }
              )
            }
          : currentThread
      )
    );

    if (!supabase) return;

    const results = await Promise.all(
      updatedMessages.map((message) =>
        supabase
          .from('messages')
          .update({ read_by: message.readBy, seen_at: message.seenAt })
          .eq('id', message.id)
          .eq('recipient_id', currentUserId)
          .is('seen_at', null)
      )
    );

    const updateError = results.find((result) => result.error)?.error;
    if (updateError) {
      setAuthMessage(updateError.message);
    }
  }, [currentReadKeys, currentUserId, messageThreads, supabase]);

  const refreshAccount = async () => {
    if (!supabase || !currentUserId) return null;
    return loadProfileAndLogs(currentUserId);
  };

  const getFreshAccessToken = async () => {
    if (!supabase) return session?.access_token || '';

    const { data: currentData } = await supabase.auth.getSession();
    let currentSession = currentData.session;

    if (!currentSession?.access_token) {
      setSession(null);
      return '';
    }

    const expiresInSeconds = currentSession.expires_at ? currentSession.expires_at - Math.floor(Date.now() / 1000) : 0;

    if (expiresInSeconds < 300) {
      const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError) {
        setSession(null);
        throw new Error('Your login session could not be refreshed. Sign out, sign back in, then try again.');
      }

      currentSession = refreshedData.session;
    }

    if (!currentSession?.access_token) {
      setSession(null);
      return '';
    }

    const { error: userError } = await supabase.auth.getUser(currentSession.access_token);

    if (userError) {
      setSession(null);
      throw new Error('Your login session could not be confirmed. Sign out, sign back in, then try again.');
    }

    setSession(currentSession);
    return currentSession.access_token;
  };

  const value = {
    activeRole,
    setActiveRole,
    beltUser,
    maiUser,
    profile,
    session,
    loading,
    authMessage,
    isSupabaseEnabled,
    isProductionBuild,
    supabaseConfigStatus,
    logs,
    beltLogs,
    assignedMaiLogs,
    maiSubmittedLogs,
    messageThreads: visibleMessageThreads,
    unreadMessageCount,
    pendingLogs,
    verifiedLogs,
    returnedLogs,
    urgentCount,
    maiDirectory,
    savedDraft,
    subscription,
    displaySubscription,
    hasPaidMaiAccess,
    subscriptionPlans,
    submitLog,
    submitMaiLog,
    sendMessage,
    markThreadRead,
    verifyLog,
    returnLog,
    updatePendingLog,
    cancelPendingLog,
    resubmitLog,
    findMaiByNumber,
    saveDraft,
    clearDraft,
    createAccount,
    createMockAccount,
    signIn,
    requestPasswordReset,
    updatePassword,
    signOut,
    deleteAccount,
    updateAccount,
    advanceBeltUser,
    markWelcomeSeen,
    refreshAccount,
    getFreshAccessToken
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function mapLogFromSupabase(row) {
  return {
    id: row.id,
    beltUserId: row.belt_user_id,
    marine: row.marine_name,
    date: row.date,
    hours: Number(row.hours),
    minutes: Number(row.minutes ?? Math.round(Number(row.hours || 0) * 60)),
    beltLevel: row.belt_level,
    targetBelt: row.target_belt || row.belt_level,
    classCode: row.class_code,
    techniqueName: row.technique_name,
    submitterRole: row.submitter_role || 'Belt User',
    assignedMaiUserId: row.assigned_mai_user_id,
    assignedMaiName: row.assigned_mai_name,
    description: row.description,
    maiNumber: row.mai_number,
    status: row.status,
    appliedMinutes: Number(row.applied_minutes ?? row.minutes ?? Math.round(Number(row.hours || 0) * 60)),
    extraMinutes: Number(row.extra_minutes ?? 0),
    source: row.source || row.verification_source || '',
    verificationSource: row.verification_source || '',
    returnReason: row.return_reason,
    returnMessage: row.return_message,
    resubmittedAt: row.resubmitted_at,
    editHistory: row.edit_history || [],
    submittedAt: row.created_at?.slice(0, 10),
    verifiedAt: row.verified_at?.slice(0, 10),
    verifiedBy: row.source === 'Account Creation' || row.source === 'Account Creation Backfill' || row.verification_source === 'Account Creation' ? 'Upon Account Creation' : row.verified_by ? 'Verified MAI' : null,
    verifiedByMaiNumber: row.verified_by ? row.mai_number : null
  };
}

function buildLogHistoryEntry(action, previousLog, updates) {
  return {
    action,
    changedAt: new Date().toISOString(),
    previous: {
      targetBelt: previousLog.targetBelt,
      beltLevel: previousLog.beltLevel,
      classCode: previousLog.classCode,
      techniqueName: previousLog.techniqueName,
      hours: previousLog.hours,
      minutes: previousLog.minutes,
      maiNumber: previousLog.maiNumber,
      assignedMaiUserId: previousLog.assignedMaiUserId,
      assignedMaiName: previousLog.assignedMaiName,
      status: previousLog.status
    },
    next: {
      targetBelt: updates.targetBelt,
      beltLevel: updates.beltLevel,
      classCode: updates.classCode,
      techniqueName: updates.techniqueName,
      hours: updates.hours,
      minutes: updates.minutes,
      maiNumber: updates.maiNumber
    }
  };
}

function calculateVerificationOverflow(logToVerify, allLogs) {
  const submittedMinutes = getLogMinutes(logToVerify);
  const targetBelt = logToVerify?.targetBelt || logToVerify?.beltLevel;
  const requirement = getBeltRequirements(targetBelt).find(
    (item) => getRequirementKey(item.code, item.name) === getRequirementKey(logToVerify?.classCode, logToVerify?.techniqueName)
  );

  if (!logToVerify || targetBelt === additionalMcmapHoursTarget || !requirement?.requiredMinutes) {
    return {
      appliedMinutes: submittedMinutes,
      extraMinutes: 0
    };
  }

  const alreadyAppliedMinutes = allLogs
    .filter((log) =>
      log.id !== logToVerify.id &&
      log.status === 'Verified' &&
      isSameSubmitter(log, logToVerify) &&
      getRequirementKey(log.classCode, log.techniqueName) === getRequirementKey(logToVerify.classCode, logToVerify.techniqueName) &&
      normalizeBeltName(log.targetBelt || log.beltLevel) === normalizeBeltName(targetBelt)
    )
    .reduce((total, log) => total + Number(log.appliedMinutes ?? getLogMinutes(log)), 0);

  const neededMinutes = Math.max(requirement.requiredMinutes - Math.min(alreadyAppliedMinutes, requirement.requiredMinutes), 0);
  const appliedMinutes = Math.min(submittedMinutes, neededMinutes);

  return {
    appliedMinutes,
    extraMinutes: Math.max(submittedMinutes - appliedMinutes, 0)
  };
}

function isSameSubmitter(log, comparisonLog) {
  if (log.beltUserId && comparisonLog.beltUserId) return log.beltUserId === comparisonLog.beltUserId;
  return log.marine === comparisonLog.marine;
}

function getRequirementKey(code, name) {
  return `${code || ''}::${name || ''}`.toLowerCase();
}

function getLogMinutes(log = {}) {
  return Number(log.minutes ?? Math.round(Number(log.hours || 0) * 60));
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

function mapThreadFromSupabase(row) {
  const thread = {
    id: row.id,
    threadType: row.thread_type || 'belt_mai',
    beltUserId: row.belt_user_id,
    beltUserName: row.belt_user_name,
    beltUserEmail: row.belt_user_email,
    maiName: row.mai_name,
    maiNumber: row.mai_number,
    initiatingMaiUserId: row.initiating_mai_user_id,
    initiatingMaiName: row.initiating_mai_name,
    initiatingMaiNumber: row.initiating_mai_number,
    recipientMaiUserId: row.recipient_mai_user_id,
    recipientMaiName: row.recipient_mai_name,
    recipientMaiNumber: row.recipient_mai_number
  };

  return {
    ...thread,
    messages: (row.messages || [])
      .map((message) => mapMessageFromSupabase(message, thread))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  };
}

function mapMessageFromSupabase(row, thread = null) {
  const inferredRecipientKey = getInferredRecipientKey(row, thread);

  return {
    id: row.id,
    senderId: row.sender_id,
    senderKey: row.sender_key,
    recipientId: row.recipient_id,
    recipientKey: row.recipient_key || inferredRecipientKey,
    senderName: row.sender_name,
    body: row.body,
    createdAt: row.created_at,
    seenAt: row.seen_at,
    readBy: row.read_by || []
  };
}

function isMessageFromCurrentUser(message, { currentUserId, currentMessageKey }) {
  return Boolean(
    (currentUserId && message.senderId === currentUserId) ||
    (currentMessageKey && message.senderKey === currentMessageKey)
  );
}

function isMessageUnreadForCurrentUser(message, currentUserId) {
  return Boolean(currentUserId && message.recipientId === currentUserId && !message.seenAt);
}

function mergeReadKeys(existingKeys = [], nextKeys = []) {
  return [...new Set([...existingKeys, ...nextKeys].filter(Boolean))];
}

function getThreadRecipientKey({ activeRole, thread, senderKey }) {
  if (thread.threadType === 'mai_mai') {
    return activeRole === 'MAI' && thread.initiatingMaiNumber === senderKey
      ? thread.recipientMaiNumber
      : thread.initiatingMaiNumber;
  }

  return activeRole === 'MAI' ? thread.beltUserEmail : thread.maiNumber;
}

function getThreadRecipientId({ activeRole, maiDirectory = [], thread, senderKey }) {
  if (thread.threadType === 'mai_mai') {
    return senderKey === thread.initiatingMaiNumber ? thread.recipientMaiUserId || null : thread.initiatingMaiUserId || null;
  }

  if (activeRole === 'MAI') return thread.beltUserId || null;

  return maiDirectory.find((mai) => mai.maiNumber?.toLowerCase() === thread.maiNumber?.toLowerCase())?.id || null;
}

function mergeMaiDirectory(directory) {
  const byNumber = new Map();

  [...fallbackMaiDirectory, ...directory].forEach((mai) => {
    if (!mai?.maiNumber) return;
    byNumber.set(mai.maiNumber.toLowerCase(), {
      ...byNumber.get(mai.maiNumber.toLowerCase()),
      ...mai,
      isActive: mai.isActive !== false
    });
  });

  return [...byNumber.values()];
}

function mergeLogsById(...logGroups) {
  const byId = new Map();
  logGroups.flat().forEach((log) => byId.set(log.id, log));
  return [...byId.values()].sort((a, b) => new Date(b.submittedAt || b.date) - new Date(a.submittedAt || a.date));
}

function getProfileSubscription(profileData) {
  const accountRole = getEffectiveAccountRole(profileData.account_type);
  const hasLifetimeAccess = hasLifetimeMaiAccess(profileData);

  return {
    status: accountRole === 'MAI'
      ? hasLifetimeAccess
        ? 'lifetime_free'
        : profileData.subscription_status || (profileData.account_type === 'Owner/Developer' ? 'owner_free' : 'unpaid')
      : 'free',
    currentPeriodEnd: hasLifetimeAccess ? null : profileData.subscription_current_period_end,
    cancelAtPeriodEnd: hasLifetimeAccess ? false : Boolean(profileData.subscription_cancel_at_period_end),
    paymentMethod: null
  };
}

function hasLifetimeMaiAccess(profileData) {
  return Boolean(
    profileData?.lifetime_mai_access ||
    profileData?.dev_test_access ||
    profileData?.id === devTestMaiUserId
  );
}

function isActiveMaiLookupProfile(profileData) {
  return (
    ['MAI', 'Owner/Developer'].includes(profileData.account_type) &&
    Boolean(profileData.mai_number) &&
    ['active', 'trialing', 'owner_free', 'lifetime_free'].includes(getMaiAccessStatus(profileData))
  );
}

function getMaiAccessStatus(profileData) {
  if (hasLifetimeMaiAccess(profileData)) return 'lifetime_free';
  if (profileData.account_type === 'Owner/Developer') return 'owner_free';
  return profileData.subscription_status || 'unpaid';
}

function getEffectiveAccountRole(accountType) {
  return accountType === 'Owner/Developer' ? 'MAI' : accountType;
}

function getVisibleMessageThreads({ activeRole, beltUser, maiUser, messageThreads }) {
  if (activeRole === 'MAI') {
    return messageThreads.filter((thread) => {
      if (thread.threadType === 'mai_mai') {
        return [thread.initiatingMaiNumber, thread.recipientMaiNumber].some(
          (maiNumber) => maiNumber?.toLowerCase() === maiUser.maiNumber?.toLowerCase()
        );
      }

      return thread.maiNumber?.toLowerCase() === maiUser.maiNumber?.toLowerCase();
    });
  }

  return messageThreads.filter((thread) =>
    thread.threadType !== 'mai_mai' && thread.beltUserEmail?.toLowerCase() === beltUser.email?.toLowerCase()
  );
}

function buildThreadForMai({ targetMaiNumber, beltUser, maiDirectory }) {
  const mai = maiDirectory.find((item) => isRealMaiOption(item) && item.maiNumber?.toLowerCase() === targetMaiNumber?.toLowerCase());
  if (!mai) return null;

  return {
    id: `thread-${beltUser.email}-${targetMaiNumber}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    beltUserName: beltUser.name,
    beltUserEmail: beltUser.email,
    maiName: mai.name,
    maiNumber: mai.maiNumber,
    messages: []
  };
}

function findExistingBeltToMaiThread({ beltUserEmail, targetMaiNumber, threads }) {
  const target = targetMaiNumber?.trim().toLowerCase();
  const beltEmail = beltUserEmail?.trim().toLowerCase();
  if (!target || !beltEmail) return null;

  return threads.find((thread) =>
    thread.threadType !== 'mai_mai' &&
    thread.beltUserEmail?.toLowerCase() === beltEmail &&
    thread.maiNumber?.toLowerCase() === target
  ) || null;
}

function buildMaiToMaiThread({ targetMaiNumber, maiUser, maiDirectory }) {
  const cleanMaiNumber = targetMaiNumber?.trim();
  if (!cleanMaiNumber || cleanMaiNumber.toLowerCase() === maiUser.maiNumber?.toLowerCase()) return null;

  const recipientMai = maiDirectory.find((item) => isRealMaiOption(item) && item.maiNumber?.toLowerCase() === cleanMaiNumber.toLowerCase());
  if (!recipientMai?.id) return null;

  return {
    id: `thread-mai-${maiUser.maiNumber}-${recipientMai.maiNumber}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    threadType: 'mai_mai',
    initiatingMaiUserId: null,
    initiatingMaiName: maiUser.name,
    initiatingMaiNumber: maiUser.maiNumber,
    recipientMaiUserId: recipientMai.id,
    recipientMaiName: recipientMai.name,
    recipientMaiNumber: recipientMai.maiNumber,
    senderMaiNumber: maiUser.maiNumber,
    messages: []
  };
}

function isRealMaiOption(mai) {
  const name = mai?.name || mai?.fullName || '';
  const maiNumber = mai?.maiNumber || mai?.mai_code || '';

  return Boolean(
    maiNumber &&
    name.trim().toLowerCase() !== 'upon account creation' &&
    maiNumber.trim().toLowerCase() !== 'upon account creation'
  );
}

function findExistingMaiToMaiThread({ currentMaiNumber, targetMaiNumber, threads }) {
  const target = targetMaiNumber?.trim().toLowerCase();
  const current = currentMaiNumber?.trim().toLowerCase();
  if (!target || !current) return null;

  return threads.find((thread) => {
    if (thread.threadType !== 'mai_mai') return false;
    const participants = [thread.initiatingMaiNumber, thread.recipientMaiNumber].map((value) => value?.toLowerCase());
    return participants.includes(current) && participants.includes(target);
  }) || null;
}

function getInferredRecipientKey(row, thread) {
  if (!thread) return null;

  if (thread.threadType === 'mai_mai') {
    return row.sender_key === thread.initiatingMaiNumber ? thread.recipientMaiNumber : thread.initiatingMaiNumber;
  }

  return row.sender_key === thread.maiNumber ? thread.beltUserEmail : thread.maiNumber;
}

export function useApp() {
  const context = React.useContext(AppContext);

  if (!context) {
    throw new Error('useApp must be used inside AppProvider');
  }

  return context;
}
