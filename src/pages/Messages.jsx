import React from 'react';
import { MessageSquare, Send } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import PageShell from '../components/PageShell.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function Messages() {
  const { activeRole, beltLogs, maiDirectory, messageThreads, sendMessage, markThreadRead } = useApp();
  const [selectedThreadId, setSelectedThreadId] = React.useState(messageThreads[0]?.id || '');
  const [draft, setDraft] = React.useState('');
  const [newMaiNumber, setNewMaiNumber] = React.useState('');
  const selectedThread = messageThreads.find((thread) => thread.id === selectedThreadId) || messageThreads[0] || null;
  const eligibleMais = React.useMemo(() => getEligibleMais({ beltLogs, maiDirectory }), [beltLogs, maiDirectory]);

  React.useEffect(() => {
    if (selectedThread?.id) markThreadRead(selectedThread.id);
  }, [selectedThread?.id]);

  React.useEffect(() => {
    if (!selectedThreadId && messageThreads[0]?.id) {
      setSelectedThreadId(messageThreads[0].id);
    }
  }, [messageThreads, selectedThreadId]);

  const submitMessage = async (event) => {
    event.preventDefault();
    const result = await sendMessage({
      threadId: selectedThread?.id,
      targetMaiNumber: selectedThread ? selectedThread.maiNumber : newMaiNumber,
      body: draft
    });
    if (result) {
      setDraft('');
      setSelectedThreadId(result.threadId);
      setNewMaiNumber('');
    }
  };

  return (
    <PageShell
      eyebrow="Messages"
      title="Messages"
      description="Communicate inside the logbook with MAIs or Belt Users connected to submitted training logs."
    >
      {messageThreads.length || activeRole === 'Belt User' ? (
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

            <div className="mt-4 grid gap-2">
              {messageThreads.map((thread) => {
                const lastMessage = thread.messages.at(-1);
                const unread = thread.messages.some((message) => !message.readBy?.includes(activeRole === 'MAI' ? thread.maiNumber : thread.beltUserEmail));
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => {
                      setSelectedThreadId(thread.id);
                      setNewMaiNumber('');
                    }}
                    className={`focus-ring rounded-md border p-3 text-left ${
                      selectedThread?.id === thread.id ? 'border-olive bg-olive/10' : 'border-coyote/30 bg-field hover:bg-paper'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-ink">{activeRole === 'MAI' ? thread.beltUserName : thread.maiName}</span>
                      {unread ? <span className="h-2.5 w-2.5 rounded-full bg-clay" /> : null}
                    </span>
                    <span className="mt-1 block truncate text-xs text-ink/60">{lastMessage?.body || 'No messages yet'}</span>
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
                      ? activeRole === 'MAI'
                        ? selectedThread.beltUserName
                        : `${selectedThread.maiName} | ${selectedThread.maiNumber}`
                      : `New message to ${newMaiNumber}`}
                  </h2>
                </div>

                <div className="grid max-h-[520px] gap-3 overflow-y-auto p-5">
                  {(selectedThread?.messages || []).map((message) => (
                    <article key={message.id} className="rounded-md bg-field p-4">
                      <div className="flex flex-col justify-between gap-1 sm:flex-row">
                        <p className="text-sm font-bold text-ink">{message.senderName}</p>
                        <p className="text-xs font-semibold text-ink/50">{formatDateTime(message.createdAt)}</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-ink/75">{message.body}</p>
                    </article>
                  ))}
                  {!selectedThread?.messages?.length ? (
                    <p className="rounded-md bg-field p-4 text-sm leading-6 text-ink/65">Write the first message in this conversation.</p>
                  ) : null}
                </div>

                <form className="border-t border-coyote/25 p-5" onSubmit={submitMessage}>
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
                    disabled={!draft.trim() || (!selectedThread && !newMaiNumber)}
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
                    : 'When Belt Users message you about submitted logs, those conversations will appear here.'
                }
              />
            )}
          </section>
        </div>
      ) : (
        <EmptyState title="No messages yet" text="When Belt Users message you about submitted logs, those conversations will appear here." />
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

function formatDateTime(date) {
  return new Date(date).toLocaleString();
}
