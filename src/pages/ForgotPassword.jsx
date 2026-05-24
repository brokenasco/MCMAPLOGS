import React from 'react';
import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import EmailNotice from '../components/EmailNotice.jsx';
import PageShell from '../components/PageShell.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function ForgotPassword() {
  const { requestPasswordReset, authMessage } = useApp();
  const [email, setEmail] = React.useState('');
  const [statusMessage, setStatusMessage] = React.useState('');
  const [emailNotice, setEmailNotice] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage('');
    setEmailNotice(false);
    setIsSubmitting(true);

    try {
      await requestPasswordReset(email);
      setEmailNotice(true);
      setStatusMessage('If that email has an account, a password reset link has been sent.');
    } catch (error) {
      setStatusMessage(error.message || 'Unable to send password reset email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell
      eyebrow="Account recovery"
      title="Reset your password"
      description="Enter your account email and MCMAP Logbook will send a password reset link."
    >
      <div className="mx-auto max-w-xl rounded-md border border-coyote/35 bg-paper p-6 shadow-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-bold text-ink">Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
              className="focus-ring mt-2 h-11 w-full rounded-md border border-ink/15 px-3 text-sm"
              placeholder="name@example.mil"
            />
          </label>

          {emailNotice ? <EmailNotice /> : null}

          {(statusMessage || authMessage) ? (
            <div className="rounded-md border border-clay/20 bg-clay/10 p-4 text-sm font-semibold text-clay">
              {statusMessage || authMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-olive px-4 text-sm font-bold text-white hover:bg-olive/90"
          >
            <Mail size={17} aria-hidden="true" />
            {isSubmitting ? 'Sending reset link...' : 'Send reset link'}
          </button>
        </form>

        <p className="mt-5 text-sm text-ink/65">
          Remembered your password?{' '}
          <Link to="/login" className="font-bold text-clay hover:underline">
            Return to login
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
