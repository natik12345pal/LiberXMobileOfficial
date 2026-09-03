import { create } from 'zustand';

export interface CellData {
  raw: string;
  computed: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align: 'left' | 'center' | 'right';
  bg?: string;
  color?: string;
  fontSize?: number;
  numberFormat?: 'general' | 'number' | 'currency' | 'percent' | 'date';
  decimals?: number;
  border?: string;
  comment?: string;
  locked?: boolean;
  validation?: { type: 'list' | 'whole' | 'decimal' | 'textLength'; value: string; message?: string };
}

export interface ConditionalFormat {
  id: string;
  range: string;
  condition: string;
  bgColor?: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
}

type SheetData = Record<string, CellData>;

interface CalcState {
  sheets: Record<string, SheetData>;
  activeSheet: string;
  selectedCell: string;
  selectionRange: { start: string; end: string } | null;
  isEditing: boolean;
  editValue: string;
  columnWidths: Record<string, number>;
  rowHeights: Record<string, number>;
  undoStack: SheetData[];
  redoStack: SheetData[];
  frozenRows: number;
  frozenCols: number;
  _filteredRows: number[] | null;
  mergedCells: Record<string, { master: string; span: { rows: number; cols: number } }>;
  conditionalFormats: ConditionalFormat[];
  sheetProtected: boolean;
  sheetPassword: string;
  namedRanges: Record<string, string>;
  findMatches: string[];
  findMatchIndex: number;
  rowGroups: Record<string, number[]>;
  colGroups: Record<string, number[]>;
  collapsedGroups: Set<string>;

  setCell: (sheet: string, cell: string, data: Partial<CellData>) => void;
  getCell: (sheet: string, cell: string) => CellData;
  selectCell: (cell: string) => void;
  setSelectionRange: (range: { start: string; end: string } | null) => void;
  setActiveSheet: (sheet: string) => void;
  startEditing: (value?: string) => void;
  commitEdit: (value: string) => void;
  cancelEdit: () => void;
  addSheet: (name: string) => void;
  deleteSheet: (name: string) => void;
  renameSheet: (oldName: string, newName: string) => void;
  evaluateFormula: (formula: string, sheet: string) => string;
  getCellValue: (sheet: string, cell: string) => string;
  getCellNumericValue: (sheet: string, cell: string) => number;
  setColumnWidth: (col: string, width: number) => void;
  setRowHeight: (row: string, height: number) => void;
  pushUndo: () => void;
  undo: () => void;
  redo: () => void;
  sortColumn: (col: string, ascending: boolean, hasHeader: boolean) => void;
  getUsedRange: () => { startRow: number; endRow: number; startCol: number; endCol: number };
  clearCell: (cell: string) => void;
  clearRange: (start: string, end: string) => void;
  setCellFormat: (cells: string[], format: Partial<CellData>) => void;
  freezePanes: (rows: number, cols: number) => void;
  mergeCells: (range: { start: string; end: string }) => void;
  unmergeCells: (cell: string) => void;
  isMerged: (cell: string) => { merged: boolean; master: string } | null;
  addConditionalFormat: (cf: Omit<ConditionalFormat, 'id'>) => void;
  removeConditionalFormat: (id: string) => void;
  getConditionalFormatForCell: (cell: string) => ConditionalFormat | undefined;
  toggleSheetProtection: (password?: string) => void;
  setNamedRange: (name: string, range: string) => void;
  removeNamedRange: (name: string) => void;
  resolveNamedRange: (name: string) => string | null;
  autoFitColumn: (col: string) => void;
  findInSheet: (term: string, matchCase: boolean, wholeWord: boolean, allSheets: boolean) => string[];
  findNext: () => void;
  findPrev: () => void;
  replaceInCell: (cell: string, find: string, replace: string, matchCase: boolean) => void;
  replaceAllInSheet: (find: string, replace: string, matchCase: boolean, allSheets: boolean) => number;
  clearFindMatches: () => void;
  createPivotTable: (config: { dataRange: string; rowGroup: string; colGroup: string; valueCol: string; agg: 'SUM' | 'COUNT' | 'AVERAGE' }) => void;
  groupRows: (startRow: number, endRow: number) => void;
  groupCols: (startCol: number, endCol: number) => void;
  ungroupRows: (startRow: number, endRow: number) => void;
  ungroupCols: (startCol: number, endCol: number) => void;
  toggleGroup: (type: 'row' | 'col', key: string) => void;
}

const emptyCell: CellData = {
  raw: '', computed: '', bold: false, italic: false, underline: false, align: 'left', numberFormat: 'general',
};

export function colToIndex(col: string): number {
  let idx = 0;
  for (let i = 0; i < col.length; i++) idx = idx * 26 + (col.charCodeAt(i) - 64);
  return idx;
}

export function indexToCol(idx: number): string {
  let col = '';
  while (idx > 0) { idx--; col = String.fromCharCode(65 + (idx % 26)) + col; idx = Math.floor(idx / 26); }
  return col;
}

function getCellRange(range: string): string[] {
  const parts = range.split(':');
  if (parts.length !== 2) return [range];
  const sc = colToIndex(parts[0].match(/[A-Z]+/)?.[0] || 'A');
  const sr = parseInt(parts[0].match(/\d+/)?.[0] || '1');
  const ec = colToIndex(parts[1].match(/[A-Z]+/)?.[0] || 'A');
  const er = parseInt(parts[1].match(/\d+/)?.[0] || '1');
  const cells: string[] = [];
  for (let r = sr; r <= er; r++) for (let c = sc; c <= ec; c++) cells.push(`${indexToCol(c)}${r}`);
  return cells;
}

// Parse function arguments, handling nested parentheses
function parseArgs(argsStr: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of argsStr) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { args.push(current.trim()); current = ''; }
    else current += ch;
  }
  if (current.trim()) args.push(current.trim());
  return args;
}

// For IF function, split by top-level commas (respecting nested parens and quotes)
function splitIfArgs(argsStr: string): [string, string, string] {
  let depth = 0;
  let inQuote = false;
  let cond = '';
  let trueVal = '';
  let falseVal = '';
  let commaCount = 0;
  for (let i = 0; i < argsStr.length; i++) {
    const ch = argsStr[i];
    if (ch === '"' && (i === 0 || argsStr[i - 1] !== '\\')) inQuote = !inQuote;
    if (!inQuote) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) {
        commaCount++;
        if (commaCount === 1) continue;
        if (commaCount === 2) continue;
      }
    }
    if (commaCount === 0) cond += ch;
    else if (commaCount === 1) trueVal += ch;
    else falseVal += ch;
  }
  return [cond.trim(), trueVal.trim(), falseVal.trim()];
}

// Resolve a value - could be a cell ref, number, or string
function resolveValue(token: string, getVal: (sheet: string, cell: string) => string, sheet: string): string {
  const t = token.trim();
  if (t.startsWith('"') && t.endsWith('"')) return t.slice(1, -1);
  if (/^[A-Z]+\d+$/i.test(t)) return getVal(sheet, t.toUpperCase());
  if (!isNaN(Number(t)) && t !== '') return t;
  return t;
}

function resolveNum(token: string, getVal: (sheet: string, cell: string) => string, sheet: string): number {
  return parseFloat(resolveValue(token, getVal, sheet)) || 0;
}

// Resolve named ranges in an expression string
function resolveNamedRangesInExpr(expr: string, namedRanges: Record<string, string>): string {
  let result = expr;
  for (const [name, range] of Object.entries(namedRanges)) {
    // Replace named range in formula (word boundary)
    const regex = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    result = result.replace(regex, range);
  }
  return result;
}

export const useCalcStore = create<CalcState>((set, get) => ({
  sheets: {
    'Sheet1': {
      A1: { raw: 'Student Name', computed: 'Student Name', bold: true, align: 'left' },
      B1: { raw: 'Hindi', computed: 'Hindi', bold: true, align: 'center' },
      C1: { raw: 'English', computed: 'English', bold: true, align: 'center' },
      D1: { raw: 'Mathematics', computed: 'Mathematics', bold: true, align: 'center' },
      E1: { raw: 'Science', computed: 'Science', bold: true, align: 'center' },
      F1: { raw: 'Social Science', computed: 'Social Science', bold: true, align: 'center' },
      G1: { raw: 'Total', computed: 'Total', bold: true, align: 'center' },
      H1: { raw: 'Percentage', computed: 'Percentage', bold: true, align: 'center', numberFormat: 'percent', decimals: 1 },
      A2: { raw: 'Aarav Sharma', computed: 'Aarav Sharma', align: 'left' },
      B2: { raw: '85', computed: '85', align: 'center' },
      C2: { raw: '78', computed: '78', align: 'center' },
      D2: { raw: '92', computed: '92', align: 'center' },
      E2: { raw: '88', computed: '88', align: 'center' },
      F2: { raw: '76', computed: '76', align: 'center' },
      G2: { raw: '=SUM(B2:F2)', computed: '419', align: 'center' },
      H2: { raw: '=G2/500*100', computed: '83.8', align: 'center', numberFormat: 'percent', decimals: 1 },
      A3: { raw: 'Priya Patel', computed: 'Priya Patel', align: 'left' },
      B3: { raw: '90', computed: '90', align: 'center' },
      C3: { raw: '82', computed: '82', align: 'center' },
      D3: { raw: '95', computed: '95', align: 'center' },
      E3: { raw: '91', computed: '91', align: 'center' },
      F3: { raw: '84', computed: '84', align: 'center' },
      G3: { raw: '=SUM(B3:F3)', computed: '442', align: 'center' },
      H3: { raw: '=G3/500*100', computed: '88.4', align: 'center', numberFormat: 'percent', decimals: 1 },
      A4: { raw: 'Rohan Singh', computed: 'Rohan Singh', align: 'left' },
      B4: { raw: '72', computed: '72', align: 'center' },
      C4: { raw: '68', computed: '68', align: 'center' },
      D4: { raw: '80', computed: '80', align: 'center' },
      E4: { raw: '75', computed: '75', align: 'center' },
      F4: { raw: '70', computed: '70', align: 'center' },
      G4: { raw: '=SUM(B4:F4)', computed: '365', align: 'center' },
      H4: { raw: '=G4/500*100', computed: '73.0', align: 'center', numberFormat: 'percent', decimals: 1 },
      A5: { raw: 'Ananya Gupta', computed: 'Ananya Gupta', align: 'left' },
      B5: { raw: '95', computed: '95', align: 'center' },
      C5: { raw: '88', computed: '88', align: 'center' },
      D5: { raw: '98', computed: '98', align: 'center' },
      E5: { raw: '93', computed: '93', align: 'center' },
      F5: { raw: '89', computed: '89', align: 'center' },
      G5: { raw: '=SUM(B5:F5)', computed: '463', align: 'center' },
      H5: { raw: '=G5/500*100', computed: '92.6', align: 'center', numberFormat: 'percent', decimals: 1 },
      A6: { raw: 'Vikram Kumar', computed: 'Vikram Kumar', align: 'left' },
      B6: { raw: '65', computed: '65', align: 'center' },
      C6: { raw: '70', computed: '70', align: 'center' },
      D6: { raw: '78', computed: '78', align: 'center' },
      E6: { raw: '72', computed: '72', align: 'center' },
      F6: { raw: '68', computed: '68', align: 'center' },
      G6: { raw: '=SUM(B6:F6)', computed: '353', align: 'center' },
      H6: { raw: '=G6/500*100', computed: '70.6', align: 'center', numberFormat: 'percent', decimals: 1 },
    },
  },
  activeSheet: 'Sheet1',
  selectedCell: 'A1',
  selectionRange: null,
  isEditing: false,
  editValue: '',
  columnWidths: {},
  rowHeights: {},
  undoStack: [],
  redoStack: [],
  frozenRows: 0,
  frozenCols: 0,
  _filteredRows: null,
  mergedCells: {},
  conditionalFormats: [],
  sheetProtected: false,
  sheetPassword: '',
  namedRanges: {},
  findMatches: [],
  findMatchIndex: -1,
  rowGroups: {},
  colGroups: {},
  collapsedGroups: new Set(),

  setCell: (sheet, cell, data) =>
    set((s) => {
      const sheets = { ...s.sheets };
      const sheetData = { ...sheets[sheet] };
      const current = sheetData[cell] || { ...emptyCell };
      const updated = { ...current, ...data };
      if (updated.raw !== current.raw) {
        updated.computed = updated.raw.startsWith('=') ? get().evaluateFormula(updated.raw, sheet) : updated.raw;
      }
      sheetData[cell] = updated;
      sheets[sheet] = sheetData;
      return { sheets };
    }),

  getCell: (sheet, cell) => { const s = get(); return s.sheets[sheet]?.[cell] || { ...emptyCell }; },
  selectCell: (cell) => set({ selectedCell: cell, selectionRange: null }),
  setSelectionRange: (range) => set({ selectionRange: range }),
  setActiveSheet: (sheet) => set({ activeSheet: sheet, selectedCell: 'A1', findMatches: [], findMatchIndex: -1 }),

  startEditing: (value) => {
    const { selectedCell, getCell, activeSheet, sheetProtected } = get();
    if (sheetProtected) {
      const cell = getCell(activeSheet, selectedCell);
      if (cell.locked) return;
    }
    const cell = getCell(activeSheet, selectedCell);
    set({ isEditing: true, editValue: value ?? cell.raw });
  },
  commitEdit: (value) => { const { activeSheet, selectedCell, setCell } = get(); setCell(activeSheet, selectedCell, { raw: value }); set({ isEditing: false, editValue: '' }); },
  cancelEdit: () => set({ isEditing: false, editValue: '' }),

  addSheet: (name) => set((s) => ({ sheets: { ...s.sheets, [name]: {} }, activeSheet: name })),
  deleteSheet: (name) => set((s) => { const sheets = { ...s.sheets }; delete sheets[name]; return { sheets, activeSheet: Object.keys(sheets)[0] || '' }; }),
  renameSheet: (oldName, newName) => set((s) => { if (oldName === newName) return s; const sheets = { ...s.sheets }; sheets[newName] = sheets[oldName]; delete sheets[oldName]; return { sheets, activeSheet: s.activeSheet === oldName ? newName : s.activeSheet }; }),

  getCellValue: (sheet, cell) => { const s = get(); const data = s.sheets[sheet]?.[cell]; return data?.computed || ''; },
  getCellNumericValue: (sheet, cell) => { const v = get().getCellValue(sheet, cell); return parseFloat(v) || 0; },

  pushUndo: () => set((s) => ({ undoStack: [...s.undoStack.slice(-19), JSON.parse(JSON.stringify(s.sheets[s.activeSheet] || {}))], redoStack: [] })),
  undo: () => set((s) => { if (!s.undoStack.length) return s; const prev = s.undoStack[s.undoStack.length - 1]; const sheets = { ...s.sheets }; sheets[s.activeSheet] = prev; return { sheets, undoStack: s.undoStack.slice(0, -1), redoStack: [...s.redoStack, JSON.parse(JSON.stringify(s.sheets[s.activeSheet] || {}))] }; }),
  redo: () => set((s) => { if (!s.redoStack.length) return s; const next = s.redoStack[s.redoStack.length - 1]; const sheets = { ...s.sheets }; sheets[s.activeSheet] = next; return { sheets, redoStack: s.redoStack.slice(0, -1), undoStack: [...s.undoStack, JSON.parse(JSON.stringify(s.sheets[s.activeSheet] || {}))] }; }),

  clearCell: (cell) => { const { activeSheet, setCell } = get(); setCell(activeSheet, cell, { raw: '', computed: '' }); },
  clearRange: (start, end) => { const { activeSheet, setCell } = get(); getCellRange(`${start}:${end}`).forEach((c) => setCell(activeSheet, c, { raw: '', computed: '' })); },
  setCellFormat: (cells, format) => { const { activeSheet, setCell } = get(); cells.forEach((c) => setCell(activeSheet, c, format)); },
  freezePanes: (rows, cols) => set({ frozenRows: rows, frozenCols: cols }),

  sortColumn: (col, ascending, hasHeader) => {
    const { sheets, activeSheet } = get();
    const sheetData = { ...sheets[activeSheet] };
    const keys = Object.keys(sheetData).filter((k) => /^([A-Z]+)(\d+)$/i.test(k));
    if (!keys.length) return;
    const colIdx = colToIndex(col);
    let maxRow = 0, maxCol = 0;
    keys.forEach((k) => { const m = k.match(/^([A-Z]+)(\d+)$/i); if (!m) return; const r = parseInt(m[2]); const c = colToIndex(m[1]); if (r > maxRow) maxRow = r; if (c > maxCol) maxCol = c; });
    const startRow = hasHeader ? 2 : 1;
    const rows: { row: number; key: string; num: number }[] = [];
    for (let r = startRow; r <= maxRow; r++) { const v = sheetData[`${col}${r}`]?.computed || ''; rows.push({ row: r, key: v, num: parseFloat(v) || 0 }); }
    rows.sort((a, b) => { const cmp = !isNaN(Number(a.key)) && !isNaN(Number(b.key)) ? a.num - b.num : a.key.localeCompare(b.key); return ascending ? cmp : -cmp; });
    const newSheet: Record<string, CellData> = {};
    if (hasHeader) for (let c = 1; c <= maxCol; c++) { const cn = indexToCol(c); if (sheetData[`${cn}1`]) newSheet[`${cn}1`] = sheetData[`${cn}1`]; }
    rows.forEach((r, i) => { const nr = hasHeader ? i + 2 : i + 1; for (let c = 1; c <= maxCol; c++) { const cn = indexToCol(c); if (sheetData[`${cn}${r.row}`]) newSheet[`${cn}${nr}`] = sheetData[`${cn}${r.row}`]; } });
    set((s) => ({ sheets: { ...s.sheets, [activeSheet]: newSheet } }));
  },

  getUsedRange: () => {
    const { sheets, activeSheet } = get();
    const data = sheets[activeSheet] || {};
    let minR = Infinity, maxR = 0, minC = Infinity, maxC = 0;
    Object.keys(data).forEach((k) => { const m = k.match(/^([A-Z]+)(\d+)$/i); if (!m || !data[k].computed) return; const r = parseInt(m[2]), c = colToIndex(m[1]); if (r < minR) minR = r; if (r > maxR) maxR = r; if (c < minC) minC = c; if (c > maxC) maxC = c; });
    return { startRow: isFinite(minR) ? minR : 1, endRow: maxR || 1, startCol: isFinite(minC) ? minC : 1, endCol: maxC || 1 };
  },

  evaluateFormula: (formula, sheet) => {
    if (!formula.startsWith('=')) return formula;
    try {
      let expr = formula.slice(1).toUpperCase();
      // Resolve named ranges first
      expr = resolveNamedRangesInExpr(expr, get().namedRanges);
      const getVal = get().getCellValue;
      const getNum = get().getCellNumericValue;

      // ---- Helper for range functions ----
      const rangeNums = (range: string) => getCellRange(range).map((c) => getNum(sheet, c));
      const rangeVals = (range: string) => getCellRange(range).map((c) => getVal(sheet, c));

      // Match function name and extract inner args
      const fnMatch = expr.match(/^([A-Z_]+)\(([\s\S]+)\)$/);
      if (!fnMatch) {
        // Simple expression with cell refs
        const resolved = expr.replace(/([A-Z]+\d+)/g, (_, ref) => String(getNum(sheet, ref)));
        try { const r = Function(`"use strict"; return (${resolved})`)(); return typeof r === 'number' ? (Number.isInteger(r) ? String(r) : String(Math.round(r * 10000) / 10000)) : String(r ?? '#ERROR'); } catch { return '#ERROR'; }
      }

      const fn = fnMatch[1];
      const rawArgs = fnMatch[2];

      // For IF, use special splitting to handle nested IFs
      let args: string[];
      if (fn === 'IF') {
        const [c, t, f] = splitIfArgs(rawArgs);
        args = [c, t, f];
      } else {
        args = parseArgs(rawArgs);
      }

      // ---- MATH FUNCTIONS ----
      if (fn === 'SUM') { return String(Math.round(rangeNums(args[0]).reduce((a, b) => a + b, 0) * 100) / 100); }
      if (fn === 'AVERAGE' || fn === 'AVG') { const n = rangeNums(args[0]); return String(Math.round((n.reduce((a, b) => a + b, 0) / n.length) * 100) / 100); }
      if (fn === 'COUNT') { return String(rangeNums(args[0]).filter((n) => n !== 0).length); }
      if (fn === 'COUNTA') { return String(rangeVals(args[0]).filter((v) => v !== '').length); }
      if (fn === 'COUNTBLANK') { return String(rangeVals(args[0]).filter((v) => v === '').length); }
      if (fn === 'MAX') { return String(Math.max(...rangeNums(args[0]))); }
      if (fn === 'MIN') { return String(Math.min(...rangeNums(args[0]))); }
      if (fn === 'ROUND') { const n = resolveNum(args[0], getVal, sheet); const d = parseInt(args[1]) || 0; const f = 10 ** d; return String(Math.round(n * f) / f); }
      if (fn === 'ROUNDUP') { const n = resolveNum(args[0], getVal, sheet); const d = parseInt(args[1]) || 0; const f = 10 ** d; return String(Math.ceil(n * f) / f); }
      if (fn === 'ROUNDDOWN') { const n = resolveNum(args[0], getVal, sheet); const d = parseInt(args[1]) || 0; const f = 10 ** d; return String(Math.floor(n * f) / f); }
      if (fn === 'ABS') { return String(Math.abs(resolveNum(args[0], getVal, sheet))); }
      if (fn === 'SQRT') { const n = resolveNum(args[0], getVal, sheet); return n < 0 ? '#NUM!' : String(Math.round(Math.sqrt(n) * 10000) / 10000); }
      if (fn === 'POWER') { return String(Math.pow(resolveNum(args[0], getVal, sheet), resolveNum(args[1], getVal, sheet))); }
      if (fn === 'MOD') { const a = resolveNum(args[0], getVal, sheet); const b = resolveNum(args[1], getVal, sheet); return b === 0 ? '#DIV/0!' : String(a % b); }
      if (fn === 'PI') { return String(Math.PI); }
      if (fn === 'LOG') { const n = resolveNum(args[0], getVal, sheet); const base = args[1] ? resolveNum(args[1], getVal, sheet) : 10; return n <= 0 || base <= 0 || base === 1 ? '#NUM!' : String(Math.round((Math.log(n) / Math.log(base)) * 10000) / 10000); }
      if (fn === 'LN') { const n = resolveNum(args[0], getVal, sheet); return n <= 0 ? '#NUM!' : String(Math.round(Math.log(n) * 10000) / 10000); }
      if (fn === 'LOG10') { const n = resolveNum(args[0], getVal, sheet); return n <= 0 ? '#NUM!' : String(Math.round(Math.log10(n) * 10000) / 10000); }
      if (fn === 'EXP') { return String(Math.exp(resolveNum(args[0], getVal, sheet))); }
      if (fn === 'INT') { return String(Math.floor(resolveNum(args[0], getVal, sheet))); }
      if (fn === 'CEILING') { return String(Math.ceil(resolveNum(args[0], getVal, sheet))); }
      if (fn === 'FLOOR') { return String(Math.floor(resolveNum(args[0], getVal, sheet))); }
      if (fn === 'RAND') { return String(Math.random()); }
      if (fn === 'RANDBETWEEN') { const lo = resolveNum(args[0], getVal, sheet); const hi = resolveNum(args[1], getVal, sheet); return String(Math.floor(Math.random() * (hi - lo + 1)) + lo); }
      if (fn === 'FACT') { let n = Math.floor(resolveNum(args[0], getVal, sheet)); if (n < 0) return '#NUM!'; let r = 1; for (let i = 2; i <= n; i++) r *= i; return String(r); }
      if (fn === 'DEGREES') { return String(resolveNum(args[0], getVal, sheet) * 180 / Math.PI); }
      if (fn === 'RADIANS') { return String(resolveNum(args[0], getVal, sheet) * Math.PI / 180); }
      if (fn === 'SIN') { return String(Math.round(Math.sin(resolveNum(args[0], getVal, sheet)) * 10000) / 10000); }
      if (fn === 'COS') { return String(Math.round(Math.cos(resolveNum(args[0], getVal, sheet)) * 10000) / 10000); }
      if (fn === 'TAN') { return String(Math.round(Math.tan(resolveNum(args[0], getVal, sheet)) * 10000) / 10000); }

      // ---- STATISTICS ----
      if (fn === 'MEDIAN') { const n = rangeNums(args[0]).sort((a, b) => a - b); const m = Math.floor(n.length / 2); return String(n.length % 2 ? n[m] : Math.round(((n[m - 1] + n[m]) / 2) * 100) / 100); }
      if (fn === 'MODE') { const freq: Record<number, number> = {}; const n = rangeNums(args[0]); n.forEach((v) => { freq[v] = (freq[v] || 0) + 1; }); let maxF = 0, mode = n[0]; Object.entries(freq).forEach(([k, f]) => { if (f > maxF) { maxF = f; mode = Number(k); } }); return String(mode); }
      if (fn === 'STDEV' || fn === 'STDEV.S') { const n = rangeNums(args[0]); if (n.length < 2) return '#DIV/0!'; const mean = n.reduce((a, b) => a + b, 0) / n.length; return String(Math.round(Math.sqrt(n.reduce((s, v) => s + (v - mean) ** 2, 0) / (n.length - 1)) * 100) / 100); }
      if (fn === 'VAR' || fn === 'VAR.S') { const n = rangeNums(args[0]); if (n.length < 2) return '#DIV/0!'; const mean = n.reduce((a, b) => a + b, 0) / n.length; return String(Math.round(n.reduce((s, v) => s + (v - mean) ** 2, 0) / (n.length - 1) * 100) / 100); }
      if (fn === 'RANK') { const val = resolveNum(args[0], getVal, sheet); const nums = rangeNums(args[1]); const desc = (args[2] || '0') === '0'; const sorted = [...nums].sort((a, b) => desc ? b - a : a - b); return String(sorted.indexOf(val) + 1); }
      if (fn === 'PERCENTILE') { const n = resolveNum(args[0], getVal, sheet) / 100; const nums = rangeNums(args[1]).sort((a, b) => a - b); const idx = (nums.length - 1) * n; const lo = Math.floor(idx); const hi = Math.ceil(idx); return String(Math.round((nums[lo] + (nums[hi] - nums[lo]) * (idx - lo)) * 100) / 100); }
      if (fn === 'QUARTILE') { const q = resolveNum(args[0], getVal, sheet); return get().evaluateFormula(`=PERCENTILE(${(q / 4).toFixed(2)},${args[1]})`, sheet); }

      // ---- TEXT FUNCTIONS ----
      if (fn === 'CONCATENATE' || fn === 'CONCAT') { return args.map((a) => resolveValue(a, getVal, sheet)).join(''); }
      if (fn === 'LEN') { return String(resolveValue(args[0], getVal, sheet).length); }
      if (fn === 'LEFT') { const s = resolveValue(args[0], getVal, sheet); const n = parseInt(args[1]) || 1; return s.slice(0, n); }
      if (fn === 'RIGHT') { const s = resolveValue(args[0], getVal, sheet); const n = parseInt(args[1]) || 1; return s.slice(-n); }
      if (fn === 'MID') { const s = resolveValue(args[0], getVal, sheet); const start = parseInt(args[1]) || 1; const len = parseInt(args[2]) || 1; return s.slice(start - 1, start - 1 + len); }
      if (fn === 'UPPER') { return resolveValue(args[0], getVal, sheet).toUpperCase(); }
      if (fn === 'LOWER') { return resolveValue(args[0], getVal, sheet).toLowerCase(); }
      if (fn === 'PROPER') { return resolveValue(args[0], getVal, sheet).replace(/\b\w/g, (c) => c.toUpperCase()); }
      if (fn === 'TRIM') { return resolveValue(args[0], getVal, sheet).trim().replace(/\s+/g, ' '); }
      if (fn === 'SUBSTITUTE') { const s = resolveValue(args[0], getVal, sheet); const old = resolveValue(args[1], getVal, sheet); const nw = resolveValue(args[2], getVal, sheet); return s.split(old).join(nw); }
      if (fn === 'REPT') { return resolveValue(args[0], getVal, sheet).repeat(Math.max(0, parseInt(args[1]) || 0)); }
      if (fn === 'TEXT') {
        const n = resolveNum(args[0], getVal, sheet);
        const fmt = resolveValue(args[1], getVal, sheet).toLowerCase();
        if (fmt.includes('0%')) return String(Math.round(n * 100) / 100) + '%';
        if (fmt.includes('#,##0')) return n.toLocaleString('en-IN');
        if (fmt.includes('yyyy-mm-dd') || fmt.includes('yyyy/mm/dd')) {
          const d = new Date(n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
        if (fmt.includes('dd/mm/yyyy') || fmt.includes('dd-mm-yyyy')) {
          const d = new Date(n); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        }
        if (fmt.includes('mm/dd/yyyy') || fmt.includes('mm-dd-yyyy')) {
          const d = new Date(n); return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
        }
        if (fmt.includes('hh:mm') || fmt.includes('hh:mm:ss')) {
          const d = new Date(n);
          const hh = String(d.getHours()).padStart(2, '0');
          const mm = String(d.getMinutes()).padStart(2, '0');
          const ss = String(d.getSeconds()).padStart(2, '0');
          return fmt.includes('ss') ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`;
        }
        return String(n);
      }
      if (fn === 'VALUE') { return String(parseFloat(resolveValue(args[0], getVal, sheet)) || 0); }
      if (fn === 'EXACT') { return resolveValue(args[0], getVal, sheet) === resolveValue(args[1], getVal, sheet) ? 'TRUE' : 'FALSE'; }
      if (fn === 'FIND' || fn === 'SEARCH') { const needle = resolveValue(args[0], getVal, sheet); const haystack = resolveValue(args[1], getVal, sheet); const start = parseInt(args[2]) || 1; const idx = haystack.toLowerCase().indexOf(needle.toLowerCase(), start - 1); return idx === -1 ? '#VALUE!' : String(idx + 1); }

      // ---- LOGICAL ----
      if (fn === 'IF') {
        const cond = args[0].replace(/>=/g, '>=').replace(/<=/g, '<=').replace(/<>/g, '!=').replace(/([A-Z]+\d+)/g, (_, ref) => String(getNum(sheet, ref)));
        try {
          const r = Function(`"use strict"; return (${cond})`)();
          const trueResult = args[1] ? resolveValue(args[1], getVal, sheet) : 'TRUE';
          const falseResult = args[2] ? resolveValue(args[2], getVal, sheet) : 'FALSE';
          // If the result looks like a formula, evaluate it (for nested IFs)
          const chosen = r ? trueResult : falseResult;
          if (chosen.startsWith('=')) return get().evaluateFormula(chosen, sheet);
          // If chosen is a function call (e.g., IF(...)), evaluate as formula
          if (/^[A-Z]+\(/i.test(chosen)) return get().evaluateFormula(`=${chosen}`, sheet);
          return chosen;
        } catch { return '#ERROR'; }
      }
      if (fn === 'AND') { return args.map((a) => { try { return !!Function(`"use strict"; return (${a.replace(/([A-Z]+\d+)/g, (_, r) => String(getNum(sheet, r)))})`)(); } catch { return false; } }).every(Boolean) ? 'TRUE' : 'FALSE'; }
      if (fn === 'OR') { return args.map((a) => { try { return !!Function(`"use strict"; return (${a.replace(/([A-Z]+\d+)/g, (_, r) => String(getNum(sheet, r)))})`)(); } catch { return false; } }).some(Boolean) ? 'TRUE' : 'FALSE'; }
      if (fn === 'NOT') { const v = resolveValue(args[0], getVal, sheet); return v === 'TRUE' ? 'FALSE' : 'TRUE'; }
      if (fn === 'IFERROR') { const val = get().evaluateFormula(`=${args[0]}`, sheet); return val.startsWith('#') ? resolveValue(args[1], getVal, sheet) : val; }
      if (fn === 'ISBLANK') { const v = getVal(sheet, args[0].toUpperCase()); return v === '' ? 'TRUE' : 'FALSE'; }
      if (fn === 'ISNUMBER') { return !isNaN(Number(resolveValue(args[0], getVal, sheet))) ? 'TRUE' : 'FALSE'; }
      if (fn === 'ISTEXT') { return isNaN(Number(resolveValue(args[0], getVal, sheet))) && resolveValue(args[0], getVal, sheet) !== '' ? 'TRUE' : 'FALSE'; }

      // ---- CONDITIONAL AGGREGATE ----
      if (fn === 'SUMIF') { const range = getCellRange(args[0]); const cond = args[1]; const sumRange = args[2] ? getCellRange(args[2]) : range; return String(Math.round(range.reduce((sum, c, i) => { const v = getVal(sheet, c); if (matchesCondition(v, cond)) sum += getNum(sheet, sumRange[i] || c); return sum; }, 0) * 100) / 100); }
      if (fn === 'COUNTIF') { const range = getCellRange(args[0]); const cond = args[1]; return String(range.filter((c) => matchesCondition(getVal(sheet, c), cond)).length); }
      if (fn === 'AVERAGEIF') { const range = getCellRange(args[0]); const cond = args[1]; const avgRange = args[2] ? getCellRange(args[2]) : range; const filtered = range.reduce((acc, c, i) => { if (matchesCondition(getVal(sheet, c), cond)) { acc.sum += getNum(sheet, avgRange[i] || c); acc.count++; } return acc; }, { sum: 0, count: 0 }); return filtered.count === 0 ? '#DIV/0!' : String(Math.round((filtered.sum / filtered.count) * 100) / 100); }

      // ---- DATE ----
      if (fn === 'TODAY') { return new Date().toLocaleDateString('en-IN'); }
      if (fn === 'NOW') { return new Date().toLocaleString('en-IN'); }
      if (fn === 'DATE') { const y = parseInt(args[0]) || 2026; const m = parseInt(args[1]) || 1; const d = parseInt(args[2]) || 1; return new Date(y, m - 1, d).toLocaleDateString('en-IN'); }
      if (fn === 'DAY') { const v = resolveValue(args[0], getVal, sheet); return String(new Date(v).getDate()); }
      if (fn === 'MONTH') { const v = resolveValue(args[0], getVal, sheet); return String(new Date(v).getMonth() + 1); }
      if (fn === 'YEAR') { const v = resolveValue(args[0], getVal, sheet); return String(new Date(v).getFullYear()); }
      if (fn === 'TIME') { const h = parseInt(args[0]) || 0; const m = parseInt(args[1]) || 0; const s = parseInt(args[2]) || 0; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; }
      if (fn === 'HOUR') { const v = resolveValue(args[0], getVal, sheet); const d = new Date(v); return isNaN(d.getTime()) ? '#VALUE!' : String(d.getHours()); }
      if (fn === 'MINUTE') { const v = resolveValue(args[0], getVal, sheet); const d = new Date(v); return isNaN(d.getTime()) ? '#VALUE!' : String(d.getMinutes()); }
      if (fn === 'SECOND') { const v = resolveValue(args[0], getVal, sheet); const d = new Date(v); return isNaN(d.getTime()) ? '#VALUE!' : String(d.getSeconds()); }
      if (fn === 'DATEDIF') {
        const startStr = resolveValue(args[0], getVal, sheet);
        const endStr = resolveValue(args[1], getVal, sheet);
        const unit = resolveValue(args[2], getVal, sheet).toUpperCase();
        const startDate = new Date(startStr);
        const endDate = new Date(endStr);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '#VALUE!';
        if (unit === 'Y') { let years = endDate.getFullYear() - startDate.getFullYear(); if (endDate.getMonth() < startDate.getMonth() || (endDate.getMonth() === startDate.getMonth() && endDate.getDate() < startDate.getDate())) years--; return String(years); }
        if (unit === 'M') { let months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()); if (endDate.getDate() < startDate.getDate()) months--; return String(months); }
        if (unit === 'D') { const diff = Math.abs(endDate.getTime() - startDate.getTime()); return String(Math.round(diff / (1000 * 60 * 60 * 24))); }
        return '#VALUE!';
      }
      if (fn === 'NETWORKDAYS') {
        const startStr = resolveValue(args[0], getVal, sheet);
        const endStr = resolveValue(args[1], getVal, sheet);
        const startDate = new Date(startStr);
        const endDate = new Date(endStr);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '#VALUE!';
        let count = 0;
        const current = new Date(startDate);
        while (current <= endDate) {
          const day = current.getDay();
          if (day !== 0 && day !== 6) count++;
          current.setDate(current.getDate() + 1);
        }
        return String(count);
      }

      // ---- LOOKUP ----
      if (fn === 'VLOOKUP') {
        const val = resolveValue(args[0], getVal, sheet);
        const range = getCellRange(args[1]);
        const colIdx = parseInt(args[2]) || 1;
        const rowLen = (colToIndex(args[1].match(/:([A-Z]+)/)?.[1] || 'A') - colToIndex(args[1].match(/^([A-Z]+)/)?.[1] || 'A')) + 1;
        for (let i = 0; i < range.length; i += rowLen) {
          if (getVal(sheet, range[i]).toLowerCase() === val.toLowerCase()) {
            const targetCell = range[i + colIdx - 1];
            return targetCell ? getVal(sheet, targetCell) : '#N/A';
          }
        }
        return '#N/A';
      }
      if (fn === 'HLOOKUP') {
        const val = resolveValue(args[0], getVal, sheet);
        const range = getCellRange(args[1]);
        const rowIdx = parseInt(args[2]) || 1;
        const colLen = parseInt(args[1].match(/:\d+/)?.[0] || '1');
        for (let i = 0; i < range.length; i++) {
          if (getVal(sheet, range[i]).toLowerCase() === val.toLowerCase()) {
            const targetCell = range[i + (rowIdx - 1) * colLen];
            return targetCell ? getVal(sheet, targetCell) : '#N/A';
          }
        }
        return '#N/A';
      }
      if (fn === 'INDEX') { const range = getCellRange(args[0]); const row = parseInt(args[1]) || 1; const col = args[2] ? parseInt(args[2]) : 1; const endC = colToIndex(args[0].match(/:([A-Z]+)/)?.[1] || 'A') - colToIndex(args[0].match(/^([A-Z]+)/)?.[1] || 'A') + 1; return getVal(sheet, range[(row - 1) * endC + col - 1] || ''); }
      if (fn === 'MATCH') { const val = resolveValue(args[0], getVal, sheet); const range = getCellRange(args[1]); const idx = range.findIndex((c) => getVal(sheet, c).toLowerCase() === val.toLowerCase()); return idx === -1 ? '#N/A' : String(idx + 1); }

      // ---- REFERENCE ----
      if (fn === 'COLUMN') { const c = args[0]?.toUpperCase() || get().selectedCell; return String(colToIndex(c.match(/[A-Z]+/)?.[0] || 'A')); }
      if (fn === 'ROW') { const c = args[0]?.toUpperCase() || get().selectedCell; return String(parseInt(c.match(/\d+/)?.[0] || '1')); }
      if (fn === 'COLUMNS') { const r = getCellRange(args[0]); const s = r[0]?.match(/[A-Z]+/)?.[0] || 'A'; const e = r[r.length - 1]?.match(/[A-Z]+/)?.[0] || 'A'; return String(colToIndex(e) - colToIndex(s) + 1); }
      if (fn === 'ROWS') { const r = getCellRange(args[0]); const s = parseInt(r[0]?.match(/\d+/)?.[0] || '1'); const e = parseInt(r[r.length - 1]?.match(/\d+/)?.[0] || '1'); return String(e - s + 1); }
      if (fn === 'ADDRESS') { const r = parseInt(args[0]) || 1; const c = parseInt(args[1]) || 1; return `${indexToCol(c)}${r}`; }
      if (fn === 'INDIRECT') { return getVal(sheet, resolveValue(args[0], getVal, sheet).toUpperCase()); }

      // Fallback: try simple expression eval with cell refs
      const resolved = fnMatch[2].replace(/([A-Z]+\d+)/g, (_, ref) => String(getNum(sheet, ref)));
      try { const r = Function(`"use strict"; return (${resolved})`)(); return typeof r === 'number' ? (Number.isInteger(r) ? String(r) : String(Math.round(r * 10000) / 10000)) : String(r ?? '#ERROR'); } catch { return '#ERROR'; }
    } catch { return '#ERROR'; }
  },

  setColumnWidth: (col, width) => set((s) => ({ columnWidths: { ...s.columnWidths, [col]: width } })),
  setRowHeight: (row, height) => set((s) => ({ rowHeights: { ...s.rowHeights, [row]: height } })),

  mergeCells: (range) => {
    const { activeSheet } = get();
    const parts = { start: range.start.match(/([A-Z]+)(\d+)/), end: range.end.match(/([A-Z]+)(\d+)/) };
    if (!parts.start || !parts.end) return;
    const sc = colToIndex(parts.start[1]), sr = parseInt(parts.start[2]);
    const ec = colToIndex(parts.end[1]), er = parseInt(parts.end[2]);
    const newMerged = { ...get().mergedCells };
    for (let r = sr; r <= er; r++) {
      for (let c = sc; c <= ec; c++) {
        const cellId = `${indexToCol(c)}${r}`;
        newMerged[cellId] = { master: range.start, span: { rows: er - sr + 1, cols: ec - sc + 1 } };
      }
    }
    set({ mergedCells: newMerged });
  },

  unmergeCells: (cell) => {
    const merged = { ...get().mergedCells };
    const info = merged[cell];
    if (!info) return;
    const master = info.master;
    Object.keys(merged).forEach((k) => {
      if (merged[k].master === master) delete merged[k];
    });
    set({ mergedCells: merged });
  },

  isMerged: (cell) => {
    const info = get().mergedCells[cell];
    if (!info) return null;
    return { merged: cell !== info.master, master: info.master };
  },

  // ---- Conditional Formatting ----
  addConditionalFormat: (cf) => set((s) => ({ conditionalFormats: [...s.conditionalFormats, { ...cf, id: `cf-${Date.now()}` }] })),
  removeConditionalFormat: (id) => set((s) => ({ conditionalFormats: s.conditionalFormats.filter((f) => f.id !== id) })),
  getConditionalFormatForCell: (cell) => {
    const { conditionalFormats, activeSheet } = get();
    for (const cf of conditionalFormats) {
      if (cf.range.split(',').some((r) => r.trim() === activeSheet || r.trim() === '')) {
        // Check if cell is in the range
        const rangePart = cf.range.replace(/^.*:/, '').includes(':') ? cf.range : cf.range;
        const cells = getCellRange(rangePart);
        if (cells.includes(cell)) {
          const val = get().getCellValue(activeSheet, cell);
          if (evalCondFormat(val, cf.condition)) return cf;
        }
      } else {
        const cells = getCellRange(cf.range);
        if (cells.includes(cell)) {
          const val = get().getCellValue(activeSheet, cell);
          if (evalCondFormat(val, cf.condition)) return cf;
        }
      }
    }
    return undefined;
  },

  // ---- Sheet Protection ----
  toggleSheetProtection: (password) => set((s) => ({ sheetProtected: !s.sheetProtected, sheetPassword: password || '' })),

  // ---- Named Ranges ----
  setNamedRange: (name, range) => set((s) => ({ namedRanges: { ...s.namedRanges, [name.toUpperCase()]: range.toUpperCase() } })),
  removeNamedRange: (name) => set((s) => { const nr = { ...s.namedRanges }; delete nr[name.toUpperCase()]; return { namedRanges: nr }; }),
  resolveNamedRange: (name) => get().namedRanges[name.toUpperCase()] || null,

  // ---- Column Auto-fit ----
  autoFitColumn: (col) => {
    const { sheets, activeSheet, columnWidths } = get();
    const sheetData = sheets[activeSheet] || {};
    let maxWidth = 60; // minimum width
    for (let r = 1; r <= 50; r++) {
      const cell = sheetData[`${col}${r}`];
      if (cell) {
        const text = cell.computed || cell.raw || '';
        const charWidth = cell.bold ? 9 : 8;
        const estWidth = text.length * charWidth + 16; // padding
        if (estWidth > maxWidth) maxWidth = estWidth;
      }
    }
    set({ columnWidths: { ...columnWidths, [col]: Math.min(maxWidth, 400) } });
  },

  // ---- Find & Replace ----
  findInSheet: (term, matchCase, wholeWord, allSheets) => {
    const { sheets, activeSheet } = get();
    const results: string[] = [];
    const sheetsToSearch = allSheets ? Object.keys(sheets) : [activeSheet];
    for (const sName of sheetsToSearch) {
      const data = sheets[sName] || {};
      for (const [cellId, cellData] of Object.entries(data)) {
        const raw = matchCase ? cellData.raw : cellData.raw.toLowerCase();
        const search = matchCase ? term : term.toLowerCase();
        if (!raw) continue;
        if (wholeWord) {
          const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, matchCase ? '' : 'i');
          if (regex.test(cellData.raw)) results.push(cellId);
        } else {
          if (raw.includes(search)) results.push(cellId);
        }
      }
    }
    set({ findMatches: results, findMatchIndex: results.length > 0 ? 0 : -1 });
    if (results.length > 0) {
      const firstCell = results[0];
      const targetSheet = allSheets ? Object.keys(sheets).find((s) => sheets[s][firstCell]) || activeSheet : activeSheet;
      if (targetSheet !== activeSheet) get().setActiveSheet(targetSheet);
      get().selectCell(firstCell);
    }
    return results;
  },

  findNext: () => {
    const { findMatches, findMatchIndex } = get();
    if (findMatches.length === 0) return;
    const nextIdx = findMatchIndex + 1 >= findMatches.length ? 0 : findMatchIndex + 1;
    set({ findMatchIndex: nextIdx });
    get().selectCell(findMatches[nextIdx]);
  },

  findPrev: () => {
    const { findMatches, findMatchIndex } = get();
    if (findMatches.length === 0) return;
    const prevIdx = findMatchIndex - 1 < 0 ? findMatches.length - 1 : findMatchIndex - 1;
    set({ findMatchIndex: prevIdx });
    get().selectCell(findMatches[prevIdx]);
  },

  replaceInCell: (cell, find, replace, matchCase) => {
    const { activeSheet, getCell, setCell } = get();
    const cellData = getCell(activeSheet, cell);
    const raw = cellData.raw;
    const flags = matchCase ? 'g' : 'gi';
    const escapedFind = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const newRaw = raw.replace(new RegExp(escapedFind, flags), replace);
    if (newRaw !== raw) {
      setCell(activeSheet, cell, { raw: newRaw });
      return true;
    }
    return false;
  },

  replaceAllInSheet: (find, replace, matchCase, allSheets) => {
    const { sheets, activeSheet } = get();
    const sheetsToSearch = allSheets ? Object.keys(sheets) : [activeSheet];
    let count = 0;
    for (const sName of sheetsToSearch) {
      const data = sheets[sName] || {};
      for (const [cellId, cellData] of Object.entries(data)) {
        const raw = cellData.raw;
        if (!raw) continue;
        const flags = matchCase ? 'g' : 'gi';
        const escapedFind = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const newRaw = raw.replace(new RegExp(escapedFind, flags), replace);
        if (newRaw !== raw) {
          get().setCell(sName, cellId, { raw: newRaw });
          count++;
        }
      }
    }
    // Refresh find matches after replace
    get().findInSheet(find, matchCase, false, allSheets);
    return count;
  },

  clearFindMatches: () => set({ findMatches: [], findMatchIndex: -1 }),

  // ---- Pivot Table ----
  createPivotTable: (config) => {
    const { sheets, activeSheet } = get();
    const dataSheet = sheets[activeSheet] || {};
    const rangeCells = getCellRange(config.dataRange);
    if (rangeCells.length === 0) return;

    // Get header row
    const startCell = rangeCells[0];
    const startRow = parseInt(startCell.match(/\d+/)?.[0] || '1');
    const endCell = rangeCells[rangeCells.length - 1];
    const endRow = parseInt(endCell.match(/\d+/)?.[0] || '1');
    const startColIdx = colToIndex(startCell.match(/[A-Z]+/)?.[0] || 'A');
    const endColIdx = colToIndex(endCell.match(/[A-Z]+/)?.[0] || 'A');

    // Get headers
    const headers: string[] = [];
    for (let c = startColIdx; c <= endColIdx; c++) {
      const cellRef = `${indexToCol(c)}${startRow}`;
      headers.push(dataSheet[cellRef]?.computed || indexToCol(c));
    }

    // Find column indices
    const rowGroupIdx = headers.findIndex((h) => h.toLowerCase() === config.rowGroup.toLowerCase());
    const colGroupIdx = headers.findIndex((h) => h.toLowerCase() === config.colGroup.toLowerCase());
    const valueColIdx = headers.findIndex((h) => h.toLowerCase() === config.valueCol.toLowerCase());
    if (rowGroupIdx === -1 || valueColIdx === -1) return;

    // Collect data
    const dataRows: { rowGroup: string; colGroup: string; value: number }[] = [];
    for (let r = startRow + 1; r <= endRow; r++) {
      const rowGroupCell = `${indexToCol(rowGroupIdx + startColIdx)}${r}`;
      const colGroupCell = colGroupIdx >= 0 ? `${indexToCol(colGroupIdx + startColIdx)}${r}` : '';
      const valueCell = `${indexToCol(valueColIdx + startColIdx)}${r}`;
      const rg = dataSheet[rowGroupCell]?.computed || '';
      const cg = colGroupIdx >= 0 ? (dataSheet[colGroupCell]?.computed || '') : '(All)';
      const v = parseFloat(dataSheet[valueCell]?.computed || '') || 0;
      dataRows.push({ rowGroup: rg, colGroup: cg, value: v });
    }

    // Aggregate
    const rowGroups = [...new Set(dataRows.map((d) => d.rowGroup))];
    const colGroups = [...new Set(dataRows.map((d) => d.colGroup))];
    const pivot: Record<string, Record<string, number[]>> = {};
    for (const d of dataRows) {
      if (!pivot[d.rowGroup]) pivot[d.rowGroup] = {};
      if (!pivot[d.rowGroup][d.colGroup]) pivot[d.rowGroup][d.colGroup] = [];
      pivot[d.rowGroup][d.colGroup].push(d.value);
    }

    const aggregate = (vals: number[]) => {
      if (config.agg === 'COUNT') return String(vals.length);
      if (config.agg === 'AVERAGE') return vals.length ? String(Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100) : '0';
      return String(Math.round(vals.reduce((a, b) => a + b, 0) * 100) / 100);
    };

    // Build pivot sheet data
    const pivotSheetData: Record<string, CellData> = {};
    const pivotRow = 1;
    const pivotStartCol = 2; // B
    // Title
    pivotSheetData['A1'] = { raw: 'Pivot Table', computed: 'Pivot Table', bold: true, align: 'left', fontSize: 14 };
    // Row group header
    pivotSheetData['A2'] = { raw: config.rowGroup, computed: config.rowGroup, bold: true, align: 'center' };
    // Column group headers
    colGroups.forEach((cg, i) => {
      const col = indexToCol(pivotStartCol + i);
      pivotSheetData[`${col}2`] = { raw: cg, computed: cg, bold: true, align: 'center' };
    });
    // Total column header
    const totalCol = indexToCol(pivotStartCol + colGroups.length);
    pivotSheetData[`${totalCol}2`] = { raw: 'Total', computed: 'Total', bold: true, align: 'center' };

    // Data rows
    rowGroups.forEach((rg, ri) => {
      const rowNum = ri + 3;
      pivotSheetData[`A${rowNum}`] = { raw: rg, computed: rg, bold: false, align: 'left' };
      colGroups.forEach((cg, ci) => {
        const col = indexToCol(pivotStartCol + ci);
        const vals = pivot[rg]?.[cg] || [];
        pivotSheetData[`${col}${rowNum}`] = { raw: '', computed: aggregate(vals), align: 'right' };
      });
      // Row total
      const rowVals = colGroups.flatMap((cg) => pivot[rg]?.[cg] || []);
      pivotSheetData[`${totalCol}${rowNum}`] = { raw: '', computed: aggregate(rowVals), bold: true, align: 'right' };
    });

    // Add pivot sheet
    const newSheets = { ...sheets, 'PivotTable': pivotSheetData };
    set({ sheets: newSheets, activeSheet: 'PivotTable', selectedCell: 'A1' });
  },

  // ---- Group/Outline ----
  groupRows: (startRow, endRow) => {
    const { rowGroups } = get();
    const rows = Array.from({ length: endRow - startRow + 1 }, (_, i) => startRow + i);
    const levelKey = String(startRow);
    set({ rowGroups: { ...rowGroups, [levelKey]: rows } });
  },

  groupCols: (startCol, endCol) => {
    const { colGroups } = get();
    const cols = Array.from({ length: endCol - startCol + 1 }, (_, i) => startCol + i);
    const levelKey = String(startCol);
    set({ colGroups: { ...colGroups, [levelKey]: cols } });
  },

  ungroupRows: (startRow, endRow) => {
    const { rowGroups } = get();
    const newGroups = { ...rowGroups };
    const rows = Array.from({ length: endRow - startRow + 1 }, (_, i) => startRow + i);
    for (const [key, groupRows] of Object.entries(newGroups)) {
      if (groupRows[0] === startRow && groupRows[groupRows.length - 1] === endRow) {
        delete newGroups[key];
        break;
      }
    }
    set({ rowGroups: newGroups });
  },

  ungroupCols: (startCol, endCol) => {
    const { colGroups } = get();
    const newGroups = { ...colGroups };
    for (const [key, groupCols] of Object.entries(newGroups)) {
      if (groupCols[0] === startCol && groupCols[groupCols.length - 1] === endCol) {
        delete newGroups[key];
        break;
      }
    }
    set({ colGroups: newGroups });
  },

  toggleGroup: (type, key) => {
    const { collapsedGroups } = get();
    const fullKey = `${type}-${key}`;
    const newSet = new Set(collapsedGroups);
    if (newSet.has(fullKey)) newSet.delete(fullKey);
    else newSet.add(fullKey);
    set({ collapsedGroups: newSet });
  },
}));

function matchesCondition(value: string, condition: string): boolean {
  const v = value.trim();
  const c = condition.trim();
  if (c.startsWith('>') && !c.startsWith('>=')) return parseFloat(v) > parseFloat(c.slice(1));
  if (c.startsWith('>=')) return parseFloat(v) >= parseFloat(c.slice(2));
  if (c.startsWith('<') && !c.startsWith('<=') && !c.startsWith('<>')) return parseFloat(v) < parseFloat(c.slice(1));
  if (c.startsWith('<=')) return parseFloat(v) <= parseFloat(c.slice(2));
  if (c.startsWith('<>')) return v !== c.slice(2).replace(/^"|"$/g, '');
  if (c.startsWith('=')) return v === c.slice(1).replace(/^"|"$/g, '');
  // String comparison (case-insensitive)
  return v.toLowerCase() === c.replace(/^"|"$/g, '').toLowerCase();
}

function evalCondFormat(value: string, condition: string): boolean {
  const v = value.trim();
  const c = condition.trim();
  const num = parseFloat(v);

  if (c.startsWith('text contains') || c.startsWith('TEXT CONTAINS')) {
    const search = c.replace(/^text contains\s*/i, '').replace(/^"|"$/g, '').trim();
    return v.toLowerCase().includes(search.toLowerCase());
  }
  if (c.startsWith('between') || c.startsWith('BETWEEN')) {
    const parts = c.replace(/^between\s*/i, '').split(/\s+and\s+/i);
    if (parts.length === 2) {
      const lo = parseFloat(parts[0]);
      const hi = parseFloat(parts[1]);
      return !isNaN(num) && num >= lo && num <= hi;
    }
    return false;
  }
  if (c.startsWith('>=')) return num >= parseFloat(c.slice(2));
  if (c.startsWith('>')) return num > parseFloat(c.slice(1));
  if (c.startsWith('<=')) return num <= parseFloat(c.slice(2));
  if (c.startsWith('<>')) return v !== c.slice(2).replace(/^"|"$/g, '');
  if (c.startsWith('<')) return num < parseFloat(c.slice(1));
  if (c.startsWith('==')) return v === c.slice(2).replace(/^"|"$/g, '');
  if (c.startsWith('!=')) return v !== c.slice(2).replace(/^"|"$/g, '');
  if (c.startsWith('=')) return v === c.slice(1).replace(/^"|"$/g, '');
  return v.toLowerCase() === c.replace(/^"|"$/g, '').toLowerCase();
}
