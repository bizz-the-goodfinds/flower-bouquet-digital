"use client";

/** Last-resort error page (root layout failed), so it can't rely on app fonts or CSS. */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100dvh", display: "grid", placeItems: "center", background: "#FBF6EE", color: "#1B1A17", fontFamily: "Georgia, serif", textAlign: "center", padding: 16 }}>
        <title>Something went wrong | Flower Bouquet Digital</title>
        <div>
          <p style={{ fontSize: 64, margin: 0 }} aria-hidden>
            💐
          </p>
          <h1 style={{ fontSize: 40, fontStyle: "italic", fontWeight: 400, margin: "16px 0 8px" }}>A petal fell off</h1>
          <p style={{ fontFamily: "system-ui, sans-serif", opacity: 0.75, maxWidth: 360, margin: "0 auto" }}>
            Something went wrong loading Flower Bouquet Digital. Please try again.
          </p>
          <button
            onClick={() => retry()}
            style={{ marginTop: 24, padding: "12px 22px", borderRadius: 999, border: 0, background: "#1B1A17", color: "#FBF6EE", fontSize: 16, cursor: "pointer" }}
          >
            Try again
          </button>
          {error.digest && <p style={{ fontFamily: "monospace", fontSize: 12, opacity: 0.6, marginTop: 24 }}>Error ref: {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
