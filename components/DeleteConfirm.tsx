'use client';

import { Button } from './ui/Button';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmProps {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirm({ title, onConfirm, onCancel }: DeleteConfirmProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Dialog */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-red-100/70 bg-white p-6 shadow-2xl shadow-red-900/10 ring-1 ring-red-200/60">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-red-900">Confirm Delete</p>
                <p className="mt-1 text-sm text-red-700">{title}</p>
              </div>
              <button
                onClick={onCancel}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="danger" onClick={onConfirm} className="flex-1">
                Delete
              </Button>
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
