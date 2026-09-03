'use client';

import React, { useMemo, useState } from 'react';
import { BarChart3, PieChart as PieIcon, TrendingUp, X } from 'lucide-react';
import { useCalcStore } from '@/stores/calc-store';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#18A303', '#2196F3', '#FF5722', '#FF9800', '#9C27B0', '#00BCD4', '#795548', '#607D8B', '#E91E63', '#3F51B5'];

type ChartType = 'bar' | 'pie' | 'line';

interface Props {
  onClose: () => void;
}

export default function CalcChartDialog({ onClose }: Props) {
  const { sheets, activeSheet } = useCalcStore();
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [dataRange, setDataRange] = useState('A1:B6');
  const [title, setTitle] = useState('Chart');

  const chartData = useMemo(() => {
    const sheetData = sheets[activeSheet] || {};
    const cells = getCellRange(dataRange.toUpperCase());
    if (cells.length < 2) return [];

    // First row = labels, first col = series names or categories
    const headers = cells.slice(0, 1).map((c) => sheetData[c]?.computed || c);
    const rows = cells.slice(1);

    if (rows.length === 0) return [];

    // Check if multi-column data
    const firstRowCol = cells[0].match(/[A-Z]+/)?.[0] || 'A';
    const lastRowCol = cells[0].match(/[A-Z]+/)?.[0] || 'A';
    const isMultiCol = cells.some((c) => c.match(/[A-Z]+/)?.[0] !== firstRowCol);

    if (isMultiCol && headers.length > 1) {
      // Multi-series: first col = labels, rest = data series
      const labels: string[] = [];
      const series: Record<string, number[]> = {};
      headers.slice(1).forEach((h) => { series[h] = []; });

      rows.forEach((cellId) => {
        const row = parseInt(cellId.match(/\d+/)?.[0] || '1');
        const label = sheetData[`${firstRowCol}${row}`]?.computed || `${firstRowCol}${row}`;
        labels.push(label);

        headers.slice(1).forEach((h, idx) => {
          const col = cells[0].match(/[A-Z]+/)?.[0];
          if (!col) return;
          const colIdx = col.charCodeAt(0) - 65 + idx + 1;
          const cellKey = `${String.fromCharCode(64 + colIdx)}${row}`;
          series[h].push(parseFloat(sheetData[cellKey]?.computed || '0'));
        });
      });

      return labels.map((label, i) => {
        const item: Record<string, any> = { name: label };
        Object.entries(series).forEach(([key, vals]) => { item[key] = vals[i] || 0; });
        return item;
      });
    }

    // Simple two-column: labels + values
    return rows.map((cellId) => {
      const row = parseInt(cellId.match(/\d+/)?.[0] || '1');
      const col = cellId.match(/[A-Z]+/)?.[0] || 'B';
      const nextCol = String.fromCharCode(col.charCodeAt(0) - 1);
      return {
        name: sheetData[`${nextCol}${row}`]?.computed || `${nextCol}${row}`,
        value: parseFloat(sheetData[`${col}${row}`]?.computed || '0'),
      };
    });
  }, [sheets, activeSheet, dataRange]);

  if (chartData.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-2xl w-[500px] p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Insert Chart</h2>
            <button className="lo-toolbar-btn w-7 h-7" onClick={onClose}><X size={14} /></button>
          </div>
          <p className="text-sm text-muted-foreground">Select a valid data range with at least 2 rows and 2 columns (e.g., A1:B6).</p>
          <div className="mt-4">
            <label className="text-sm font-medium">Data Range:</label>
            <input
              className="w-full mt-1 h-9 px-3 text-sm border border-border rounded-md bg-transparent outline-none focus:ring-1 focus:ring-primary font-mono"
              value={dataRange}
              onChange={(e) => setDataRange(e.target.value)}
              placeholder="e.g. A1:B6"
            />
          </div>
        </div>
      </div>
    );
  }

  const renderChart = () => {
    if (chartType === 'bar') {
      const keys = Object.keys(chartData[0]).filter((k) => k !== 'name');
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            {keys.map((key, i) => (
              <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }
    if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    // line
    const keys = Object.keys(chartData[0]).filter((k) => k !== 'name');
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          {keys.map((key, i) => (
            <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={2} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const handleSave = () => {
    const svg = document.querySelector('.recharts-wrapper svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-2xl w-[600px] max-w-[94vw] max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-semibold">Insert Chart</h2>
          <button className="lo-toolbar-btn w-7 h-7" onClick={onClose}><X size={14} /></button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border flex-wrap">
          <div className="flex gap-1">
            <button className={`lo-toolbar-btn !w-auto px-2 text-xs ${chartType === 'bar' ? 'lo-toolbar-btn-active' : ''}`} onClick={() => setChartType('bar')}><BarChart3 size={14} /> Bar</button>
            <button className={`lo-toolbar-btn !w-auto px-2 text-xs ${chartType === 'pie' ? 'lo-toolbar-btn-active' : ''}`} onClick={() => setChartType('pie')}><PieIcon size={14} /> Pie</button>
            <button className={`lo-toolbar-btn !w-auto px-2 text-xs ${chartType === 'line' ? 'lo-toolbar-btn-active' : ''}`} onClick={() => setChartType('line')}><TrendingUp size={14} /> Line</button>
          </div>
          <div className="flex items-center gap-1 flex-1 min-w-[150px]">
            <label className="text-xs text-muted-foreground">Range:</label>
            <input className="h-7 px-2 text-xs border border-border rounded font-mono flex-1 bg-transparent outline-none" value={dataRange} onChange={(e) => setDataRange(e.target.value)} />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-xs text-muted-foreground">Title:</label>
            <input className="h-7 px-2 text-xs border border-border rounded flex-1 bg-transparent outline-none" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
        </div>

        {/* Chart Title */}
        {title && <div className="text-center text-sm font-semibold pt-3">{title}</div>}

        {/* Chart */}
        <div className="flex-1 p-4 overflow-auto">
          {renderChart()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border">
          <button className="h-8 px-4 text-xs border border-border rounded-md hover:bg-accent" onClick={onClose}>Cancel</button>
          <button className="h-8 px-4 text-xs bg-lo-green text-white rounded-md hover:bg-lo-green-dark" onClick={handleSave}>Save as SVG</button>
        </div>
      </div>
    </div>
  );
}

function getCellRange(range: string): string[] {
  const parts = range.split(':');
  if (parts.length !== 2) return [range];
  const startCol = parts[0].match(/[A-Z]+/)?.[0] || 'A';
  const startRow = parseInt(parts[0].match(/\d+/)?.[0] || '1');
  const endCol = parts[1].match(/[A-Z]+/)?.[0] || 'A';
  const endRow = parseInt(parts[1].match(/\d+/)?.[0] || '1');
  const cells: string[] = [];
  const sc = colToIndex(startCol);
  const ec = colToIndex(endCol);
  for (let r = startRow; r <= endRow; r++) {
    for (let c = sc; c <= ec; c++) {
      cells.push(`${indexToCol(c)}${r}`);
    }
  }
  return cells;
}

function colToIndex(col: string): number {
  let idx = 0;
  for (let i = 0; i < col.length; i++) idx = idx * 26 + (col.charCodeAt(i) - 64);
  return idx;
}

function indexToCol(idx: number): string {
  let col = '';
  while (idx > 0) { idx--; col = String.fromCharCode(65 + (idx % 26)) + col; idx = Math.floor(idx / 26); }
  return col;
}
