import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from './Header.jsx';
import { useApp } from '../context/AppContext.jsx';
import { isLegacySupabaseProject } from '../lib/supabaseClient.js';

export default function AppLayout() {
  const navigate = useNavigate();
  const { achievementToasts, activeRole, dismissAchievementToast, markWelcomeSeen, passwordRecoveryActive, profile, session } = useApp();
  const [accountDeletionMessage, setAccountDeletionMessage] = React.useState('');
  const [legacyNoticeStep, setLegacyNoticeStep] = React.useState(0);
  const isAppSession = Boolean(session && !passwordRecoveryActive);
  const isLegacyAccount = Boolean(isAppSession && profile && isLegacySupabaseProject);
  const showWelcome = Boolean(isAppSession && profile && profile.welcome_seen === false);

  React.useEffect(() => {
    const deletionMessage = sessionStorage.getItem('mcmap-account-deletion-message');
    if (!deletionMessage) return;

    setAccountDeletionMessage(deletionMessage);
    sessionStorage.removeItem('mcmap-account-deletion-message');
  }, []);

  React.useEffect(() => {
    if (isLegacyAccount) {
      setLegacyNoticeStep(1);
      return;
    }

    setLegacyNoticeStep(0);
  }, [isLegacyAccount, profile?.id]);

  const continueToDashboard = async () => {
    await markWelcomeSeen();
    navigate(activeRole === 'MAI' ? '/mai/dashboard' : '/belt/dashboard');
  };

  return (
    <div className="min-h-screen bg-field text-ink">
      <Header />
      <main className={isAppSession ? 'pb-64 lg:pb-0' : ''}>
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
      {achievementToasts.length ? (
        <div className="fixed bottom-28 right-4 z-50 grid w-[calc(100%-2rem)] max-w-sm gap-3 sm:bottom-6">
          {achievementToasts.slice(-3).map((toast) => (
            <div key={toast.id} className="rounded-md border border-brass/40 bg-charcoal p-4 text-paper shadow-panel">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-brass">Achievement unlocked</p>
                  <p className="mt-1 text-sm leading-6 text-paper/80">{toast.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dismissAchievementToast(toast.id)}
                  className="focus-ring grid h-8 w-8 shrink-0 place-items-center rounded-md border border-paper/20 text-sm font-bold text-paper"
                  aria-label="Dismiss achievement notification"
                >
                  X
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {legacyNoticeStep === 1 ? (
        <LegacySystemUpgradeNoticeModal onContinue={() => setLegacyNoticeStep(2)} />
      ) : legacyNoticeStep === 2 ? (
        <LegacyMigrationInstructionsModal onContinue={() => setLegacyNoticeStep(0)} />
      ) : showWelcome ? (
        <WelcomeModal onContinue={continueToDashboard} />
      ) : null}
      <footer className="border-t border-coyote/30 bg-charcoal px-4 py-5 text-paper sm:px-6 lg:px-8">
        <p className="mx-auto max-w-7xl text-xs leading-5 text-paper/65">
          Disclaimer: This website is privately operated and is not affiliated with, endorsed by, or sponsored by the United States Government, the Department of Defense, the United States Marine Corps, or any of their subordinate commands or agencies.
        </p>
      </footer>
    </div>
  );
}

function LegacySystemUpgradeNoticeModal({ onContinue }) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-ink/75 px-4 py-6">
      <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-md border border-brass/30 bg-paper p-6 shadow-panel">
        <p className="text-sm font-black uppercase tracking-wide text-clay">System Upgrade Notice</p>
        <h2 className="mt-2 text-3xl font-bold text-ink">System Upgrade Notice</h2>
        <div className="mt-5 space-y-4 text-sm leading-7 text-ink/75">
          <p>Dear Warfighters,</p>
          <p>
            MCMAP Logs has expanded faster than we anticipated, and our current account storage system needs to be upgraded to support that growth.
          </p>
          <p>
            Beginning Saturday, July 11, 2026, we will be migrating to our new account system. As part of this upgrade, all users will need to create a new account. This is a one-time requirement. After completing the new account setup, all future account information and MCMAP training records will be stored in the upgraded system.
          </p>
          <div>
            <p className="font-semibold text-ink">This upgrade will provide:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Better tracking of MCMAP training logs</li>
              <li>Easier communication between Belt Users and MAIs</li>
              <li>Improved logbook and record management</li>
              <li>Lower account pricing for MAIs</li>
            </ul>
          </div>
          <p>
            We understand that creating a new account is an inconvenience, and we sincerely appreciate your patience and support as we complete this major system upgrade. These improvements will allow us to continue expanding MCMAP Logs while providing a faster, more reliable experience for all users.
          </p>
          <p>Thank you for your continued support.</p>
          <p className="font-semibold text-ink">
            Keaton R. Permenter<br />
            CEO<br />
            Broken Arrow Solutions<br />
            "Stay informed. Stay lethal."
          </p>
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="focus-ring mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-olive px-5 text-sm font-bold text-white hover:bg-olive/90 sm:w-auto"
        >
          OK
        </button>
      </section>
    </div>
  );
}

function LegacyMigrationInstructionsModal({ onContinue }) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-ink/75 px-4 py-6">
      <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-md border border-brass/30 bg-paper p-6 shadow-panel">
        <p className="text-sm font-black uppercase tracking-wide text-clay">Migrating Your Account</p>
        <h2 className="mt-2 text-3xl font-bold text-ink">Migrating Your Account</h2>
        <div className="mt-5 space-y-4 text-sm leading-7 text-ink/75">
          <p>Please complete the following steps to transfer your approved training records into the new system:</p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Export your current Log Book as a PDF.</li>
            <li>Delete your old account.</li>
            <li>Create a new account in the upgraded MCMAP Logs system. On July 11th 2026 at 1200pm EST.</li>
            <li>Email your exported PDF logbook to BrokenAS.co@gmail.com.</li>
            <li>Important: Send the email from the same email address used to create your new account.</li>
            <li>Our Customer Support team will import all previously approved logs into your new account within 5 business days.</li>
          </ol>
          <p className="font-semibold text-ink">
            Customer Support<br />
            Broken Arrow Solutions
          </p>
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="focus-ring mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-olive px-5 text-sm font-bold text-white hover:bg-olive/90 sm:w-auto"
        >
          I Understand
        </button>
      </section>
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
