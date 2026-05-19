import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import SubscriptionBanner from './SubscriptionBanner.jsx';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-field text-ink">
      <Header />
      <SubscriptionBanner />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
