'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useCalcStore, type ConditionalFormat } from '@/stores/calc-store';
import { X, Plus, Trash2 } from 'lucide-react';

export default function ConditionalFormatDialog() {
  const { showConditionalFormatDialog, toggleConditionalFormatDialog } = useAppStore();
  const { conditionalFormats, addConditionalFormat, removeConditionalFormat, selectionRange, selectedCell } = useCalcStore();

  const [range, setRange] = useState(selectionRange ? `${selectionRange.start}:${selectionRange.end}` : `${selectedCell}:${selectedCell}`);
  const [condition, setCondition] = useState('>50');
  const [bgColor, setBgColor] = useState('#ffcccc');
  const [textColor, setTextColor] = useState('#cc0000');
  const [applyBold, setApplyBold] = useState(false);

  if (!showConditionalFormatDialog) return null;

  const handleAdd = () => {
    if (!range) return;
    addConditionalFormat({
      range,
      condition,
      bgColor,
      color: textColor,
      bold: applyBold,
    });
    toggleConditionalFormatDialog();
  };

  const conditionExamples = [
    { label: 'Greater than', value: '>50' },
    { label: 'Less than', value: '<30' },
    { label: 'Greater than or equal', value: '>=80' },
    { label: 'Less than or equal', value: '<=40' },
    { label: 'Equal to', value: '==100' },
    { label: 'Not equal to', value: '!=0' },
    { label: 'Text contains', value: 'text contains Pass' },
    { label: 'Between', value: 'between 60 and 90' },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40" onClick={toggleConditionalFormatDialog}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-2xl w-[440px] max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h2 className="text-base font-semibold">Conditional Formatting</h2>
          <button className="lo-toolbar-btn w-8 h-8" onClick={toggleConditionalFormatDialog}><X size={16} /></button>
        </div>

        {/* Existing rules */}
        {conditionalFormats.length > 0 && (
          <div className="px-4 pt-3 max-h-[140px] overflow-y-auto lo-scrollbar">
            <p className="text-xs text-muted-foreground mb-1">Existing Rules:</p>
            {conditionalFormats.map((cf) => (
              <div key={cf.id} className="flex items-center gap-2 text-xs bg-muted/50 rounded px-2 py-1 mb-1">
                <span className="flex-1 font-mono">{cf.range} | {cf.condition}</span>
                {cf.bgColor && <span className="w-3 h-3 rounded border" style={{ backgroundColor: cf.bgColor }} />}
                <button className="text-destructive hover:bg-destructive/10 rounded p-0.5" onClick={() => removeConditionalFormat(cf.id)}><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        )}

        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          <div>
            <label className="text-xs text-muted-foreground">Cell Range (e.g., B2:H6)</label>
            <input className="w-full h-9 px-2 text-sm border border-border rounded-md bg-transparent mt-1 font-mono uppercase"
              value={range} onChange={(e) => setRange(e.target.value.toUpperCase())} />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Condition</label>
            <input className="w-full h-9 px-2 text-sm border border-border rounded-md bg-transparent font-mono"
              value={condition} onChange={(e) => setCondition(e.target.value)} placeholder=">50" />
            <div className="flex flex-wrap gap-1 mt-1">
              {conditionExamples.map((ex) => (
                <button key={ex.value} className="text-[10px] px-1.5 py-0.5 border border-border rounded hover:bg-accent"
                  onClick={() => setCondition(ex.value)}>{ex.label}</button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Background Color</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-8 h-8 rounded border border-border cursor-pointer" />
                <span className="text-xs font-mono text-muted-foreground">{bgColor}</span>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Text Color</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-8 h-8 rounded border border-border cursor-pointer" />
                <span className="text-xs font-mono text-muted-foreground">{textColor}</span>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={applyBold} onChange={(e) => setApplyBold(e.target.checked)} className="w-4 h-4" />
            Apply Bold
          </label>
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border shrink-0">
          <button className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent touch-target" onClick={toggleConditionalFormatDialog}>Cancel</button>
          <button className="px-3 py-1.5 text-sm bg-lo-green text-white rounded-md hover:bg-lo-green-dark flex items-center gap-1 touch-target" onClick={handleAdd}><Plus size={14} /> Add Rule</button>
        </div>
      </div>
    </div>
  );
}
