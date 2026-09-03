'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useCalcStore } from '@/stores/calc-store';
import { X, ArrowUp, ArrowDown } from 'lucide-react';

export default function SortDialog() {
  const { showSortDialog, toggleSortDialog } = useAppStore();
  const { sheets, activeSheet, setCell, getCell, selectedCell } = useCalcStore();
  const [sortCol, setSortCol] = useState(selectedCell.replace(/\d+/, ''));
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [hasHeader, setHasHeader] = useState(true);

  if (!showSortDialog) return null;

  const doSort = () => {
    const sheetData = sheets[activeSheet];
    if (!sheetData) return;

    // Find the data range
    const colIdx = sortCol.split('').reduce((a, c) => a * 26 + (c.charCodeAt(0) - 64), 0);
    let maxRow = 0;
    let maxCol = 0;
    Object.keys(sheetData).forEach((cell) => {
      const m = cell.match(/^([A-Z]+)(\d+)$/);
      if (!m) return;
      const r = parseInt(m[2]);
      const c = m[1].split('').reduce((a, ch) => a * 26 + (ch.charCodeAt(0) - 64), 0);
      if (r > maxRow) maxRow = r;
      if (c > maxCol) maxCol = c;
    });

    const startRow = hasHeader ? 2 : 1;
    const rows: { row: number; sortKey: string; sortVal: number }[] = [];
    for (let r = startRow; r <= maxRow; r++) {
      const cell = sheetData[`${sortCol}${r}`];
      const val = cell?.computed || '';
      rows.push({ row: r, sortKey: val, sortVal: parseFloat(val) || 0 });
    }

    rows.sort((a, b) => {
      if (sortDir === 'asc') return a.sortKey.localeCompare(b.sortKey) || a.sortVal - b.sortVal;
      return b.sortKey.localeCompare(a.sortKey) || b.sortVal - a.sortVal;
    });

    // Build new sheet data
    const newSheet: Record<string, typeof sheetData[string]> = {};
    // Copy header if exists
    if (hasHeader) {
      for (let c = 1; c <= maxCol; c++) {
        const col = colIndexToStr(c);
        const cell = sheetData[`${col}1`];
        if (cell) newSheet[`${col}1`] = cell;
      }
    }
    // Copy sorted rows
    rows.forEach((r, newIdx) => {
      const newRow = hasHeader ? newIdx + 2 : newIdx + 1;
      for (let c = 1; c <= maxCol; c++) {
        const col = colIndexToStr(c);
        const cell = sheetData[`${col}${r.row}`];
        if (cell) newSheet[`${col}${newRow}`] = cell;
      }
    });

    useCalcStore.setState((s) => ({ sheets: { ...s.sheets, [activeSheet]: newSheet } }));
    toggleSortDialog();
  };

  function colIndexToStr(idx: number): string {
    let s = '';
    while (idx > 0) { idx--; s = String.fromCharCode(65 + (idx % 26)) + s; idx = Math.floor(idx / 26); }
    return s;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40" onClick={toggleSortDialog}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-2xl w-[360px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-base font-semibold">Sort Data</h2>
          <button className="lo-toolbar-btn w-8 h-8" onClick={toggleSortDialog}><X size={16} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Sort by Column</label>
            <input className="w-full h-9 px-2 text-sm border border-border rounded-md bg-transparent mt-1 font-mono uppercase"
              value={sortCol} onChange={(e) => setSortCol(e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Direction</label>
            <div className="flex gap-2">
              <button className={`flex-1 flex items-center justify-center gap-1 h-9 text-sm rounded-md border transition-colors ${sortDir === 'asc' ? 'bg-lo-green text-white border-lo-green' : 'border-border hover:bg-accent'}`}
                onClick={() => setSortDir('asc')}><ArrowUp size={14} /> Ascending</button>
              <button className={`flex-1 flex items-center justify-center gap-1 h-9 text-sm rounded-md border transition-colors ${sortDir === 'desc' ? 'bg-lo-green text-white border-lo-green' : 'border-border hover:bg-accent'}`}
                onClick={() => setSortDir('desc')}><ArrowDown size={14} /> Descending</button>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} className="w-4 h-4" />
            First row contains headers
          </label>
        </div>
        <div className="flex justify-end gap-2 px-4 pb-4">
          <button className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent" onClick={toggleSortDialog}>Cancel</button>
          <button className="px-3 py-1.5 text-sm bg-lo-green text-white rounded-md hover:bg-lo-green-dark" onClick={doSort}>Sort</button>
        </div>
      </div>
    </div>
  );
}