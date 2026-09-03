'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ChevronDown, ChevronUp, CaseSensitive, WholeWord } from 'lucide-react';

interface FindReplaceProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
}

export default function FindReplace({ editorRef, onClose }: FindReplaceProps) {
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showReplace, setShowReplace] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const matchesRef = useRef<{ index: number; length: number }[]>([]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const doSearch = useCallback(() => {
    if (!editorRef.current || !searchText) { matchesRef.current = []; setMatchCount(0); return; }
    const text = editorRef.current.innerText || '';
    const result: { index: number; length: number }[] = [];
    const flags = matchCase ? 'g' : 'gi';
    const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = wholeWord ? `\\b${escaped}\\b` : escaped;
    try {
      const regex = new RegExp(pattern, flags);
      let m;
      while ((m = regex.exec(text)) !== null) { result.push({ index: m.index, length: m[0].length }); if (result.length > 1000) break; }
    } catch { result.length = 0; }
    matchesRef.current = result;
    setMatchCount(result.length);
    if (result.length > 0) setCurrentIdx((c) => Math.min(c, result.length - 1));
    else setCurrentIdx(0);
  }, [searchText, matchCase, wholeWord, editorRef]);

  useEffect(() => { doSearch(); return undefined; }, [doSearch]);

  const selectMatch = useCallback((direction: 'next' | 'prev') => {
    if (!editorRef.current || matchCount === 0) return;
    let idx = direction === 'next' ? (currentIdx + 1) % matchCount : (currentIdx - 1 + matchCount) % matchCount;
    setCurrentIdx(idx);
    const sel = window.getSelection();
    if (!sel) return;
    const textNode = editorRef.current.firstChild;
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return;
    const range = document.createRange();
    try { range.setStart(textNode, matchesRef.current[idx].index); range.setEnd(textNode, matchesRef.current[idx].index + matchesRef.current[idx].length); sel.removeAllRanges(); sel.addRange(range); }
    catch { range.setStart(textNode, 0); range.collapse(true); sel.removeAllRanges(); sel.addRange(range); }
  }, [editorRef, matchCount, currentIdx]);

  const replaceCurrent = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.toString().length > 0) { document.execCommand('insertText', false, replaceText); doSearch(); }
    else selectMatch('next');
  }, [replaceText, doSearch, selectMatch]);

  const replaceAll = useCallback(() => {
    if (!editorRef.current || !searchText) return;
    const text = editorRef.current.innerText || '';
    const flags = matchCase ? 'g' : 'gi';
    const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = wholeWord ? `\\b${escaped}\\b` : escaped;
    try { const regex = new RegExp(pattern, flags); editorRef.current.innerText = text.replace(regex, replaceText); doSearch(); } catch {}
  }, [searchText, matchCase, wholeWord, replaceText, editorRef, doSearch]);

  return (
    <div className="absolute top-12 right-4 z-50 bg-white dark:bg-zinc-800 border border-border rounded-lg shadow-xl w-[400px] max-w-[90vw]">
      <div className="flex items-center gap-1 p-2 border-b border-border">
        <input ref={inputRef} className="flex-1 h-8 px-2 text-sm border border-border rounded-md bg-transparent outline-none focus:ring-1 focus:ring-primary" placeholder="Find..." value={searchText} onChange={(e) => { setSearchText(e.target.value); setCurrentIdx(0); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); selectMatch(e.shiftKey ? 'prev' : 'next'); } if (e.key === 'Escape') onClose(); }} />
        <span className="text-xs text-muted-foreground min-w-[50px] text-center">{matchCount > 0 ? `${currentIdx + 1}/${matchCount}` : matchCount === 0 && searchText ? 'No results' : ''}</span>
        <button className="lo-toolbar-btn w-7 h-7" onClick={() => selectMatch('prev')} disabled={matchCount === 0}><ChevronUp size={14} /></button>
        <button className="lo-toolbar-btn w-7 h-7" onClick={() => selectMatch('next')} disabled={matchCount === 0}><ChevronDown size={14} /></button>
        <button className={`lo-toolbar-btn w-7 h-7 ${matchCase ? 'lo-toolbar-btn-active' : ''}`} onClick={() => setMatchCase(!matchCase)}><CaseSensitive size={14} /></button>
        <button className={`lo-toolbar-btn w-7 h-7 ${wholeWord ? 'lo-toolbar-btn-active' : ''}`} onClick={() => setWholeWord(!wholeWord)}><WholeWord size={14} /></button>
        <button className="lo-toolbar-btn w-7 h-7" onClick={onClose}><X size={14} /></button>
      </div>
      <div className="px-2 py-1"><button className="text-xs text-lo-green hover:underline" onClick={() => setShowReplace(!showReplace)}>{showReplace ? 'Hide Replace' : 'Show Replace'}</button></div>
      {showReplace && (
        <div className="flex items-center gap-1 px-2 pb-2">
          <input className="flex-1 h-8 px-2 text-sm border border-border rounded-md bg-transparent outline-none focus:ring-1 focus:ring-primary" placeholder="Replace with..." value={replaceText} onChange={(e) => setReplaceText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); replaceCurrent(); } }} />
          <button className="h-8 px-3 text-xs bg-secondary rounded-md hover:bg-accent" onClick={replaceCurrent}>Replace</button>
          <button className="h-8 px-3 text-xs bg-lo-green text-white rounded-md hover:bg-lo-green-dark" onClick={replaceAll}>All</button>
        </div>
      )}
    </div>
  );
}
