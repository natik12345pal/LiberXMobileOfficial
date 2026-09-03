'use client';

import React, { useState } from 'react';
import { X, Search } from 'lucide-react';

interface SpecialCharsProps {
  onInsert: (char: string) => void;
  onClose: () => void;
}

const CHAR_CATEGORIES: Record<string, { label: string; chars: string[] }> = {
  'Math': { label: 'Mathematical', chars: ['±', '×', '÷', '≠', '≈', '≤', '≥', '∞', '√', '∑', '∏', '∫', '∂', 'π', 'θ', 'α', 'β', 'γ', 'Δ', '°', 'µ', '∈', '∉', '⊂', '⊃', '∩', '∪', '∅', '∀', '∃', '¬', '∧', '∨', '⇒', '⇔'] },
  'Arrows': { label: 'Arrows', chars: ['←', '→', '↑', '↓', '↔', '↕', '⇐', '⇒', '⇑', '⇓', '⇔', '⇕', '➜', '➤', '→', '↗', '↘', '↙', '↖'] },
  'Currency': { label: 'Currency', chars: ['$', '€', '£', '¥', '₹', '₩', '₽', '₿', '¢', '₹'] },
  'Science': { label: 'Science', chars: ['°C', '°F', 'Å', 'Å', 'Ω', 'µ', '℃', '℉', '⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉', '⁺', '⁻', '⁼', '⁽', '⁾'] },
  'Punctuation': { label: 'Punctuation', chars: ['\u2013', '\u2014', '\u2026', '\u00AB', '\u00BB', '\u2018', '\u2019', '\u201C', '\u201D', '\u2018', '\u201A', '\u201B', '\u201E', '\u201F', '\u00A7', '\u00B6', '\u2020', '\u2021', '\u00A9', '\u00AE', '\u2122', '\u2120', '\u2117', '\u2121'] },
  'Bullets': { label: 'Bullets & Shapes', chars: ['•', '◦', '▪', '▫', '●', '○', '■', '□', '◆', '◇', '★', '☆', '✦', '✧', '♦', '♠', '♣', '♥', '✓', '✗', '✕', '✖', '✚', '✜'] },
};

export default function SpecialChars({ onInsert, onClose }: SpecialCharsProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Math');

  const filteredChars = search
    ? Object.values(CHAR_CATEGORIES).flatMap((c) => c.chars).filter((c) => c.includes(search))
    : (CHAR_CATEGORIES[category]?.chars || []);

  return (
    <div className="absolute top-12 right-4 z-50 bg-white dark:bg-zinc-800 border border-border rounded-lg shadow-xl w-[360px] max-w-[90vw]">
      <div className="flex items-center gap-2 p-2 border-b border-border">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full h-8 pl-7 pr-2 text-sm border border-border rounded-md bg-transparent outline-none focus:ring-1 focus:ring-primary"
            placeholder="Search characters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <button className="lo-toolbar-btn w-7 h-7" onClick={onClose}><X size={14} /></button>
      </div>
      {!search && (
        <div className="flex gap-1 px-2 pt-2 flex-wrap">
          {Object.entries(CHAR_CATEGORIES).map(([key, cat]) => (
            <button
              key={key}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${category === key ? 'bg-lo-green text-white' : 'bg-secondary hover:bg-accent'}`}
              onClick={() => setCategory(key)}
            >{cat.label}</button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-10 gap-0.5 p-2 max-h-[200px] overflow-y-auto lo-scrollbar">
        {filteredChars.map((char, i) => (
          <button
            key={i}
            className="w-8 h-8 flex items-center justify-center text-lg rounded hover:bg-accent transition-colors"
            onClick={() => { onInsert(char); onClose(); }}
            title={char}
          >{char}</button>
        ))}
      </div>
    </div>
  );
}
