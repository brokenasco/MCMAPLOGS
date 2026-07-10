import React from 'react';
import { RoleBadge } from './Header.jsx';

const devTestMaiUserIds = [
  '18a9842e-84f8-46a8-806c-c2276a46c6f0',
  '9fb3dac1-bfd7-440d-bbd4-9b625ec26dd6',
  '33ef0ef8-cfec-4524-a137-56e585897472',
  '3095224e-73bc-47d1-8ccc-a5e17bd718d8',
  '725b7c3c-8aed-4491-9eed-2461d1228d16'
];

const developerTesterUserIds = [
  '16e59741-7d69-424d-a922-023f3ec0a0ec',
  '3095224e-73bc-47d1-8ccc-a5e17bd718d8'
];

const ownerDeveloperUserIds = [
  '8c5a14d7-5f97-4020-ade5-de534b315287',
  'cbfab507-3f3a-402e-868d-399f387d83d1'
];

export default function ProfileBadges({ displaySubscription, isMai, maiCode, profile }) {
  if (!isMai) return <RoleBadge role="Belt User" />;

  const roleLabel = getProfileRoleBadge({ displaySubscription, isMai, profile });
  const hasSpecialBadge = ['Owner / Developer', 'Dev Tester', 'MAI / Dev Test'].includes(roleLabel);

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {hasSpecialBadge ? <RoleBadge role={roleLabel} /> : null}
      <RoleBadge role={maiCode || profile?.mai_number || 'MAI Code Pending'} />
    </div>
  );
}

export function getProfileRoleBadge({ displaySubscription, isMai, profile }) {
  const isOwnerMai =
    ownerDeveloperUserIds.includes(profile?.id) ||
    displaySubscription?.status === 'owner_free' ||
    profile?.mai_number === 'MAI-0000' ||
    profile?.account_type === 'Owner/Developer';
  const isDeveloperTester = developerTesterUserIds.includes(profile?.id);
  const isDevTestMai = Boolean(profile?.dev_test_access) || devTestMaiUserIds.includes(profile?.id);

  if (isOwnerMai) return 'Owner / Developer';
  if (isDeveloperTester) return 'Dev Tester';
  if (isDevTestMai) return 'MAI / Dev Test';
  if (isMai) return 'Martial Arts Instructor';
  return 'Belt User';
}
