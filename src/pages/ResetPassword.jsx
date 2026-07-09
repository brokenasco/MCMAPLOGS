import React from 'react';
import { KeyRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import PasswordField from '../components/PasswordField.jsx';
import { useApp } from '../context/AppContext.jsx';
import { passwordRequirementMessage, validatePassword } from '../lib/passwordValidation.js';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { updatePassword, authMessage } = useApp();
  const [form, setForm] = React.useState({
    password: '',
    confirmPassword: ''
  });
  const [statusMessage, setStatusMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage('');

    if (!validatePassword(form.password)) {
      setStatusMessage(passwordRequirementMessage);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setStatusMessage('The two passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePassword(form.password);
      setStatusMessage('Password updated. You can now log in with the new password.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (error) {
      setStatusMessage(error.message || 'Unable to update password. Open the latest reset email and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell
      eyebrow="Account recovery"
      title="Create a new password"
      description="Use the link from your password reset email, then enter a new password."
    >
      <div className="mx-auto max-w-xl rounded-md border border-coyote/35 bg-paper p-6 shadow-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-5">
            <PasswordField
              label="New password"
              name="password"
              value={form.password}
              onChange={updateField}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
            <PasswordField
              label="Confirm new password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={updateField}
              placeholder="Re-enter password"
              autoComplete="new-password"
            />
          </div>

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
            <KeyRound size={17} aria-hidden="true" />
            {isSubmitting ? 'Updating password...' : 'Update password'}
          </button>
        </form>

        <p className="mt-5 text-sm text-ink/65">
          Already updated it?{' '}
          <Link to="/login" className="font-bold text-clay hover:underline">
            Return to login
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
