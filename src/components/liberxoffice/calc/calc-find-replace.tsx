'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useCalcStore } from '@/stores/calc-store';
import { X, ChevronDown, ChevronUp, CaseSensitive, WholeWord, LayoutGrid } from 'lucide-react';

export default function CalcFindReplace() {
  const { showFindReplace, toggleFindReplace } = useAppStore();
  const { findInSheet, findNext, findPrev, replaceInCell, replaceAllInSheet, selectedCell, findMatches, findMatchIndex, clearFindMatches, activeSheet, sheets } = useCalcStore();
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [allSheets, setAllSheets] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [lastResultCount, setLastResultCount] = useState<number | null>(null);

  // Clear find matches when dialog closes
  useEffect(() => {
    if (!showFindReplace) clearFindMatches();
  }, [showFindReplace, clearFindMatches]);

  const handleFind = useCallback(() => {
    if (!findText) return;
    const results = findInSheet(findText, matchCase, wholeWord, allSheets);
    setLastResultCount(results.length);
  }, [findText, matchCase, wholeWord, allSheets, findInSheet]);

  const handleFindNext = useCallback(() => {
    if (!findText) return;
    if (findMatches.length === 0) {
      handleFind();
      return;
    }
    findNext();
  }, [findText, findMatches.length, findNext, handleFind]);

  const handleFindPrev = useCallback(() => {
    if (!findText) return;
    if (findMatches.length === 0) {
      handleFind();
      return;
    }
    findPrev();
  }, [findText, findMatches.length, findPrev, handleFind]);

  const handleReplace = () => {
    if (!findText || findMatches.length === 0) return;
    const currentMatchCell = findMatches[findMatchIndex];
    if (currentMatchCell) {
      replaceInCell(currentMatchCell, findText, replaceText, matchCase);
    }
    findNext();
  };

  const handleReplaceAll = () => {
    if (!findText) return;
    const count = replaceAllInSheet(findText, replaceText, matchCase, allSheets);
    setLastResultCount(count);
  };

  const handleFindAll = () => {
    handleFind();
  };

  if (!showFindReplace) return null;

  return (
    <div className="fixed top-12 right-4 z-[60] w-[400px] bg-white dark:bg-zinc-800 border border-border rounded-lg shadow-xl">
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
            onChange={(e) => setFindText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleFindNext(); if (e.key === 'Escape') toggleFindReplace(); }} autoFocus />
          <button className="lo-toolbar-btn" onClick={handleFindPrev} title="Find Previous"><ChevronUp size={16} /></button>
          <button className="lo-toolbar-btn" onClick={handleFindNext} title="Find Next"><ChevronDown size={16} /></button>
          <button className="lo-toolbar-btn" onClick={handleFindAll} title="Find All"><LayoutGrid size={16} /></button>
        </div>
        <div className="flex items-center gap-3">
          <button className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${matchCase ? 'bg-accent' : 'hover:bg-accent'}`} onClick={() => setMatchCase(!matchCase)}><CaseSensitive size={12} /> Case</button>
          <button className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${wholeWord ? 'bg-accent' : 'hover:bg-accent'}`} onClick={() => setWholeWord(!wholeWord)}><WholeWord size={12} /> Word</button>
          <button className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${allSheets ? 'bg-accent' : 'hover:bg-accent'}`} onClick={() => setAllSheets(!allSheets)}>All Sheets</button>
        </div>
        {findMatches.length > 0 && (
          <p className="text-xs text-muted-foreground">{findMatchIndex + 1} of {findMatches.length} match{findMatches.length !== 1 ? 'es' : ''} found</p>
        )}
        {lastResultCount !== null && findMatches.length === 0 && (
          <p className="text-xs text-muted-foreground">{lastResultCount} match{lastResultCount !== 1 ? 'es' : ''} found</p>
        )}
        {showReplace && (
          <>
            <div className="flex gap-1"><input className="flex-1 h-9 px-2 text-sm border border-border rounded-md bg-transparent" placeholder="Replace with..." value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') toggleFindReplace(); }} /></div>
            <div className="flex gap-2">
              <button className="flex-1 h-8 text-xs font-medium bg-lo-toolbar border border-border rounded-md hover:bg-accent touch-target" onClick={handleReplace}>Replace</button>
              <button className="flex-1 h-8 text-xs font-medium bg-lo-toolbar border border-border rounded-md hover:bg-accent touch-target" onClick={handleReplaceAll}>Replace All</button>
            </div>
          </>
        )}
        <p className="text-[10px] text-muted-foreground">Ctrl+F to toggle | Enter to find | Esc to close</p>
      </div>
    </div>
  );
}
