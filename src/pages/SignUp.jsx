import React from 'react';
import { UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import RoleCard from '../components/RoleCard.jsx';
import { useApp } from '../context/AppContext.jsx';
import { beltLevels } from '../data/mockData.js';

export default function SignUp() {
  const navigate = useNavigate();
  const { createAccount, authMessage, isSupabaseEnabled, isProductionBuild, supabaseConfigStatus } = useApp();
  const [accountType, setAccountType] = React.useState('Belt User');
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    password: '',
    beltLevel: 'Green Belt'
  });
  const [assignedMaiNumber, setAssignedMaiNumber] = React.useState('');
  const [statusMessage, setStatusMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isMai = accountType === 'MAI';

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage('');

    try {
      const account = await createAccount({
        role: accountType,
        name: form.name,
        email: form.email,
        password: form.password,
        beltLevel: form.beltLevel
      });

      if (account.needsEmailConfirmation) {
        setStatusMessage('Account created. Check your email to confirm your account, then return to login.');
        if (isMai) setAssignedMaiNumber(account.mai_number);
        return;
      }

      if (isMai) {
        setAssignedMaiNumber(account.maiNumber || account.mai_number);
        return;
      }

      navigate('/belt/dashboard');
    } catch (error) {
      setStatusMessage(error.message || 'Account could not be created. Check the form and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell
      eyebrow="Create account"
      title="Sign up"
      description="Choose whether this mock account is for a Belt User submitting hours or an MAI verifying and signing logbooks. New accounts include a 1-month free trial."
    >
      <div className="mx-auto max-w-3xl rounded-md border border-coyote/35 bg-paper p-6 shadow-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md border border-coyote/30 bg-field p-4 text-sm leading-6 text-ink/70">
            {isSupabaseEnabled
              ? `Real account creation is connected to ${supabaseConfigStatus.urlHost}. Supabase will store the user account and profile.`
              : isProductionBuild
                ? 'Supabase is not connected on this deployment. Add the Vercel environment variables, then redeploy.'
                : 'Local setup mode: add Supabase keys to run real account creation locally.'}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <RoleCard role="Belt User" selected={accountType === 'Belt User'} onSelect={setAccountType} />
            <RoleCard role="MAI" selected={accountType === 'MAI'} onSelect={setAccountType} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" name="name" value={form.name} onChange={updateField} placeholder="LCpl Jordan Hayes" />
            <Field label="Email" name="email" value={form.email} onChange={updateField} type="email" placeholder="name@example.mil" />
            <Field label="Password" name="password" value={form.password} onChange={updateField} type="password" placeholder="Create password" />
            <label className="block">
              <span className="text-sm font-bold text-ink">Current belt level</span>
              <select
                name="beltLevel"
                value={form.beltLevel}
                onChange={updateField}
                className="focus-ring mt-2 h-11 w-full rounded-md border border-ink/15 bg-paper px-3 text-sm"
              >
                {beltLevels.map((level) => (
                  <option key={level}>{level}</option>
                ))}
              </select>
            </label>
          </div>

          {isMai ? (
            <div className="rounded-md border border-olive/20 bg-olive/10 p-4">
              <p className="text-sm font-bold text-olive">Assigned MAI number</p>
              <p className="mt-2 text-3xl font-bold text-ink">{assignedMaiNumber || 'Generated after account creation'}</p>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                This number is created when the MAI account is created. It verifies the MAI when they sign
                Belt User logbooks.
              </p>
              {assignedMaiNumber ? (
                <button
                  type="button"
                  onClick={() => navigate('/mai/dashboard')}
                  className="focus-ring mt-4 inline-flex h-10 items-center rounded-md bg-olive px-4 text-sm font-bold text-white hover:bg-olive/90"
                >
                  Go to MAI dashboard
                </button>
              ) : null}
            </div>
          ) : (
            <div className="rounded-md bg-field p-4 text-sm leading-6 text-ink/70">
              Belt Users will enter the verifying MAI number when submitting each training log.
            </div>
          )}

          <div className="rounded-md border border-brass/30 bg-brass/10 p-4 text-sm leading-6 text-ink/70">
            Subscription: first month free, then $2 per month. Payment processing will be connected through billing.
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
            <UserPlus size={17} aria-hidden="true" />
            {isSubmitting ? 'Creating account...' : isMai ? 'Create MAI account' : 'Create Belt User account'}
          </button>
        </form>
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
