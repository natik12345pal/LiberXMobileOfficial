'use client';            

import React from 'react';            
import { X } from 'lucide-react';            

interface Shortcut { keys: string; action: string; }            
const SHORTCUTS: Shortcut[] = [            
  { keys: 'Ctrl + N', action: 'New document' },            
  { keys: 'Ctrl + O', action: 'Open file' },            
  { keys: 'Ctrl + S', action: 'Save file' },            
  { keys: 'Ctrl + Shift + S', action: 'Save As...' },            
  { keys: 'Ctrl + P', action: 'Print' },            
  { keys: 'Ctrl + Z', action: 'Undo' },            
  { keys: 'Ctrl + Y', action: 'Redo' },            
  { keys: 'Ctrl + X', action: 'Cut' },            
  { keys: 'Ctrl + C', action: 'Copy' },            
  { keys: 'Ctrl + V', action: 'Paste' },            
  { keys: 'Ctrl + A', action: 'Select All' },            
  { keys: 'Ctrl + F', action: 'Find & Replace' },            
  { keys: 'Ctrl + B', action: 'Bold' },            
  { keys: 'Ctrl + I', action: 'Italic' },            
  { keys: 'Ctrl + U', action: 'Underline' },            
  { keys: 'Ctrl + E', action: 'Center align' },            
  { keys: 'Ctrl + L', action: 'Left align' },            
  { keys: 'Ctrl + R', action: 'Right align' },            
  { keys: 'Ctrl + J', action: 'Justify' },            
  { keys: 'Ctrl + Shift + +', action: 'Superscript' },            
  { keys: 'Ctrl + =', action: 'Subscript' },            
  { keys: 'Ctrl + [', action: 'Decrease indent' },            
  { keys: 'Ctrl + ]', action: 'Increase indent' },            
  { keys: 'Ctrl + Enter', action: 'Insert page break (Writer)' },            
  { keys: 'Delete / Backspace', action: 'Delete selected (Impress)' },            
  { keys: 'Arrow keys', action: 'Move element (Impress)' },            
  { keys: 'Shift + Arrow keys', action: 'Move element 10px (Impress)' },            
  { keys: 'Enter', action: 'Confirm edit / Next row (Calc)' },            
  { keys: 'Tab', action: 'Next cell (Calc)' },            
  { keys: 'Escape', action: 'Cancel edit / Exit presentation' },            
  { keys: 'F5', action: 'Start Presentation (Impress)' },            
  { keys: 'Ctrl + +', action: 'Zoom In' },            
  { keys: 'Ctrl + -', action: 'Zoom Out' },            
  { keys: 'Ctrl + 0', action: 'Reset Zoom' },            
  { keys: 'Alt + Left Arrow', action: 'Go back to Start Center' },            
];            

interface Props { onClose: () => void; }            
export default function KeyboardShortcuts({ onClose }: Props) {            
  return (            
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>            
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-2xl w-[520px] max-w-[92vw] max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>            
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">            
          <h2 className="font-semibold">Keyboard Shortcuts</h2>            
          <button className="lo-toolbar-btn w-7 h-7" onClick={onClose}><X size={14} /></button>            
        </div>            
        <div className="overflow-y-auto lo-scrollbar p-4 space-y-1">            
          {SHORTCUTS.map((s, i) => (            
            <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-accent">            
              <span className="text-sm">{s.action}</span>            
              <kbd className="text-xs font-mono bg-secondary px-2 py-0.5 rounded border border-border">{s.keys}</kbd>            
            </div>            
          ))}            
        </div>            
      </div>            
    </div>            
  );            
}