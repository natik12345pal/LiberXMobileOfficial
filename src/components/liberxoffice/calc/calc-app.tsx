'use client';

import React, { useState } from 'react';
import { useCalcStore } from '@/stores/calc-store';
import { useAppStore } from '@/stores/app-store';
import { downloadJSON, downloadCSV, downloadXLSX, openFile, autoSave, loadAutoSave, clearAutoSave, printDocument, openXLSXFile } from '@/lib/file-service';
import MenuBar from '../shared/menu-bar';
import StatusBar from '../shared/status-bar';
import CalcToolbar from './calc-toolbar';
import SpreadsheetGrid from './spreadsheet-grid';
import SortDialog from '../dialogs/sort-dialog';
import ChartDialog from '../dialogs/chart-dialog';
import CalcFindReplace from './calc-find-replace';
import ConditionalFormatDialog from './conditional-format-dialog';
import DataValidationDialog from './data-validation-dialog';
import NamedRangesDialog from './named-ranges-dialog';
import PivotTableDialog from './pivot-table-dialog';
import CellBorderDialog from './cell-border-dialog';
import TextToColumnsDialog from './text-to-columns-dialog';
import GoalSeekDialog from './goal-seek-dialog';
import SaveAsDialog from '../dialogs/save-as-dialog';
import { Plus } from 'lucide-react';

export default function CalcApp() {
  const {
    activeSheet, selectedCell, isEditing, editValue, commitEdit, startEditing,
    cancelEdit, sheets, getCell, pushUndo, undo, redo, setActiveSheet, sheetProtected
  } = useCalcStore();
  const { fileName, setFileName, setModified, sidebarOpen, toggleSortDialog, toggleChartDialog,
    showCellBorderDialog, showTextToColumnsDialog, showGoalSeekDialog,
    toggleCellBorderDialog, toggleTextToColumnsDialog, toggleGoalSeekDialog, showSaveAsDialog, toggleSaveAsDialog } = useAppStore();

  const cell = getCell(activeSheet, selectedCell);
  const sheetNames = Object.keys(sheets);

  // Auto-save every 30 seconds
  React.useEffect(() => {
    const i = setInterval(() => autoSave('calc', JSON.stringify(useCalcStore.getState().sheets)), 30000);
    return () => clearInterval(i);
  }, []);

  // Load auto-saved data on mount if current sheets are empty
  React.useEffect(() => {
    const saved = loadAutoSave('calc');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        const currentSheets = useCalcStore.getState().sheets;
        const isEmpty = Object.keys(currentSheets).every(
          (name) => Object.keys(currentSheets[name] || {}).length === 0
        );
        if (isEmpty && typeof data === 'object' && data !== null) {
          useCalcStore.setState({
            sheets: data,
            activeSheet: Object.keys(data)[0] || 'Sheet1',
            selectedCell: 'A1',
          });
        }
      } catch {}
    }
  }, []);

  // liberx-action listener
  React.useEffect(() => {
    const handler = async (e: Event) => {
      const action = (e as CustomEvent).detail;
      if (action === 'openxlsx') {
        try {
          const result = await openXLSXFile();
          useCalcStore.setState({
            sheets: result.sheets as any,
            activeSheet: Object.keys(result.sheets)[0] || 'Sheet1',
            selectedCell: 'A1',
          });
          setFileName(result.name);
          setModified(true);
        } catch {}
      }
      if (action === 'grouprows') {
        const store = useCalcStore.getState();
        const sr = parseInt(store.selectedCell.replace(/[^0-9]/g, '')) || 1;
        const er = sr + 4; // Group 5 rows at a time
        store.groupRows(sr, Math.min(er, 50));
      }
      if (action === 'ungrouprows') {
        const store = useCalcStore.getState();
        const sr = parseInt(store.selectedCell.replace(/[^0-9]/g, '')) || 1;
        const er = sr + 4;
        store.ungroupRows(sr, Math.min(er, 50));
      }
    };
    window.addEventListener('liberx-action', handler);
    return () => window.removeEventListener('liberx-action', handler);
  }, []);

  const handleSave = () => {
    downloadJSON(fileName, useCalcStore.getState().sheets);
    setModified(false);
  };

  const handleOpen = async () => {
    try {
      const { name, content } = await openFile('.json');
      const data = JSON.parse(content);
      if (typeof data === 'object') {
        useCalcStore.setState({ sheets: data, activeSheet: Object.keys(data)[0] || 'Sheet1', selectedCell: 'A1' });
        setFileName(name);
        setModified(false);
      }
    } catch {}
  };

  const handleFormulaBarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      if (sheetProtected && cell.locked) {
        alert('This cell is locked. Unprotect the sheet to edit.');
        return;
      }
      commitEdit(editValue);
    }
  };

  const handleUndo = () => { pushUndo(); undo(); setModified(true); };
  const handleRedo = () => { redo(); setModified(true); };

  return (
    <div className="flex flex-col h-full">
      <MenuBar
        currentView="calc"
        onNewDocument={() => { pushUndo(); useCalcStore.setState({ sheets: { Sheet1: {} }, activeSheet: 'Sheet1', selectedCell: 'A1' }); setFileName('Untitled Spreadsheet'); }}
        onSave={handleSave}
        onOpen={handleOpen}
        onExport={handleSave}
        onPrint={() => printDocument()}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />
      <CalcToolbar onShowChart={toggleChartDialog} />

      {/* Formula Bar */}
      <div className="formula-bar">
        <div className="w-16 h-full flex items-center justify-center text-sm font-semibold bg-lo-header-row border-r border-border">
          {selectedCell}
        </div>
        <div className="flex-1 flex items-center px-1">
          <span className="text-sm text-muted-foreground pr-2 select-none">fx</span>
        </div>
        <form className="flex-1" onSubmit={handleFormulaBarSubmit}>
          <input className="formula-input w-full h-full"
            value={isEditing ? editValue : cell.raw}
            onChange={(e) => { if (!isEditing) startEditing(); useCalcStore.setState({ editValue: e.target.value }); }}
            onFocus={() => { if (!isEditing) startEditing(cell.raw); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (sheetProtected && cell.locked) { alert('This cell is locked.'); return; }
                pushUndo(); commitEdit(useCalcStore.getState().editValue);
              }
              if (e.key === 'Escape') cancelEdit();
            }}
          />
        </form>
      </div>

      {/* Grid */}
      <SpreadsheetGrid />

      {/* Sheet tabs */}
      <div className="flex items-center h-8 border-t border-border bg-lo-toolbar px-1 gap-1">
        {sheetNames.map((name) => (
          <div key={name} className="flex items-center group">
            <button className={`px-3 py-1 text-xs rounded-t transition-colors ${name === activeSheet ? 'bg-white border border-b-white -mb-px relative z-10 border-border' : 'hover:bg-white/60'}`}
              onClick={() => setActiveSheet(name)} onDoubleClick={() => {
                const newName = prompt('Rename sheet:', name);
                if (newName && newName !== name) useCalcStore.getState().renameSheet(name, newName);
              }}>
              {name}
            </button>
            {sheetNames.length > 1 && (
              <button className="w-4 h-4 flex items-center justify-center text-[10px] text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => { if (confirm(`Delete sheet "${name}"?`)) useCalcStore.getState().deleteSheet(name); }}>
                x</button>
            )}
          </div>
        ))}
        <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/60" onClick={() => useCalcStore.getState().addSheet(`Sheet${sheetNames.length + 1}`)} title="Add Sheet">
          <Plus size={12} />
        </button>
        <div className="ml-auto text-[10px] text-muted-foreground px-2 flex items-center gap-2">
          {sheetProtected && <span className="text-amber-600 font-medium">🔒 Protected</span>}
          {useCalcStore.getState().getUsedRange().endRow > 1 && `Range: ${useCalcStore.getState().getUsedRange().endRow} rows`}
        </div>
      </div>

      <StatusBar currentView="calc" extraInfo={`Sheet: ${activeSheet} | Cell: ${selectedCell} | ${cell.raw?.startsWith('=') ? 'Formula' : 'Value'}${cell.comment ? ' | 📝' : ''}${cell.locked ? ' | 🔒' : ''}`} />

      {/* Dialogs */}
      <SortDialog />
      <ChartDialog />
      <CalcFindReplace />
      <ConditionalFormatDialog />
      <DataValidationDialog />
      <NamedRangesDialog />
      <PivotTableDialog />
      <CellBorderDialog open={showCellBorderDialog} onClose={toggleCellBorderDialog} />
      <TextToColumnsDialog open={showTextToColumnsDialog} onClose={toggleTextToColumnsDialog} />
      <GoalSeekDialog open={showGoalSeekDialog} onClose={toggleGoalSeekDialog} />
      <SaveAsDialog open={showSaveAsDialog} appType="calc" onClose={toggleSaveAsDialog} onSave={async (name, format) => {
        const sheets = useCalcStore.getState().sheets;
        if (format === 'xlsx') {
          await downloadXLSX(name, sheets);
        } else if (format === 'csv') {
          // Export active sheet as CSV
          const sheet = sheets[useCalcStore.getState().activeSheet] || {};
          const rows: string[] = [];
          const COLS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
          for (let r = 1; r <= 50; r++) {
            const cols: string[] = [];
            for (const c of COLS) {
              const val = sheet[`${c}${r}`]?.computed || '';
              cols.push(val.includes(',') || val.includes('"') || val.includes('\n') ? `"${val.replace(/"/g, '""')}"` : val);
            }
            rows.push(cols.join(','));
          }
          downloadCSV(name, rows.join('\n'));
        } else {
          downloadJSON(name, sheets);
        }
        setModified(false);
      }} />
    </div>
  );
}
