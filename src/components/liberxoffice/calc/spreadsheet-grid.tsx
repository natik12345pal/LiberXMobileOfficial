'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useCalcStore, indexToCol, colToIndex } from '@/stores/calc-store';
import { useAppStore } from '@/stores/app-store';
import { useContextMenu } from '../shared/context-menu';
import { ClipboardPaste, Copy, Scissors, Trash2, Paintbrush, Merge, Columns, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Snowflake, Filter, MessageSquare, Lock, Unlock, ChevronDown, ArrowLeftRight, Plus, Minus } from 'lucide-react';

const TOTAL_ROWS = 50;
const TOTAL_COLS = 26;

export default function SpreadsheetGrid() {
  const {
    activeSheet, selectedCell, selectCell, getCell,
    isEditing, editValue, startEditing, commitEdit, cancelEdit,
    setSelectionRange, sheets, pushUndo, clearCell, clearRange,
    setCell, getUsedRange, setCellFormat, mergeCells, unmergeCells,
    isMerged, _filteredRows, selectionRange, frozenRows, frozenCols,
    columnWidths, setColumnWidth, sheetProtected, getConditionalFormatForCell,
    findMatches, autoFitColumn, rowHeights, setRowHeight,
    rowGroups, colGroups, collapsedGroups, toggleGroup,
  } = useCalcStore();
  const { toggleFilterDialog, toggleConditionalFormatDialog, toggleDataValidationDialog, toggleNamedRangesDialog } = useAppStore();

  const gridRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);

  // Column resize state
  const [resizingCol, setResizingCol] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartW, setResizeStartW] = useState(100);

  // Row height resize state
  const [resizingRow, setResizingRow] = useState<number | null>(null);
  const [rowResizeStartY, setRowResizeStartY] = useState(0);
  const [rowResizeStartH, setRowResizeStartH] = useState(28);

  // Comment tooltip state
  const [commentTooltip, setCommentTooltip] = useState<{ cell: string; x: number; y: number } | null>(null);

  // Validation dropdown state
  const [validationDropdown, setValidationDropdown] = useState<{ cell: string; x: number; y: number; values: string[] } | null>(null);

  // Comment input dialog state
  const [commentInput, setCommentInput] = useState<{ cell: string; x: number; y: number } | null>(null);
  const [commentText, setCommentText] = useState('');

  // Protection password dialog
  const [protectionDialog, setProtectionDialog] = useState<{ x: number; y: number } | null>(null);
  const [protectionPwd, setProtectionPwd] = useState('');

  // Validation error
  const [validationError, setValidationError] = useState<{ cell: string; x: number; y: number; message: string } | null>(null);

  const { show: showCtx, hide: hideCtx, menuEl: ctxMenu } = useContextMenu();

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  const getColWidth = (col: string) => columnWidths[col] || 100;
  const getRowHeight = (row: number) => rowHeights[String(row)] || 28;
  const headerSize = 44;

  // Compute frozen column left offsets
  const frozenColLeftOffsets = useMemo(() => {
    const offsets: Record<string, number> = {};
    let left = 0;
    for (let i = 0; i < frozenCols; i++) {
      const col = indexToCol(i);
      offsets[col] = left;
      left += getColWidth(col);
    }
    return offsets;
  }, [frozenCols, columnWidths]);

  // Compute frozen row top offsets
  const frozenRowTopOffsets = useMemo(() => {
    const offsets: Record<number, number> = {};
    let top = 0;
    for (let r = 1; r <= frozenRows; r++) {
      offsets[r] = top;
      top += getRowHeight(r);
    }
    return offsets;
  }, [frozenRows, rowHeights]);

  // Determine which rows are hidden by collapsed groups
  const isRowCollapsed = useCallback((rowNum: number) => {
    for (const [levelStr, rows] of Object.entries(rowGroups)) {
      for (const r of rows) {
        const key = `row-${levelStr}`;
        if (collapsedGroups.has(key) && r !== rows[0] && r !== rows[rows.length - 1] && r > rows[0] && r < rows[rows.length - 1]) {
          return true;
        }
      }
    }
    return false;
  }, [rowGroups, collapsedGroups]);

  const isColCollapsed = useCallback((colIdx: number) => {
    for (const [levelStr, cols] of Object.entries(colGroups)) {
      const key = `col-${levelStr}`;
      if (collapsedGroups.has(key) && colIdx !== cols[0] && colIdx !== cols[cols.length - 1] && colIdx > cols[0] && colIdx < cols[cols.length - 1]) {
        return true;
      }
    }
    return false;
  }, [colGroups, collapsedGroups]);

  // Get the group level for a row (for showing +/- button)
  const getRowGroupLevel = useCallback((rowNum: number) => {
    for (const [levelStr, rows] of Object.entries(rowGroups)) {
      if (rows.includes(rowNum) && rows[0] === rowNum) return levelStr;
    }
    return null;
  }, [rowGroups]);

  const getSelectedPosition = useCallback(() => {
    const col = selectedCell.match(/[A-Z]+/)?.[0] || 'A';
    const row = parseInt(selectedCell.match(/\d+/)?.[0] || '1');
    return { col, row, colIdx: col.split('').reduce((a, c) => a * 26 + (c.charCodeAt(0) - 64), 0) - 1 };
  }, [selectedCell]);

  const handleCellClick = (cellId: string) => {
    if (isEditing) commitEdit(editValue);
    setValidationDropdown(null);
    setValidationError(null);
    selectCell(cellId);
  };

  const handleCellDoubleClick = (cellId: string) => {
    setValidationDropdown(null);
    setValidationError(null);
    const cell = getCell(activeSheet, cellId);
    // Check if cell has list validation - show dropdown
    if (cell.validation?.type === 'list') {
      const rect = gridRef.current?.querySelector(`[data-cell="${cellId}"]`)?.getBoundingClientRect();
      if (rect) {
        setValidationDropdown({ cell: cellId, x: rect.left, y: rect.bottom, values: cell.validation.value.split(',').map((v) => v.trim()) });
      }
      return;
    }
    selectCell(cellId);
    startEditing(cell.raw);
  };

  // Column resize handlers
  const handleColResizeStart = (col: string, e: React.MouseEvent) => {
    e.preventDefault();
    setResizingCol(col);
    setResizeStartX(e.clientX);
    setResizeStartW(getColWidth(col));
  };

  // Double-click column border to auto-fit
  const handleColHeaderDoubleClick = (col: string) => {
    pushUndo();
    autoFitColumn(col);
  };

  // Row height resize handlers
  const handleRowResizeStart = (rowNum: number, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setResizingRow(rowNum);
    setRowResizeStartY(clientY);
    setRowResizeStartH(getRowHeight(rowNum));
  };

  useEffect(() => {
    if (!resizingCol) return;
    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - resizeStartX;
      setColumnWidth(resizingCol, Math.max(40, resizeStartW + dx));
    };
    const handleUp = () => setResizingCol(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [resizingCol, resizeStartX, resizeStartW, setColumnWidth]);

  useEffect(() => {
    if (resizingRow === null) return;
    const handleMove = (e: MouseEvent) => {
      const dy = e.clientY - rowResizeStartY;
      setRowHeight(String(resizingRow), Math.max(20, Math.min(200, rowResizeStartH + dy)));
    };
    const handleTouchMove = (e: TouchEvent) => {
      const dy = e.touches[0].clientY - rowResizeStartY;
      setRowHeight(String(resizingRow), Math.max(20, Math.min(200, rowResizeStartH + dy)));
    };
    const handleUp = () => setResizingRow(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [resizingRow, rowResizeStartY, rowResizeStartH, setRowHeight]);

  // Validate cell input on commit
  const validateAndCommit = (cellId: string, value: string) => {
    const cell = getCell(activeSheet, cellId);
    if (cell.validation) {
      const v = cell.validation;
      if (v.type === 'whole') {
        const num = parseFloat(value);
        if (value && (isNaN(num) || !Number.isInteger(num))) {
          const rect = gridRef.current?.querySelector(`[data-cell="${cellId}"]`)?.getBoundingClientRect();
          if (rect) setValidationError({ cell: cellId, x: rect.left + rect.width / 2, y: rect.top - 8, message: v.message || 'Must be a whole number' });
          return;
        }
        if (v.value) {
          const [min, max] = v.value.split(',').map(Number);
          if (!isNaN(min) && num < min) { const rect = gridRef.current?.querySelector(`[data-cell="${cellId}"]`)?.getBoundingClientRect(); if (rect) setValidationError({ cell: cellId, x: rect.left + rect.width / 2, y: rect.top - 8, message: v.message || `Value must be >= ${min}` }); return; }
          if (!isNaN(max) && num > max) { const rect = gridRef.current?.querySelector(`[data-cell="${cellId}"]`)?.getBoundingClientRect(); if (rect) setValidationError({ cell: cellId, x: rect.left + rect.width / 2, y: rect.top - 8, message: v.message || `Value must be <= ${max}` }); return; }
        }
      } else if (v.type === 'decimal') {
        const num = parseFloat(value);
        if (value && isNaN(num)) {
          const rect = gridRef.current?.querySelector(`[data-cell="${cellId}"]`)?.getBoundingClientRect();
          if (rect) setValidationError({ cell: cellId, x: rect.left + rect.width / 2, y: rect.top - 8, message: v.message || 'Must be a decimal number' });
          return;
        }
        if (v.value) {
          const [min, max] = v.value.split(',').map(Number);
          if (!isNaN(min) && num < min) { const rect = gridRef.current?.querySelector(`[data-cell="${cellId}"]`)?.getBoundingClientRect(); if (rect) setValidationError({ cell: cellId, x: rect.left + rect.width / 2, y: rect.top - 8, message: v.message || `Value must be >= ${min}` }); return; }
          if (!isNaN(max) && num > max) { const rect = gridRef.current?.querySelector(`[data-cell="${cellId}"]`)?.getBoundingClientRect(); if (rect) setValidationError({ cell: cellId, x: rect.left + rect.width / 2, y: rect.top - 8, message: v.message || `Value must be <= ${max}` }); return; }
        }
      } else if (v.type === 'textLength') {
        if (v.value) {
          const [min, max] = v.value.split(',').map(Number);
          if (!isNaN(min) && value.length < min) { const rect = gridRef.current?.querySelector(`[data-cell="${cellId}"]`)?.getBoundingClientRect(); if (rect) setValidationError({ cell: cellId, x: rect.left + rect.width / 2, y: rect.top - 8, message: v.message || `Text must be at least ${min} characters` }); return; }
          if (!isNaN(max) && value.length > max) { const rect = gridRef.current?.querySelector(`[data-cell="${cellId}"]`)?.getBoundingClientRect(); if (rect) setValidationError({ cell: cellId, x: rect.left + rect.width / 2, y: rect.top - 8, message: v.message || `Text must be at most ${max} characters` }); return; }
        }
      } else if (v.type === 'list') {
        const allowed = v.value.split(',').map((s) => s.trim().toLowerCase());
        if (value && !allowed.includes(value.toLowerCase())) {
          const rect = gridRef.current?.querySelector(`[data-cell="${cellId}"]`)?.getBoundingClientRect();
          if (rect) setValidationError({ cell: cellId, x: rect.left + rect.width / 2, y: rect.top - 8, message: v.message || `Value must be one of: ${v.value}` });
          return;
        }
      }
    }
    setValidationError(null);
    commitEdit(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const { col, row } = getSelectedPosition();
    if (isEditing) {
      if (e.key === 'Enter') { e.preventDefault(); validateAndCommit(selectedCell, editValue); selectCell(`${col}${Math.min(row + 1, TOTAL_ROWS)}`); }
      else if (e.key === 'Escape') cancelEdit();
      else if (e.key === 'Tab') { e.preventDefault(); validateAndCommit(selectedCell, editValue); const ci = col.split('').reduce((a, c) => a * 26 + (c.charCodeAt(0) - 64), 0); selectCell(`${indexToCol(Math.min(ci, TOTAL_COLS - 1))}${row}`); }
      return;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && !sheetProtected) { e.preventDefault(); useCalcStore.getState().setCell(activeSheet, selectedCell, { raw: '', computed: '' }); }
    switch (e.key) {
      case 'ArrowUp': e.preventDefault(); selectCell(`${col}${Math.max(1, row - 1)}`); if (e.shiftKey) setDragEnd(`${col}${Math.max(1, row - 1)}`); break;
      case 'ArrowDown': case 'Enter': e.preventDefault(); selectCell(`${col}${Math.min(TOTAL_ROWS, row + 1)}`); if (e.shiftKey) setDragEnd(`${col}${Math.min(TOTAL_ROWS, row + 1)}`); break;
      case 'ArrowLeft': e.preventDefault(); { const ci = col.split('').reduce((a, c) => a * 26 + (c.charCodeAt(0) - 64), 0); selectCell(`${indexToCol(Math.max(0, ci - 2))}${row}`); if (e.shiftKey) setDragEnd(`${indexToCol(Math.max(0, ci - 2))}${row}`); } break;
      case 'ArrowRight': case 'Tab': e.preventDefault(); { const ci = col.split('').reduce((a, c) => a * 26 + (c.charCodeAt(0) - 64), 0); selectCell(`${indexToCol(Math.min(TOTAL_COLS - 1, ci))}${row}`); if (e.shiftKey) setDragEnd(`${indexToCol(Math.min(TOTAL_COLS - 1, ci))}${row}`); } break;
      default: if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        if (sheetProtected) {
          const cell = getCell(activeSheet, selectedCell);
          if (cell.locked) return;
        }
        startEditing(e.key);
      } break;
    }
  };

  const isCellInSelection = (cellId: string) => {
    if (!dragStart || !dragEnd) return false;
    const sC = dragStart.match(/[A-Z]+/)?.[0] || '', sR = parseInt(dragStart.match(/\d+/)?.[0] || '0');
    const eC = dragEnd.match(/[A-Z]+/)?.[0] || '', eR = parseInt(dragEnd.match(/\d+/)?.[0] || '0');
    const cC = cellId.match(/[A-Z]+/)?.[0] || '', cR = parseInt(cellId.match(/\d+/)?.[0] || '0');
    return cC >= (sC < eC ? sC : eC) && cC <= (sC > eC ? sC : eC) && cR >= Math.min(sR, eR) && cR <= Math.max(sR, eR);
  };

  // Check if cell is in find matches
  const isFindMatch = (cellId: string) => findMatches.includes(cellId);
  const isCurrentFindMatch = (cellId: string) => findMatches.length > 0 && findMatches[useCalcStore.getState().findMatchIndex] === cellId;

  // Right-click context menu for cells
  const handleContextMenu = (e: React.MouseEvent, cellId: string) => {
    e.preventDefault();
    selectCell(cellId);
    const cell = getCell(activeSheet, cellId);
    const selRange = useCalcStore.getState().selectionRange;
    const merged = isMerged(cellId);

    showCtx(e, [
      { label: 'Cut', shortcut: 'Ctrl+X', icon: <Scissors size={14} />, action: () => document.execCommand('cut') },
      { label: 'Copy', shortcut: 'Ctrl+C', icon: <Copy size={14} />, action: () => document.execCommand('copy') },
      { label: 'Paste', shortcut: 'Ctrl+V', icon: <ClipboardPaste size={14} />, action: () => { navigator.clipboard.readText().then(text => { setCell(activeSheet, cellId, { raw: text }); }); } },
      { label: '', divider: true, action: '' },
      { label: 'Delete Contents', icon: <Trash2 size={14} />, action: () => clearCell(cellId) },
      { label: 'Clear Formatting', icon: <Paintbrush size={14} />, action: () => setCell(activeSheet, cellId, { bold: false, italic: false, underline: false, bg: undefined, color: undefined }) },
      { label: '', divider: true, action: '' },
      { label: 'Bold', icon: <Bold size={14} />, action: () => setCell(activeSheet, cellId, { bold: !cell.bold }) },
      { label: 'Italic', icon: <Italic size={14} />, action: () => setCell(activeSheet, cellId, { italic: !cell.italic }) },
      { label: 'Underline', icon: <Underline size={14} />, action: () => setCell(activeSheet, cellId, { underline: !cell.underline }) },
      { label: '', divider: true, action: '' },
      { label: 'Align Left', icon: <AlignLeft size={14} />, action: () => setCell(activeSheet, cellId, { align: 'left' }) },
      { label: 'Align Center', icon: <AlignCenter size={14} />, action: () => setCell(activeSheet, cellId, { align: 'center' }) },
      { label: 'Align Right', icon: <AlignRight size={14} />, action: () => setCell(activeSheet, cellId, { align: 'right' }) },
      { label: '', divider: true, action: '' },
      { label: 'Add/Edit Comment', icon: <MessageSquare size={14} />, action: () => {
        setCommentText(cell.comment || '');
        setCommentInput({ cell: cellId, x: e.clientX, y: e.clientY });
      } },
      { label: 'Toggle Lock', icon: cell.locked ? <Unlock size={14} /> : <Lock size={14} />, action: () => setCell(activeSheet, cellId, { locked: !cell.locked }) },
      { label: 'Data Validation...', action: () => { useAppStore.getState().toggleDataValidationDialog(); } },
      { label: '', divider: true, action: '' },
      ...(selRange ? [
        { label: 'Merge Cells', icon: <Merge size={14} />, action: () => mergeCells(selRange) },
        { label: 'Unmerge Cells', icon: <Columns size={14} />, action: () => unmergeCells(cellId), disabled: !merged } as any,
      ] : []),
      { label: 'Freeze Panes', icon: <Snowflake size={14} />, action: () => useCalcStore.getState().freezePanes(1, 0) },
      { label: 'AutoFilter', icon: <Filter size={14} />, action: () => toggleFilterDialog() },
    ]);
  };

  // Right-click context menu for column headers
  const handleColContextMenu = (e: React.MouseEvent, col: string) => {
    e.preventDefault();
    showCtx(e, [
      { label: 'Auto-fit Column', icon: <ArrowLeftRight size={14} />, action: () => { pushUndo(); autoFitColumn(col); } },
      { label: 'Set Column Width...', action: () => {
        const w = prompt('Column width (40-400):', String(getColWidth(col)));
        if (w) { const num = parseInt(w); if (num >= 40 && num <= 400) setColumnWidth(col, num); }
      } },
    ]);
  };

  const sheetData = sheets[activeSheet] || {};
  const isRowFiltered = (rowNum: number) => _filteredRows !== null && !_filteredRows.includes(rowNum);
  const isRowHidden = (rowNum: number) => isRowFiltered(rowNum) || isRowCollapsed(rowNum);

  return (
    <div className="flex-1 overflow-auto lo-scrollbar" onKeyDown={handleKeyDown} tabIndex={0}>
      <div ref={gridRef} className="relative" style={{ minWidth: Object.keys(columnWidths).length > 0 ? Object.entries(columnWidths).reduce((sum, [col, w]) => sum + (w || 100), 0) + headerSize : TOTAL_COLS * 100 + headerSize }}>
        {/* Column Headers */}
        <div className="sticky top-0 z-20 flex" style={{ left: headerSize }}>
          {Array.from({ length: TOTAL_COLS }, (_, i) => {
            const col = indexToCol(i);
            const w = getColWidth(col);
            const isFrozen = i < frozenCols;
            const frozenLeft = frozenColLeftOffsets[col];
            const collapsed = isColCollapsed(i);
            const groupLevel = (() => {
              for (const [levelStr, cols] of Object.entries(colGroups)) {
                if (cols.includes(i) && cols[0] === i) return levelStr;
              }
              return null;
            })();
            if (collapsed) return null;
            return (
              <div key={col} className="spreadsheet-header relative"
                style={{
                  width: w, minWidth: w, height: headerSize,
                  ...(isFrozen ? { position: 'sticky', left: headerSize + (frozenLeft || 0), zIndex: 21, backgroundColor: 'var(--lo-header-row-frozen, #e8f5e9)' } : {}),
                }}
                onDoubleClick={() => handleColHeaderDoubleClick(col)}
                onContextMenu={(e) => handleColContextMenu(e, col)}>
                {groupLevel !== null && (
                  <button className="absolute left-0.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-[9px] rounded-sm bg-lo-green/20 hover:bg-lo-green/40 text-lo-green-dark z-40"
                    onClick={(e) => { e.stopPropagation(); toggleGroup('col', groupLevel); }}>
                    {collapsedGroups.has(`col-${groupLevel}`) ? <Plus size={9} /> : <Minus size={9} />}
                  </button>
                )}
                <span className={groupLevel !== null ? 'ml-3' : ''}>{col}</span>
                {/* Resize handle */}
                <div
                  className="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-lo-green/40 z-30"
                  onMouseDown={(e) => handleColResizeStart(col, e)}
                />
              </div>
            );
          })}
        </div>

        {/* Row Headers + Cells */}
        {Array.from({ length: TOTAL_ROWS }, (_, rowIdx) => {
          const rowNum = rowIdx + 1;
          if (isRowHidden(rowNum)) return null;
          const rowH = getRowHeight(rowNum);
          const isFrozenRow = rowNum <= frozenRows;
          const frozenTop = frozenRowTopOffsets[rowNum];
          const groupLevel = getRowGroupLevel(rowNum);
          return (
            <div key={rowNum} className="flex" style={isFrozenRow ? { position: 'sticky', top: headerSize + (frozenTop || 0), zIndex: frozenCols > 0 && isFrozenRow ? 3 : 2 } : {}}>
              <div className="spreadsheet-header sticky left-0 z-10 relative flex items-center justify-center"
                style={{ width: headerSize, minWidth: headerSize, height: rowH, ...(isFrozenRow ? { zIndex: frozenCols > 0 ? 22 : 12, backgroundColor: 'var(--lo-header-row-frozen, #e8f5e9)' } : {}) }}>
                {groupLevel !== null && (
                  <button className="absolute left-0.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-[9px] rounded-sm bg-lo-green/20 hover:bg-lo-green/40 text-lo-green-dark z-40"
                    onClick={(e) => { e.stopPropagation(); toggleGroup('row', groupLevel); }}>
                    {collapsedGroups.has(`row-${groupLevel}`) ? <Plus size={9} /> : <Minus size={9} />}
                  </button>
                )}
                <span className={groupLevel !== null ? 'ml-3' : ''}>{rowNum}</span>
                {/* Row resize handle */}
                <div
                  className="absolute bottom-0 left-0 w-full h-1.5 cursor-row-resize hover:bg-lo-green/40 z-30"
                  onMouseDown={(e) => handleRowResizeStart(rowNum, e)}
                  onTouchStart={(e) => handleRowResizeStart(rowNum, e)}
                />
              </div>
              {Array.from({ length: TOTAL_COLS }, (_, colIdx) => {
                const col = indexToCol(colIdx);
                const cellId = `${col}${rowNum}`;
                const cellData = sheetData[cellId];
                const isSelected = cellId === selectedCell;
                const inSelection = isCellInSelection(cellId);
                const merged = isMerged(cellId);
                const w = getColWidth(col);
                const isFrozenCol = colIdx < frozenCols;
                const frozenLeft = frozenColLeftOffsets[col];

                // If this cell is merged (not the master), hide it
                if (merged && merged.merged) return null;

                // Check conditional formatting
                const cf = getConditionalFormatForCell(cellId);
                const cfBg = cf?.bgColor;
                const cfColor = cf?.color;
                const cfBold = cf?.bold;

                // Check if cell is in find matches
                const isMatched = isFindMatch(cellId);
                const isCurrent = isCurrentFindMatch(cellId);

                // Check if cell has a validation error
                const hasValidationError = validationError?.cell === cellId;

                // If column is collapsed, skip
                if (isColCollapsed(colIdx)) return null;

                return (
                  <div
                    key={cellId}
                    data-cell={cellId}
                    className={`spreadsheet-cell relative ${inSelection ? 'bg-lo-selection/30' : ''} ${isMatched ? 'ring-2 ring-yellow-400' : ''} ${isCurrent ? 'ring-2 ring-yellow-500 bg-yellow-200 dark:bg-yellow-900/40' : ''} ${hasValidationError ? 'ring-2 ring-red-500' : ''}`}
                    style={{
                      width: w, minWidth: w, height: rowH,
                      fontWeight: (cfBold || cellData?.bold) ? 'bold' : 'normal',
                      fontStyle: cellData?.italic ? 'italic' : 'normal',
                      textDecoration: cellData?.underline ? 'underline' : 'none',
                      textAlign: cellData?.align || 'left',
                      backgroundColor: isFrozenRow && isFrozenCol ? 'var(--lo-header-row-frozen, #e8f5e9)' : isFrozenRow || isFrozenCol ? 'var(--lo-header-row-frozen, #e8f5e9)' : cfBg || cellData?.bg || undefined,
                      color: cfColor || cellData?.color || undefined,
                      outline: isSelected ? '2px solid #18A303' : 'none',
                      outlineOffset: '-1px',
                      zIndex: isSelected ? 5 : isFrozenRow && isFrozenCol ? 4 : isFrozenCol ? 1 : isFrozenRow ? 2 : undefined,
                      ...(isFrozenCol ? { position: 'sticky', left: headerSize + (frozenLeft || 0) } : {}),
                      ...(isFrozenRow ? { position: 'sticky', top: headerSize + (frozenTop || 0) } : {}),
                      cursor: cellData?.locked && sheetProtected ? 'not-allowed' : undefined,
                      border: cellData?.border && cellData.border !== 'none' ? cellData.border : undefined,
                    }}
                    onClick={() => handleCellClick(cellId)}
                    onDoubleClick={() => handleCellDoubleClick(cellId)}
                    onContextMenu={(e) => handleContextMenu(e, cellId)}
                  >
                    {isEditing && isSelected ? (
                      <input ref={inputRef} className="w-full h-full outline-none px-1" value={editValue}
                        onChange={(e) => useCalcStore.setState({ editValue: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.stopPropagation(); validateAndCommit(selectedCell, editValue); selectCell(`${col}${Math.min(rowNum + 1, TOTAL_ROWS)}`); }
                          if (e.key === 'Escape') { e.stopPropagation(); cancelEdit(); }
                        }}
                      />
                    ) : (
                      <span className={`${cellData?.raw?.startsWith('=') ? 'text-left' : ''} truncate block`}>{cellData?.computed || ''}</span>
                    )}

                    {/* Comment indicator (red triangle) */}
                    {cellData?.comment && !isEditing && (
                      <div
                        className="absolute top-0 right-0 w-0 h-0 border-t-[8px] border-t-red-500 border-l-[8px] border-l-transparent cursor-pointer"
                        onMouseEnter={(e) => {
                          const rect = (e.target as HTMLElement).closest('[data-cell]')?.getBoundingClientRect();
                          if (rect) setCommentTooltip({ cell: cellId, x: rect.right, y: rect.bottom });
                        }}
                        onMouseLeave={() => setCommentTooltip(null)}
                      />
                    )}

                    {/* Validation dropdown arrow */}
                    {cellData?.validation?.type === 'list' && !isEditing && (
                      <div
                        className="absolute right-1 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                        onClick={(e) => { e.stopPropagation(); const rect = (e.target as HTMLElement).closest('[data-cell]')?.getBoundingClientRect(); if (rect) setValidationDropdown({ cell: cellId, x: rect.left, y: rect.bottom, values: cellData.validation!.value.split(',').map((v) => v.trim()) }); }}
                      >
                        <ChevronDown size={12} />
                      </div>
                    )}

                    {/* Lock icon indicator */}
                    {cellData?.locked && sheetProtected && !isEditing && (
                      <div className="absolute top-0.5 left-0.5 text-[8px] text-muted-foreground/50">
                        <Lock size={8} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Comment Tooltip */}
      {commentTooltip && (
        <div className="fixed z-[60] max-w-[240px] bg-yellow-50 dark:bg-yellow-900/80 border border-yellow-300 dark:border-yellow-700 rounded-md shadow-lg p-2 text-xs"
          style={{ left: Math.min(commentTooltip.x, window.innerWidth - 260), top: commentTooltip.y + 4 }}>
          <div className="font-semibold text-yellow-800 dark:text-yellow-200 mb-0.5">Comment:</div>
          <div className="text-yellow-900 dark:text-yellow-100 whitespace-pre-wrap">{getCell(activeSheet, commentTooltip.cell).comment}</div>
        </div>
      )}

      {/* Comment Input Dialog */}
      {commentInput && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40" onClick={() => setCommentInput(null)}>
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-2xl w-[320px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">Comment for {commentInput.cell}</h3>
              <button className="text-muted-foreground hover:text-foreground" onClick={() => setCommentInput(null)}>✕</button>
            </div>
            <div className="p-3">
              <textarea className="w-full h-24 px-2 py-1.5 text-sm border border-border rounded-md bg-transparent resize-none" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Enter comment..." autoFocus />
            </div>
            <div className="flex justify-end gap-2 px-3 pb-3">
              <button className="px-3 py-1.5 text-xs border border-border rounded-md hover:bg-accent touch-target" onClick={() => { setCell(activeSheet, commentInput.cell, { comment: undefined }); setCommentInput(null); }}>Remove</button>
              <button className="px-3 py-1.5 text-xs border border-border rounded-md hover:bg-accent touch-target" onClick={() => setCommentInput(null)}>Cancel</button>
              <button className="px-3 py-1.5 text-xs bg-lo-green text-white rounded-md hover:bg-lo-green-dark touch-target" onClick={() => { setCell(activeSheet, commentInput.cell, { comment: commentText || undefined }); setCommentInput(null); }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Dropdown */}
      {validationDropdown && (
        <div className="fixed z-[60] bg-white dark:bg-zinc-800 border border-border rounded-md shadow-lg max-h-[200px] overflow-y-auto lo-scrollbar"
          style={{ left: validationDropdown.x, top: validationDropdown.y, minWidth: 120 }}>
          {validationDropdown.values.map((v, i) => (
            <button key={i} className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors touch-target"
              onClick={() => { setCell(activeSheet, validationDropdown.cell, { raw: v }); setValidationDropdown(null); }}>{v}</button>
          ))}
        </div>
      )}

      {/* Validation Error Tooltip */}
      {validationError && (
        <div className="fixed z-[60] bg-red-50 dark:bg-red-900/80 border border-red-300 dark:border-red-700 rounded-md shadow-lg p-2 text-xs text-red-700 dark:text-red-200 max-w-[240px]"
          style={{ left: validationError.x, top: validationError.y, transform: 'translate(-50%, -100%)' }}>
          <div className="font-semibold">⚠ {validationError.message}</div>
        </div>
      )}

      {ctxMenu}
    </div>
  );
}