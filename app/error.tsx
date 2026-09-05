"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="error-page">
      <h1>Let’s reconnect.</h1>
      <p>
        Pact could not load this view. Your funds remain controlled by the
        escrow contract.
      </p>
      <button onClick={reset}>Try again</button>
    </main>
  );
}
