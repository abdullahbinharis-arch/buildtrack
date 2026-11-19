'use client';

import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string;
  onDone: () => void;
  durationMs?: number;
}

/** Small floating confirmation shown after a successful save/delete. Auto-dismisses. */
export function Toast({ message, onDone, durationMs = 3000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, durationMs);
    return () => clearTimeout(t);
  }, [onDone, durationMs]);

  return (
    <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 animate-fade-in">
      <div className="flex items-center gap-2 rounded-xl bg-slate-900/95 px-4 py-2.5 text-sm font-semibold text-white shadow-xl shadow-slate-900/20 ring-1 ring-white/10 backdrop-blur-sm">
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        {message}
      </div>
    </div>
  );
}
