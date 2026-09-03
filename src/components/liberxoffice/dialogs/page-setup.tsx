'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { X, Eye } from 'lucide-react';

interface PageSetupProps {
  pageMargins: { top: number; bottom: number; left: number; right: number };
  orientation: 'portrait' | 'landscape';
  pageNumberFormat: string;
  onApply: (margins: { top: number; bottom: number; left: number; right: number }, orientation: 'portrait' | 'landscape', pageNumberFormat: string) => void;
}

export default function PageSetup({ pageMargins, orientation, pageNumberFormat, onApply }: PageSetupProps) {
  const { showPageSetup, togglePageSetup, togglePrintPreview } = useAppStore();
  const [margins, setMargins] = useState(pageMargins);
  const [orient, setOrient] = useState(orientation);
  const [pgNumFormat, setPgNumFormat] = useState(pageNumberFormat);

  if (!showPageSetup) return null;

  const isLandscape = orient === 'landscape';
  const pageW = isLandscape ? 120 : 84;
  const pageH = isLandscape ? 84 : 120;
  const scale = 0.42;
  const mt = margins.top * scale;
  const mb = margins.bottom * scale;
  const ml = margins.left * scale;
  const mr = margins.right * scale;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40" onClick={togglePageSetup}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-2xl w-[480px] max-h-[90vh] overflow-y-auto lo-scrollbar" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-base font-semibold">Page Setup</h2>
          <button className="lo-toolbar-btn w-8 h-8" onClick={togglePageSetup}><X size={16} /></button>
        </div>
        <div className="p-4 space-y-4">
          {/* Orientation */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Orientation</label>
            <div className="flex gap-2">
              {([['portrait', 'Portrait (A4)'], ['landscape', 'Landscape (A4)']] as [string, string][]).map(([v, l]) => (
                <button key={v} className={`flex-1 h-20 text-xs rounded-md border-2 flex flex-col items-center justify-center gap-1 transition-colors ${orient === v ? 'border-lo-green bg-lo-green/5' : 'border-border hover:border-primary/40'}`}
                  onClick={() => setOrient(v as 'portrait' | 'landscape')}>
                  <div className={`border-2 border-current ${v === 'landscape' ? 'w-12 h-8' : 'w-8 h-12'} rounded-sm`} />
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Margins */}
          <div className="grid grid-cols-2 gap-3">
            {[['top', 'Top'], ['bottom', 'Bottom'], ['left', 'Left'], ['right', 'Right']].map(([key, label]) => (
              <div key={key}>
                <label className="text-xs text-muted-foreground">{label} (mm)</label>
                <input type="number" min={0} max={100} value={margins[key as keyof typeof margins]}
                  className="w-full h-9 px-2 text-sm border border-border rounded-md bg-transparent mt-1"
                  onChange={(e) => setMargins({ ...margins, [key]: parseInt(e.target.value) || 0 })} />
              </div>
            ))}
          </div>

          {/* Page Number Format */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Page Number Format</label>
            <select
              className="w-full h-9 px-2 text-sm border border-border rounded-md bg-white dark:bg-zinc-700 touch-target"
              value={pgNumFormat}
              onChange={e => setPgNumFormat(e.target.value)}
            >
              <option value="arabic">1, 2, 3 (Arabic)</option>
              <option value="roman-lower">i, ii, iii (Roman Lower)</option>
              <option value="roman-upper">I, II, III (Roman Upper)</option>
              <option value="letter-lower">a, b, c (Letter Lower)</option>
            </select>
          </div>

          {/* Visual Page Preview */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Preview</label>
            <div className="bg-secondary/30 rounded-md p-4 flex items-center justify-center">
              <div className="relative" style={{ width: `${pageW}px`, height: `${pageH}px` }}>
                {/* Page outline */}
                <div className="absolute inset-0 border-2 border-foreground/20 rounded-sm bg-white" />
                {/* Margin area */}
                <div
                  className="absolute border border-dashed border-lo-green/60 rounded-[1px] bg-lo-green/5"
                  style={{
                    top: `${mt}px`,
                    bottom: `${mb}px`,
                    left: `${ml}px`,
                    right: `${mr}px`,
                  }}
                />
                {/* Margin labels */}
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground">{margins.top}mm</span>
                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground">{margins.bottom}mm</span>
                <span className="absolute top-1/2 -left-6 -translate-y-1/2 text-[9px] text-muted-foreground">{margins.left}</span>
                <span className="absolute top-1/2 -right-6 -translate-y-1/2 text-[9px] text-muted-foreground">{margins.right}</span>
                {/* Center label */}
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] text-muted-foreground select-none">
                  {isLandscape ? 'Landscape' : 'Portrait'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-between gap-2 px-4 pb-4">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent transition-colors touch-target"
            onClick={() => { togglePageSetup(); setTimeout(togglePrintPreview, 150); }}
          >
            <Eye size={14} />
            Print Preview
          </button>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent" onClick={togglePageSetup}>Cancel</button>
            <button className="px-3 py-1.5 text-sm bg-lo-green text-white rounded-md hover:bg-lo-green-dark"
              onClick={() => { onApply(margins, orient, pgNumFormat); togglePageSetup(); }}>Apply</button>
          </div>
        </div>
      </div>
    </div>
  );
}
