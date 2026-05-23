import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout.jsx';
import BeltDashboard from './pages/BeltDashboard.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Help from './pages/Help.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import MaiDashboard from './pages/MaiDashboard.jsx';
import PendingLogs from './pages/PendingLogs.jsx';
import Profile from './pages/Profile.jsx';
import SignUp from './pages/SignUp.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import SubmitHours from './pages/SubmitHours.jsx';
import Subscription from './pages/Subscription.jsx';
import VerifiedLogbook from './pages/VerifiedLogbook.jsx';
import { useApp } from './context/AppContext.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Landing />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<SignUp />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route
          path="belt/dashboard"
          element={
            <RequireRole role="Belt User">
              <BeltDashboard />
            </RequireRole>
          }
        />
        <Route
          path="belt/submit"
          element={
            <RequireRole role="Belt User">
              <SubmitHours />
            </RequireRole>
          }
        />
        <Route
          path="mai/dashboard"
          element={
            <RequireRole role="MAI">
              <MaiDashboard />
            </RequireRole>
          }
        />
        <Route
          path="mai/pending"
          element={
            <RequireRole role="MAI">
              <PendingLogs />
            </RequireRole>
          }
        />
        <Route
          path="logbook/verified"
          element={
            <RequireAccount>
              <VerifiedLogbook />
            </RequireAccount>
          }
        />
        <Route
          path="profile"
          element={
            <RequireAccount>
              <Profile />
            </RequireAccount>
          }
        />
        <Route path="subscription" element={<Subscription />} />
        <Route path="help" element={<Help />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function RequireAccount({ children }) {
  const { session, loading, isSupabaseEnabled, isProductionBuild } = useApp();

  if (loading) {
    return <RouteLoading />;
  }

  if ((isSupabaseEnabled || isProductionBuild) && !session) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function RequireRole({ role, children }) {
  const { activeRole, profile, session, loading, isSupabaseEnabled, isProductionBuild, hasPaidMaiAccess } = useApp();

  if (loading) {
    return <RouteLoading />;
  }

  if ((isSupabaseEnabled || isProductionBuild) && !session) {
    return <Navigate to="/login" replace />;
  }

  const accountRole = profile?.account_type || activeRole;

  if (accountRole !== role) {
    return <Navigate to={accountRole === 'MAI' ? '/mai/dashboard' : '/belt/dashboard'} replace />;
  }

  if (role === 'MAI' && (isSupabaseEnabled || isProductionBuild) && !hasPaidMaiAccess) {
    return <Navigate to="/subscription" replace />;
  }

  return children;
}

function RouteLoading() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-md border border-coyote/35 bg-paper p-6 text-sm font-semibold text-ink shadow-sm">
        Loading account...
      </div>
    </section>
  );
}
