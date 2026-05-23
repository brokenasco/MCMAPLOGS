import React from 'react';
import { LogIn } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, authMessage, isSupabaseEnabled, isProductionBuild, supabaseConfigStatus } = useApp();
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
      const signedInProfile = await signIn({ email: form.email, password: form.password });
      navigate(signedInProfile.account_type === 'MAI' ? '/mai/dashboard' : '/belt/dashboard');
    } catch (error) {
      setStatusMessage(error.message || 'Login failed. Check your email and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell
      eyebrow="Account access"
      title="Login"
      description="Enter your email and password. Your account type comes from your saved profile."
    >
      <div className="mx-auto max-w-xl rounded-md border border-coyote/35 bg-paper p-6 shadow-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md border border-coyote/30 bg-field p-4 text-sm leading-6 text-ink/70">
            {isSupabaseEnabled
              ? `Real login is connected to ${supabaseConfigStatus.urlHost}.`
              : isProductionBuild
                ? 'Supabase is not connected on this deployment. Add the Vercel environment variables, then redeploy.'
                : 'Local setup mode: add Supabase keys to run real login locally.'}
          </div>

          <div className="grid gap-5">
            <Field label="Email" name="email" value={form.email} onChange={updateField} type="email" placeholder="name@example.mil" />
            <Field label="Password" name="password" value={form.password} onChange={updateField} type="password" placeholder="Enter password" />
          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="text-sm font-bold text-clay hover:underline">
              Forgot password?
            </Link>
          </div>

          {(statusMessage || authMessage) ? (
            <div className="rounded-md border border-clay/20 bg-clay/10 p-4 text-sm font-semibold text-clay">
              {authMessage || statusMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-olive px-4 text-sm font-bold text-white hover:bg-olive/90"
          >
            <LogIn size={17} aria-hidden="true" />
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="mt-5 text-sm text-ink/65">
          New here?{' '}
          <Link to="/signup" className="font-bold text-clay hover:underline">
            Create an account
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
