import { Button } from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="dnd-container flex min-h-[60vh] flex-col items-center justify-center gap-6 py-20 text-center">
      <p className="font-[family-name:var(--font-display)] text-7xl font-bold text-sand-400 sm:text-9xl">
        404
      </p>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">This page went out of stock.</h1>
        <p className="max-w-sm text-sm text-ink-500">
          The link may be out of date, or the piece may have been archived.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button to="/">Back home</Button>
        <Button to="/shop" variant="outline">
          Browse the collection
        </Button>
      </div>
    </div>
  );
}
