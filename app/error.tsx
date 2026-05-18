"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    fetch('/api/errors/client', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        path: window.location.pathname,
      }),
    }).catch(() => undefined);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Terjadi kesalahan</h1>
        <p className="mt-2 text-sm text-slate-600">Sistem tidak dapat memuat halaman ini. Coba lagi atau hubungi administrator.</p>
        <button
          onClick={reset}
          className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Coba lagi
        </button>
      </div>
    </div>
  );
}
