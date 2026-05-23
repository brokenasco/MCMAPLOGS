import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-field text-ink">
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
