import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { getWhatsAppContacts, openWhatsAppMessage } from '../utils/whatsapp';

export default function Feedback() {
  const { settings } = useStore();
  const { notify } = useToast();
  const contacts = useMemo(() => getWhatsAppContacts(settings), [settings]);
  const [rating, setRating] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function sendFeedback(contact) {
    const trimmedMessage = message.trim();
    if (!rating) {
      setError('Choose a rating before continuing.');
      return;
    }
    if (trimmedMessage.length < 5) {
      setError('Please enter at least 5 characters of feedback.');
      return;
    }

    openWhatsAppMessage(
      contact.number,
      `Hello ${settings.storeName || 'Store'}, I would like to share feedback.\n\nRating: ${rating}/5\nFeedback: ${trimmedMessage}`,
    );
    setError('');
    notify('Review the feedback draft and tap Send in WhatsApp.', { tone: 'success' });
  }

  return (
    <main className="dnd-container max-w-3xl py-12 sm:py-16">
      <p className="dnd-eyebrow">Your thoughts matter</p>
      <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Share feedback</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-500">
        Tell us about your experience. We’ll prepare a WhatsApp message for you to review and send.
      </p>

      <section className="mt-8 rounded-3xl border border-sand-300 bg-sand-50 p-6 sm:p-8">
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (contacts[0]) sendFeedback(contacts[0]);
          }}
        >
          <fieldset>
            <legend className="dnd-label">How was your experience?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <label
                  key={value}
                  className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm ${
                    rating === String(value)
                      ? 'border-ink-900 bg-ink-900 text-sand-50'
                      : 'border-sand-300 bg-white'
                  }`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="feedback-rating"
                    value={value}
                    checked={rating === String(value)}
                    onChange={(event) => {
                      setRating(event.target.value);
                      setError('');
                    }}
                  />
                  {value} {value === 1 ? 'star' : 'stars'}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="feedback-message" className="dnd-label">Your feedback</label>
            <textarea
              id="feedback-message"
              className="dnd-field min-h-36 resize-y"
              maxLength={1000}
              required
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                setError('');
              }}
              placeholder="What did you like, or what could we improve?"
            />
            <p className="mt-1 text-right text-xs text-ink-500">{message.length}/1000</p>
          </div>

          {error && <p role="alert" className="text-sm text-berry-500">{error}</p>}

          {contacts.length ? (
            <div className="flex flex-wrap gap-3">
              {contacts.map((contact) => (
                <Button
                  key={contact.id || contact.number}
                  type="button"
                  onClick={() => sendFeedback(contact)}
                >
                  {contacts.length > 1 ? `Continue in WhatsApp · ${contact.label}` : 'Continue in WhatsApp'}
                </Button>
              ))}
            </div>
          ) : (
            <p role="status" className="rounded-xl bg-sand-200 p-4 text-sm">
              WhatsApp feedback is unavailable because no enabled store contact is configured.
            </p>
          )}
          <p className="text-xs leading-relaxed text-ink-500">
            Your feedback is not sent by this page. WhatsApp will open with a draft; check the
            recipient and message, then tap Send. Return to the <Link to="/" className="underline">storefront</Link>.
          </p>
        </form>
      </section>
    </main>
  );
}
