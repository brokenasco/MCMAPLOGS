import React from 'react';
import { BadgeCheck, GraduationCap } from 'lucide-react';

const roleDetails = {
  'Belt User': {
    icon: GraduationCap,
    title: 'Belt User',
    text: 'Submit MCMAP training hours and track pending or verified logs.'
  },
  MAI: {
    icon: BadgeCheck,
    title: 'MAI',
    text: 'Receive an assigned MAI number and use it to sign verified logbooks.'
  }
};

export default function RoleCard({ role, selected, onSelect }) {
  const details = roleDetails[role];
  const Icon = details.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(role)}
      className={`focus-ring min-h-36 rounded-md border p-5 text-left transition ${
        selected ? 'border-olive bg-olive/10 shadow-sm' : 'border-ink/10 bg-white hover:border-olive/40'
      }`}
    >
      <span className={`grid h-11 w-11 place-items-center rounded-md ${selected ? 'bg-olive text-white' : 'bg-field text-olive'}`}>
        <Icon size={22} aria-hidden="true" />
      </span>
      <span className="mt-4 block text-lg font-bold text-ink">{details.title}</span>
      <span className="mt-2 block text-sm leading-6 text-ink/65">{details.text}</span>
    </button>
  );
}
