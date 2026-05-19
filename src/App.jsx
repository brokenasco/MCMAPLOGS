import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout.jsx';
import BeltDashboard from './pages/BeltDashboard.jsx';
import Help from './pages/Help.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import MaiDashboard from './pages/MaiDashboard.jsx';
import PendingLogs from './pages/PendingLogs.jsx';
import Profile from './pages/Profile.jsx';
import SignUp from './pages/SignUp.jsx';
import SubmitHours from './pages/SubmitHours.jsx';
import Subscription from './pages/Subscription.jsx';
import VerifiedLogbook from './pages/VerifiedLogbook.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Landing />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<SignUp />} />
        <Route path="belt/dashboard" element={<BeltDashboard />} />
        <Route path="belt/submit" element={<SubmitHours />} />
        <Route path="mai/dashboard" element={<MaiDashboard />} />
        <Route path="mai/pending" element={<PendingLogs />} />
        <Route path="logbook/verified" element={<VerifiedLogbook />} />
        <Route path="profile" element={<Profile />} />
        <Route path="subscription" element={<Subscription />} />
        <Route path="help" element={<Help />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
