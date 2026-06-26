"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: "1rem" }}>
          <div style={{ maxWidth: "24rem", textAlign: "center" }}>
            <h1 style={{ marginBottom: "0.5rem", fontSize: "1.125rem", fontWeight: 600, color: "#0f172a" }}>Something went wrong</h1>
            <p style={{ marginBottom: "1.5rem", fontSize: "0.875rem", color: "#64748b" }}>
              We&apos;ve been notified and are looking into it.
            </p>
            <button
              onClick={reset}
              style={{ borderRadius: "0.5rem", background: "#059669", padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: 500, color: "#fff", border: "none", cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
