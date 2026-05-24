import React from 'react';
import { BookOpenCheck, LogIn, LogOut, Menu, ShieldCheck, UserPlus } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

const roleLinks = {
  'Belt User': [
    { label: 'Dashboard', to: '/belt/dashboard' },
    { label: 'Logbook', to: '/logbook/verified' },
    { label: 'Messages', to: '/messages' },
    { label: 'Profile', to: '/profile' },
    { label: 'Help', to: '/help' }
  ],
  MAI: [
    { label: 'Dashboard', to: '/mai/dashboard' },
    { label: 'Logbook', to: '/logbook/verified' },
    { label: 'Messages', to: '/messages' },
    { label: 'Profile', to: '/profile' },
    { label: 'Help', to: '/help' }
  ]
};

export default function Header() {
  const { activeRole, session, signOut, unreadMessageCount } = useApp();
  const navLinks = roleLinks[activeRole];

  return (
    <header className="sticky top-0 z-20 border-b border-coyote/30 bg-charcoal text-paper shadow-panel">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <NavLink to="/" className="focus-ring flex items-center gap-3 rounded-md">
          <span className="grid h-10 w-10 place-items-center rounded-md border border-coyote/30 bg-olive text-paper">
            <BookOpenCheck size={22} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-lg font-bold text-paper">MCMAP Logbook</span>
            <span className="block text-xs font-medium uppercase tracking-wide text-coyote">
              {activeRole} view
            </span>
          </span>
        </NavLink>

        {session ? (
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `focus-ring rounded-md px-3 py-2 text-sm font-semibold transition ${
                    isActive ? 'bg-paper text-olive shadow-sm' : 'text-paper/70 hover:bg-paper/10 hover:text-paper'
                  }`
                }
              >
                <NavLabel label={link.label} unread={link.label === 'Messages' ? unreadMessageCount : 0} />
              </NavLink>
            ))}
          </nav>
        ) : null}

        <div className="flex items-center gap-2">
          {session ? (
            <button
              type="button"
              onClick={signOut}
              className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-coyote/30 bg-paper px-3 text-sm font-semibold text-ink shadow-sm hover:bg-field"
            >
              <LogOut size={16} aria-hidden="true" />
              Sign out
            </button>
          ) : (
            <>
              <NavLink
                to="/login"
                className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-coyote/30 bg-paper px-3 text-sm font-semibold text-ink shadow-sm hover:bg-field"
              >
                <LogIn size={16} aria-hidden="true" />
                Login
              </NavLink>
              <NavLink
                to="/signup"
                className="focus-ring inline-flex h-10 items-center gap-2 rounded-md bg-brass px-3 text-sm font-semibold text-ink shadow-sm hover:bg-brass/90"
              >
                <UserPlus size={16} aria-hidden="true" />
                Sign up
              </NavLink>
            </>
          )}
          <button
            type="button"
            className="focus-ring inline-grid h-10 w-10 place-items-center rounded-md border border-coyote/30 bg-paper text-ink lg:hidden"
            title="Navigation links are available on large screens"
          >
            <Menu size={18} aria-hidden="true" />
            <span className="sr-only">Menu</span>
          </button>
        </div>
      </div>
      {session ? (
        <div className="border-t border-coyote/20 px-4 py-2 lg:hidden">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `focus-ring shrink-0 rounded-md px-3 py-2 text-sm font-semibold ${
                  isActive ? 'bg-paper text-olive' : 'text-paper/70'
                }`
              }
            >
              <NavLabel label={link.label} unread={link.label === 'Messages' ? unreadMessageCount : 0} />
            </NavLink>
          ))}
        </div>
      </div>
      ) : null}
    </header>
  );
}

function NavLabel({ label, unread }) {
  return (
    <span className="inline-flex items-center gap-2">
      {label}
      {unread ? (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-clay px-1.5 text-xs font-black text-white">
          {unread}
        </span>
      ) : null}
    </span>
  );
}

export function RoleBadge({ role }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-brass/30 bg-brass/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-ink">
      <ShieldCheck size={14} aria-hidden="true" />
      {role}
    </span>
  );
}
