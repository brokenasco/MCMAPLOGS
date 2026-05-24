import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export const emailSentMessage =
  'Please check your inbox for the email. If you do not see it within a few minutes, check your Spam/Junk folder in case it was filtered there.';

export default function EmailNotice({ title = 'Email Sent', text = emailSentMessage }) {
  return (
    <div className="rounded-md border border-olive/25 bg-olive/10 p-4 text-sm leading-6 text-ink/75">
      <p className="flex items-center gap-2 font-black text-olive">
        <CheckCircle2 size={18} aria-hidden="true" />
        {title}
      </p>
      <p className="mt-2">{text}</p>
    </div>
  );
}
