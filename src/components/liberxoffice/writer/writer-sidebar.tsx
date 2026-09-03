'use client';

import React from 'react';
import {
  Type, AlignLeft, AlignCenter, AlignRight, List,
  FileText, Heading1, Heading2, Quote, Code
} from 'lucide-react';

interface WriterSidebarProps {
  onInsert: (type: string) => void;
  onFormat: (command: string, value?: string) => void;
}

const paragraphStyles = [
  { icon: <FileText size={16} />, label: 'Normal', tag: 'p' },
  { icon: <Heading1 size={16} />, label: 'Heading 1', tag: 'h1' },
  { icon: <Heading2 size={16} />, label: 'Heading 2', tag: 'h2' },
  { icon: <Type size={16} />, label: 'Heading 3', tag: 'h3' },
  { icon: <Quote size={16} />, label: 'Quote', tag: 'blockquote' },
];

export default function WriterSidebar({ onInsert, onFormat }: WriterSidebarProps) {
  return (
    <div className="flex flex-col h-full bg-lo-sidebar">
      {/* Paragraph Styles */}
      <div className="border-b border-border p-3">
        <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Styles</h3>
        <div className="space-y-0.5">
          {paragraphStyles.map((style) => (
            <button
              key={style.tag}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent transition-colors touch-target"
              onClick={() => onFormat('formatBlock', style.tag)}
            >
              {style.icon}
              <span>{style.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Inserts for School Work */}
      <div className="border-b border-border p-3">
        <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Quick Insert</h3>
        <div className="space-y-0.5">
          <button
            className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-accent transition-colors touch-target"
            onClick={() => onInsert('horizontal-rule')}
          >
            Horizontal Line
          </button>
          <button
            className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-accent transition-colors touch-target"
            onClick={() => onInsert('page-break')}
          >
            Page Break
          </button>
          <button
            className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-accent transition-colors touch-target"
            onClick={() => onInsert('date')}
          >
            Today&apos;s Date
          </button>
          <button
            className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-accent transition-colors touch-target"
            onClick={() => onInsert('table-3x3')}
          >
            Table (3 x 3)
          </button>
        </div>
      </div>

      {/* CBSE/ICSE Format Helpers */}
      <div className="p-3 flex-1">
        <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">School Formats</h3>
        <div className="space-y-0.5">
          <button
            className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-accent transition-colors touch-target"
            onClick={() => onInsert('formal-letter')}
          >
            Formal Letter Format
          </button>
          <button
            className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-accent transition-colors touch-target"
            onClick={() => onInsert('informal-letter')}
          >
            Informal Letter Format
          </button>
          <button
            className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-accent transition-colors touch-target"
            onClick={() => onInsert('essay-outline')}
          >
            Essay Outline
          </button>
          <button
            className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-accent transition-colors touch-target"
            onClick={() => onInsert('lab-report')}
          >
            Lab Report Template
          </button>
        </div>
      </div>
    </div>
  );
}
