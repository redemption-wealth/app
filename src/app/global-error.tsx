"use client";

import { useEffect } from "react";
import { telemetry } from "@/lib/telemetry";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    telemetry.capture(error, { scope: "global", digest: error.digest });
  }, [error]);

  return (
    <html lang="id">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          padding: "3rem 1.5rem",
          fontFamily: "system-ui, sans-serif",
          background: "#fff",
          color: "#111",
          textAlign: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
            Terjadi kesalahan
          </h1>
          <p
            style={{
              maxWidth: "24rem",
              marginTop: "0.5rem",
              fontSize: "0.875rem",
              color: "#555",
            }}
          >
            Aplikasi mengalami masalah. Coba muat ulang halaman.
          </p>
          {error.digest ? (
            <p
              style={{
                marginTop: "0.5rem",
                fontSize: "0.75rem",
                fontFamily: "monospace",
                color: "#555",
              }}
            >
              ID: {error.digest}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={reset}
          style={{
            borderRadius: "9999px",
            background: "#111",
            color: "#fff",
            padding: "0.5rem 1.25rem",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          Coba lagi
        </button>
      </body>
    </html>
  );
}
