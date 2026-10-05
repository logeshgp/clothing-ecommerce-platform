import { useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { classNames, formatDate } from '../../utils/format';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { FormField } from '../checkout/FormField';
import { CheckIcon } from '../ui/Icons';

const KINDS = [
  { value: 'query', label: 'Product question' },
  { value: 'sizing', label: 'Sizing help' },
  { value: 'order', label: 'Order status' },
  { value: 'complaint', label: 'Complaint' },
];

/**
 * Product-page support widget.
 *
 * Opens a conversation that lands in the support console. Once a thread
 * exists, its id is remembered on the device so the shopper can reopen the
 * chat and read replies without signing in.
 */
export function SupportChat({ product }) {
  const { settings } = useStore();
  const { user, isAuthenticated } = useAuth();
  const { notify } = useToast();

  const support = settings.support ?? {};
  const [threads, setThreads] = useLocalStorage('dnd.supportThreads.v1', {});

  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [draft, setDraft] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    kind: 'query',
    message: '',
  });
  const [reply, setReply] = useState('');

  const bottomRef = useRef(null);
  const existingId = product ? threads[product.id] : null;

  // Load any previous conversation about this product when the widget opens.
  useEffect(() => {
    if (!open || !existingId || thread) return;

    api
      .thread(existingId, draft.email || user?.email)
      .then((data) => setThread(data.thread))
      .catch(() => {
        // Thread was deleted or the email no longer matches — start fresh.
        setThreads((current) => {
          const next = { ...current };
          delete next[product.id];
          return next;
        });
      });
  }, [open, existingId, thread, draft.email, user?.email, product, setThreads]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages?.length]);

  if (!support.enabled) return null;

  async function startThread(event) {
    event.preventDefault();

    const found = {};
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(draft.email)) {
      found.email = 'Enter a valid email address.';
    }
    if (draft.message.trim().length < 5) found.message = 'Tell us a little more.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      const { thread: created } = await api.createThread({
        ...draft,
        subject: `${product.name} — ${KINDS.find((k) => k.value === draft.kind)?.label}`,
        productId: product.id,
      });

      setThread(created);
      setThreads((current) => ({ ...current, [product.id]: created.id }));
      setDraft((current) => ({ ...current, message: '' }));
      notify('Message sent. Our team will reply shortly.', { tone: 'success' });
    } catch (error) {
      notify(error.message, { tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function sendReply(event) {
    event.preventDefault();
    if (reply.trim().length < 2) return;

    setBusy(true);
    try {
      const { thread: updated } = await api.replyToThread(thread.id, {
        message: reply,
        email: thread.email,
      });
      setThread(updated);
      setReply('');
    } catch (error) {
      notify(error.message, { tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-sand-300 bg-sand-50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">{support.heading ?? 'Questions about this piece?'}</p>
            <p className="mt-0.5 text-xs text-ink-500">
              {support.body ?? 'Our team usually replies within a few hours.'}
            </p>
          </div>
          <Button onClick={() => setOpen(true)} variant="outline" size="sm">
            {existingId ? 'View conversation' : support.buttonLabel ?? 'Ask a question'}
          </Button>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={thread ? `Conversation · ${thread.status}` : 'Ask about this product'}
      >
        <div className="space-y-5 p-6">
          <div className="flex items-center gap-3 rounded-2xl bg-sand-100 p-3">
            <img
              src={product.colors?.[0]?.image}
              alt=""
              className="h-14 w-12 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{product.name}</p>
              <p className="text-xs text-ink-500">Reference: {product.id}</p>
            </div>
          </div>

          {thread ? (
            <>
              <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                {thread.messages.map((message) => (
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
                <div ref={bottomRef} />
              </div>

              {thread.status === 'closed' ? (
                <p className="flex items-center gap-2 rounded-xl bg-moss-500/10 px-3.5 py-2.5 text-sm text-moss-500">
                  <CheckIcon className="h-4 w-4" /> This conversation is closed.
                </p>
              ) : (
                <form onSubmit={sendReply} className="flex gap-2">
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Write a reply…"
                    aria-label="Reply"
                    className="dnd-field flex-1"
                  />
                  <Button type="submit" loading={busy}>
                    Send
                  </Button>
                </form>
              )}
            </>
          ) : (
            <form onSubmit={startThread} noValidate className="space-y-4">
              {!isAuthenticated && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    id="support-name"
                    label="Your name"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  />
                  <FormField
                    id="support-email"
                    label="Email"
                    type="email"
                    value={draft.email}
                    onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                    error={errors.email}
                  />
                </div>
              )}

              <FormField
                id="support-kind"
                label="What's this about?"
                as="select"
                value={draft.kind}
                onChange={(e) => setDraft({ ...draft, kind: e.target.value })}
              >
                {KINDS.map((kind) => (
                  <option key={kind.value} value={kind.value}>
                    {kind.label}
                  </option>
                ))}
              </FormField>

              <FormField
                id="support-message"
                label="Message"
                as="textarea"
                rows={4}
                value={draft.message}
                onChange={(e) => setDraft({ ...draft, message: e.target.value })}
                error={errors.message}
                placeholder="I'm 5'9 and usually wear M — would L be too loose?"
              />

              <Button type="submit" full loading={busy}>
                Send to support
              </Button>
            </form>
          )}
        </div>
      </Modal>
    </>
  );
}
