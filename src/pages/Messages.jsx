import React from 'react';
import { MessageSquare, Plus, Send, X } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import PageShell from '../components/PageShell.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function Messages() {
  const { activeRole, maiDirectory, messageThreads, sendMessage, markThreadRead, session, beltUser, maiUser } = useApp();
  const [selectedThreadId, setSelectedThreadId] = React.useState(messageThreads[0]?.id || '');
  const [draft, setDraft] = React.useState('');
  const [newMaiNumber, setNewMaiNumber] = React.useState('');
  const [showStartMessage, setShowStartMessage] = React.useState(false);
  const [messageError, setMessageError] = React.useState('');
  const selectedThread = selectedThreadId ? messageThreads.find((thread) => thread.id === selectedThreadId) || null : null;
  const lookedUpMai = React.useMemo(
    () => maiDirectory.find((mai) => mai.isActive !== false && mai.maiNumber?.toLowerCase() === newMaiNumber.trim().toLowerCase()),
    [maiDirectory, newMaiNumber]
  );

  React.useEffect(() => {
    if (selectedThread?.id) {
      markThreadRead(selectedThread.id);
    }
  }, [selectedThread?.id, markThreadRead]);

  React.useEffect(() => {
    if (!selectedThreadId && !newMaiNumber && messageThreads[0]?.id) {
      setSelectedThreadId(messageThreads[0].id);
    }
  }, [messageThreads, newMaiNumber, selectedThreadId]);

  const openNewMessage = () => {
    const cleanMaiNumber = newMaiNumber.trim();
    setMessageError('');

    if (!cleanMaiNumber) {
      setMessageError('Enter an MAI code to start a message.');
      return;
    }

    if (!/^MAI-\d{4}$/i.test(cleanMaiNumber)) {
      setMessageError('Use the format MAI-0000.');
      return;
    }

    if (!lookedUpMai) {
      setMessageError('That MAI code does not match an active MAI account.');
      return;
    }

    if (activeRole === 'MAI' && lookedUpMai.maiNumber?.toLowerCase() === maiUser.maiNumber?.toLowerCase()) {
      setMessageError('Choose another MAI. You cannot message yourself.');
      return;
    }

    const existingThread = findExistingThreadForMai({ activeRole, beltUser, maiUser, messageThreads, targetMaiNumber: lookedUpMai.maiNumber });
    if (existingThread) {
      setSelectedThreadId(existingThread.id);
    } else {
      setSelectedThreadId('');
    }
    setNewMaiNumber(lookedUpMai.maiNumber);
    setDraft('');
    setShowStartMessage(false);
  };

  const submitMessage = async (event) => {
    event.preventDefault();
    setMessageError('');
    try {
      const result = await sendMessage({
        threadId: selectedThread?.id,
        targetMaiNumber: selectedThread ? getThreadTargetMaiNumber({ activeRole, maiUser, thread: selectedThread }) : newMaiNumber,
        body: draft
      });
      if (!result) return;
      setDraft('');
      setSelectedThreadId(result.threadId);
      setNewMaiNumber('');
      setShowStartMessage(false);
    } catch (error) {
      setMessageError(error.message || 'Message could not be sent. Check the MAI code and try again.');
    }
  };

  return (
    <>
      <PageShell
        eyebrow="Messages"
        title="Messages"
        description="Communicate inside the logbook with MAIs or Belt Users connected to submitted training logs."
      >
      {messageThreads.length || ['Belt User', 'MAI'].includes(activeRole) ? (
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-md border border-coyote/35 bg-paper p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-ink">Inbox</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowStartMessage(true);
                    setNewMaiNumber('');
                    setSelectedThreadId('');
                    setMessageError('');
                  }}
                  className="focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-md bg-olive px-3 text-sm font-bold text-white"
                >
                  <Plus size={16} aria-hidden="true" />
                  Start New Message
                </button>
                <MessageSquare size={19} className="text-olive" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {messageThreads.map((thread) => {
                const unread = thread.messages.some((message) =>
                  isUnreadForCurrentUser(message, {
                    currentUserId: session?.user?.id
                  })
                );
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => {
                      setSelectedThreadId(thread.id);
                      setNewMaiNumber('');
                      setMessageError('');
                    }}
                    className={`focus-ring rounded-md border p-3 text-left ${
                      selectedThread?.id === thread.id ? 'border-olive bg-olive/10' : 'border-coyote/30 bg-field hover:bg-paper'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-ink">{getThreadDisplayName({ activeRole, maiUser, thread })}</span>
                      {unread ? <span className="h-2.5 w-2.5 rounded-full bg-clay" /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="rounded-md border border-coyote/35 bg-paper shadow-sm">
            {selectedThread || newMaiNumber ? (
              <>
                <div className="border-b border-coyote/25 p-5">
                  <p className="text-sm font-bold uppercase tracking-wide text-clay">Conversation</p>
                  <h2 className="mt-1 text-xl font-bold text-ink">
                    {selectedThread
                      ? getThreadConversationTitle({ activeRole, maiUser, thread: selectedThread })
                      : lookedUpMai
                        ? `${lookedUpMai.name} | ${lookedUpMai.maiNumber}`
                        : `New message to ${newMaiNumber}`}
                  </h2>
                </div>

                <div className="grid max-h-[520px] gap-3 overflow-y-auto p-5">
                  {(selectedThread?.messages || []).map((message) => (
                    <article key={message.id} className="rounded-md bg-field p-4">
                      <div className="flex flex-col justify-between gap-1 sm:flex-row">
                        <p className="text-sm font-bold text-ink">{message.senderName}</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-ink/75">{message.body}</p>
                      <div className="mt-3 grid gap-1 text-xs font-semibold text-ink/50 sm:grid-cols-2">
                        <p>Sent: {formatDateTime(message.createdAt)}</p>
                        <p>Seen: {message.seenAt ? formatDateTime(message.seenAt) : 'Not yet viewed'}</p>
                      </div>
                    </article>
                  ))}
                  {!selectedThread?.messages?.length ? (
                    <p className="rounded-md bg-field p-4 text-sm leading-6 text-ink/65">Write the first message in this conversation.</p>
                  ) : null}
                </div>

                <form className="border-t border-coyote/25 p-5" onSubmit={submitMessage}>
                  {messageError ? (
                    <div className="mb-4 rounded-md border border-clay/20 bg-clay/10 p-3 text-sm font-semibold text-clay">
                      {messageError}
                    </div>
                  ) : null}
                  <label className="block">
                    <span className="text-sm font-bold text-ink">Reply</span>
                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      className="focus-ring mt-2 min-h-28 w-full rounded-md border border-ink/15 px-3 py-3 text-sm"
                      placeholder="Type your message"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={!draft.trim() || (!selectedThread && !newMaiNumber.trim()) || (activeRole === 'MAI' && !selectedThread && (!lookedUpMai || lookedUpMai.maiNumber?.toLowerCase() === maiUser.maiNumber?.toLowerCase()))}
                    className="focus-ring mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-olive px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send size={17} aria-hidden="true" />
                    Send message
                  </button>
                </form>
              </>
            ) : (
              <EmptyState
                title="No messages yet"
                text={
                  activeRole === 'Belt User'
                    ? 'Once you submit a log to an MAI, you will be able to message that MAI here.'
                    : 'Enter an MAI code to start a message, or open a conversation when one appears here.'
                }
              />
            )}
          </section>
        </div>
      ) : (
        <EmptyState title="No messages yet" text="Enter an MAI code to start a message, or open a conversation when one appears here." />
      )}
      </PageShell>
      {showStartMessage ? (
        <StartMessageModal
          activeRole={activeRole}
          maiUser={maiUser}
          newMaiNumber={newMaiNumber}
          lookedUpMai={lookedUpMai}
          messageError={messageError}
          onChange={(value) => {
            setNewMaiNumber(value);
            setMessageError('');
          }}
          onClose={() => {
            setShowStartMessage(false);
            setNewMaiNumber('');
            setMessageError('');
          }}
          onStart={openNewMessage}
        />
      ) : null}
    </>
  );
}

function getThreadDisplayName({ activeRole, maiUser, thread }) {
  if (activeRole === 'MAI' && thread.threadType === 'mai_mai') {
    return thread.initiatingMaiNumber?.toLowerCase() === maiUser.maiNumber?.toLowerCase()
      ? thread.recipientMaiName
      : thread.initiatingMaiName;
  }

  return activeRole === 'MAI' ? thread.beltUserName : thread.maiName;
}

function getThreadConversationTitle({ activeRole, maiUser, thread }) {
  if (activeRole === 'MAI' && thread.threadType === 'mai_mai') {
    const name = getThreadDisplayName({ activeRole, maiUser, thread });
    const maiNumber = thread.initiatingMaiNumber?.toLowerCase() === maiUser.maiNumber?.toLowerCase()
      ? thread.recipientMaiNumber
      : thread.initiatingMaiNumber;
    return `${name} | ${maiNumber}`;
  }

  if (activeRole === 'MAI') return thread.beltUserName;
  return `${thread.maiName} | ${thread.maiNumber}`;
}

function getThreadTargetMaiNumber({ activeRole, maiUser, thread }) {
  if (activeRole === 'MAI' && thread.threadType === 'mai_mai') {
    return thread.initiatingMaiNumber?.toLowerCase() === maiUser.maiNumber?.toLowerCase()
      ? thread.recipientMaiNumber
      : thread.initiatingMaiNumber;
  }

  return thread.maiNumber;
}

function formatDateTime(date) {
  return new Date(date).toLocaleString();
}

function isUnreadForCurrentUser(message, { currentUserId }) {
  return Boolean(currentUserId && message.recipientId === currentUserId && !message.seenAt);
}

function findExistingThreadForMai({ activeRole, beltUser, maiUser, messageThreads, targetMaiNumber }) {
  const target = targetMaiNumber?.trim().toLowerCase();
  if (!target) return null;

  if (activeRole === 'MAI') {
    return messageThreads.find((thread) => {
      if (thread.threadType !== 'mai_mai') return false;
      const participants = [thread.initiatingMaiNumber, thread.recipientMaiNumber].map((maiNumber) => maiNumber?.toLowerCase());
      return participants.includes(target) && participants.includes(maiUser.maiNumber?.toLowerCase());
    }) || null;
  }

  return messageThreads.find((thread) =>
    thread.threadType !== 'mai_mai' &&
    thread.beltUserEmail?.toLowerCase() === beltUser.email?.toLowerCase() &&
    thread.maiNumber?.toLowerCase() === target
  ) || null;
}

function StartMessageModal({ activeRole, maiUser, newMaiNumber, lookedUpMai, messageError, onChange, onClose, onStart }) {
  const isSelfMai = activeRole === 'MAI' && lookedUpMai?.maiNumber?.toLowerCase() === maiUser.maiNumber?.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 px-4 py-6">
      <section className="w-full max-w-md rounded-md bg-paper p-5 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-clay">Start New Message</p>
            <h2 className="mt-1 text-2xl font-bold text-ink">Enter MAI Code</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring grid h-9 w-9 place-items-center rounded-md border border-ink/15 text-ink/70 hover:bg-field"
          >
            <X size={17} aria-hidden="true" />
            <span className="sr-only">Close start message form</span>
          </button>
        </div>

        <label className="mt-5 block">
          <span className="text-sm font-bold text-ink">Enter MAI Code</span>
          <input
            value={newMaiNumber}
            onChange={(event) => onChange(event.target.value)}
            className="focus-ring mt-2 h-11 w-full rounded-md border border-ink/15 bg-paper px-3 text-sm"
            placeholder="Example: MAI-0000"
          />
        </label>

        {newMaiNumber.trim() ? (
          <p className={`mt-3 text-sm font-semibold ${lookedUpMai && !isSelfMai ? 'text-olive' : 'text-clay'}`}>
            {lookedUpMai && !isSelfMai
              ? `${lookedUpMai.maiNumber} ${lookedUpMai.name}`
              : isSelfMai
                ? 'Choose another MAI. You cannot message yourself.'
                : 'No active MAI found with that code.'}
          </p>
        ) : null}

        {messageError ? (
          <div className="mt-4 rounded-md border border-clay/20 bg-clay/10 p-3 text-sm font-semibold text-clay">
            {messageError}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="focus-ring inline-flex h-10 items-center justify-center rounded-md border border-ink/15 bg-field px-4 text-sm font-bold text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onStart}
            className="focus-ring inline-flex h-10 items-center justify-center rounded-md bg-olive px-4 text-sm font-bold text-white"
          >
            Start Message
          </button>
        </div>
      </section>
    </div>
  );
}
