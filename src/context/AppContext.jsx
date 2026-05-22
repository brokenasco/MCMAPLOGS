import React from 'react';
import { currentBeltUser, currentMai, trainingLogs } from '../data/mockData.js';
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
    label: '$84.99/year',
    requiresPayment: true,
    annualPrice: 84.99,
    monthlyDisplay: '$7/mo billed annually'
  }
};

export function AppProvider({ children }) {
  const [activeRole, setActiveRole] = React.useState('Belt User');
  const [beltUser, setBeltUser] = React.useState(currentBeltUser);
  const [maiUser, setMaiUser] = React.useState(currentMai);
  const [profile, setProfile] = React.useState(null);
  const [session, setSession] = React.useState(null);
  const [logs, setLogs] = React.useState(trainingLogs);
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
    status: 'trial',
    planName: subscriptionPlans['Belt User'].planName,
    annualPrice: subscriptionPlans['Belt User'].annualPrice,
    trialStartedAt: new Date().toISOString().slice(0, 10),
    trialEndsAt: addDays(new Date(), 30).toISOString().slice(0, 10),
    paymentMethod: null
  });

  const isSupabaseEnabled = Boolean(supabase);
  const isProductionBuild = import.meta.env.PROD;
  const currentUserId = session?.user?.id;
  const beltLogs = logs.filter((log) => log.beltUserId === currentUserId || log.marine === beltUser.name);
  const pendingLogs = logs.filter((log) => log.status === 'Pending');
  const verifiedLogs = logs.filter((log) => log.status === 'Verified');
  const returnedLogs = logs.filter((log) => log.status === 'Returned');
  const urgentCount = beltLogs.filter((log) => log.status === 'Returned').length;
  const maiDirectory = [
    {
      name: maiUser.name,
      maiNumber: maiUser.maiNumber,
      unit: maiUser.unit
    },
    {
      name: 'SSgt Cameron Reed',
      maiNumber: 'MAI-2497',
      unit: 'Weapons Training Detachment'
    }
  ];
  const currentPlan = subscriptionPlans[activeRole] || subscriptionPlans['Belt User'];
  const displaySubscription = {
    ...subscription,
    planName: currentPlan.planName,
    annualPrice: currentPlan.annualPrice,
    monthlyDisplay: currentPlan.monthlyDisplay,
    requiresPayment: currentPlan.requiresPayment,
    label: currentPlan.label
  };

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
    await loadLogs(profileData);
    return profileData;
  }

  async function loadLogs(profileData = profile) {
    if (!supabase || !profileData) return;

    const { data, error } = await supabase
      .from('training_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setLogs(data.map(mapLogFromSupabase));
  }

  function applyProfile(profileData) {
    setProfile(profileData);
    setActiveRole(profileData.account_type);

    if (profileData.account_type === 'MAI') {
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
    const newLog = {
      id: crypto.randomUUID?.() || Date.now(),
      beltUserId: currentUserId,
      marine: beltUser.name,
      submittedAt: new Date().toISOString().slice(0, 10),
      status: 'Pending',
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
        belt_level: log.beltLevel,
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

  const verifyLog = async (logId) => {
    if (!supabase || !currentUserId) {
      setLogs((currentLogs) =>
        currentLogs.map((log) =>
          log.id === logId
            ? {
                ...log,
                status: 'Verified',
                verifiedAt: new Date().toISOString().slice(0, 10),
                verifiedBy: maiUser.name,
                verifiedByMaiNumber: maiUser.maiNumber
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
        verified_at: new Date().toISOString()
      })
      .eq('id', logId);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    await loadLogs();
  };

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
    if (!supabase || !currentUserId) {
      setLogs((currentLogs) =>
        currentLogs.map((log) =>
          log.id === logId
            ? {
                ...log,
                ...updates,
                status: 'Pending',
                submittedAt: new Date().toISOString().slice(0, 10),
                returnedAt: null,
                returnedBy: null,
                returnedByMaiNumber: null,
                returnReason: null,
                returnMessage: null
              }
            : log
        )
      );
      return;
    }

    const { error } = await supabase
      .from('training_logs')
      .update({
        description: updates.description,
        status: 'Pending',
        return_reason: null,
        return_message: null
      })
      .eq('id', logId);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    await loadLogs();
  };

  const findMaiByNumber = (maiNumber) =>
    maiDirectory.find((mai) => mai.maiNumber?.toLowerCase() === maiNumber.trim().toLowerCase()) || null;

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
      mai_number: maiNumber
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

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setProfile(null);
    setLogs(trainingLogs);
    setActiveRole('Belt User');
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

  const startPaidSubscription = () => {
    setSubscription((current) => ({
      ...current,
      status: 'active',
      paymentMethod: 'Mock card ending in 4242'
    }));
  };

  const resetTrial = () => {
    setSubscription({
      status: 'trial',
      planName: currentPlan.planName,
      annualPrice: currentPlan.annualPrice,
      trialStartedAt: new Date().toISOString().slice(0, 10),
      trialEndsAt: addDays(new Date(), 30).toISOString().slice(0, 10),
      paymentMethod: null
    });
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
    pendingLogs,
    verifiedLogs,
    returnedLogs,
    urgentCount,
    maiDirectory,
    savedDraft,
    subscription,
    displaySubscription,
    subscriptionPlans,
    submitLog,
    verifyLog,
    returnLog,
    resubmitLog,
    findMaiByNumber,
    saveDraft,
    clearDraft,
    createAccount,
    createMockAccount,
    signIn,
    signOut,
    startPaidSubscription,
    resetTrial
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
    beltLevel: row.belt_level,
    description: row.description,
    maiNumber: row.mai_number,
    status: row.status,
    returnReason: row.return_reason,
    returnMessage: row.return_message,
    submittedAt: row.created_at?.slice(0, 10),
    verifiedAt: row.verified_at?.slice(0, 10),
    verifiedBy: row.verified_by ? 'Verified MAI' : null,
    verifiedByMaiNumber: row.verified_by ? row.mai_number : null
  };
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export function useApp() {
  const context = React.useContext(AppContext);

  if (!context) {
    throw new Error('useApp must be used inside AppProvider');
  }

  return context;
}
