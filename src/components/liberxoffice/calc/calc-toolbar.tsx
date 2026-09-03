'use client';

import React, { useState } from 'react';
import { useCalcStore, type CellData } from '@/stores/calc-store';
import { useAppStore } from '@/stores/app-store';
import { downloadCSV, downloadXLSX } from '@/lib/file-service';
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  ArrowDownUp, Paintbrush, BarChart3, Search, Snowflake, Trash2, Plus, Download, Filter, Merge, Columns, Lock, Unlock, FileSpreadsheet
} from 'lucide-react';

const QUICK_FUNCS = ['SUM', 'AVERAGE', 'COUNT', 'MAX', 'MIN', 'IF', 'ROUND', 'ABS', 'SQRT', 'POWER', 'MOD', 'PI', 'MEDIAN', 'STDEV', 'COUNTIF', 'SUMIF', 'VLOOKUP', 'CONCATENATE', 'LEN', 'UPPER', 'LOWER', 'TRIM', 'LEFT', 'RIGHT', 'MID', 'LOG', 'LN', 'EXP', 'INT', 'RAND', 'TIME', 'HOUR', 'MINUTE', 'SECOND', 'DATEDIF', 'NETWORKDAYS', 'TEXT'];
const COLS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

interface CalcToolbarProps {
  onShowChart: () => void;
}

export default function CalcToolbar({ onShowChart }: CalcToolbarProps) {
  const { activeSheet, selectedCell, getCell, setCell, addSheet, sheets, setCellFormat, getUsedRange, clearCell, selectionRange, mergeCells, unmergeCells, isMerged, _filteredRows, sheetProtected, toggleSheetProtection } = useCalcStore();
  const { fileName, toggleFindReplace, toggleFilterDialog } = useAppStore();
  const cell = getCell(activeSheet, selectedCell);
  const [showFuncs, setShowFuncs] = useState(false);
  const [showNumberFmt, setShowNumberFmt] = useState(false);
  const [showProtectDialog, setShowProtectDialog] = useState(false);
  const [protectPwd, setProtectPwd] = useState('');

  const toggleBold = () => setCell(activeSheet, selectedCell, { bold: !cell.bold });
  const toggleItalic = () => setCell(activeSheet, selectedCell, { italic: !cell.italic });
  const toggleUnderline = () => setCell(activeSheet, selectedCell, { underline: !cell.underline });
  const setAlign = (align: 'left' | 'center' | 'right') => setCell(activeSheet, selectedCell, { align });

  const insertFunction = (fn: string) => {
    setCell(activeSheet, selectedCell, { raw: `${fn}()`, computed: '' });
    useCalcStore.getState().startEditing(`${fn}()`);
    setShowFuncs(false);
  };

  const setNumberFormat = (fmt: 'general' | 'number' | 'currency' | 'percent' | 'date') => {
    setCell(activeSheet, selectedCell, { numberFormat: fmt });
    setShowNumberFmt(false);
  };

  const handleColor = (type: 'bg' | 'color') => {
    const input = document.createElement('input');
    input.type = 'color';
    input.value = type === 'bg' ? (cell.bg || '#ffffff') : (cell.color || '#000000');
    input.onchange = () => setCell(activeSheet, selectedCell, { [type]: input.value });
    input.click();
  };

  const handleExportCSV = () => {
    const sheetData = sheets[activeSheet] || {};
    const rows: string[] = [];
    for (let r = 1; r <= 50; r++) {
      const cols: string[] = [];
      for (const c of COLS) {
        const val = sheetData[`${c}${r}`]?.computed || '';
        cols.push(val.includes(',') || val.includes('"') || val.includes('\n') ? `"${val.replace(/"/g, '""')}"` : val);
      }
      rows.push(cols.join(','));
    }
    downloadCSV(fileName, rows.join('\n'));
  };

  const handleExportXLSX = () => {
    downloadXLSX(fileName, sheets);
  };

  const handleSort = () => {
    const sortCol = selectedCell.replace(/\d+/, '');
    const sheetData: Record<string, CellData> = { ...(sheets[activeSheet] || {}) };

    // Collect rows 2-50 that have any data
    const dataRows: { rowNum: number; cells: Record<string, CellData> }[] = [];
    for (let r = 2; r <= 50; r++) {
      const rowData: Record<string, CellData> = {};
      let hasData = false;
      for (const c of COLS) {
        const ref = `${c}${r}`;
        if (sheetData[ref]) {
          rowData[c] = sheetData[ref];
          hasData = true;
        }
      }
      if (hasData) dataRows.push({ rowNum: r, cells: rowData });
    }

    // Sort by selected column using string/number comparison
    dataRows.sort((a, b) => {
      const va = a.cells[sortCol]?.computed || '';
      const vb = b.cells[sortCol]?.computed || '';
      const na = Number(va);
      const nb = Number(vb);
      if (va !== '' && vb !== '' && !isNaN(na) && !isNaN(nb)) return na - nb;
      return String(va).localeCompare(String(vb));
    });

    // Remove old row data from sheet
    for (const row of dataRows) {
      for (const c of COLS) {
        delete sheetData[`${c}${row.rowNum}`];
      }
    }

    // Reassign sorted rows starting from row 2
    dataRows.forEach((row, i) => {
      const newRow = i + 2;
      for (const [c, cellData] of Object.entries(row.cells)) {
        sheetData[`${c}${newRow}`] = cellData;
      }
    });

    useCalcStore.setState({ sheets: { ...sheets, [activeSheet]: sheetData } });
  };

  const handleProtectToggle = () => {
    if (sheetProtected) {
      // Unprotect
      if (useCalcStore.getState().sheetPassword) {
        const pwd = prompt('Enter password to unprotect:');
        if (pwd !== useCalcStore.getState().sheetPassword) { alert('Incorrect password'); return; }
      }
      toggleSheetProtection();
    } else {
      setShowProtectDialog(true);
    }
  };

  const doProtect = () => {
    toggleSheetProtection(protectPwd);
    setShowProtectDialog(false);
    setProtectPwd('');
  };

  const range = getUsedRange();
  const allCells = Object.keys(sheets[activeSheet] || {});

  return (
    <div className="lo-toolbar flex-wrap gap-0.5 relative">
      {/* Sheet tabs in toolbar */}
      <div className="flex items-center gap-1 mr-2 border-r border-border pr-2">
        {Object.keys(sheets).map((name) => (
          <button key={name} className={`px-2 py-1 text-xs rounded-t transition-colors touch-target ${name === activeSheet ? 'bg-white border border-border border-b-white -mb-px relative z-10' : 'hover:bg-white/60'}`}
            onClick={() => useCalcStore.getState().setActiveSheet(name)}>{name}</button>
        ))}
        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/60 touch-target" onClick={() => addSheet(`Sheet${Object.keys(sheets).length + 1}`)} title="Add Sheet">
          <Plus size={14} />
        </button>
      </div>

      {/* Formatting */}
      <button className={`lo-toolbar-btn ${cell.bold ? 'lo-toolbar-btn-active' : ''}`} onClick={toggleBold} title="Bold"><Bold size={16} /></button>
      <button className={`lo-toolbar-btn ${cell.italic ? 'lo-toolbar-btn-active' : ''}`} onClick={toggleItalic} title="Italic"><Italic size={16} /></button>
      <button className={`lo-toolbar-btn ${cell.underline ? 'lo-toolbar-btn-active' : ''}`} onClick={toggleUnderline} title="Underline"><Underline size={16} /></button>

      <div className="w-px h-6 bg-border mx-1" />

      <button className={`lo-toolbar-btn ${cell.align === 'left' ? 'lo-toolbar-btn-active' : ''}`} onClick={() => setAlign('left')}><AlignLeft size={16} /></button>
      <button className={`lo-toolbar-btn ${cell.align === 'center' ? 'lo-toolbar-btn-active' : ''}`} onClick={() => setAlign('center')}><AlignCenter size={16} /></button>
      <button className={`lo-toolbar-btn ${cell.align === 'right' ? 'lo-toolbar-btn-active' : ''}`} onClick={() => setAlign('right')}><AlignRight size={16} /></button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Colors */}
      <button className="lo-toolbar-btn" onClick={() => handleColor('bg')} title="Cell Background">
        <div className="w-4 h-4 rounded border border-black/20" style={{ background: cell.bg || '#ffffff' }} />
      </button>
      <button className="lo-toolbar-btn" onClick={() => handleColor('color')} title="Text Color">
        <Paintbrush size={14} />
      </button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Number format dropdown */}
      <div className="relative">
        <button className="lo-toolbar-btn !w-auto px-2 text-xs font-medium" onClick={() => setShowNumberFmt(!showNumberFmt)} title="Number Format">
          {cell.numberFormat === 'currency' ? '₹' : cell.numberFormat === 'percent' ? '%' : cell.numberFormat === 'date' ? 'Date' : cell.numberFormat === 'number' ? '#' : 'General'}
        </button>
        {showNumberFmt && (
          <div className="absolute top-full left-0 z-50 bg-white dark:bg-zinc-800 border border-border rounded-md shadow-lg py-1 min-w-[120px]">
            {[["general", "General"], ["number", "Number"], ["currency", "Currency (₹)"], ["percent", "Percentage"], ["date", "Date"]].map(([v, l]) => (
              <button key={v} className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent" onClick={() => setNumberFormat(v as 'general' | 'number' | 'currency' | 'percent' | 'date')}>{l}</button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Quick function buttons */}
      <span className="text-xs text-muted-foreground px-1">fx</span>
      <div className="relative">
        <button className="lo-toolbar-btn !w-auto px-2 text-xs font-mono" onClick={() => setShowFuncs(!showFuncs)}>
          Functions
        </button>
        {showFuncs && (
          <div className="absolute top-full left-0 z-50 bg-white dark:bg-zinc-800 border border-border rounded-md shadow-lg py-1 max-h-[280px] overflow-y-auto lo-scrollbar" style={{ minWidth: '320px' }}>
            <div className="grid grid-cols-3 gap-px p-1">
              {QUICK_FUNCS.map((fn) => (
                <button key={fn} className="px-2 py-1 text-xs font-mono hover:bg-accent rounded text-left" onClick={() => insertFunction(fn)}>{fn}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Tools */}
      <button className="lo-toolbar-btn" onClick={handleSort} title="Sort by Selected Column"><ArrowDownUp size={16} /></button>
      <button className={`lo-toolbar-btn ${_filteredRows !== null ? 'lo-toolbar-btn-active' : ''}`} onClick={toggleFilterDialog} title="AutoFilter"><Filter size={16} /></button>
      <button className="lo-toolbar-btn" onClick={onShowChart} title="Insert Chart"><BarChart3 size={16} /></button>
      <button className="lo-toolbar-btn" onClick={handleExportCSV} title="Export CSV"><Download size={16} /></button>
      <button className="lo-toolbar-btn text-green-700" onClick={handleExportXLSX} title="Export XLSX"><FileSpreadsheet size={16} /></button>
      <button className="lo-toolbar-btn" onClick={toggleFindReplace} title="Find"><Search size={16} /></button>
      <button className="lo-toolbar-btn" onClick={() => { if (range.endRow > 1) useCalcStore.getState().freezePanes(1, 0); }} title="Freeze Top Row"><Snowflake size={16} /></button>
      {selectionRange ? (
        <button className="lo-toolbar-btn" onClick={() => mergeCells(selectionRange)} title="Merge Cells"><Merge size={16} /></button>
      ) : isMerged(selectedCell) ? (
        <button className="lo-toolbar-btn" onClick={() => unmergeCells(selectedCell)} title="Unmerge Cells"><Columns size={16} /></button>
      ) : null}
      <button className={`lo-toolbar-btn ${sheetProtected ? 'lo-toolbar-btn-active text-amber-600' : ''}`} onClick={handleProtectToggle} title={sheetProtected ? 'Unprotect Sheet' : 'Protect Sheet'}>
        {sheetProtected ? <Lock size={16} /> : <Unlock size={16} />}
      </button>
      <button className="lo-toolbar-btn text-destructive" onClick={() => clearCell(selectedCell)} title="Clear Cell"><Trash2 size={16} /></button>
      {_filteredRows !== null && (
        <button className="text-[10px] px-2 py-0.5 rounded bg-lo-green/10 border border-lo-green/30 text-lo-green" onClick={() => useCalcStore.setState({ _filteredRows: null })}>Clear Filter</button>
      )}

      {/* Protect Sheet Dialog */}
      {showProtectDialog && (
        <div className="absolute top-full right-0 z-50 bg-white dark:bg-zinc-800 border border-border rounded-md shadow-lg p-3 w-[240px]">
          <p className="text-xs font-medium mb-2">Protect Sheet</p>
          <input className="w-full h-8 px-2 text-sm border border-border rounded-md bg-transparent mb-2" value={protectPwd} onChange={(e) => setProtectPwd(e.target.value)} placeholder="Password (optional)" autoFocus />
          <div className="flex gap-1">
            <button className="flex-1 h-8 text-xs border border-border rounded-md hover:bg-accent" onClick={() => { setShowProtectDialog(false); setProtectPwd(''); }}>Cancel</button>
            <button className="flex-1 h-8 text-xs bg-lo-green text-white rounded-md" onClick={doProtect}>Protect</button>
          </div>
        </div>
      )}
    </div>
  );
}