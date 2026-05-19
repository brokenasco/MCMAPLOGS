import React from 'react';
import { currentBeltUser, currentMai, trainingLogs } from '../data/mockData.js';

const AppContext = React.createContext(null);

export function AppProvider({ children }) {
  const [activeRole, setActiveRole] = React.useState('Belt User');
  const [beltUser, setBeltUser] = React.useState(currentBeltUser);
  const [maiUser, setMaiUser] = React.useState(currentMai);
  const [logs, setLogs] = React.useState(trainingLogs);
  const [subscription, setSubscription] = React.useState({
    status: 'trial',
    planName: 'MCMAP Logbook Monthly',
    monthlyPrice: 2,
    trialStartedAt: new Date().toISOString().slice(0, 10),
    trialEndsAt: addDays(new Date(), 30).toISOString().slice(0, 10),
    paymentMethod: null
  });

  const beltLogs = logs.filter((log) => log.marine === beltUser.name);
  const pendingLogs = logs.filter((log) => log.status === 'Pending');
  const verifiedLogs = logs.filter((log) => log.status === 'Verified');

  const submitLog = (log) => {
    const newLog = {
      id: Date.now(),
      marine: beltUser.name,
      submittedAt: new Date().toISOString().slice(0, 10),
      status: 'Pending',
      ...log
    };

    setLogs((currentLogs) => [newLog, ...currentLogs]);
    return newLog;
  };

  const verifyLog = (logId) => {
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
  };

  const returnLog = (logId) => {
    setLogs((currentLogs) =>
      currentLogs.map((log) =>
        log.id === logId
          ? {
              ...log,
              status: 'Returned',
              returnedAt: new Date().toISOString().slice(0, 10),
              returnedBy: maiUser.name,
              returnedByMaiNumber: maiUser.maiNumber
            }
          : log
      )
    );
  };

  const createMockAccount = ({ role, name, email, beltLevel }) => {
    setActiveRole(role);

    if (role === 'MAI') {
      const assignedNumber = `MAI-${Math.floor(2000 + Math.random() * 7000)}`;
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
      planName: 'MCMAP Logbook Monthly',
      monthlyPrice: 2,
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
    logs,
    beltLogs,
    pendingLogs,
    verifiedLogs,
    subscription,
    submitLog,
    verifyLog,
    returnLog,
    createMockAccount,
    startPaidSubscription,
    resetTrial
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
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
