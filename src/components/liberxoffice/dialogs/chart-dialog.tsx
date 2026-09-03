'use client';

import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useCalcStore } from '@/stores/calc-store';
import { X } from 'lucide-react';
import { BarChart3 } from 'lucide-react';

export default function ChartDialog() {
  const { showChartDialog, toggleChartDialog } = useAppStore();
  const { sheets, activeSheet } = useCalcStore();
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'doughnut' | 'radar'>('bar');
  const [dataRange, setDataRange] = useState('A1:H6');
  const [title, setTitle] = useState('Chart');

  const CHART_COLORS = ['#18A303', '#4A86C8', '#D4573B', '#F5A623', '#7B1FA2', '#00ACC1', '#E91E63', '#795548'];

  const chartData = useMemo(() => {
    try {
      const sheetData = sheets[activeSheet] || {};
      const rangeMatch = dataRange.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
      if (!rangeMatch) return null;

      const startCol = rangeMatch[1].toUpperCase();
      const startRow = parseInt(rangeMatch[2]);
      const endCol = rangeMatch[3].toUpperCase();
      const endRow = parseInt(rangeMatch[4]);

      const colToIdx = (c: string) => c.split('').reduce((a, ch) => a * 26 + (ch.charCodeAt(0) - 64), 0);
      const idxToCol = (i: number) => { let s = ''; while (i > 0) { i--; s = String.fromCharCode(65 + (i % 26)) + s; i = Math.floor(i / 26); } return s; };

      const sc = colToIdx(startCol);
      const ec = colToIdx(endCol);
      const labels: string[] = [];
      const datasets: { label: string; data: number[]; color: string }[] = [];

      // First row = labels for datasets
      for (let c = sc + 1; c <= ec; c++) {
        const col = idxToCol(c);
        const cellData = sheetData[`${col}${startRow}`];
        datasets.push({ label: cellData?.computed || col, data: [], color: CHART_COLORS[(c - sc - 1) % CHART_COLORS.length] });
      }

      // Remaining rows = data
      for (let r = startRow + 1; r <= endRow; r++) {
        const labelCell = sheetData[`${startCol}${r}`];
        labels.push(labelCell?.computed || `Row ${r}`);
        datasets.forEach((ds, di) => {
          const col = idxToCol(sc + 1 + di);
          const cell = sheetData[`${col}${r}`];
          ds.data.push(parseFloat(cell?.computed) || 0);
        });
      }

      return { labels, datasets };
    } catch { return null; }
  }, [dataRange, sheets, activeSheet]);

  if (!showChartDialog) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40" onClick={toggleChartDialog}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-2xl w-[680px] max-w-[92vw] max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-base font-semibold">Insert Chart</h2>
          <button className="lo-toolbar-btn w-8 h-8" onClick={toggleChartDialog}><X size={16} /></button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          {/* Controls */}
          <div className="w-56 border-r border-border p-4 space-y-3 overflow-y-auto lo-scrollbar">
            <div>
              <label className="text-xs text-muted-foreground">Data Range</label>
              <input className="w-full h-9 px-2 text-sm border border-border rounded-md bg-transparent mt-1 font-mono"
                value={dataRange} onChange={(e) => setDataRange(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Chart Title</label>
              <input className="w-full h-9 px-2 text-sm border border-border rounded-md bg-transparent mt-1"
                value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Chart Type</label>
              <div className="grid grid-cols-3 gap-1 mt-1">
                {[['bar', 'Bar'], ['line', 'Line'], ['pie', 'Pie'], ['area', 'Area'], ['scatter', 'Scatter'], ['doughnut', 'Doughnut'], ['radar', 'Radar']].map(([t, l]) => (
                  <button key={t} className={`px-2 py-1.5 text-xs rounded-md border transition-colors ${chartType === t ? 'bg-lo-green text-white border-lo-green' : 'border-border hover:bg-accent'}`}
                    onClick={() => setChartType(t as typeof chartType)}>{l}</button>
                ))}
              </div>
            </div>
            {chartData && (
              <div className="text-[10px] text-muted-foreground">
                <p>Labels: {chartData.labels.length}</p>
                <p>Datasets: {chartData.datasets.length}</p>
              </div>
            )}
          </div>
          {/* Chart Preview */}
          <div className="flex-1 p-4 overflow-y-auto lo-scrollbar flex items-start justify-center">
            {chartData && chartData.datasets.length > 0 ? (
              <ChartPreview data={chartData} type={chartType} title={title} />
            ) : (
              <div className="text-sm text-muted-foreground text-center">
                <BarChart3 size={48} className="mx-auto mb-2 opacity-30" />
                <p>Enter a valid data range</p>
                <p className="text-xs">e.g. A1:H6</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 px-4 pb-4 pt-2 border-t border-border">
          <button className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent" onClick={toggleChartDialog}>Cancel</button>
          <button className="px-3 py-1.5 text-sm bg-lo-green text-white rounded-md hover:bg-lo-green-dark" onClick={toggleChartDialog}>Insert Chart</button>
        </div>
      </div>
    </div>
  );
}

// Lightweight chart renderer (no external dependency needed)
function ChartPreview({ data, type, title }: { data: { labels: string[]; datasets: { label: string; data: number[]; color: string }[] }; type: string; title: string }) {
  const allValues = data.datasets.flatMap((d) => d.data);
  const maxVal = Math.max(...allValues, 1);
  const minVal = Math.min(...allValues, 0);
  const range = maxVal - minVal || 1;
  const W = 340, H = 280;
  const padL = 50, padR = 20, padT = 35, padB = 75;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const yTicks = 5;
  const barW = Math.max(8, (plotW / data.labels.length) / (data.datasets.length + 0.5) - 2);

  if (type === 'doughnut') {
    const total = allValues.reduce((a, b) => a + b, 0) || 1;
    let angle = -Math.PI / 2;
    const chartH = H - 40;
    const cx = W / 2, cy = chartH / 2 + 10, r = Math.min(W, chartH) / 2 - 30;
    const innerR = r * 0.55;
    const slices = data.datasets[0]?.data.map((v, i) => {
      const sweep = (v / total) * Math.PI * 2;
      const path = `M ${cx + innerR * Math.cos(angle)} ${cy + innerR * Math.sin(angle)} L ${cx + r * Math.cos(angle)} ${cy + r * Math.sin(angle)} A ${r} ${r} 0 ${sweep > Math.PI ? 1 : 0} 1 ${cx + r * Math.cos(angle + sweep)} ${cy + r * Math.sin(angle + sweep)} L ${cx + innerR * Math.cos(angle + sweep)} ${cy + innerR * Math.sin(angle + sweep)} A ${innerR} ${innerR} 0 ${sweep > Math.PI ? 1 : 0} 0 ${cx + innerR * Math.cos(angle)} ${cy + innerR * Math.sin(angle)} Z`;
      const midAngle = angle + sweep / 2;
      const result = { path, color: data.datasets[0]?.color || '#ccc', label: data.labels[i], value: v, pct: ((v / total) * 100).toFixed(0), lx: cx + (r * 0.77) * Math.cos(midAngle), ly: cy + (r * 0.77) * Math.sin(midAngle) };
      angle += sweep;
      return result;
    }) || [];

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-h-[340px]">
        <text x={W / 2} y={18} textAnchor="middle" fontSize="12" fontWeight="bold" fill="currentColor">{title}</text>
        {slices.map((s, i) => (
          <g key={i}>
            <path d={s.path} fill={s.color} stroke="white" strokeWidth="2" />
          </g>
        ))}
        <g transform={`translate(10, ${H - 18})`} >
          {slices.slice(0, 6).map((s, i) => (
            <g key={i} transform={`translate(${(i % 3) * 110}, ${Math.floor(i / 3) * 14})`}>
              <rect y="-6" width="10" height="10" fill={s.color} rx="1" />
              <text x="14" y="3" fontSize="8" fill="#444">{s.label.slice(0, 10)} ({s.pct}%)</text>
            </g>
          ))}
        </g>
      </svg>
    );
  }

  if (type === 'radar') {
    const ds = data.datasets[0];
    if (!ds) return null;
    const n = ds.data.length;
    const cx = W / 2, cy = H / 2 + 10, r = 110;
    const angleStep = (Math.PI * 2) / n;
    const gridLevels = 4;

    const getPoint = (i: number, val: number) => {
      const angle = angleStep * i - Math.PI / 2;
      const maxDataVal = Math.max(...ds.data, 1);
      const pct = val / maxDataVal;
      return { x: cx + r * pct * Math.cos(angle), y: cy + r * pct * Math.sin(angle) };
    };

    const pts = ds.data.map((v, i) => getPoint(i, v));
    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-h-[340px]">
        <text x={W / 2} y={18} textAnchor="middle" fontSize="12" fontWeight="bold" fill="currentColor">{title}</text>
        {Array.from({ length: gridLevels }, (_, gl) => {
          const gr = r * ((gl + 1) / gridLevels);
          const gridPath = Array.from({ length: n }, (_, i) => {
            const angle = angleStep * i - Math.PI / 2;
            return `${i === 0 ? 'M' : 'L'} ${cx + gr * Math.cos(angle)} ${cy + gr * Math.sin(angle)}`;
          }).join(' ') + ' Z';
          return <path key={gl} d={gridPath} fill="none" stroke="#e5e5e5" />;
        })}
        {Array.from({ length: n }, (_, i) => {
          const angle = angleStep * i - Math.PI / 2;
          return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke="#e5e5e5" />;
        })}
        {data.labels.map((label, i) => {
          const angle = angleStep * i - Math.PI / 2;
          return <text key={i} x={cx + (r + 15) * Math.cos(angle)} y={cy + (r + 15) * Math.sin(angle)} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#666">{label.slice(0, 8)}</text>;
        })}
        <path d={pathD} fill={`${ds.color}33`} stroke={ds.color} strokeWidth="2" />
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill={ds.color} />)}
      </svg>
    );
  }

  if (type === 'scatter') {
    const ds = data.datasets[0];
    if (!ds) return null;
    const pts = ds.data.map((v, i) => ({
      x: padL + ((i + 0.5) / ds.data.length) * plotW,
      y: padT + plotH - ((v - minVal) / range) * plotH,
    }));
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-h-[340px]">
        <text x={W / 2} y={14} textAnchor="middle" fontSize="11" fontWeight="bold" fill="currentColor">{title}</text>
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const val = minVal + (range * (yTicks - i)) / yTicks;
          const y = padT + (plotH * i) / yTicks;
          return (<g key={i}><line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e5e5e5" /><text x={padL - 4} y={y + 3} textAnchor="end" fontSize="8" fill="#888">{Math.round(val * 10) / 10}</text></g>);
        })}
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={4} fill={ds.color} />)}
      </svg>
    );
  }

  if (type === 'pie') {
    const total = allValues.reduce((a, b) => a + b, 0) || 1;
    let angle = -Math.PI / 2;
    const chartH = H - 40;
    const cx = W / 2, cy = chartH / 2 + 10, r = Math.min(W, chartH) / 2 - 30;
    const slices = data.datasets[0]?.data.map((v, i) => {
      const sweep = (v / total) * Math.PI * 2;
      const path = `M ${cx} ${cy} L ${cx + r * Math.cos(angle)} ${cy + r * Math.sin(angle)} A ${r} ${r} 0 ${sweep > Math.PI ? 1 : 0} 1 ${cx + r * Math.cos(angle + sweep)} ${cy + r * Math.sin(angle + sweep)} Z`;
      const midAngle = angle + sweep / 2;
      const result = { path, color: data.datasets[0]?.color || '#ccc', label: data.labels[i], value: v, pct: ((v / total) * 100).toFixed(0), lx: cx + (r * 0.6) * Math.cos(midAngle), ly: cy + (r * 0.6) * Math.sin(midAngle) };
      angle += sweep;
      return result;
    }) || [];

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-h-[340px]">
        <text x={W / 2} y={18} textAnchor="middle" fontSize="12" fontWeight="bold" fill="currentColor">{title}</text>
        {slices.map((s, i) => (
          <g key={i}>
            <path d={s.path} fill={s.color} stroke="white" strokeWidth="2" />
            <text x={s.lx} y={s.ly} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="white" fontWeight="bold">{s.pct}%</text>
          </g>
        ))}
        {/* Pie legend */}
        <g transform={`translate(10, ${H - 18})`} >
          {slices.slice(0, 6).map((s, i) => (
            <g key={i} transform={`translate(${(i % 3) * 110}, ${Math.floor(i / 3) * 14})`}>
              <rect y="-6" width="10" height="10" fill={s.color} rx="1" />
              <text x="14" y="3" fontSize="8" fill="#444">{s.label.slice(0, 10)} ({s.pct}%)</text>
            </g>
          ))}
        </g>
      </svg>
    );
  }

  // Bar, Line, or Area chart
  // Compute area paths for area chart
  const areaPaths = type === 'area' ? data.datasets.map((ds, di) => {
    const pts = ds.data.map((val, vi) => {
      const lx = padL + (plotW * (vi + 0.5)) / data.labels.length + di * 8;
      const ly = padT + plotH - ((val - minVal) / range) * plotH;
      return `${lx},${ly}`;
    });
    if (pts.length === 0) return '';
    const firstX = pts[0].split(',')[0];
    const lastX = pts[pts.length - 1].split(',')[0];
    const baseY = padT + plotH;
    return `M ${firstX},${baseY} L ${pts.join(' L ')} L ${lastX},${baseY} Z`;
  }) : [];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-h-[340px]">
      <text x={W / 2} y={14} textAnchor="middle" fontSize="11" fontWeight="bold" fill="currentColor">{title}</text>
      {/* Y axis */}
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const val = minVal + (range * (yTicks - i)) / yTicks;
        const y = padT + (plotH * i) / yTicks;
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e5e5e5" />
            <text x={padL - 4} y={y + 3} textAnchor="end" fontSize="8" fill="#888">{Math.round(val * 10) / 10}</text>
          </g>
        );
      })}
      {/* X axis labels */}
      {data.labels.map((label, i) => {
        const x = padL + (plotW * (i + 0.5)) / data.labels.length;
        const plotBottom = padT + plotH;
        return <text key={i} x={x} y={plotBottom + 15} textAnchor="middle" fontSize="8" fill="#666">{label.slice(0, 12)}</text>;
      })}
      {/* Area fills */}
      {type === 'area' && areaPaths.map((p, i) => (
        <path key={i} d={p} fill={`${data.datasets[i].color}33`} stroke="none" />
      ))}
      {/* Data */}
      {data.datasets.map((ds, di) =>
        ds.data.map((val, vi) => {
          const x = padL + (plotW * (vi + 0.5)) / data.labels.length + (di - data.datasets.length / 2 + 0.5) * (barW + 1);
          const barH = ((val - minVal) / range) * plotH;
          const y = padT + plotH - barH;
          if (type === 'line' || type === 'area') {
            const lx = padL + (plotW * (vi + 0.5)) / data.labels.length + di * 8;
            const ly = padT + plotH - barH;
            return <circle key={`${di}-${vi}`} cx={lx} cy={ly} r={3} fill={ds.color} />;
          }
          return <rect key={`${di}-${vi}`} x={x - barW / 2} y={y} width={barW} height={barH} fill={ds.color} rx={1} />;
        })
      )}
      {/* Line paths */}
      {(type === 'line' || type === 'area') && data.datasets.map((ds, di) => {
        const pts = ds.data.map((val, vi) => {
          const lx = padL + (plotW * (vi + 0.5)) / data.labels.length + di * 8;
          const ly = padT + plotH - ((val - minVal) / range) * plotH;
          return `${lx},${ly}`;
        }).join(' ');
        return <polyline key={di} points={pts} fill="none" stroke={ds.color} strokeWidth="2" />;
      })}
      {/* Legend */}
      {data.datasets.map((ds, i) => {
        const legendY = H - 18;
        const legendX = padL + (i % 4) * 80;
        const legendRow = Math.floor(i / 4);
        return (
          <g key={i} transform={`translate(${legendX}, ${legendY - legendRow * 16})`}>
            <rect y="-6" width="10" height="10" fill={ds.color} rx="1" />
            <text x="14" y="3" fontSize="8" fill="#444">{ds.label.slice(0, 10)}</text>
          </g>
        );
      })}
    </svg>
  );
}