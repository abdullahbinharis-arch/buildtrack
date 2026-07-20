'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HardHat, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const [key, setKey] = useState('');
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;

    // Test the key against the API
    fetch('/api/projects', {
      headers: { 'x-api-key': key.trim() },
    })
      .then((res) => {
        if (res.ok) {
          sessionStorage.setItem('buildtrack_key', key.trim());
          router.push('/');
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true));
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-rose-50/30 p-4">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-20 top-0 h-96 w-96 rounded-full bg-violet-300/25 blur-[120px]" />
        <div className="absolute right-0 top-24 h-[28rem] w-[28rem] rounded-full bg-rose-300/20 blur-[130px]" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl bg-white/50 p-8 shadow-xl shadow-slate-900/5 ring-1 ring-white/80 backdrop-blur-2xl"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/25">
            <HardHat className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">BuildTrack</h1>
          <p className="mt-1 text-sm text-slate-500">Enter access key to continue</p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200/80 bg-red-50/80 px-4 py-3 text-sm text-red-700">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            Invalid key
          </div>
        )}

        <input
          type="password"
          value={key}
          onChange={(e) => { setKey(e.target.value); setError(false); }}
          placeholder="Enter API key"
          className="mb-4 w-full rounded-xl border border-slate-200/80 bg-white/85 px-4 py-3 text-sm text-slate-900 shadow-sm ring-1 ring-white/70 backdrop-blur-sm transition-all placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          autoFocus
        />

        <button
          type="submit"
          disabled={!key.trim()}
          className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-brand-500/20 transition-all hover:bg-brand-700 disabled:opacity-50"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
