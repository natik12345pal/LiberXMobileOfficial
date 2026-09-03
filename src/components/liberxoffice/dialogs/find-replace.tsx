'use client';

import React, { useState, useCallback } from 'react';
import { useAppStore } from '@/stores/app-store';
import { X, ChevronDown, ChevronUp, CaseSensitive, WholeWord } from 'lucide-react';

interface FindReplaceProps {
  targetRef?: React.RefObject<HTMLElement | null>;
  onFindNext?: (term: string, matchCase: boolean, wholeWord: boolean) => void;
  onReplace?: (find: string, replace: string) => void;
  onReplaceAll?: (find: string, replace: string) => number;
}

export default function FindReplace({ targetRef, onFindNext, onReplace, onReplaceAll }: FindReplaceProps) {
  const { showFindReplace, toggleFindReplace } = useAppStore();
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [resultCount, setResultCount] = useState<number | null>(null);

  const handleFind = useCallback((direction: 'next' | 'prev') => {
    if (!findText || !targetRef?.current) return;
    const win = window as unknown as { find: (text: string, caseSensitive?: boolean, backwards?: boolean, wrap?: boolean) => boolean };
    win.find(findText, matchCase, direction === 'prev', true);
    onFindNext?.(findText, matchCase, wholeWord);
  }, [findText, matchCase, wholeWord, targetRef, onFindNext]);

  const handleReplace = () => {
    if (!findText || !targetRef?.current) return;
    const sel = window.getSelection();
    if (sel && sel.toString().toLowerCase() === findText.toLowerCase()) {
      document.execCommand('insertText', false, replaceText);
      onReplace?.(findText, replaceText);
    }
    handleFind('next');
  };

  const handleReplaceAll = () => {
    if (!findText || !targetRef?.current) return;
    const html = targetRef.current.innerHTML;
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), matchCase ? 'g' : 'gi');
    const matches = html.match(regex);
    const count = matches ? matches.length : 0;
    if (count > 0) targetRef.current.innerHTML = html.replace(regex, replaceText.replace(/\$/g, '$$$$'));
    setResultCount(count);
    onReplaceAll?.(findText, replaceText);
  };

  if (!showFindReplace) return null;

  return (
    <div className="fixed top-12 right-4 z-[60] w-[380px] bg-white dark:bg-zinc-800 border border-border rounded-lg shadow-xl">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-sm font-medium">Find & Replace</span>
        <div className="flex items-center gap-1">
          <button className="text-xs px-2 py-1 rounded hover:bg-accent" onClick={() => setShowReplace(!showReplace)}>{showReplace ? 'Less' : 'More'}</button>
          <button className="lo-toolbar-btn w-7 h-7" onClick={toggleFindReplace}><X size={14} /></button>
        </div>
      </div>
      <div className="p-3 space-y-2">
        <div className="flex gap-1">
          <input className="flex-1 h-9 px-2 text-sm border border-border rounded-md bg-transparent" placeholder="Find..." value={findText}
            onChange={(e) => setFindText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleFind(e.shiftKey ? 'prev' : 'next'); if (e.key === 'Escape') toggleFindReplace(); }} autoFocus />
          <button className="lo-toolbar-btn" onClick={() => handleFind('prev')} title="Find Previous"><ChevronUp size={16} /></button>
          <button className="lo-toolbar-btn" onClick={() => handleFind('next')} title="Find Next"><ChevronDown size={16} /></button>
        </div>
        <div className="flex items-center gap-3">
          <button className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${matchCase ? 'bg-accent' : 'hover:bg-accent'}`} onClick={() => setMatchCase(!matchCase)}><CaseSensitive size={12} /> Match Case</button>
          <button className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${wholeWord ? 'bg-accent' : 'hover:bg-accent'}`} onClick={() => setWholeWord(!wholeWord)}><WholeWord size={12} /> Whole Word</button>
        </div>
        {showReplace && (
          <>
            <div className="flex gap-1"><input className="flex-1 h-9 px-2 text-sm border border-border rounded-md bg-transparent" placeholder="Replace with..." value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') toggleFindReplace(); }} /></div>
            <div className="flex gap-2">
              <button className="flex-1 h-8 text-xs font-medium bg-lo-toolbar border border-border rounded-md hover:bg-accent" onClick={handleReplace}>Replace</button>
              <button className="flex-1 h-8 text-xs font-medium bg-lo-toolbar border border-border rounded-md hover:bg-accent" onClick={handleReplaceAll}>Replace All</button>
            </div>
            {resultCount !== null && <p className="text-xs text-muted-foreground">{resultCount} occurrence(s) found</p>}
          </>
        )}
        <p className="text-[10px] text-muted-foreground">Ctrl+F to toggle | Enter to find | Esc to close</p>
      </div>
    </div>
  );
}
