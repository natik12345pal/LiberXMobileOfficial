'use client';

import React, { useState } from 'react';
import { X, Bookmark, Link as LinkIcon } from 'lucide-react';

export interface BookmarkEntry {
  id: string;
  name: string;
}

// Storage
const BOOKMARKS_KEY = 'liberxoffice-writer-bookmarks';

export function loadBookmarks(): BookmarkEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBookmarks(items: BookmarkEntry[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(items));
}

// Insert bookmark dialog
interface InsertBookmarkDialogProps {
  show: boolean;
  onClose: () => void;
 onInsert: (name: string) => void;
  existingBookmarks: BookmarkEntry[];
}

export function InsertBookmarkDialog({ show, onClose, onInsert, existingBookmarks }: InsertBookmarkDialogProps) {
  const [name, setName] = useState('');

  if (!show) return null;

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (existingBookmarks.some(b => b.name === trimmed)) return;
    onInsert(trimmed);
    setName('');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-2xl w-[400px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-base font-semibold">Insert Bookmark</h2>
          <button className="lo-toolbar-btn w-8 h-8" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Bookmark Name</label>
            <input
              type="text"
              className="w-full h-10 px-3 text-sm border border-border rounded-md bg-transparent"
              placeholder="Enter bookmark name"
              value={name}
              onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
            {existingBookmarks.some(b => b.name === name.trim()) && (
              <p className="text-xs text-red-500 mt-1">A bookmark with this name already exists.</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 px-4 pb-4">
          <button className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors touch-target" onClick={onClose}>Cancel</button>
          <button
            className="px-4 py-2 text-sm bg-lo-green text-white rounded-md hover:bg-lo-green-dark transition-colors touch-target"
            onClick={handleSubmit}
            disabled={!name.trim() || existingBookmarks.some(b => b.name === name.trim())}
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}

// Cross-reference dialog
interface CrossRefDialogProps {
  show: boolean;
  onClose: () => void;
  onInsert: (bookmarkName: string) => void;
  bookmarks: BookmarkEntry[];
}

export function CrossRefDialog({ show, onClose, onInsert, bookmarks }: CrossRefDialogProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-2xl w-[400px] max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-base font-semibold">Insert Cross-Reference</h2>
          <button className="lo-toolbar-btn w-8 h-8" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="p-4">
          {bookmarks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No bookmarks found. Insert bookmarks first.</p>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto lo-scrollbar">
              {bookmarks.map(bm => (
                <button
                  key={bm.id}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left rounded-md hover:bg-accent transition-colors touch-target"
                  onClick={() => { onInsert(bm.name); onClose(); }}
                >
                  <LinkIcon size={14} className="text-lo-green shrink-0" />
                  <span className="font-mono text-xs text-muted-foreground">#{bm.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="px-4 pb-4">
          <button className="w-full h-10 border border-border rounded-md hover:bg-accent transition-colors touch-target text-sm" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
