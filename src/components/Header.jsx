import React from 'react';
import { BookOpenCheck, CircleHelp, LayoutDashboard, LogIn, LogOut, MessageSquare, ShieldCheck, UserCircle, UserPlus } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

const roleLinks = {
  'Belt User': [
    { label: 'Dashboard', to: '/belt/dashboard', icon: LayoutDashboard },
    { label: 'Logbook', to: '/logbook/verified', icon: BookOpenCheck },
    { label: 'Messages', to: '/messages', icon: MessageSquare },
    { label: 'Profile', to: '/profile', icon: UserCircle },
    { label: 'Help', to: '/help', icon: CircleHelp }
  ],
  MAI: [
    { label: 'Dashboard', to: '/mai/dashboard', icon: LayoutDashboard },
    { label: 'Logbook', to: '/logbook/verified', icon: BookOpenCheck },
    { label: 'Messages', to: '/messages', icon: MessageSquare },
    { label: 'Profile', to: '/profile', icon: UserCircle },
    { label: 'Help', to: '/help', icon: CircleHelp }
  ]
};

export default function Header() {
  const { activeRole, session, signOut, unreadMessageCount } = useApp();
  const navLinks = roleLinks[activeRole];

  return (
    <header className="sticky top-0 z-20 border-b border-coyote/30 bg-charcoal text-paper shadow-panel">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8 lg:py-4">
        <NavLink to="/" className="focus-ring flex items-center gap-3 rounded-md">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-coyote/30 bg-olive text-paper">
            <BookOpenCheck size={22} aria-hidden="true" />
          </span>
          <span className="min-w-0">
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
        </div>
      </div>
      {session ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-coyote/30 bg-charcoal px-2 py-2 shadow-panel lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `focus-ring flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1.5 py-2 text-[11px] font-bold ${
                  isActive ? 'bg-paper text-olive' : 'text-paper/70'
                }`
              }
            >
              <MobileNavLabel icon={link.icon} label={link.label} unread={link.label === 'Messages' ? unreadMessageCount : 0} />
            </NavLink>
          ))}
        </div>
      </div>
      ) : null}
    </header>
  );
}

function MobileNavLabel({ icon: Icon, label, unread }) {
  return (
    <>
      <span className="relative">
        <Icon size={19} aria-hidden="true" />
        {unread ? (
          <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-clay px-1 text-[10px] font-black text-white">
            {unread}
          </span>
        ) : null}
      </span>
      <span>{label}</span>
    </>
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
