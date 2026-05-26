import React from 'react';
import { MessageSquare, Send } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import PageShell from '../components/PageShell.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function Messages() {
  const { activeRole, beltLogs, maiDirectory, messageThreads, sendMessage, markThreadRead, session, beltUser, maiUser } = useApp();
  const [selectedThreadId, setSelectedThreadId] = React.useState(messageThreads[0]?.id || '');
  const [draft, setDraft] = React.useState('');
  const [newMaiNumber, setNewMaiNumber] = React.useState('');
  const [messageError, setMessageError] = React.useState('');
  const selectedThread = messageThreads.find((thread) => thread.id === selectedThreadId) || messageThreads[0] || null;
  const eligibleMais = React.useMemo(() => getEligibleMais({ beltLogs, maiDirectory }), [beltLogs, maiDirectory]);
  const lookedUpMai = React.useMemo(
    () => maiDirectory.find((mai) => mai.maiNumber?.toLowerCase() === newMaiNumber.trim().toLowerCase()),
    [maiDirectory, newMaiNumber]
  );

  React.useEffect(() => {
    if (selectedThread?.id) {
      markThreadRead(selectedThread.id);
    }
  }, [selectedThread?.id, markThreadRead]);

  React.useEffect(() => {
    if (!selectedThreadId && messageThreads[0]?.id) {
      setSelectedThreadId(messageThreads[0].id);
    }
  }, [messageThreads, selectedThreadId]);

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
    } catch (error) {
      setMessageError(error.message || 'Message could not be sent. Check the MAI code and try again.');
    }
  };

  return (
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
              <MessageSquare size={19} className="text-olive" aria-hidden="true" />
            </div>

            {activeRole === 'Belt User' && eligibleMais.length ? (
              <label className="mt-4 block">
                <span className="text-sm font-bold text-ink">Start message to MAI</span>
                <select
                  value={newMaiNumber}
                  onChange={(event) => {
                    setNewMaiNumber(event.target.value);
                    setSelectedThreadId('');
                    setMessageError('');
                  }}
                  className="focus-ring mt-2 h-11 w-full rounded-md border border-ink/15 bg-paper px-3 text-sm"
                >
                  <option value="">Choose connected MAI</option>
                  {eligibleMais.map((mai) => (
                    <option key={mai.maiNumber} value={mai.maiNumber}>
                      {mai.name} | {mai.maiNumber}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {activeRole === 'MAI' ? (
              <label className="mt-4 block">
                <span className="text-sm font-bold text-ink">Start message to MAI</span>
                <input
                  value={newMaiNumber}
                  onChange={(event) => {
                    setNewMaiNumber(event.target.value);
                    setSelectedThreadId('');
                    setMessageError('');
                  }}
                  className="focus-ring mt-2 h-11 w-full rounded-md border border-ink/15 bg-paper px-3 text-sm"
                  placeholder="Enter MAI code"
                />
                {newMaiNumber.trim() ? (
                  <span className={`mt-2 block text-xs font-semibold ${lookedUpMai && lookedUpMai.maiNumber?.toLowerCase() !== maiUser.maiNumber?.toLowerCase() ? 'text-olive' : 'text-clay'}`}>
                    {lookedUpMai && lookedUpMai.maiNumber?.toLowerCase() !== maiUser.maiNumber?.toLowerCase()
                      ? `${lookedUpMai.maiNumber} ${lookedUpMai.name}`
                      : lookedUpMai?.maiNumber?.toLowerCase() === maiUser.maiNumber?.toLowerCase()
                        ? 'Choose another MAI. You cannot message yourself.'
                        : 'No MAI found with that code.'}
                  </span>
                ) : null}
              </label>
            ) : null}

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
  );
}

function getEligibleMais({ beltLogs, maiDirectory }) {
  const submittedMaiNumbers = [...new Set(beltLogs.map((log) => log.maiNumber).filter(Boolean))];
  return submittedMaiNumbers
    .map((maiNumber) => maiDirectory.find((mai) => mai.maiNumber?.toLowerCase() === maiNumber.toLowerCase()))
    .filter(Boolean);
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
