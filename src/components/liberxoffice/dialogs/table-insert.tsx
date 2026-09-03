'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { X } from 'lucide-react';

interface TableInsertProps {
  onInsert: (rows: number, cols: number, header: boolean) => void;
}

export default function TableInsert({ onInsert }: TableInsertProps) {
  const { showTableInsert, toggleTableInsert } = useAppStore();
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [header, setHeader] = useState(true);

  if (!showTableInsert) return null;

  const doInsert = () => {
    onInsert(rows, cols, header);
    toggleTableInsert();
  };

  // Build preview grid
  const preview: React.JSX.Element[] = [];
  for (let r = 0; r < Math.min(rows, 8); r++) {
    const row: React.JSX.Element[] = [];
    for (let c = 0; c < Math.min(cols, 8); c++) {
      row.push(
        <div
          key={`${r}-${c}`}
          className={`border border-border ${r === 0 && header ? 'bg-lo-header-row' : ''}`}
          style={{ minWidth: '24px', height: '18px' }}
        />
      );
    }
    preview.push(<div key={r} className="flex">{row}</div>);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40" onClick={toggleTableInsert}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-2xl w-[360px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-base font-semibold">Insert Table</h2>
          <button className="lo-toolbar-btn w-8 h-8" onClick={toggleTableInsert}><X size={16} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Rows</label>
              <input
                type="number" min={1} max={50} value={rows}
                className="w-full h-9 px-2 text-sm border border-border rounded-md bg-transparent mt-1"
                onChange={(e) => setRows(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Columns</label>
              <input
                type="number" min={1} max={26} value={cols}
                className="w-full h-9 px-2 text-sm border border-border rounded-md bg-transparent mt-1"
                onChange={(e) => setCols(Math.max(1, Math.min(26, parseInt(e.target.value) || 1)))}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={header} onChange={(e) => setHeader(e.target.checked)} className="w-4 h-4" />
            First row as header (bold)
          </label>
          {/* Preview */}
          <div className="bg-secondary/30 rounded-md p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Preview:</p>
            <div className="flex flex-col gap-px">{preview}</div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-4 pb-4">
          <button className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent" onClick={toggleTableInsert}>Cancel</button>
          <button className="px-3 py-1.5 text-sm bg-lo-green text-white rounded-md hover:bg-lo-green-dark" onClick={doInsert}>Insert</button>
        </div>
      </div>
    </div>
  );
}