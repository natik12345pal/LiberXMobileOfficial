'use client';
import React, { useState, useMemo } from 'react';
import { useCalcStore } from '@/stores/calc-store';

export default function TextToColumnsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { selectedCell, getCell, activeSheet, setCell } = useCalcStore();
  const [delimiter, setDelimiter] = useState<'comma' | 'tab' | 'space' | 'semicolon' | 'custom'>('comma');
  const [customDelimiter, setCustomDelimiter] = useState(',');

  const cellValue = getCell(activeSheet, selectedCell).computed || '';

  const getDelimiterChar = () => {
    switch (delimiter) {
      case 'comma': return ',';
      case 'tab': return '\t';
      case 'space': return ' ';
      case 'semicolon': return ';';
      case 'custom': return customDelimiter;
    }
  };

  const preview = useMemo(() => {
    const delim = getDelimiterChar();
    return cellValue.split(delim).map(s => s.trim());
  }, [cellValue, delimiter, customDelimiter]);

  if (!open) return null;

  const apply = () => {
    const delim = getDelimiterChar();
    const parts = cellValue.split(delim);
    const col = selectedCell.match(/[A-Z]+/)?.[0] || 'A';
    const row = parseInt(selectedCell.match(/\d+/)?.[0] || '1');
    const startColIdx = col.split('').reduce((a, c) => a * 26 + (c.charCodeAt(0) - 64), 0);
    parts.forEach((part, i) => {
      const colName = String.fromCharCode(64 + startColIdx + i);
      setCell(activeSheet, `${colName}${row}`, { raw: part.trim() });
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl w-96 p-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-semibold mb-3">Text to Columns</h3>
        <div className="text-xs text-muted-foreground mb-2">Cell: {selectedCell} = &ldquo;{cellValue}&rdquo;</div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Delimiter</label>
            <select className="w-full mt-1 p-2 border rounded text-sm bg-white dark:bg-zinc-700"
              value={delimiter} onChange={e => setDelimiter(e.target.value as typeof delimiter)}>
              <option value="comma">Comma</option>
              <option value="tab">Tab</option>
              <option value="space">Space</option>
              <option value="semicolon">Semicolon</option>
              <option value="custom">Custom...</option>
            </select>
          </div>
          {delimiter === 'custom' && (
            <div>
              <label className="text-xs text-muted-foreground">Custom Delimiter</label>
              <input className="w-full mt-1 p-2 border rounded text-sm bg-transparent" value={customDelimiter}
                onChange={e => setCustomDelimiter(e.target.value)} />
            </div>
          )}
          <div>
            <label className="text-xs text-muted-foreground">Preview</label>
            <div className="mt-1 p-2 border rounded bg-muted/30 text-xs font-mono max-h-32 overflow-auto">
              {preview.map((part, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-lo-green font-semibold min-w-[40px]">{String.fromCharCode(65 + i)}:</span>
                  <span>&ldquo;{part}&rdquo;</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="px-4 py-2 text-sm rounded border hover:bg-accent min-h-[40px]" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 text-sm rounded bg-lo-green text-white hover:bg-lo-green-dark min-h-[40px]" onClick={apply}>Apply</button>
        </div>
      </div>
    </div>
  );
}
