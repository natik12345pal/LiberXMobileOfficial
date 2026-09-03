'use client';
import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';

export default function SaveAsDialog({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (name: string) => void }) {
  const { fileName } = useAppStore();
  const [name, setName] = useState(fileName);
  const [format, setFormat] = useState('json');

  useEffect(() => { if (open) setName(fileName); }, [open, fileName]);

  if (!open) return null;

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    useAppStore.getState().setFileName(trimmed);
    onSave(trimmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl w-96 p-5" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-semibold mb-4">Save As</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">File Name</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full p-2.5 border rounded text-sm bg-white dark:bg-zinc-700 dark:text-white"
              autoFocus onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose(); }}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button className="px-4 py-2.5 text-sm rounded border hover:bg-accent min-h-[40px] min-w-[80px]" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2.5 text-sm rounded bg-lo-green text-white hover:bg-lo-green-dark min-h-[40px] min-w-[80px]" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
