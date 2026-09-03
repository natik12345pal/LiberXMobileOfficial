'use client';

import React, { useState, useMemo } from 'react';

import { useAppStore } from '@/stores/app-store';
import { useCalcStore } from '@/stores/calc-store';
import { X } from 'lucide-react';

function colFromIndex(idx: number): string {
  let colStr = '';
  let tmp = idx;
  while (tmp > 0) { tmp--; colStr = String.fromCharCode(65 + (tmp % 26)) + colStr; tmp = Math.floor(tmp / 26); }
  return colStr;
}

export default function PivotTableDialog() {
  const { showPivotTableDialog, togglePivotTableDialog } = useAppStore();
  const { sheets, activeSheet, selectionRange, getUsedRange, createPivotTable } = useCalcStore();

  const usedRange = getUsedRange();
  const defaultRange = selectionRange
    ? `${selectionRange.start}:${selectionRange.end}`
    : `A${usedRange.startRow}:${String.fromCharCode(64 + usedRange.endCol)}${usedRange.endRow}`;

  const [dataRange, setDataRange] = useState(defaultRange);
  const [rowGroup, setRowGroup] = useState('');
  const [colGroup, setColGroup] = useState('');
  const [valueCol, setValueCol] = useState('');
  const [agg, setAgg] = useState<'SUM' | 'COUNT' | 'AVERAGE'>('SUM');

  const headers = useMemo(() => {
    const sheetData = sheets[activeSheet] || {};
    const m = dataRange.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
    if (!m) return [];
    const startCol = m[1];
    const headerRow = m[2];
    const endCol = m[3];
    const sc = startCol.split('').reduce((a: number, c: string) => a * 26 + (c.charCodeAt(0) - 64), 0);
    const ec = endCol.split('').reduce((a: number, c: string) => a * 26 + (c.charCodeAt(0) - 64), 0);
    const h: string[] = [];
    for (let c = sc; c <= ec; c++) {
      h.push(sheetData[`${colFromIndex(c)}${headerRow}`]?.computed || colFromIndex(c));
    }
    return h;
  }, [dataRange, sheets, activeSheet]);

  const effectiveRowGroup = rowGroup || headers[0] || '';
  const effectiveValueCol = valueCol || (headers.length > 2 ? headers[2] : headers[1] || '');
  const effectiveColGroup = colGroup || (headers.length > 2 ? headers[1] : '');

  if (!showPivotTableDialog) return null;

  const handleCreate = () => {
    if (!dataRange || !effectiveRowGroup || !effectiveValueCol) return;
    createPivotTable({
      dataRange,
      rowGroup: effectiveRowGroup,
      colGroup: effectiveColGroup || '(All)',
      valueCol: effectiveValueCol,
      agg,
    });
    togglePivotTableDialog();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40" onClick={togglePivotTableDialog}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-2xl w-[420px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-base font-semibold">Pivot Table</h2>
          <button className="lo-toolbar-btn w-8 h-8" onClick={togglePivotTableDialog}><X size={16} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Data Range</label>
            <input className="w-full h-9 px-2 text-sm border border-border rounded-md bg-transparent mt-1 font-mono uppercase"
              value={dataRange} onChange={(e) => setDataRange(e.target.value.toUpperCase())} placeholder="A1:E10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Row Grouping</label>
              <select className="w-full h-9 px-2 text-sm border border-border rounded-md bg-transparent mt-1"
                value={effectiveRowGroup} onChange={(e) => setRowGroup(e.target.value)}>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Column Grouping</label>
              <select className="w-full h-9 px-2 text-sm border border-border rounded-md bg-transparent mt-1"
                value={effectiveColGroup} onChange={(e) => setColGroup(e.target.value)}>
                <option value="">(None)</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Value Column</label>
              <select className="w-full h-9 px-2 text-sm border border-border rounded-md bg-transparent mt-1"
                value={effectiveValueCol} onChange={(e) => setValueCol(e.target.value)}>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Aggregation</label>
              <select className="w-full h-9 px-2 text-sm border border-border rounded-md bg-transparent mt-1"
                value={agg} onChange={(e) => setAgg(e.target.value as typeof agg)}>
                <option value="SUM">SUM</option>
                <option value="COUNT">COUNT</option>
                <option value="AVERAGE">AVERAGE</option>
              </select>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground">A new sheet named "PivotTable" will be created with the results.</p>
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border">
          <button className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent touch-target" onClick={togglePivotTableDialog}>Cancel</button>
          <button className="px-3 py-1.5 text-sm bg-lo-green text-white rounded-md hover:bg-lo-green-dark touch-target" onClick={handleCreate}>Create</button>
        </div>
      </div>
    </div>
  );
}
