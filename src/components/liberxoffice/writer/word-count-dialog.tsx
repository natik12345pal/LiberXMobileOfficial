'use client';

import React, { useMemo } from 'react';
import { X } from 'lucide-react';

interface WordCountDialogProps {
  show: boolean;
  onClose: () => void;
  getText: () => string;
  getHtml: () => string;
}

function countStats(text: string, html: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const charsWithSpaces = text.length;
  const charsWithoutSpaces = text.replace(/\s/g, '').length;

  // Asian characters (CJK ranges)
  const asianChars = (text.match(/[\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af\uf900-\ufaff]/g) || []).length;

  // Sentences: split by . ! ? followed by space or end
  const sentences = (text.match(/[^.!?]*[.!?]+(?:\s|$)/g) || []).length || (text.trim() ? 1 : 0);

  // Paragraphs: count non-empty blocks
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const blockElements = tempDiv.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, div');
  const paragraphs = Array.from(blockElements).filter(el => el.textContent?.trim()).length || (text.trim() ? 1 : 0);

  const lines = text.split('\n').filter(l => l.trim()).length;

  // Estimate pages (~250 words per page, ~40 lines per page)
  const estimatedPages = Math.max(1, Math.ceil(words / 250));

  return { words, charsWithSpaces, charsWithoutSpaces, asianChars, sentences, paragraphs, lines, estimatedPages };
}

export default function WordCountDialog({ show, onClose, getText, getHtml }: WordCountDialogProps) {
  const stats = useMemo(() => {
    if (!show) return null;
    return countStats(getText(), getHtml());
  }, [show, getText, getHtml]);

  if (!show || !stats) return null;

  const statItems = [
    { label: 'Words', value: stats.words.toLocaleString() },
    { label: 'Characters (with spaces)', value: stats.charsWithSpaces.toLocaleString() },
    { label: 'Characters (without spaces)', value: stats.charsWithoutSpaces.toLocaleString() },
    { label: 'Characters (Asian)', value: stats.asianChars.toLocaleString() },
    { label: 'Sentences', value: stats.sentences.toLocaleString() },
    { label: 'Paragraphs', value: stats.paragraphs.toLocaleString() },
    { label: 'Lines', value: stats.lines.toLocaleString() },
    { label: 'Pages (estimated)', value: stats.estimatedPages.toLocaleString() },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-2xl w-[420px] max-h-[90vh] overflow-y-auto lo-scrollbar" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-base font-semibold">Word Count</h2>
          <button className="lo-toolbar-btn w-8 h-8" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {statItems.map((item) => (
              <div key={item.label} className="bg-secondary/30 rounded-md p-3">
                <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                <div className="text-xl font-bold tabular-nums">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-4 pb-4">
          <button className="w-full h-10 bg-lo-green text-white rounded-md hover:bg-lo-green-dark transition-colors touch-target text-sm font-medium" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
