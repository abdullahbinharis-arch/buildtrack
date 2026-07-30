'use client';

import { Button } from './ui/Button';
import { AlertTriangle, X } from 'lucide-react';

interface DuplicateConfirmProps {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DuplicateConfirm({ title, onConfirm, onCancel }: DuplicateConfirmProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Dialog */}
      <div className="fixed inset-0 z-50">
        <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-amber-100/70 bg-white p-4 shadow-2xl shadow-amber-900/10 ring-1 ring-amber-200/60">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-900">Possible duplicate</p>
              <p className="mt-0.5 text-sm text-amber-700">{title}</p>
            </div>
            <button
              onClick={onCancel}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 -mr-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex gap-3">
            <Button variant="primary" onClick={onConfirm} className="flex-1 h-10 text-sm">
              Add Anyway
            </Button>
            <Button variant="outline" onClick={onCancel} className="flex-1 h-10 text-sm">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
