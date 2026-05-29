import React from 'react';
import {
  AlertTriangle,
  Award,
  BookOpenCheck,
  Calendar,
  Clock3,
  Compass,
  CreditCard,
  Crosshair,
  Droplet,
  GraduationCap,
  Link2,
  Map as MapIcon,
  Medal,
  Pencil,
  Save,
  ShieldCheck,
  Snowflake,
  Target,
  Trash2,
  Users,
  X,
  Zap
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import EmailNotice from '../components/EmailNotice.jsx';
import PageShell from '../components/PageShell.jsx';
import StatCard from '../components/StatCard.jsx';
import { RoleBadge } from '../components/Header.jsx';
import { useApp } from '../context/AppContext.jsx';
import { achievements as fallbackAchievements, evaluateAchievements } from '../data/achievements.js';
import { formatMinutes, getTargetBelt } from '../data/mcmapReference.js';

export default function Profile() {
  const navigate = useNavigate();
  const {
    achievements,
    activeRole,
    profile,
    beltUser,
    maiUser,
    beltLogs,
    pendingLogs,
    verifiedLogs,
    userAchievements,
    displaySubscription,
    deleteAccount,
    updateAccount
  } = useApp();
  const isMai = activeRole === 'MAI';
  const user = isMai ? maiUser : beltUser;
  const isOwnerMai = displaySubscription.status === 'owner_free' || profile?.mai_number === 'MAI-0000' || profile?.account_type === 'Owner/Developer';
  const isDevTestMai = Boolean(profile?.dev_test_access) || devTestMaiUserIds.includes(profile?.id);
  const accountRoleLabel = isDevTestMai ? 'MAI / Dev Test' : isOwnerMai ? 'Owner/Developer' : isMai ? 'Martial Arts Instructor' : 'Belt User';
  const currentBelt = profile?.belt_level || user.beltLevel || beltUser.beltLevel;
  const [isEditing, setIsEditing] = React.useState(false);
  const [editForm, setEditForm] = React.useState({ email: user.email || '', unit: user.unit || '' });
  const [editMessage, setEditMessage] = React.useState('');
  const [emailNotice, setEmailNotice] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [deleteText, setDeleteText] = React.useState('');
  const [deleteMessage, setDeleteMessage] = React.useState('');
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [profileSection, setProfileSection] = React.useState('account');
  const canDelete = deleteText === 'DELETE';
  const achievementDefinitions = Array.isArray(achievements) && achievements.length ? achievements : fallbackAchievements;
  const unlockedAchievements = Array.isArray(userAchievements) ? userAchievements : [];
  const unlockedAchievementIds = new Set(unlockedAchievements.map((achievement) => achievement.achievementId));
  const achievementProgress = React.useMemo(
    () => evaluateAchievements({ logs: beltLogs, profile }).progress,
    [beltLogs, profile]
  );

  React.useEffect(() => {
    setEditForm({ email: user.email || '', unit: user.unit || '' });
    setEditMessage('');
    setEmailNotice(false);
    setIsEditing(false);
  }, [user.email, user.unit]);

  const updateEditField = (event) => {
    setEditForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setEditMessage('');
  };

  const handleSaveAccount = async (event) => {
    event.preventDefault();

    if (!editForm.email.trim() || !editForm.unit.trim()) {
      setEditMessage('Email and unit are both required.');
      return;
    }

    setIsSaving(true);
    setEditMessage('');
    setEmailNotice(false);

    try {
      const result = await updateAccount(editForm);
      setIsEditing(false);
      setEmailNotice(Boolean(result.emailConfirmationRequired));
      setEditMessage(
        result.emailConfirmationRequired
          ? 'Saved. Confirm the email change before using the new email to log in.'
          : 'Account updated.'
      );
    } catch (error) {
      setEditMessage(error.message || 'Account could not be updated. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!canDelete) return;

    setIsDeleting(true);
    setDeleteMessage('');

    try {
      const result = await deleteAccount();
      sessionStorage.setItem(
        'mcmap-account-deletion-message',
        result.deletionEmailSent
          ? 'Your account has been deleted. A confirmation email has been sent. Please check your inbox and Spam/Junk folder.'
          : 'Your account has been deleted. We were unable to send a confirmation email, but the deletion was completed.'
      );
      navigate('/');
    } catch (error) {
      setDeleteMessage(error.message || 'Account could not be deleted. Try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PageShell
      eyebrow="Settings"
      title="Profile"
      description="Review your account details."
      actions={<RoleBadge role={accountRoleLabel} />}
    >
      <div className="mb-5 flex flex-wrap gap-2">
        {[
          ['account', 'Account'],
          ['achievements', 'Achievements']
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setProfileSection(key)}
            className={`focus-ring h-11 rounded-md border px-4 text-sm font-bold ${
              profileSection === key
                ? 'border-olive bg-olive text-white'
                : 'border-coyote/35 bg-paper text-ink hover:bg-field'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {profileSection === 'achievements' ? (
        <AchievementsSection
          achievements={achievementDefinitions}
          progress={achievementProgress}
          unlockedAchievementIds={unlockedAchievementIds}
          userAchievements={unlockedAchievements}
        />
      ) : (
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <section className="rounded-md border border-coyote/35 bg-paper p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-clay">Account</p>
          <h2 className="mt-2 text-2xl font-bold text-ink">{user.name}</h2>
          <p className="mt-1 text-sm text-ink/60">{user.email}</p>
          <dl className="mt-6 space-y-4">
            <Detail label="Unit" value={user.unit || maiUser.unit} />
            <Detail label="Belt level" value={currentBelt} />
            <Detail label="Current target" value={getTargetBelt(currentBelt)} />
            <Detail label="MAI number" value={isMai ? maiUser.maiNumber : 'Assigned only to MAI accounts'} />
            <Detail
              label="Subscription Status"
              value={getSubscriptionAccessLabel({ activeRole, displaySubscription })}
            />
          </dl>

          <div className="mt-6 border-t border-coyote/25 pt-5">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-ink/15 bg-field px-4 text-sm font-bold text-ink hover:bg-paper sm:h-10 sm:w-auto"
              >
                <Pencil size={17} aria-hidden="true" />
                Edit account details
              </button>
            ) : null}

            {editMessage ? (
              <div className="mt-4 rounded-md border border-coyote/35 bg-field p-4 text-sm font-semibold text-ink/75">
                {editMessage}
              </div>
            ) : null}

            {emailNotice ? <div className="mt-4"><EmailNotice title="Email Change Sent" /></div> : null}

            {isEditing ? (
              <form className="mt-4 grid gap-4" onSubmit={handleSaveAccount}>
                <label className="block">
                  <span className="text-sm font-bold text-ink">Email</span>
                  <input
                    name="email"
                    type="email"
                    value={editForm.email}
                    onChange={updateEditField}
                    className="focus-ring mt-2 h-11 w-full rounded-md border border-ink/15 px-3 text-sm"
                    placeholder="name@example.mil"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-ink">Unit</span>
                  <input
                    name="unit"
                    value={editForm.unit}
                    onChange={updateEditField}
                    className="focus-ring mt-2 h-11 w-full rounded-md border border-ink/15 px-3 text-sm"
                    placeholder="Unit or training section"
                  />
                </label>
                <div className="grid gap-3 sm:flex sm:flex-wrap">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-olive px-4 text-sm font-bold text-white hover:bg-olive/90 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10"
                  >
                    <Save size={17} aria-hidden="true" />
                    {isSaving ? 'Saving...' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditForm({ email: user.email || '', unit: user.unit || '' });
                      setEditMessage('');
                      setEmailNotice(false);
                      setIsEditing(false);
                    }}
                    className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md border border-ink/15 bg-field px-4 text-sm font-bold text-ink sm:h-10"
                  >
                    <X size={17} aria-hidden="true" />
                    Cancel
                  </button>
                </div>

                <div className="mt-2 rounded-md border border-clay/30 bg-clay/10 p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 text-clay">
                      <AlertTriangle size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-bold text-ink">Delete account</h3>
                      <p className="mt-1 text-sm leading-6 text-ink/70">
                        This removes your login and profile. Pending or returned logs are removed, while verified logs stay preserved for MAI recordkeeping with your name anonymized. Paid MAI subscriptions are canceled during deletion.
                      </p>
                    </div>
                  </div>

                  <label className="mt-4 block">
                    <span className="text-sm font-bold text-ink">Type DELETE to confirm</span>
                    <input
                      value={deleteText}
                      onChange={(event) => setDeleteText(event.target.value)}
                      className="focus-ring mt-2 h-11 w-full rounded-md border border-clay/30 bg-paper px-3 text-sm"
                      placeholder="DELETE"
                    />
                  </label>

                  {deleteMessage ? (
                    <div className="mt-4 rounded-md border border-clay/20 bg-paper p-4 text-sm font-semibold text-clay">
                      {deleteMessage}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={!canDelete || isDeleting}
                    className="focus-ring mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-clay px-4 text-sm font-bold text-white hover:bg-clay/90 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:w-auto"
                  >
                    <Trash2 size={17} aria-hidden="true" />
                    {isDeleting ? 'Deleting account...' : 'Delete my account'}
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </section>

        <section>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="My logs" value={beltLogs.length} detail="Belt User submissions" />
            <StatCard label="Pending queue" value={pendingLogs.length} detail="MAI review" />
            <StatCard label="Verified logs" value={verifiedLogs.length} detail="Signed records" />
          </div>

          <div className="mt-5 rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-clay">Manage Subscription</p>
            <h2 className="mt-1 text-xl font-bold text-ink">
              {isMai ? 'Subscription and billing' : 'Upgrade to MAI'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              {isMai
                ? 'View status, billing cycle, cancellation, and resume options without deleting your account or training history.'
                : 'Upgrade this same account to MAI access. Your belt history, logs, messages, and profile data stay with you.'}
            </p>
            <Link
              to="/profile/subscription"
              className="focus-ring mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-olive px-4 text-sm font-bold text-white hover:bg-olive/90 sm:w-auto"
            >
              <CreditCard size={17} aria-hidden="true" />
              {isMai ? 'Manage Subscription' : 'Upgrade to MAI'}
            </Link>
          </div>
        </section>
      </div>
      )}
    </PageShell>
  );
}

function getSubscriptionAccessLabel({ activeRole, displaySubscription }) {
  if (activeRole !== 'MAI') return 'Free Account';
  if (displaySubscription.status === 'lifetime_free') return 'Lifetime MAI Access';
  if (displaySubscription.status === 'owner_free') return 'Full Access';
  if (displaySubscription.status === 'trialing') return 'Free Trial';
  if (displaySubscription.status === 'active') return 'Full Access';
  return 'Restricted Access';
}

const devTestMaiUserIds = [
  '18a9842e-84f8-46a8-806c-c2276a46c6f0',
  '9fb3dac1-bfd7-440d-bbd4-9b625ec26dd6'
];

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-ink/50">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}

function AchievementsSection({ achievements, progress, unlockedAchievementIds, userAchievements }) {
  const unlockLookup = new Map(userAchievements.map((achievement) => [achievement.achievementId, achievement]));
  const visibleAchievements = Array.isArray(achievements) && achievements.length ? achievements : fallbackAchievements;

  return (
    <section className="rounded-md border border-coyote/35 bg-paper p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-clay">Achievements</p>
          <h2 className="mt-1 text-2xl font-bold text-ink">MCMAP milestones</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/65">
            Badges unlock automatically when verified logs, belt progress, studies, and participation meet the requirement.
          </p>
        </div>
        <p className="text-sm font-bold text-olive">
          {userAchievements.length} of {visibleAchievements.length} unlocked
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleAchievements.map((achievement) => {
          const unlocked = unlockedAchievementIds.has(achievement.id);
          const unlock = unlockLookup.get(achievement.id);
          const visibleName = achievement.hidden && !unlocked ? 'Hidden Achievement' : achievement.name;
          const visibleRequirement = achievement.hidden && !unlocked ? 'Requirement hidden until unlocked.' : achievement.requirement;
          const progressValue = Math.min(progress[achievement.id] || 0, achievement.progressTarget || 1);
          const percent = Math.round((progressValue / (achievement.progressTarget || 1)) * 100);

          return (
            <article
              key={achievement.id}
              className={`rounded-md border p-4 ${
                unlocked
                  ? 'border-olive/35 bg-olive/10'
                  : 'border-coyote/35 bg-field'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-md border ${
                  unlocked
                    ? 'border-olive/35 bg-paper text-olive'
                    : 'border-coyote/35 bg-paper text-ink/35'
                }`}>
                  <AchievementIcon name={achievement.icon} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-ink">{visibleName}</h3>
                    {unlocked ? (
                      <span className="rounded-md bg-olive px-2 py-1 text-xs font-black uppercase tracking-wide text-white">
                        Unlocked
                      </span>
                    ) : achievement.hidden ? (
                      <span className="rounded-md bg-charcoal px-2 py-1 text-xs font-black uppercase tracking-wide text-paper">
                        Hidden
                      </span>
                    ) : (
                      <span className="rounded-md bg-coyote/20 px-2 py-1 text-xs font-black uppercase tracking-wide text-ink/65">
                        Locked
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-ink/65">{visibleRequirement}</p>
                  {achievement.description && (!achievement.hidden || unlocked) ? (
                    <p className="mt-2 text-sm font-semibold leading-6 text-olive">{achievement.description}</p>
                  ) : null}
                </div>
              </div>

              {unlocked ? (
                <p className="mt-4 text-sm font-semibold text-ink/70">
                  Unlock date: {formatAchievementDate(unlock?.unlockedAt)}
                </p>
              ) : achievement.hidden ? null : (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-ink/50">
                    <span>Progress</span>
                    <span>{formatAchievementProgress(achievement, progressValue)} / {formatAchievementProgress(achievement, achievement.progressTarget)}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-coyote/25">
                    <div className="h-2 rounded-full bg-brass" style={{ width: `${Math.min(percent, 100)}%` }} />
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function AchievementIcon({ name }) {
  const iconProps = { size: 24, 'aria-hidden': true };
  const icons = {
    droplet: Droplet,
    chain: Link2,
    helmet: Medal,
    study: BookOpenCheck,
    'shield-bolt': ShieldCheck,
    compass: Compass,
    badge: Award,
    drum: Target,
    glove: Zap,
    graduation: GraduationCap,
    runner: Zap,
    ega: Award,
    snowflake: Snowflake,
    rifles: Crosshair,
    users: Users,
    crosshair: Crosshair,
    calendar: Calendar,
    clock: Clock3,
    map: MapIcon
  };
  const Icon = icons[name] || Award;
  return <Icon {...iconProps} />;
}

function formatAchievementDate(date) {
  if (!date) return 'Unlocked';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

function formatAchievementProgress(achievement, value) {
  if (['first-blood', 'relentless', 'combat-athlete', 'sparring-partner', 'never-rest', 'chesty-proud', 'frozen-chosin', 'master-of-arms', 'belt-hunter'].includes(achievement.id)) {
    return formatMinutes(value);
  }
  return String(value);
}
