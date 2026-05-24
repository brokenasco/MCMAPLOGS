import React from 'react';
import { currentBeltUser, currentMai, messageThreads as mockMessageThreads, trainingLogs } from '../data/mockData.js';
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
    trialDays: 90,
    monthlyDisplay: '$7/mo billed annually'
  }
};

const paidMaiAccessStatuses = ['active', 'trialing', 'owner_free'];

export function AppProvider({ children }) {
  const [activeRole, setActiveRole] = React.useState('Belt User');
  const [beltUser, setBeltUser] = React.useState(currentBeltUser);
  const [maiUser, setMaiUser] = React.useState(currentMai);
  const [maiDirectory, setMaiDirectory] = React.useState([currentMai, { name: 'SSgt Cameron Reed', maiNumber: 'MAI-2497', unit: 'Weapons Training Detachment' }]);
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
    ? assignedMaiLogs.filter((log) => isReturnedOrRejected(log.status))
    : beltLogs.filter((log) => isReturnedOrRejected(log.status));
  const urgentCount = beltLogs.filter((log) => isReturnedOrRejected(log.status)).length;
  const visibleMessageThreads = getVisibleMessageThreads({ activeRole, beltUser, maiUser, messageThreads });
  const unreadMessageCount = visibleMessageThreads.reduce(
    (total, thread) => total + thread.messages.filter((message) => !message.readBy?.includes(currentMessageKey)).length,
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
  const hasPaidMaiAccess = activeRole !== 'MAI' || paidMaiAccessStatuses.includes(displaySubscription.status);

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
    await loadLogs(profileData);
    await loadMessages(profileData);
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

    const { data, error } = await supabase
      .from('profiles')
      .select('id,full_name,email,unit,mai_number,account_type')
      .not('mai_number', 'is', null);

    if (error) {
      return;
    }

    const directory = data
      .filter((item) => ['MAI', 'Owner/Developer'].includes(item.account_type))
      .map((item) => ({
        id: item.id,
        name: item.full_name,
        email: item.email,
        unit: item.unit,
        maiNumber: item.mai_number
      }));

    setMaiDirectory(directory.length ? directory : [currentMai]);
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

  const verifyLog = async (logId) => {
    const logToVerify = logs.find((log) => log.id === logId);
    if (logToVerify?.submitterRole === 'MAI' && logToVerify?.beltUserId === currentUserId) {
      setAuthMessage('MAIs cannot verify their own submitted hours.');
      throw new Error('MAIs cannot verify their own submitted hours.');
    }

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

  const rejectLog = async (logId, reason = 'Rejected', message = 'This log was rejected by the MAI. Review the note before submitting a new log.') => {
    if (!supabase || !currentUserId) {
      setLogs((currentLogs) =>
        currentLogs.map((log) =>
          log.id === logId
            ? {
                ...log,
                status: 'Rejected',
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
        status: 'Rejected',
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

  const findMaiByNumber = (maiNumber = '') =>
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
      mai_number: maiNumber,
      subscription_status: role === 'MAI' ? 'unpaid' : 'free'
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

    const thread = threadId
      ? messageThreads.find((item) => item.id === threadId)
      : buildThreadForMai({ targetMaiNumber, beltUser, maiDirectory, beltLogs });

    if (!thread) {
      throw new Error('You can only message MAIs connected to your submitted logs.');
    }

    const message = {
      id: crypto.randomUUID?.() || `msg-${Date.now()}`,
      senderKey: currentMessageKey,
      senderName: activeRole === 'MAI' ? maiUser.name : beltUser.name,
      body: cleanBody,
      createdAt: new Date().toISOString(),
      readBy: [currentMessageKey]
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
      const { data: threadData, error: threadError } = await supabase
        .from('message_threads')
        .insert({
          belt_user_id: currentUserId,
          belt_user_name: beltUser.name,
          belt_user_email: beltUser.email,
          mai_number: thread.maiNumber,
          mai_name: thread.maiName
        })
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
        sender_name: activeRole === 'MAI' ? maiUser.name : beltUser.name,
        body: cleanBody,
        read_by: [currentMessageKey]
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

  const markThreadRead = (threadId) => {
    setMessageThreads((currentThreads) =>
      currentThreads.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              messages: thread.messages.map((message) =>
                message.readBy?.includes(currentMessageKey)
                  ? message
                  : { ...message, readBy: [...(message.readBy || []), currentMessageKey] }
              )
            }
          : thread
      )
    );
  };

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
    rejectLog,
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
    returnReason: row.return_reason,
    returnMessage: row.return_message,
    submittedAt: row.created_at?.slice(0, 10),
    verifiedAt: row.verified_at?.slice(0, 10),
    verifiedBy: row.verified_by ? 'Verified MAI' : null,
    verifiedByMaiNumber: row.verified_by ? row.mai_number : null
  };
}

function mapThreadFromSupabase(row) {
  return {
    id: row.id,
    beltUserName: row.belt_user_name,
    beltUserEmail: row.belt_user_email,
    maiName: row.mai_name,
    maiNumber: row.mai_number,
    messages: (row.messages || []).map(mapMessageFromSupabase).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  };
}

function mapMessageFromSupabase(row) {
  return {
    id: row.id,
    senderKey: row.sender_key,
    senderName: row.sender_name,
    body: row.body,
    createdAt: row.created_at,
    readBy: row.read_by || []
  };
}

function getProfileSubscription(profileData) {
  const accountRole = getEffectiveAccountRole(profileData.account_type);

  return {
    status: accountRole === 'MAI' ? profileData.subscription_status || (profileData.account_type === 'Owner/Developer' ? 'owner_free' : 'unpaid') : 'free',
    currentPeriodEnd: profileData.subscription_current_period_end,
    cancelAtPeriodEnd: Boolean(profileData.subscription_cancel_at_period_end),
    paymentMethod: null
  };
}

function getEffectiveAccountRole(accountType) {
  return accountType === 'Owner/Developer' ? 'MAI' : accountType;
}

function isReturnedOrRejected(status) {
  return status === 'Returned' || status === 'Rejected';
}

function getVisibleMessageThreads({ activeRole, beltUser, maiUser, messageThreads }) {
  if (activeRole === 'MAI') {
    return messageThreads.filter((thread) => thread.maiNumber?.toLowerCase() === maiUser.maiNumber?.toLowerCase());
  }

  return messageThreads.filter((thread) => thread.beltUserEmail?.toLowerCase() === beltUser.email?.toLowerCase());
}

function buildThreadForMai({ targetMaiNumber, beltUser, maiDirectory, beltLogs }) {
  const canMessageMai = beltLogs.some((log) => log.maiNumber?.toLowerCase() === targetMaiNumber?.toLowerCase());
  if (!canMessageMai) return null;

  const mai = maiDirectory.find((item) => item.maiNumber?.toLowerCase() === targetMaiNumber?.toLowerCase());
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

export function useApp() {
  const context = React.useContext(AppContext);

  if (!context) {
    throw new Error('useApp must be used inside AppProvider');
  }

  return context;
}
