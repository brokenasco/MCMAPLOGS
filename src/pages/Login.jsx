import React from 'react';
import { LogIn } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import RoleCard from '../components/RoleCard.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function Login() {
  const navigate = useNavigate();
  const { setActiveRole } = useApp();
  const [role, setRole] = React.useState('Belt User');

  const handleSubmit = (event) => {
    event.preventDefault();
    setActiveRole(role);
    navigate(role === 'MAI' ? '/mai/dashboard' : '/belt/dashboard');
  };

  return (
    <PageShell
      eyebrow="Account access"
      title="Login"
      description="Choose the account type first, then continue into the matching mock dashboard."
    >
      <div className="mx-auto max-w-3xl rounded-md border border-coyote/35 bg-paper p-6 shadow-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <RoleCard role="Belt User" selected={role === 'Belt User'} onSelect={setRole} />
            <RoleCard role="MAI" selected={role === 'MAI'} onSelect={setRole} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Email" type="email" placeholder="name@example.mil" />
            <Field label="Password" type="password" placeholder="Enter password" />
          </div>

          <button
            type="submit"
            className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-olive px-4 text-sm font-bold text-white hover:bg-olive/90 sm:w-auto"
          >
            <LogIn size={17} aria-hidden="true" />
            Continue as {role}
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
