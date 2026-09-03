'use client';

import React, { useState } from 'react';
import { useImpressStore, SlideMaster, DEFAULT_SLIDE_MASTER, loadSlideMaster, saveSlideMaster } from '@/stores/impress-store';
import { useAppStore } from '@/stores/app-store';
import { X } from 'lucide-react';

export default function SlideMasterDialog() {
  const { showSlideMaster, toggleSlideMaster } = useAppStore();
  const { slides, slideTheme } = useImpressStore();
  const [master, setMaster] = useState<SlideMaster>(loadSlideMaster);
  const [applied, setApplied] = useState(false);

  if (!showSlideMaster) return null;

  const applyMaster = () => {
    saveSlideMaster(master);
    const store = useImpressStore.getState();
    store.pushUndo();
    useImpressStore.setState({
      slides: store.slides.map((slide) => ({
        ...slide,
        elements: slide.elements.map((el) => {
          if (el.type !== 'text') return el;
          const isTitle = (el.fontSize && el.fontSize >= 28) || el.fontWeight === 'bold';
          return {
            ...el,
            color: isTitle ? master.titleColor : master.bodyColor,
            fontSize: isTitle ? (el.fontSize || master.titleSize) : (el.fontSize || master.bodySize),
          };
        }),
      })),
    });
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  const applyAsBackground = () => {
    saveSlideMaster(master);
    const store = useImpressStore.getState();
    store.pushUndo();
    useImpressStore.setState({
      slides: store.slides.map((slide) => ({
        ...slide,
        background: master.defaultBackground,
      })),
    });
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  const handleReset = () => {
    setMaster(DEFAULT_SLIDE_MASTER);
  };

  const update = (key: keyof SlideMaster, value: string | number) => {
    setMaster((m) => ({ ...m, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={toggleSlideMaster}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto lo-scrollbar" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-base font-semibold">Slide Master</h2>
          <button className="lo-toolbar-btn w-8 h-8" onClick={toggleSlideMaster}><X size={16} /></button>
        </div>
        <div className="p-4 space-y-4">
          {/* Preview */}
          <div className="rounded-md border border-border overflow-hidden" style={{ background: master.defaultBackground, minHeight: 100 }}>
            <div className="p-3 space-y-2">
              <div style={{ fontFamily: master.titleFont, fontSize: Math.min(master.titleSize * 0.5, 24), color: master.titleColor, fontWeight: 'bold' }}>Title Preview</div>
              <div style={{ fontFamily: master.bodyFont, fontSize: Math.min(master.bodySize * 0.6, 14), color: master.bodyColor }}>Body text preview - The quick brown fox jumps over the lazy dog.</div>
              <div className="w-16 h-1 rounded" style={{ background: master.accentColor }} />
            </div>
          </div>

          {/* Title Settings */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Title Style</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Font Family</label>
                <select className="w-full mt-1 px-2 py-1.5 text-sm rounded-md border border-border bg-white dark:bg-zinc-700 dark:text-white" value={master.titleFont} onChange={(e) => update('titleFont', e.target.value)}>
                  <option value="sans-serif">Sans Serif</option>
                  <option value="serif">Serif</option>
                  <option value="monospace">Monospace</option>
                  <option value="cursive">Cursive</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Size (px)</label>
                <input type="number" className="w-full mt-1 px-2 py-1.5 text-sm rounded-md border border-border bg-white dark:bg-zinc-700 dark:text-white" value={master.titleSize} min={12} max={120} onChange={(e) => update('titleSize', parseInt(e.target.value) || 36)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Color</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" className="w-8 h-8 rounded border border-border cursor-pointer" value={master.titleColor} onChange={(e) => update('titleColor', e.target.value)} />
                <input type="text" className="flex-1 px-2 py-1.5 text-sm rounded-md border border-border bg-white dark:bg-zinc-700 dark:text-white" value={master.titleColor} onChange={(e) => update('titleColor', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Body Settings */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Body Style</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Font Family</label>
                <select className="w-full mt-1 px-2 py-1.5 text-sm rounded-md border border-border bg-white dark:bg-zinc-700 dark:text-white" value={master.bodyFont} onChange={(e) => update('bodyFont', e.target.value)}>
                  <option value="sans-serif">Sans Serif</option>
                  <option value="serif">Serif</option>
                  <option value="monospace">Monospace</option>
                  <option value="cursive">Cursive</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Size (px)</label>
                <input type="number" className="w-full mt-1 px-2 py-1.5 text-sm rounded-md border border-border bg-white dark:bg-zinc-700 dark:text-white" value={master.bodySize} min={8} max={72} onChange={(e) => update('bodySize', parseInt(e.target.value) || 16)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Color</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" className="w-8 h-8 rounded border border-border cursor-pointer" value={master.bodyColor} onChange={(e) => update('bodyColor', e.target.value)} />
                <input type="text" className="flex-1 px-2 py-1.5 text-sm rounded-md border border-border bg-white dark:bg-zinc-700 dark:text-white" value={master.bodyColor} onChange={(e) => update('bodyColor', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Accent Color */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Accent Color</h3>
            <div className="flex items-center gap-2">
              <input type="color" className="w-8 h-8 rounded border border-border cursor-pointer" value={master.accentColor} onChange={(e) => update('accentColor', e.target.value)} />
              <input type="text" className="flex-1 px-2 py-1.5 text-sm rounded-md border border-border bg-white dark:bg-zinc-700 dark:text-white" value={master.accentColor} onChange={(e) => update('accentColor', e.target.value)} />
            </div>
          </div>

          {/* Default Background */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Default Background</h3>
            <div className="flex items-center gap-2">
              <input type="color" className="w-8 h-8 rounded border border-border cursor-pointer" value={master.defaultBackground} onChange={(e) => update('defaultBackground', e.target.value)} />
              <input type="text" className="flex-1 px-2 py-1.5 text-sm rounded-md border border-border bg-white dark:bg-zinc-700 dark:text-white" value={master.defaultBackground} onChange={(e) => update('defaultBackground', e.target.value)} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <button className="flex-1 px-3 py-2 text-sm font-medium bg-lo-green text-white rounded-md hover:bg-lo-green-dark transition-colors touch-target" onClick={applyMaster}>
              {applied ? '✓ Applied!' : 'Apply to All Slides'}
            </button>
            <button className="px-3 py-2 text-sm rounded-md border border-border hover:bg-accent transition-colors touch-target" onClick={applyAsBackground}>
              Set Background
            </button>
            <button className="px-3 py-2 text-sm rounded-md border border-border hover:bg-accent transition-colors touch-target" onClick={handleReset}>
              Reset
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center">Master settings are saved to localStorage automatically.</p>
        </div>
      </div>
    </div>
  );
}
