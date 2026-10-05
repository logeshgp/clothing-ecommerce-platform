import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { classNames, formatDate } from '../../utils/format';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { FormField } from '../../components/checkout/FormField';

const STATUS_TONES = {
  open: 'bg-clay-400/20 text-clay-500',
  pending: 'bg-ink-900/10 text-ink-700',
  resolved: 'bg-moss-500/15 text-moss-500',
  closed: 'bg-sand-300 text-ink-500',
};

/** Customer-facing view of their support conversations. */
export default function AccountSupport() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [threadIds] = useLocalStorage('dnd.supportThreads.v1', {});

  const [threads, setThreads] = useState([]);
  const [active, setActive] = useState(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = [...new Set(Object.values(threadIds))];
    if (!ids.length) {
      setLoading(false);
      return;
    }

    Promise.allSettled(ids.map((id) => api.thread(id, user?.email))).then((results) => {
      const loaded = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value.thread)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      setThreads(loaded);
      setActive(loaded[0] ?? null);
      setLoading(false);
    });
  }, [threadIds, user?.email]);

  async function sendReply(event) {
    event.preventDefault();
    if (reply.trim().length < 2) return;

    setBusy(true);
    try {
      const { thread } = await api.replyToThread(active.id, {
        message: reply,
        email: active.email,
      });
      setActive(thread);
      setThreads((current) => current.map((t) => (t.id === thread.id ? thread : t)));
      setReply('');
    } catch (error) {
      notify(error.message, { tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-sm text-ink-500">Loading conversations…</p>;

  if (!threads.length) {
    return (
      <EmptyState
        mark="◇"
        title="No conversations yet."
        description="Ask a question from any product page and it will appear here."
      >
        <Button to="/shop">Browse products</Button>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Support conversations</h2>

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <ul className="space-y-2">
          {threads.map((thread) => (
            <li key={thread.id}>
              <button
                type="button"
                onClick={() => setActive(thread)}
                className={classNames(
                  'w-full rounded-2xl border p-3 text-left transition-colors',
                  active?.id === thread.id
                    ? 'border-ink-900 bg-sand-50'
                    : 'border-sand-300 hover:border-ink-900/40',
                )}
              >
                <p className="truncate text-sm font-medium">{thread.subject}</p>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span
                    className={classNames(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize',
                      STATUS_TONES[thread.status],
                    )}
                  >
                    {thread.status}
                  </span>
                  <span className="text-[11px] text-ink-500">
                    {formatDate(thread.updatedAt, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>

        {active && (
          <div className="rounded-3xl border border-sand-300 bg-sand-50 p-5">
            <div className="mb-4 border-b border-sand-200 pb-3">
              <p className="text-sm font-semibold">{active.subject}</p>
              <p className="text-xs text-ink-500">
                Opened {formatDate(active.createdAt)} · {active.messages.length} messages
              </p>
            </div>

            <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
              {active.messages.map((message) => (
                <div
                  key={message.id}
                  className={classNames(
                    'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                    message.role === 'agent'
                      ? 'bg-ink-900 text-sand-100'
                      : 'ml-auto bg-sand-200 text-ink-900',
                  )}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{message.body}</p>
                  <p
                    className={classNames(
                      'mt-1.5 text-[10px]',
                      message.role === 'agent' ? 'text-sand-400' : 'text-ink-500',
                    )}
                  >
                    {message.role === 'agent' ? message.name || 'Support' : 'You'} ·{' '}
                    {formatDate(message.createdAt, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>

            {active.status !== 'closed' && (
              <form onSubmit={sendReply} className="mt-4 flex gap-2">
                <FormField
                  id="account-reply"
                  label="Reply"
                  className="flex-1"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Write a reply…"
                />
                <Button type="submit" loading={busy} className="mt-6 self-start">
                  Send
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
