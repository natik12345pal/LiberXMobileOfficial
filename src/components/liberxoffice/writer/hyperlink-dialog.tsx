'use client';

import React, { useState, useEffect } from 'react';
import { Link, Unlink } from 'lucide-react';

interface HyperlinkDialogProps {
  show: boolean;
  onClose: () => void;
  onInsert: (displayText: string, url: string) => void;
  editorRef: React.RefObject<HTMLDivElement | null>;
}

export default function HyperlinkDialog({ show, onClose, onInsert, editorRef }: HyperlinkDialogProps) {
  const [displayText, setDisplayText] = useState('');
  const [url, setUrl] = useState('');
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    if (!show || !editorRef.current) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const anchor = sel.anchorNode;
    if (!anchor) return;

    // Check if cursor is inside an <a> tag
    let el: Node | null = anchor;
    while (el && el !== editorRef.current) {
      if (el instanceof HTMLAnchorElement) {
        setIsEdit(true);
        setUrl(el.href);
        setDisplayText(el.textContent || '');
        return;
      }
      el = el.parentNode;
    }

    // Pre-fill display text with selection
    const selectedText = sel.toString();
    setDisplayText(selectedText);
    setIsEdit(false);
    setUrl('');
  }, [show, editorRef]);

  if (!show) return null;

  const handleSubmit = () => {
    if (!url.trim()) return;
    onInsert(displayText.trim() || url.trim(), url.trim());
    onClose();
  };

  const handleRemove = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const anchor = sel.anchorNode;
    if (!anchor) return;
    let el: Node | null = anchor;
    while (el && el !== editorRef.current) {
      if (el instanceof HTMLAnchorElement) {
        // Unwrap the <a> tag
        const parent = el.parentNode;
        while (el.firstChild) parent?.insertBefore(el.firstChild, el);
        parent?.removeChild(el);
        onClose();
        return;
      }
      el = el.parentNode;
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-2xl w-[400px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Link size={16} />
            {isEdit ? 'Edit Hyperlink' : 'Insert Hyperlink'}
          </h2>
          <button className="lo-toolbar-btn w-8 h-8" onClick={onClose}>x</button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Text to Display</label>
            <input
              type="text"
              className="w-full h-10 px-3 text-sm border border-border rounded-md bg-transparent"
              placeholder="Enter display text"
              value={displayText}
              onChange={e => setDisplayText(e.target.value)}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">URL / Link</label>
            <input
              type="text"
              className="w-full h-10 px-3 text-sm border border-border rounded-md bg-transparent"
              placeholder="https://example.com"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-4 pb-4">
          {isEdit && (
            <button
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md touch-target"
              onClick={handleRemove}
            >
              <Unlink size={14} /> Remove Link
            </button>
          )}
          <button className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent touch-target" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 text-sm bg-lo-green text-white rounded-md hover:bg-lo-green-dark touch-target" onClick={handleSubmit}>
            {isEdit ? 'Update' : 'Insert'}
          </button>
        </div>
      </div>
    </div>
  );
}
