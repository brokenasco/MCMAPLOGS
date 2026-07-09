import React from 'react';
import { FileText, UserPlus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EmailNotice from '../components/EmailNotice.jsx';
import PageShell from '../components/PageShell.jsx';
import PasswordField from '../components/PasswordField.jsx';
import RoleCard from '../components/RoleCard.jsx';
import { useApp } from '../context/AppContext.jsx';
import { beltLevels } from '../data/mockData.js';

export default function SignUp() {
  const navigate = useNavigate();
  const { createAccount, authMessage } = useApp();
  const [accountType, setAccountType] = React.useState('Belt User');
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    password: '',
    beltLevel: 'No MCMAP Belt'
  });
  const [assignedMaiNumber, setAssignedMaiNumber] = React.useState('');
  const [statusMessage, setStatusMessage] = React.useState('');
  const [emailNotice, setEmailNotice] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [showTerms, setShowTerms] = React.useState(false);

  const isMai = accountType === 'MAI';

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage('');
    setEmailNotice(false);

    if (!acceptedTerms) {
      setStatusMessage('You must agree to the Terms & Conditions before creating an account.');
      setIsSubmitting(false);
      return;
    }

    try {
      const account = await createAccount({
        role: accountType,
        name: form.name,
        email: form.email,
        password: form.password,
        beltLevel: form.beltLevel
      });

      if (account.needsEmailConfirmation) {
        setEmailNotice(true);
        setStatusMessage('Account created. Confirm your email, then return to login.');
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
      description="Choose Belt User for free training-log access or MAI for logbook verification and signing tools."
    >
      <div className="mx-auto max-w-3xl rounded-md border border-coyote/35 bg-paper p-6 shadow-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <RoleCard role="Belt User" selected={accountType === 'Belt User'} onSelect={setAccountType} />
            <RoleCard role="MAI" selected={accountType === 'MAI'} onSelect={setAccountType} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" name="name" value={form.name} onChange={updateField} placeholder="LCpl Jordan Hayes" />
            <Field label="Email" name="email" value={form.email} onChange={updateField} type="email" placeholder="name@example.mil" />
            <PasswordField name="password" value={form.password} onChange={updateField} placeholder="Create password" />
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
            Belt User accounts are free. MAI accounts start with a 3-week free trial, then bill at only $25 every 3 months.
          </div>

          <div className="rounded-md border border-coyote/35 bg-field p-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => {
                  setAcceptedTerms(event.target.checked);
                  setStatusMessage('');
                }}
                className="mt-1 h-4 w-4 rounded border-ink/20 text-olive focus:ring-brass"
              />
              <span className="text-sm leading-6 text-ink/75">
                I agree to the Terms & Conditions.
              </span>
            </label>
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              className="focus-ring mt-3 inline-flex h-9 items-center gap-2 rounded-md border border-ink/15 bg-paper px-3 text-sm font-bold text-ink hover:bg-field"
            >
              <FileText size={16} aria-hidden="true" />
              View Terms & Conditions
            </button>
          </div>

          {emailNotice ? <EmailNotice /> : null}

          {(statusMessage || authMessage) ? (
            <div className="rounded-md border border-clay/20 bg-clay/10 p-4 text-sm font-semibold text-clay">
              {statusMessage || authMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || !acceptedTerms}
            className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-olive px-4 text-sm font-bold text-white hover:bg-olive/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <UserPlus size={17} aria-hidden="true" />
            {isSubmitting ? 'Creating account...' : isMai ? 'Create MAI account' : 'Create Belt User account'}
          </button>
        </form>
      </div>

      {showTerms ? (
        <TermsModal onClose={() => setShowTerms(false)} />
      ) : null}
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

function TermsModal({ onClose }) {
  const terms = [
    'Users are responsible for entering accurate training data.',
    'MAI verifications should reflect actual training conducted.',
    'False records or misuse may result in account restriction or removal.',
    'Users are responsible for maintaining their own login credentials.',
    "This platform provides digital recordkeeping tools but does not replace official Marine Corps administrative requirements unless accepted by the user's command.",
    'Subscription access may change based on payment status.',
    'Users may delete their account, but verified MAI records may remain preserved for training-hour documentation.'
  ];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 px-4 py-6">
      <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-md bg-paper p-5 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-clay">Terms & Conditions</p>
            <h2 className="mt-1 text-2xl font-bold text-ink">MCMAP Logbook use terms</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring grid h-9 w-9 place-items-center rounded-md border border-ink/15 text-ink/70 hover:bg-field"
          >
            <X size={17} aria-hidden="true" />
            <span className="sr-only">Close Terms & Conditions</span>
          </button>
        </div>
        <ul className="mt-5 space-y-3 text-sm leading-6 text-ink/75">
          {terms.map((term) => (
            <li key={term} className="rounded-md border border-coyote/25 bg-field p-3">
              {term}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="focus-ring mt-5 inline-flex h-10 items-center justify-center rounded-md bg-olive px-4 text-sm font-bold text-white"
        >
          Close
        </button>
      </section>
    </div>
  );
}
