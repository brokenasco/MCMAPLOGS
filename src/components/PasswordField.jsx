import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordField({ label = 'Password', ...props }) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <label className="block">
      <span className="text-sm font-bold text-ink">{label}</span>
      <div className="mt-2 flex h-11 overflow-hidden rounded-md border border-ink/15 bg-paper focus-within:ring-2 focus-within:ring-brass/60">
        <input
          className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-sm outline-none"
          type={showPassword ? 'text' : 'password'}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          className="inline-flex h-full items-center gap-2 border-l border-ink/10 px-3 text-sm font-bold text-ink/70 hover:bg-field hover:text-ink"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>
    </label>
  );
}
