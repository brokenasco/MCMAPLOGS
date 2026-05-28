import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from './Header.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function AppLayout() {
  const navigate = useNavigate();
  const { activeRole, markWelcomeSeen, profile, session } = useApp();
  const [accountDeletionMessage, setAccountDeletionMessage] = React.useState('');
  const showWelcome = Boolean(profile && profile.welcome_seen === false);

  React.useEffect(() => {
    const deletionMessage = sessionStorage.getItem('mcmap-account-deletion-message');
    if (!deletionMessage) return;

    setAccountDeletionMessage(deletionMessage);
    sessionStorage.removeItem('mcmap-account-deletion-message');
  }, []);

  const continueToDashboard = async () => {
    await markWelcomeSeen();
    navigate(activeRole === 'MAI' ? '/mai/dashboard' : '/belt/dashboard');
  };

  return (
    <div className="min-h-screen bg-field text-ink">
      <Header />
      <main className={session ? 'pb-64 lg:pb-0' : ''}>
        {accountDeletionMessage ? (
          <div className="mx-auto mt-4 max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-md border border-olive/25 bg-olive/10 p-4 text-sm font-semibold leading-6 text-olive">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <p>{accountDeletionMessage}</p>
                <button
                  type="button"
                  onClick={() => setAccountDeletionMessage('')}
                  className="focus-ring inline-flex h-9 items-center justify-center rounded-md border border-olive/30 bg-paper px-3 text-xs font-bold text-olive"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ) : null}
        <Outlet />
      </main>
      {showWelcome ? <WelcomeModal onContinue={continueToDashboard} /> : null}
      <footer className="border-t border-coyote/30 bg-charcoal px-4 py-5 text-paper sm:px-6 lg:px-8">
        <p className="mx-auto max-w-7xl text-xs leading-5 text-paper/65">
          Disclaimer: This website is privately operated and is not affiliated with, endorsed by, or sponsored by the United States Government, the Department of Defense, the United States Marine Corps, or any of their subordinate commands or agencies.
        </p>
      </footer>
    </div>
  );
}

function WelcomeModal({ onContinue }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/65 px-4 py-6">
      <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-md border border-brass/30 bg-paper p-6 shadow-panel">
        <p className="text-sm font-black uppercase tracking-wide text-clay">Thank You for Joining</p>
        <h2 className="mt-2 text-3xl font-bold text-ink">Thank You for Joining</h2>
        <div className="mt-5 space-y-4 text-sm leading-7 text-ink/75">
          <p>
            Thank you for creating your account and for supporting an Active Duty-owned and operated small business.
          </p>
          <p>
            MCMAP Logs is a project by Broken Arrow Supply Co. built from firsthand experience to solve a problem many Marines know well: lost paperwork, difficult record tracking, and unnecessary administrative friction.
          </p>
          <p>
            Our mission is simple: build tools that make life easier for Marines and the leaders responsible for training them.
          </p>
          <p>
            Your trust and support mean a great deal to us, and we are grateful to have you here.
          </p>
          <p className="font-semibold text-ink">
            Respectfully,<br />
            Keaton R. Permenter<br />
            CEO and Founder, Broken Arrow Supply Co.
          </p>
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="focus-ring mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-olive px-5 text-sm font-bold text-white hover:bg-olive/90 sm:w-auto"
        >
          Continue to Dashboard
        </button>
      </section>
    </div>
  );
}
