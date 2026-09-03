'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

export interface FootnoteItem {
  id: string;
  number: number;
  type: 'footnote' | 'endnote';
  text: string;
}

interface FootnotesProps {
  footnotes: FootnoteItem[];
  onInsertFootnote: (text: string) => void;
  onInsertEndnote: (text: string) => void;
  onDeleteFootnote: (id: string) => void;
}

export default function Footnotes({ footnotes, onInsertFootnote, onInsertEndnote, onDeleteFootnote }: FootnotesProps) {
  return null;
}

// Helper to generate unique IDs
export function generateFootnoteId() {
  return 'fn-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
}

// Storage keys
export const FOOTNOTES_STORAGE_KEY = 'liberxoffice-writer-footnotes';

export function loadFootnotes(): FootnoteItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FOOTNOTES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFootnotes(items: FootnoteItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FOOTNOTES_STORAGE_KEY, JSON.stringify(items));
}

// Dialog for inserting a footnote/endnote
interface FootnoteDialogProps {
  show: boolean;
  onClose: () => void;
  type: 'footnote' | 'endnote';
  onInsert: (text: string) => void;
  nextNumber: number;
}

export function FootnoteDialog({ show, onClose, type, onInsert, nextNumber }: FootnoteDialogProps) {
  const [text, setText] = useState('');

  if (!show) return null;

  const label = type === 'footnote' ? 'Footnote' : 'Endnote';

  function handleSubmit() {
    if (!text.trim()) return;
    onInsert(text.trim());
    setText('');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-2xl w-[440px] max-h-[90vh] overflow-y-auto lo-scrollbar" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-base font-semibold">Insert {label} ({nextNumber})</h2>
          <button className="lo-toolbar-btn w-8 h-8" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{label} text</label>
            <textarea
              className="w-full h-32 px-3 py-2 text-sm border border-border rounded-md bg-transparent resize-none lo-scrollbar"
              placeholder={`Enter ${label.toLowerCase()} text here...`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-4 pb-4">
          <button className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors touch-target" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 text-sm bg-lo-green text-white rounded-md hover:bg-lo-green-dark transition-colors touch-target" onClick={handleSubmit}>Insert</button>
        </div>
      </div>
    </div>
  );
}

// Footnotes/Endnotes list dialog
interface FootnotesListDialogProps {
  show: boolean;
  onClose: () => void;
  footnotes: FootnoteItem[];
  onDelete: (id: string) => void;
}

export function FootnotesListDialog({ show, onClose, footnotes, onDelete }: FootnotesListDialogProps) {
  if (!show) return null;

  const fnNotes = footnotes.filter(f => f.type === 'footnote');
  const enNotes = footnotes.filter(f => f.type === 'endnote');

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-2xl w-[500px] max-h-[80vh] overflow-y-auto lo-scrollbar" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-white dark:bg-zinc-800 z-10">
          <h2 className="text-base font-semibold">Footnotes & Endnotes</h2>
          <button className="lo-toolbar-btn w-8 h-8" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="p-4 space-y-4">
          {footnotes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No footnotes or endnotes in this document.</p>
          )}
          {fnNotes.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Footnotes ({fnNotes.length})</h3>
              <div className="space-y-1 max-h-48 overflow-y-auto lo-scrollbar">
                {fnNotes.map(fn => (
                  <div key={fn.id} className="flex items-start gap-2 p-2 rounded hover:bg-secondary/50 group">
                    <sup className="text-lo-green font-bold mt-0.5">{fn.number}</sup>
                    <p className="flex-1 text-sm">{fn.text}</p>
                    <button className="opacity-0 group-hover:opacity-100 lo-toolbar-btn w-7 h-7 shrink-0" onClick={() => onDelete(fn.id)} title="Delete"><X size={12} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {enNotes.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Endnotes ({enNotes.length})</h3>
              <div className="space-y-1 max-h-48 overflow-y-auto lo-scrollbar">
                {enNotes.map(fn => (
                  <div key={fn.id} className="flex items-start gap-2 p-2 rounded hover:bg-secondary/50 group">
                    <sup className="text-blue-500 font-bold mt-0.5">{fn.number}</sup>
                    <p className="flex-1 text-sm">{fn.text}</p>
                    <button className="opacity-0 group-hover:opacity-100 lo-toolbar-btn w-7 h-7 shrink-0" onClick={() => onDelete(fn.id)} title="Delete"><X size={12} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="px-4 pb-4">
          <button className="w-full h-10 bg-lo-green text-white rounded-md hover:bg-lo-green-dark transition-colors touch-target text-sm font-medium" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
