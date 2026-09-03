'use client';
import React, { useState, useEffect } from 'react';

interface Change {
  id: string;
  type: 'insert' | 'delete' | 'format';
  content: string;
  timestamp: number;
  accepted: boolean;
}

const STORAGE_KEY = 'liberxoffice-track-changes';

export function getTrackChangesEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function setTrackChangesEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
}

export default function TrackChangesDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [enabled, setEnabled] = useState(false);
  const [changes, setChanges] = useState<Change[]>([]);

  useEffect(() => {
    if (open) {
      setEnabled(getTrackChangesEnabled());
      try {
        const stored = localStorage.getItem('liberxoffice-changes-log');
        if (stored) setChanges(JSON.parse(stored));
      } catch {}
    }
  }, [open]);

  const toggle = () => {
    const newVal = !enabled;
    setEnabled(newVal);
    setTrackChangesEnabled(newVal);
  };

  const acceptAll = () => {
    const updated = changes.map(c => ({ ...c, accepted: true }));
    setChanges(updated);
    localStorage.setItem('liberxoffice-changes-log', JSON.stringify(updated));
  };

  const rejectAll = () => {
    setChanges([]);
    localStorage.removeItem('liberxoffice-changes-log');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl w-96 p-5" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-semibold mb-4">Track Changes</h3>
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-700 rounded mb-4">
          <div>
            <div className="text-sm font-medium">Record Changes</div>
            <div className="text-xs text-muted-foreground">Highlight insertions and deletions</div>
          </div>
          <button
            className={`px-4 py-2 rounded text-sm font-medium min-h-[40px] min-w-[80px] transition-colors ${enabled ? 'bg-lo-green text-white' : 'bg-gray-200 dark:bg-zinc-600'}`}
            onClick={toggle}
          >{enabled ? 'ON' : 'OFF'}</button>
        </div>
        <div className="text-xs text-muted-foreground mb-2">Changes: {changes.filter(c => !c.accepted).length} pending, {changes.filter(c => c.accepted).length} accepted</div>
        <div className="max-h-40 overflow-y-auto space-y-1 mb-4">
          {changes.slice(-10).reverse().map((c, i) => (
            <div key={i} className="text-xs p-2 rounded bg-gray-50 dark:bg-zinc-700 flex justify-between">
              <span className={c.type === 'insert' ? 'text-green-600' : c.type === 'delete' ? 'text-red-600' : 'text-blue-600'}>
                {c.type === 'insert' ? '+' : c.type === 'delete' ? '-' : '~'} {c.content.slice(0, 40)}
              </span>
              <span className="text-muted-foreground">{new Date(c.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
          {changes.length === 0 && <div className="text-xs text-center text-muted-foreground py-4">No changes recorded yet</div>}
        </div>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-2 text-xs rounded border hover:bg-accent min-h-[40px]" onClick={rejectAll}>Reject All</button>
          <button className="px-3 py-2 text-xs rounded border hover:bg-accent min-h-[40px]" onClick={acceptAll}>Accept All</button>
          <button className="px-4 py-2 text-sm rounded bg-lo-green text-white min-h-[40px]" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}