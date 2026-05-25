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
      <footer className="border-t border-coyote/30 bg-charcoal px-4 py-5 text-paper sm:px-6 lg:px-8">
        <p className="mx-auto max-w-7xl text-xs leading-5 text-paper/65">
          Disclaimer: This website is privately operated and is not affiliated with, endorsed by, or sponsored by the United States Government, the Department of Defense, the United States Marine Corps, or any of their subordinate commands or agencies.
        </p>
      </footer>
    </div>
  );
}
