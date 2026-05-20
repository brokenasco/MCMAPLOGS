import React from 'react';
import { LogIn } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import RoleCard from '../components/RoleCard.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, authMessage, isSupabaseEnabled, supabaseConfigStatus } = useApp();
  const [role, setRole] = React.useState('Belt User');
  const [form, setForm] = React.useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState('');

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage('');

    try {
      await signIn({ email: form.email, password: form.password, role });
      navigate(role === 'MAI' ? '/mai/dashboard' : '/belt/dashboard');
    } catch {
      setStatusMessage('Login failed. Check your email and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell
      eyebrow="Account access"
      title="Login"
      description="Choose the account type first, then continue into the matching mock dashboard."
    >
      <div className="mx-auto max-w-3xl rounded-md border border-coyote/35 bg-paper p-6 shadow-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md border border-coyote/30 bg-field p-4 text-sm leading-6 text-ink/70">
            {isSupabaseEnabled
              ? `Real login is connected to ${supabaseConfigStatus.urlHost}.`
              : 'Demo mode is active because Supabase keys are not available locally.'}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <RoleCard role="Belt User" selected={role === 'Belt User'} onSelect={setRole} />
            <RoleCard role="MAI" selected={role === 'MAI'} onSelect={setRole} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Email" name="email" value={form.email} onChange={updateField} type="email" placeholder="name@example.mil" />
            <Field label="Password" name="password" value={form.password} onChange={updateField} type="password" placeholder="Enter password" />
          </div>

          {(statusMessage || authMessage) ? (
            <div className="rounded-md border border-clay/20 bg-clay/10 p-4 text-sm font-semibold text-clay">
              {authMessage || statusMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-olive px-4 text-sm font-bold text-white hover:bg-olive/90 sm:w-auto"
          >
            <LogIn size={17} aria-hidden="true" />
            {isSubmitting ? 'Logging in...' : `Continue as ${role}`}
          </button>
        </form>
        <p className="mt-5 text-sm text-ink/65">
          New here?{' '}
          <Link to="/signup" className="font-bold text-clay hover:underline">
            Create a mock account
          </Link>
        </p>
      </div>
    </PageShell>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink">{label}</span>
      <input className="focus-ring mt-2 h-11 w-full rounded-md border border-ink/15 px-3 text-sm" {...props} />
    </label>
  );
}
