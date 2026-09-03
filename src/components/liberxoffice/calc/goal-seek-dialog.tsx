'use client';
import React, { useState } from 'react';
import { useCalcStore } from '@/stores/calc-store';

export default function GoalSeekDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { selectedCell, getCell, activeSheet, setCell, evaluateFormula } = useCalcStore();
  const [setCellAddr, setSetCellAddr] = useState(selectedCell);
  const [targetValue, setTargetValue] = useState('');
  const [changeCellAddr, setChangeCellAddr] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  if (!open) return null;

  const run = () => {
    const target = parseFloat(targetValue);
    if (isNaN(target)) { setResult('Invalid target value'); return; }
    const store = useCalcStore.getState();
    const formulaCell = getCell(activeSheet, setCellAddr);
    if (!formulaCell.raw.startsWith('=')) { setResult('Set cell must contain a formula'); return; }

    setRunning(true);
    setResult(null);

    // Bisection method
    let lo = -10000;
    let hi = 10000;
    const maxIter = 100;
    const tolerance = 0.0001;

    // Check if formula depends on change cell
    const formulaUpper = formulaCell.raw.toUpperCase();
    const changeUpper = changeCellAddr.toUpperCase();
    if (!formulaUpper.includes(changeUpper)) {
      setResult('Formula does not reference the changing cell');
      setRunning(false);
      return;
    }

    for (let i = 0; i < maxIter; i++) {
      const mid = (lo + hi) / 2;
      setCell(activeSheet, changeCellAddr, { raw: String(mid) });
      const val = parseFloat(evaluateFormula(formulaCell.raw, activeSheet));
      if (isNaN(val)) { setResult('Formula returned an error'); setRunning(false); return; }
      if (Math.abs(val - target) < tolerance) {
        setResult(`Found: ${changeCellAddr} = ${Math.round(mid * 10000) / 10000} (formula = ${Math.round(val * 10000) / 10000})`);
        setRunning(false);
        return;
      }
      // Evaluate at lo
      setCell(activeSheet, changeCellAddr, { raw: String(lo) });
      const loVal = parseFloat(evaluateFormula(formulaCell.raw, activeSheet));
      if ((loVal - target) * (val - target) < 0) {
        hi = mid;
      } else {
        lo = mid;
      }
    }
    // Restore the last mid value
    const finalMid = (lo + hi) / 2;
    setCell(activeSheet, changeCellAddr, { raw: String(finalMid) });
    const finalVal = parseFloat(evaluateFormula(formulaCell.raw, activeSheet));
    setResult(`Approx: ${changeCellAddr} = ${Math.round(finalMid * 10000) / 10000} (formula = ${Math.round(finalVal * 10000) / 10000})`);
    setRunning(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl w-96 p-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-semibold mb-3">Goal Seek</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Set Cell (formula cell)</label>
            <input className="w-full mt-1 p-2 border rounded text-sm bg-transparent font-mono"
              value={setCellAddr} onChange={e => setSetCellAddr(e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">To Value (target)</label>
            <input className="w-full mt-1 p-2 border rounded text-sm bg-transparent"
              type="number" value={targetValue} onChange={e => setTargetValue(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">By Changing Cell</label>
            <input className="w-full mt-1 p-2 border rounded text-sm bg-transparent font-mono"
              value={changeCellAddr} onChange={e => setChangeCellAddr(e.target.value.toUpperCase())} />
          </div>
          {result && (
            <div className={`text-xs p-2 rounded ${result.startsWith('Found') || result.startsWith('Approx') ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
              {result}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="px-4 py-2 text-sm rounded border hover:bg-accent min-h-[40px]" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 text-sm rounded bg-lo-green text-white hover:bg-lo-green-dark min-h-[40px]"
            onClick={run} disabled={running || !targetValue || !changeCellAddr}>
            {running ? 'Running...' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}
