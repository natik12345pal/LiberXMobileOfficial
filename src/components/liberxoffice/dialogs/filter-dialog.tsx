'use client';

import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useCalcStore } from '@/stores/calc-store';
import { X, Filter, XCircle } from 'lucide-react';

export default function FilterDialog() {
  const { showFilterDialog, toggleFilterDialog } = useAppStore();
  const { sheets, activeSheet, getUsedRange } = useCalcStore();
  const [filters, setFilters] = useState<Record<string, string>>({});

  const range = useMemo(() => getUsedRange(), [sheets, activeSheet, getUsedRange]);
  const sheetData = sheets[activeSheet] || {};

  // Get header row values
  const headers = useMemo(() => {
    const h: { col: string; label: string }[] = [];
    for (let c = range.startCol; c <= range.endCol; c++) {
      const col = String.fromCharCode(64 + c);
      const val = sheetData[`${col}1`]?.computed || col;
      if (val) h.push({ col, label: val });
    }
    return h;
  }, [range, sheetData]);

  // Get unique values per column for filter options
  const columnValues = useMemo(() => {
    const result: Record<string, string[]> = {};
    for (const h of headers) {
      const vals = new Set<string>();
      for (let r = range.startRow + 1; r <= range.endRow; r++) {
        const v = sheetData[`${h.col}${r}`]?.computed || '';
        if (v) vals.add(v);
      }
      result[h.col] = Array.from(vals).sort();
    }
    return result;
  }, [headers, range, sheetData]);

  // Apply filters
  const applyFilters = () => {
    const filteredRows: Set<number> = new Set();
    // First, find all rows that match ALL filters
    for (let r = range.startRow + 1; r <= range.endRow; r++) {
      let matches = true;
      for (const [col, filterVal] of Object.entries(filters)) {
        if (!filterVal) continue;
        const cellVal = (sheetData[`${col}${r}`]?.computed || '').toLowerCase();
        if (!cellVal.includes(filterVal.toLowerCase())) {
          matches = false;
          break;
        }
      }
      if (matches) filteredRows.add(r);
    }
    // Hide non-matching rows by setting a flag in the store
    // Since we can't truly hide rows in CSS grid, we'll mark them
    useCalcStore.setState({ _filteredRows: Array.from(filteredRows) });
    toggleFilterDialog();
  };

  const clearFilters = () => {
    setFilters({});
    useCalcStore.setState({ _filteredRows: null });
  };

  if (!showFilterDialog) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40" onClick={toggleFilterDialog}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-2xl w-[460px] max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-lo-green" />
            <h2 className="text-base font-semibold">AutoFilter</h2>
          </div>
          <button className="lo-toolbar-btn w-8 h-8" onClick={toggleFilterDialog}><X size={16} /></button>
        </div>

        <div className="p-4 space-y-3 flex-1 overflow-y-auto lo-scrollbar">
          {headers.length === 0 && <p className="text-sm text-muted-foreground">No data found. Make sure your sheet has a header row.</p>}

          {headers.map((h) => (
            <div key={h.col}>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{h.label} (Column {h.col})</label>
              <div className="flex gap-1">
                <input
                  className="flex-1 h-8 px-2 text-sm border border-border rounded-md bg-transparent outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Filter..."
                  value={filters[h.col] || ''}
                  onChange={(e) => setFilters({ ...filters, [h.col]: e.target.value })}
                />
                {filters[h.col] && (
                  <button className="lo-toolbar-btn w-8 h-8" onClick={() => setFilters({ ...filters, [h.col]: '' })}>
                    <XCircle size={14} />
                  </button>
                )}
              </div>
              {/* Quick filter chips */}
              {columnValues[h.col] && columnValues[h.col].length <= 20 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {columnValues[h.col].map((v) => (
                    <button
                      key={v}
                      className={`px-2 py-0.5 text-[11px] rounded-full border transition-colors ${
                        filters[h.col]?.toLowerCase() === v.toLowerCase()
                          ? 'bg-lo-green text-white border-lo-green'
                          : 'border-border hover:bg-accent'
                      }`}
                      onClick={() => setFilters({ ...filters, [h.col]: filters[h.col] === v ? '' : v })}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between gap-2 px-4 py-3 border-t border-border">
          <button
            className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent transition-colors"
            onClick={clearFilters}
          >
            Clear All
          </button>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent" onClick={toggleFilterDialog}>Cancel</button>
            <button className="px-3 py-1.5 text-sm bg-lo-green text-white rounded-md hover:bg-lo-green-dark" onClick={applyFilters}>Apply Filter</button>
          </div>
        </div>
      </div>
    </div>
  );
}
