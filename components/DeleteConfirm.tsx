'use client';

import { useState } from 'react';
import { Button } from './ui/Button';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmProps {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** When set, the user must type this exact text to enable the Delete button. */
  requireTyping?: string;
}

export function DeleteConfirm({ title, onConfirm, onCancel, requireTyping }: DeleteConfirmProps) {
  const [typed, setTyped] = useState('');
  const canConfirm = !requireTyping || typed.trim() === requireTyping;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Dialog */}
      <div className="fixed inset-0 z-50">
        <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-red-100/70 bg-white p-4 shadow-2xl shadow-red-900/10 ring-1 ring-red-200/60">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-red-900">Confirm Delete</p>
              <p className="mt-0.5 text-sm text-red-700">{title}</p>
            </div>
            <button
              onClick={onCancel}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 -mr-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {requireTyping && (
            <div className="mt-3">
              <input
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={`Type "${requireTyping}" to confirm`}
                className="w-full rounded-xl border border-red-200 bg-red-50/40 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                autoFocus
              />
            </div>
          )}
          <div className="mt-3 flex gap-3">
            <Button variant="danger" onClick={onConfirm} disabled={!canConfirm} className="flex-1 h-10 text-sm">
              Delete
            </Button>
            <Button variant="outline" onClick={onCancel} className="flex-1 h-10 text-sm">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
