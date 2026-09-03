'use client';

import React from 'react';
import { useAppStore } from '@/stores/app-store';
import { X } from 'lucide-react';

const shortcutGroups = [
  {
    title: 'General',
    shortcuts: [
      { keys: 'Ctrl + N', desc: 'New document' },
      { keys: 'Ctrl + S', desc: 'Save document' },
      { keys: 'Ctrl + F', desc: 'Find & Replace' },
      { keys: 'Ctrl + P', desc: 'Print' },
      { keys: 'Ctrl + Z', desc: 'Undo' },
      { keys: 'Ctrl + Y', desc: 'Redo' },
      { keys: 'F5', desc: 'Toggle Sidebar' },
      { keys: 'F11', desc: 'Toggle Full Screen' },
      { keys: 'F1', desc: 'Keyboard Shortcuts' },
      { keys: 'Alt + Left', desc: 'Go back to Start Center' },
      { keys: 'Ctrl + +/-', desc: 'Zoom In / Out' },
      { keys: 'Ctrl + 0', desc: 'Reset Zoom to 100%' },
      { keys: 'Ctrl + A', desc: 'Select All' },
      { keys: 'Ctrl + X/C/V', desc: 'Cut / Copy / Paste' },
      { keys: 'Delete', desc: 'Delete selected content' },
      { keys: 'Escape', desc: 'Cancel / Close dialog' },
    ],
  },
  {
    title: 'Writer (Document Editor)',
    shortcuts: [
      { keys: 'Ctrl + B', desc: 'Bold' },
      { keys: 'Ctrl + I', desc: 'Italic' },
      { keys: 'Ctrl + U', desc: 'Underline' },
      { keys: 'Ctrl + E', desc: 'Center align' },
      { keys: 'Ctrl + L', desc: 'Left align' },
      { keys: 'Ctrl + R', desc: 'Right align' },
      { keys: 'Ctrl + J', desc: 'Justify' },
      { keys: 'Ctrl + Shift + S', desc: 'Save As / Download' },
      { keys: 'Ctrl + O', desc: 'Open file' },
    ],
  },
  {
    title: 'Calc (Spreadsheet)',
    shortcuts: [
      { keys: 'Enter', desc: 'Confirm cell edit, move down' },
      { keys: 'Tab', desc: 'Confirm cell edit, move right' },
      { keys: 'Escape', desc: 'Cancel cell edit' },
      { keys: 'Delete / Backspace', desc: 'Clear cell content' },
      { keys: 'Arrow keys', desc: 'Navigate cells' },
      { keys: 'Shift + Arrow', desc: 'Extend selection' },
      { keys: 'F2', desc: 'Edit selected cell' },
      { keys: 'Type any character', desc: 'Start typing in cell' },
    ],
  },
  {
    title: 'Impress (Presentations)',
    shortcuts: [
      { keys: 'Arrow keys', desc: 'Move selected element (1px)' },
      { keys: 'Shift + Arrow', desc: 'Move element (10px)' },
      { keys: 'Delete', desc: 'Delete selected element' },
      { keys: 'Escape', desc: 'Deselect element' },
      { keys: 'Double-click text', desc: 'Edit text content' },
    ],
  },
  {
    title: 'Presentation Mode',
    shortcuts: [
      { keys: 'Arrow Right / Space', desc: 'Next slide' },
      { keys: 'Arrow Left', desc: 'Previous slide' },
      { keys: 'Home', desc: 'First slide' },
      { keys: 'End', desc: 'Last slide' },
      { keys: 'Escape', desc: 'Exit presentation' },
    ],
  },
];

export default function KeyboardShortcutsDialog() {
  const { showShortcuts, toggleShortcuts } = useAppStore();

  if (!showShortcuts) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40" onClick={toggleShortcuts}>
      <div
        className="bg-white dark:bg-zinc-800 rounded-lg shadow-2xl w-[600px] max-w-[90vw] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-base font-semibold">Keyboard Shortcuts</h2>
          <button className="lo-toolbar-btn w-8 h-8" onClick={toggleShortcuts}>
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 lo-scrollbar">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-semibold text-lo-green uppercase tracking-wide mb-2">{group.title}</h3>
              <div className="space-y-0.5">
                {group.shortcuts.map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-1 px-2 rounded hover:bg-accent">
                    <span className="text-sm">{s.desc}</span>
                    <kbd className="text-xs font-mono bg-secondary px-2 py-0.5 rounded border border-border">{s.keys}</kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
