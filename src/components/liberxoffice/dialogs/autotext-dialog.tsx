'use client';
import React, { useState, useEffect } from 'react';

interface AutoTextEntry {
  name: string;
  content: string;
  shortcut: string;
}

const DEFAULT_ENTRIES: AutoTextEntry[] = [
  { name: 'Letter Closing', content: 'Yours faithfully,\n[Arun Kumar]\n[Designation]', shortcut: 'yc' },
  { name: 'Formal Opening', content: 'Respected Sir/Madam,', shortcut: 'fo' },
  { name: 'Subject Line', content: 'Subject: ', shortcut: 'sj' },
  { name: 'Date', content: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), shortcut: 'dt' },
  { name: 'Page Break', content: '<div style="page-break-after:always"></div>', shortcut: 'pb' },
  { name: 'Horizontal Rule', content: '<hr />', shortcut: 'hr' },
  { name: 'Signature Block', content: '<br/><br/>This is a computer-generated document.<br/>No physical signature required.', shortcut: 'sb' },
];

function loadEntries(): AutoTextEntry[] {
  if (typeof window === 'undefined') return DEFAULT_ENTRIES;
  try { const r = localStorage.getItem('liberxoffice-autotext'); return r ? JSON.parse(r) : DEFAULT_ENTRIES; } catch { return DEFAULT_ENTRIES; }
}

function saveEntries(e: AutoTextEntry[]) {
  try { localStorage.setItem('liberxoffice-autotext', JSON.stringify(e)); } catch {}
}

export default function AutoTextDialog({ open, onClose, onInsert }: { open: boolean; onClose: () => void; onInsert: (html: string) => void }) {
  const [entries, setEntries] = useState<AutoTextEntry[]>(DEFAULT_ENTRIES);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({ name: '', content: '', shortcut: '' });

  useEffect(() => { if (open) setEntries(loadEntries()); }, [open]);

  const filtered = entries.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.shortcut.includes(search.toLowerCase()));

  const insert = (entry: AutoTextEntry) => { onInsert(entry.content); onClose(); };

  const addEntry = () => {
    if (!newEntry.name.trim() || !newEntry.content.trim()) return;
    const updated = [...entries, newEntry];
    setEntries(updated);
    saveEntries(updated);
    setNewEntry({ name: '', content: '', shortcut: '' });
    setShowAdd(false);
  };

  const deleteEntry = (idx: number) => {
    const updated = entries.filter((_, i) => i !== idx);
    setEntries(updated);
    saveEntries(updated);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl w-[480px] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold">AutoText</h3>
            <button className="text-xs px-3 py-1.5 bg-lo-green text-white rounded min-h-[36px]" onClick={() => setShowAdd(!showAdd)}>+ New</button>
          </div>
          {showAdd && (
            <div className="space-y-2 p-3 bg-gray-50 dark:bg-zinc-700 rounded">
              <input placeholder="Name" value={newEntry.name} onChange={e => setNewEntry({ ...newEntry, name: e.target.value })} className="w-full p-2 border rounded text-sm" />
              <textarea placeholder="Content" value={newEntry.content} onChange={e => setNewEntry({ ...newEntry, content: e.target.value })} className="w-full p-2 border rounded text-sm h-20 resize-none" />
              <input placeholder="Shortcut" value={newEntry.shortcut} onChange={e => setNewEntry({ ...newEntry, shortcut: e.target.value })} className="w-full p-2 border rounded text-sm" />
              <button className="w-full p-2 bg-lo-green text-white rounded text-sm min-h-[36px]" onClick={addEntry}>Add Entry</button>
            </div>
          )}
          <input placeholder="Search entries..." value={search} onChange={e => setSearch(e.target.value)} className="w-full p-2 border rounded text-sm" />
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.map((entry, i) => (
            <div key={i} className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer" onClick={() => insert(entry)}>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{entry.name}</div>
                <div className="text-xs text-muted-foreground truncate">{entry.content.slice(0, 60)}...</div>
              </div>
              {entry.shortcut && <span className="text-[10px] bg-gray-100 dark:bg-zinc-600 px-1.5 py-0.5 rounded">{entry.shortcut}</span>}
              <button className="text-destructive text-xs p-1" onClick={e => { e.stopPropagation(); deleteEntry(i); }}>✕</button>
            </div>
          ))}
        </div>
        <div className="p-3 border-t">
          <button className="w-full p-2.5 text-sm border rounded hover:bg-accent min-h-[40px]" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
