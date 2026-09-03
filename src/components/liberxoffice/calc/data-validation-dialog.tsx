'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useCalcStore } from '@/stores/calc-store';
import { X, ChevronDown } from 'lucide-react';

export default function DataValidationDialog() {
  const { showDataValidationDialog, toggleDataValidationDialog } = useAppStore();
  const { activeSheet, selectedCell, selectionRange, getCell, setCell, sheets, setCellFormat, pushUndo } = useCalcStore();

  const [valType, setValType] = useState<'list' | 'whole' | 'decimal' | 'textLength'>('list');
  const [valValue, setValValue] = useState('');
  const [valMessage, setValMessage] = useState('');
  const [applyToRange, setApplyToRange] = useState(false);

  const currentValidation = showDataValidationDialog ? getCell(activeSheet, selectedCell).validation : null;
  const effectiveType = currentValidation?.type || valType;
  const effectiveValue = currentValidation?.value || (valValue ? '' : undefined);
  const effectiveMessage = currentValidation?.message || (valMessage ? '' : undefined);

  if (!showDataValidationDialog) return null;

  const handleApply = () => {
    pushUndo();
    if (applyToRange && selectionRange) {
      const cells: string[] = [];
      const start = selectionRange.start.match(/([A-Z]+)(\d+)/);
      const end = selectionRange.end.match(/([A-Z]+)(\d+)/);
      if (start && end) {
        const sc = start[1].split('').reduce((a, c) => a * 26 + (c.charCodeAt(0) - 64), 0);
        const sr = parseInt(start[2]);
        const ec = end[1].split('').reduce((a, c) => a * 26 + (c.charCodeAt(0) - 64), 0);
        const er = parseInt(end[2]);
        for (let r = sr; r <= er; r++) {
          for (let c = sc; c <= ec; c++) {
            let colStr = '';
            let tmp = c;
            while (tmp > 0) { tmp--; colStr = String.fromCharCode(65 + (tmp % 26)) + colStr; tmp = Math.floor(tmp / 26); }
            cells.push(`${colStr}${r}`);
          }
        }
      }
      const resolvedValue = valValue || effectiveValue;
      const resolvedMessage = valMessage || effectiveMessage;
      const validation = resolvedValue ? { type: effectiveType, value: resolvedValue, message: resolvedMessage } : undefined;
      cells.forEach((c) => setCell(activeSheet, c, { validation }));
    } else {
      const resolvedVal = valValue || effectiveValue;
      const resolvedMsg = valMessage || effectiveMessage;
      const validation = resolvedVal ? { type: effectiveType, value: resolvedVal, message: resolvedMsg } : undefined;
      setCell(activeSheet, selectedCell, { validation });
    }
    toggleDataValidationDialog();
  };

  const getRangeCells = () => {
    const cells: string[] = [];
    if (!applyToRange || !selectionRange) return cells;
    const start = selectionRange.start.match(/([A-Z]+)(\d+)/);
    const end = selectionRange.end.match(/([A-Z]+)(\d+)/);
    if (start && end) {
      const sc = start[1].split('').reduce((a, c) => a * 26 + (c.charCodeAt(0) - 64), 0);
      const sr = parseInt(start[2]);
      const ec = end[1].split('').reduce((a, c) => a * 26 + (c.charCodeAt(0) - 64), 0);
      const er = parseInt(end[2]);
      for (let r = sr; r <= er; r++) {
        for (let c = sc; c <= ec; c++) {
          let colStr = '';
          let tmp = c;
          while (tmp > 0) { tmp--; colStr = String.fromCharCode(65 + (tmp % 26)) + colStr; tmp = Math.floor(tmp / 26); }
          cells.push(`${colStr}${r}`);
        }
      }
    }
    return cells;
  };

  const handleRemove = () => {
    pushUndo();
    const cells = getRangeCells();
    if (cells.length > 0) {
      cells.forEach((c) => setCell(activeSheet, c, { validation: undefined }));
    } else {
      setCell(activeSheet, selectedCell, { validation: undefined });
    }
    toggleDataValidationDialog();
  };

  const typeLabels = {
    list: 'List (Dropdown)',
    whole: 'Whole Number',
    decimal: 'Decimal',
    textLength: 'Text Length',
  };

  const typeHints = {
    list: 'Enter comma-separated values (e.g., Yes,No,Maybe)',
    whole: 'Enter min and max (e.g., 1,100)',
    decimal: 'Enter min and max (e.g., 0.0,10.0)',
    textLength: 'Enter min and max length (e.g., 1,50)',
  };

  const initType = effectiveType;
  const initValue = effectiveValue || '';
  const initMessage = effectiveMessage || '';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40" onClick={toggleDataValidationDialog}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-2xl w-[400px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-base font-semibold">Data Validation</h2>
          <button className="lo-toolbar-btn w-8 h-8" onClick={toggleDataValidationDialog}><X size={16} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Cell: {applyToRange && selectionRange ? `${selectionRange.start}:${selectionRange.end}` : selectedCell}</label>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Validation Type</label>
            <div className="flex gap-1">
              {(Object.keys(typeLabels) as Array<keyof typeof typeLabels>).map((t) => (
                <button key={t} className={`flex-1 h-9 text-xs rounded-md border transition-colors touch-target ${initType === t ? 'bg-lo-green text-white border-lo-green' : 'border-border hover:bg-accent'}`}
                  onClick={() => setValType(t)}>{typeLabels[t]}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Value</label>
            <input className="w-full h-9 px-2 text-sm border border-border rounded-md bg-transparent mt-1"
              defaultValue={initValue} onChange={(e) => setValValue(e.target.value)} placeholder={typeHints[initType]} />
            <p className="text-[10px] text-muted-foreground mt-0.5">{typeHints[initType]}</p>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Error Message (optional)</label>
            <input className="w-full h-9 px-2 text-sm border border-border rounded-md bg-transparent mt-1"
              defaultValue={initMessage} onChange={(e) => setValMessage(e.target.value)} placeholder="Invalid input!" />
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={applyToRange} onChange={(e) => setApplyToRange(e.target.checked)} className="w-4 h-4" disabled={!selectionRange} />
            Apply to selected range
          </label>
        </div>
        <div className="flex justify-between gap-2 px-4 py-3 border-t border-border">
          <button className="px-3 py-1.5 text-sm border border-destructive text-destructive rounded-md hover:bg-destructive/10 touch-target" onClick={handleRemove}>Remove</button>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent touch-target" onClick={toggleDataValidationDialog}>Cancel</button>
            <button className="px-3 py-1.5 text-sm bg-lo-green text-white rounded-md hover:bg-lo-green-dark touch-target" onClick={handleApply}>Apply</button>
          </div>
        </div>
      </div>
    </div>
  );
}
