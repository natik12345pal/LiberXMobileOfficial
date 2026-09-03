'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useCalcStore } from '@/stores/calc-store';
import { X, Plus, Trash2, Copy } from 'lucide-react';

export default function NamedRangesDialog() {
  const { showNamedRangesDialog, toggleNamedRangesDialog } = useAppStore();
  const { namedRanges, setNamedRange, removeNamedRange, selectionRange, selectedCell } = useCalcStore();

  const [name, setName] = useState('');
  const [range, setRange] = useState(selectionRange ? `${selectionRange.start}:${selectionRange.end}` : selectedCell);
  const [copied, setCopied] = useState<string | null>(null);

  if (!showNamedRangesDialog) return null;

  const handleAdd = () => {
    if (!name.trim() || !range.trim()) return;
    const cleanName = name.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
    if (!cleanName) return;
    setNamedRange(cleanName, range.trim().toUpperCase());
    setName('');
  };

  const handleCopy = (r: string) => {
    navigator.clipboard.writeText(r);
    setCopied(r);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40" onClick={toggleNamedRangesDialog}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-2xl w-[400px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-base font-semibold">Named Ranges</h2>
          <button className="lo-toolbar-btn w-8 h-8" onClick={toggleNamedRangesDialog}><X size={16} /></button>
        </div>

        <div className="p-4 space-y-3">
          {/* Add new */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Name</label>
              <input className="w-full h-9 px-2 text-sm border border-border rounded-md bg-transparent mt-0.5 font-mono uppercase"
                value={name} onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} placeholder="EXPENSES" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Range</label>
              <input className="w-full h-9 px-2 text-sm border border-border rounded-md bg-transparent mt-0.5 font-mono uppercase"
                value={range} onChange={(e) => setRange(e.target.value.toUpperCase())} placeholder="A1:B10" />
            </div>
            <button className="mt-4 lo-toolbar-btn" onClick={handleAdd} title="Add"><Plus size={16} /></button>
          </div>

          {/* Existing named ranges */}
          {Object.keys(namedRanges).length > 0 ? (
            <div className="max-h-[250px] overflow-y-auto lo-scrollbar">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b border-border">
                    <th className="text-left py-1.5 px-2">Name</th>
                    <th className="text-left py-1.5 px-2">Range</th>
                    <th className="w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(namedRanges).map(([n, r]) => (
                    <tr key={n} className="border-b border-border/50 hover:bg-accent/50">
                      <td className="py-1.5 px-2 font-mono font-medium text-lo-green">{n}</td>
                      <td className="py-1.5 px-2 font-mono">{r}</td>
                      <td className="py-1.5 px-2">
                        <div className="flex gap-1">
                          <button className="p-1 rounded hover:bg-accent" title="Copy" onClick={() => handleCopy(r)}><Copy size={12} /></button>
                          <button className="p-1 rounded hover:bg-destructive/10 text-destructive" title="Delete" onClick={() => removeNamedRange(n)}><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No named ranges defined. Use named ranges in formulas like <code className="font-mono bg-muted px-1 rounded">=SUM(expenses)</code></p>
          )}
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border">
          {copied && <span className="text-xs text-lo-green self-center mr-auto">Copied!</span>}
          <button className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent touch-target" onClick={toggleNamedRangesDialog}>Close</button>
        </div>
      </div>
    </div>
  );
}
