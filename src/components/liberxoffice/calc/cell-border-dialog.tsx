'use client';
import React, { useState } from 'react';
import { useCalcStore } from '@/stores/calc-store';

export default function CellBorderDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { selectedCell, selectionRange, setCellFormat, getCell } = useCalcStore();
  const [borderStyle, setBorderStyle] = useState('thin');
  const [borderColor, setBorderColor] = useState('#000000');
  const [scope, setScope] = useState<'cell' | 'range'>('cell');

  if (!open) return null;

  const getCells = () => {
    if (scope === 'cell') return [selectedCell];
    if (!selectionRange) return [selectedCell];
    const cells: string[] = [];
    const startCol = selectionRange.start.replace(/\d+/, '');
    const endCol = selectionRange.end.replace(/\d+/, '');
    const startRow = parseInt(selectionRange.start.replace(/[^0-9]/g, ''));
    const endRow = parseInt(selectionRange.end.replace(/[^0-9]/g, ''));
    const colStart = startCol.charCodeAt(0);
    const colEnd = endCol.charCodeAt(0);
    for (let r = startRow; r <= endRow; r++) {
      for (let c = colStart; c <= colEnd; c++) {
        cells.push(String.fromCharCode(c) + r);
      }
    }
    return cells;
  };

  const applyBorder = () => {
    const borderCSS = borderStyle === 'none' ? 'none' : `${borderStyle} ${borderColor}`;
    setCellFormat(getCells(), { border: borderCSS });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl w-80 p-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-semibold mb-3">Cell Borders</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Style</label>
            <select className="w-full mt-1 p-2 border rounded text-sm bg-white dark:bg-zinc-700" value={borderStyle} onChange={e => setBorderStyle(e.target.value)}>
              <option value="none">None</option>
              <option value="thin">Thin</option>
              <option value="medium">Medium</option>
              <option value="thick">Thick</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Color</label>
            <input type="color" value={borderColor} onChange={e => setBorderColor(e.target.value)} className="w-full h-8 mt-1 rounded border cursor-pointer" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Apply to</label>
            <select className="w-full mt-1 p-2 border rounded text-sm bg-white dark:bg-zinc-700" value={scope} onChange={e => setScope(e.target.value as 'cell' | 'range')}>
              <option value="cell">Selected Cell</option>
              <option value="range">Selected Range</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="px-4 py-2 text-sm rounded border hover:bg-accent min-h-[40px]" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 text-sm rounded bg-lo-green text-white hover:bg-lo-green-dark min-h-[40px]" onClick={applyBorder}>Apply</button>
        </div>
      </div>
    </div>
  );
}
