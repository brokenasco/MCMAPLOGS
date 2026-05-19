import React from 'react';
import { BookOpenCheck, LogIn, Menu, ShieldCheck, UserCircle, UserPlus } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

const roleLinks = {
  'Belt User': [
    { label: 'Dashboard', to: '/belt/dashboard' },
    { label: 'Submit Hours', to: '/belt/submit' },
    { label: 'Logbook', to: '/logbook/verified' },
    { label: 'Profile', to: '/profile' }
  ],
  MAI: [
    { label: 'Dashboard', to: '/mai/dashboard' },
    { label: 'Pending Logs', to: '/mai/pending' },
    { label: 'Logbook', to: '/logbook/verified' },
    { label: 'Profile', to: '/profile' }
  ]
};

export default function Header() {
  const { activeRole, setActiveRole } = useApp();
  const navLinks = roleLinks[activeRole];

  return (
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-field/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <NavLink to="/" className="focus-ring flex items-center gap-3 rounded-md">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-olive text-white">
            <BookOpenCheck size={22} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-lg font-bold">MCMAP Logbook</span>
            <span className="block text-xs font-medium uppercase tracking-wide text-ink/60">
              {activeRole} view
            </span>
          </span>
        </NavLink>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `focus-ring rounded-md px-3 py-2 text-sm font-semibold transition ${
                  isActive ? 'bg-white text-olive shadow-sm' : 'text-ink/70 hover:bg-white/70 hover:text-ink'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveRole(activeRole === 'Belt User' ? 'MAI' : 'Belt User')}
            className="focus-ring hidden h-10 items-center gap-2 rounded-md border border-ink/15 bg-white px-3 text-sm font-semibold text-ink shadow-sm hover:border-olive/40 sm:inline-flex"
          >
            <UserCircle size={16} aria-hidden="true" />
            {activeRole}
          </button>
          <NavLink
            to="/login"
            className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-ink/15 bg-white px-3 text-sm font-semibold text-ink shadow-sm hover:border-olive/40"
          >
            <LogIn size={16} aria-hidden="true" />
            Login
          </NavLink>
          <NavLink
            to="/signup"
            className="focus-ring inline-flex h-10 items-center gap-2 rounded-md bg-clay px-3 text-sm font-semibold text-white shadow-sm hover:bg-clay/90"
          >
            <UserPlus size={16} aria-hidden="true" />
            Sign up
          </NavLink>
          <button
            type="button"
            className="focus-ring inline-grid h-10 w-10 place-items-center rounded-md border border-ink/15 bg-white text-ink lg:hidden"
            title="Navigation links are available on large screens"
          >
            <Menu size={18} aria-hidden="true" />
            <span className="sr-only">Menu</span>
          </button>
        </div>
      </div>
      <div className="border-t border-ink/10 px-4 py-2 lg:hidden">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `focus-ring shrink-0 rounded-md px-3 py-2 text-sm font-semibold ${
                  isActive ? 'bg-white text-olive' : 'text-ink/70'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>
    </header>
  );
}

export function RoleBadge({ role }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-brass/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-ink">
      <ShieldCheck size={14} aria-hidden="true" />
      {role}
    </span>
  );
}
