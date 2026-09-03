'use client';

import React from 'react';
import { useAppStore } from '@/stores/app-store';
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter,
  AlignRight, AlignJustify, List, ListOrdered, Indent, Outdent,
  Type, Highlighter, ImagePlus, Table, Minus, Superscript, Subscript,
  ListTree, Bookmark as BookmarkIcon, Target, BookOpen, Link,
  RectangleHorizontal, Droplets, Pilcrow, Section, Columns2, Columns3
} from 'lucide-react';

interface WriterToolbarProps {
  onFormat: (command: string, value?: string) => void;
  onInsert: (type: string) => void;
  activeFormats: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
    align: string;
    orderedList: boolean;
    unorderedList: boolean;
  };
}

const fonts = ['Times New Roman', 'Arial', 'Calibri', 'Verdana', 'Georgia', 'Courier New', 'Trebuchet MS', 'Impact', 'Noto Sans Devanagari', 'Mangal', 'Shruti', 'Gujarati Sangam MN', 'Bangla Sangam MN', 'Tamil Sangam MN', 'Telugu Sangam MN'];
const sizes = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '24', '28', '36', '48', '72'];
const lineHeights = ['1', '1.15', '1.5', '2', '2.5', '3'];

export default function WriterToolbar({ onFormat, onInsert, activeFormats }: WriterToolbarProps) {
  const { toggleTableInsert } = useAppStore();

  return (
    <div className="lo-toolbar flex-wrap gap-0.5">
      {/* Font family */}
      <select className="h-9 px-2 text-sm border border-border rounded-md bg-white min-w-[120px] touch-target"
        onChange={(e) => onFormat('fontName', e.target.value)} title="Font">
        {fonts.map((f) => (<option key={f} value={f} style={{ fontFamily: f }}>{f}</option>))}
      </select>

      {/* Font size */}
      <select className="h-9 px-2 text-sm border border-border rounded-md bg-white w-16 touch-target"
        onChange={(e) => onFormat('fontSize', e.target.value)} title="Font Size">
        {sizes.map((s) => (<option key={s} value={s}>{s}</option>))}
      </select>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Formatting */}
      <button className={`lo-toolbar-btn ${activeFormats.bold ? 'lo-toolbar-btn-active' : ''}`} onClick={() => onFormat('bold')} title="Bold (Ctrl+B)"><Bold size={16} /></button>
      <button className={`lo-toolbar-btn ${activeFormats.italic ? 'lo-toolbar-btn-active' : ''}`} onClick={() => onFormat('italic')} title="Italic (Ctrl+I)"><Italic size={16} /></button>
      <button className={`lo-toolbar-btn ${activeFormats.underline ? 'lo-toolbar-btn-active' : ''}`} onClick={() => onFormat('underline')} title="Underline (Ctrl+U)"><Underline size={16} /></button>
      <button className={`lo-toolbar-btn ${activeFormats.strikethrough ? 'lo-toolbar-btn-active' : ''}`} onClick={() => onFormat('strikeThrough')} title="Strikethrough"><Strikethrough size={16} /></button>
      <button className="lo-toolbar-btn" onClick={() => document.execCommand('superscript')} title="Superscript"><Superscript size={16} /></button>
      <button className="lo-toolbar-btn" onClick={() => document.execCommand('subscript')} title="Subscript"><Subscript size={16} /></button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Colors */}
      <button className="lo-toolbar-btn" onClick={() => onFormat('foreColor', '#D32F2F')} title="Text Color">
        <div className="flex flex-col items-center"><Type size={14} /><div className="w-4 h-1 rounded-sm bg-[#D32F2F] mt-0.5" /></div>
      </button>
      <button className="lo-toolbar-btn" onClick={() => onFormat('hiliteColor', '#FFFF00')} title="Highlight Color">
        <div className="flex flex-col items-center"><Highlighter size={14} /><div className="w-4 h-1 rounded-sm bg-[#FFFF00] mt-0.5" /></div>
      </button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Alignment */}
      <button className={`lo-toolbar-btn ${activeFormats.align === 'left' ? 'lo-toolbar-btn-active' : ''}`} onClick={() => onFormat('justifyLeft')} title="Align Left"><AlignLeft size={16} /></button>
      <button className={`lo-toolbar-btn ${activeFormats.align === 'center' ? 'lo-toolbar-btn-active' : ''}`} onClick={() => onFormat('justifyCenter')} title="Align Center"><AlignCenter size={16} /></button>
      <button className={`lo-toolbar-btn ${activeFormats.align === 'right' ? 'lo-toolbar-btn-active' : ''}`} onClick={() => onFormat('justifyRight')} title="Align Right"><AlignRight size={16} /></button>
      <button className={`lo-toolbar-btn ${activeFormats.align === 'justify' ? 'lo-toolbar-btn-active' : ''}`} onClick={() => onFormat('justifyFull')} title="Justify"><AlignJustify size={16} /></button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Lists */}
      <button className={`lo-toolbar-btn ${activeFormats.unorderedList ? 'lo-toolbar-btn-active' : ''}`} onClick={() => onFormat('insertUnorderedList')} title="Bullet List"><List size={16} /></button>
      <button className={`lo-toolbar-btn ${activeFormats.orderedList ? 'lo-toolbar-btn-active' : ''}`} onClick={() => onFormat('insertOrderedList')} title="Numbered List"><ListOrdered size={16} /></button>

      {/* Indent */}
      <button className="lo-toolbar-btn" onClick={() => onFormat('outdent')} title="Decrease Indent"><Outdent size={16} /></button>
      <button className="lo-toolbar-btn" onClick={() => onFormat('indent')} title="Increase Indent"><Indent size={16} /></button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Line spacing */}
      <select className="h-9 px-1 text-xs border border-border rounded-md bg-white touch-target"
        title="Line Spacing" onChange={(e) => { const el = document.querySelector('[contenteditable]') as HTMLElement | null; if (el) el.style.lineHeight = e.target.value; }}>
        <option value="">Line Spacing</option>
        {lineHeights.map((l) => (<option key={l} value={l}>{l === '1' ? 'Single' : l === '1.5' ? '1.5 Lines' : l === '2' ? 'Double' : `${l} Lines`}</option>))}
      </select>

      {/* Heading style */}
      <select className="h-9 px-2 text-sm border border-border rounded-md bg-white min-w-[100px] touch-target"
        onChange={(e) => onFormat('formatBlock', e.target.value)} title="Paragraph Style" defaultValue="">
        <option value="">Paragraph Style</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="p">Normal Text</option>
        <option value="blockquote">Block Quote</option>
        <option value="pre">Monospace</option>
      </select>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Insert */}
      <button className="lo-toolbar-btn" onClick={() => onInsert('image')} title="Insert Image"><ImagePlus size={16} /></button>
      <button className="lo-toolbar-btn" onClick={() => onInsert('hyperlink')} title="Insert Hyperlink (Ctrl+K)"><Link size={16} /></button>
      <button className="lo-toolbar-btn" onClick={() => toggleTableInsert()} title="Insert Table"><Table size={16} /></button>
      <button className="lo-toolbar-btn" onClick={() => onInsert('horizontal-rule')} title="Horizontal Line"><Minus size={16} /></button>
      <button className="lo-toolbar-btn" onClick={() => onInsert('special-char')} title="Special Characters">
        <span className="text-sm font-mono">Ω</span>
      </button>
      <button className="lo-toolbar-btn" onClick={() => onInsert('sectionbreak')} title="Section Break"><Section size={16} /></button>
      <div className="w-px h-6 bg-border mx-1" />

      {/* Column selector */}
      <select className="h-9 px-1 text-xs border border-border rounded-md bg-white touch-target"
        title="Columns" onChange={(e) => {
          const action = `setcolumns${e.target.value}`;
          window.dispatchEvent(new CustomEvent('liberx-action', { detail: action }));
        }}>
        <option value="1">1 Col</option>
        <option value="2">2 Cols</option>
        <option value="3">3 Cols</option>
      </select>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Format tools */}
      <button className="lo-toolbar-btn" onClick={() => onInsert('dropcap')} title="Drop Cap"><Pilcrow size={16} /></button>
      <button className="lo-toolbar-btn" onClick={() => onInsert('paraborders')} title="Paragraph Borders"><RectangleHorizontal size={16} /></button>
      <button className="lo-toolbar-btn" onClick={() => onInsert('watermark')} title="Watermark"><Droplets size={16} /></button>

      <div className="w-px h-6 bg-border mx-1" />
      {/* Writer-specific tools */}
      <button className="lo-toolbar-btn" onClick={() => onInsert('toc')} title="Table of Contents"><ListTree size={16} /></button>
      <button className="lo-toolbar-btn" onClick={() => onInsert('footnote')} title="Insert Footnote"><BookOpen size={16} /></button>
      <button className="lo-toolbar-btn" onClick={() => onInsert('bookmark')} title="Insert Bookmark"><BookmarkIcon size={16} /></button>
      <button className="lo-toolbar-btn" onClick={() => onInsert('wordcount')} title="Word Count"><Target size={16} /></button>
      <button className="lo-toolbar-btn" onClick={() => onInsert('wordgoal')} title="Word Goal"><span className="text-xs font-bold">🎯</span></button>
    </div>
  );
}
