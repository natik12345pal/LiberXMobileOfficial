'use client';

import React, { useState, useEffect } from 'react';
import { Paintbrush, X, RectangleHorizontal } from 'lucide-react';

interface BorderSettings {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
  width: number;
  color: string;
  style: 'solid' | 'dashed' | 'dotted' | 'double';
  bgColor: string;
}

interface ParaBordersDialogProps {
  show: boolean;
  onClose: () => void;
  onApply: (settings: BorderSettings) => void;
  editorRef: React.RefObject<HTMLDivElement | null>;
}

export default function ParaBordersDialog({ show, onClose, onApply, editorRef }: ParaBordersDialogProps) {
  const [settings, setSettings] = useState<BorderSettings>({
    top: true, bottom: true, left: false, right: false,
    width: 1, color: '#000000', style: 'solid', bgColor: '',
  });

  useEffect(() => {
    if (!show || !editorRef.current) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    let node = sel.anchorNode;
    while (node && node !== editorRef.current && !(node instanceof HTMLParagraphElement) && !(node instanceof HTMLHeadingElement)) {
      node = node.parentNode;
    }
    if (node && node instanceof HTMLElement) {
      const cs = window.getComputedStyle(node);
      const currentStyle = node.style;
      setSettings(prev => ({
        ...prev,
        top: !!(currentStyle.borderTopWidth && currentStyle.borderTopWidth !== '0px'),
        bottom: !!(currentStyle.borderBottomWidth && currentStyle.borderBottomWidth !== '0px'),
        left: !!(currentStyle.borderLeftWidth && currentStyle.borderLeftWidth !== '0px'),
        right: !!(currentStyle.borderRightWidth && currentStyle.borderRightWidth !== '0px'),
        width: parseInt(currentStyle.borderTopWidth) || 1,
        color: currentStyle.borderTopColor || '#000000',
        style: (currentStyle.borderTopStyle || 'solid') as BorderSettings['style'],
        bgColor: currentStyle.backgroundColor || '',
      }));
    }
  }, [show, editorRef]);

  if (!show) return null;

  const borderSides = ['top', 'bottom', 'left', 'right'] as const;
  const borderStyleOptions: { value: BorderSettings['style']; label: string }[] = [
    { value: 'solid', label: '───── Solid' },
    { value: 'dashed', label: '- - - Dashed' },
    { value: 'dotted', label: '...... Dotted' },
    { value: 'double', label: '══ Double' },
  ];

  const handleApply = () => {
    onApply(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-2xl w-[420px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <RectangleHorizontal size={16} />
            Paragraph Borders & Shading
          </h2>
          <button className="lo-toolbar-btn w-8 h-8" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="p-4 space-y-4">
          {/* Border sides */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block font-medium">Border Sides</label>
            <div className="flex gap-2">
              {borderSides.map(side => (
                <button
                  key={side}
                  className={`flex-1 h-10 text-xs rounded-md border transition-colors touch-target capitalize ${settings[side] ? 'border-lo-green bg-lo-green/10 text-lo-green' : 'border-border hover:bg-accent'}`}
                  onClick={() => setSettings(s => ({ ...s, [side]: !s[side] }))}
                >
                  {side}
                </button>
              ))}
            </div>
          </div>

          {/* Border style + width + color */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Style</label>
              <select
                className="w-full h-9 px-2 text-sm border border-border rounded-md bg-white dark:bg-zinc-700 touch-target"
                value={settings.style}
                onChange={e => setSettings(s => ({ ...s, style: e.target.value as BorderSettings['style'] }))}
              >
                {borderStyleOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Width (px)</label>
              <select
                className="w-full h-9 px-2 text-sm border border-border rounded-md bg-white dark:bg-zinc-700 touch-target"
                value={settings.width}
                onChange={e => setSettings(s => ({ ...s, width: parseInt(e.target.value) }))}
              >
                {[1, 2, 3, 4].map(w => <option key={w} value={w}>{w}px</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Color</label>
              <div className="flex gap-1 items-center h-9">
                <input
                  type="color"
                  value={settings.color}
                  onChange={e => setSettings(s => ({ ...s, color: e.target.value }))}
                  className="w-8 h-8 rounded border border-border cursor-pointer"
                />
                <span className="text-xs text-muted-foreground">{settings.color}</span>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block font-medium">Preview</label>
            <div className="bg-secondary/30 rounded-md p-6 flex items-center justify-center">
              <div
                className="w-48 h-16 flex items-center justify-center text-xs text-muted-foreground rounded-sm"
                style={{
                  backgroundColor: settings.bgColor || 'transparent',
                  borderTop: settings.top ? `${settings.width}px ${settings.style} ${settings.color}` : 'none',
                  borderBottom: settings.bottom ? `${settings.width}px ${settings.style} ${settings.color}` : 'none',
                  borderLeft: settings.left ? `${settings.width}px ${settings.style} ${settings.color}` : 'none',
                  borderRight: settings.right ? `${settings.width}px ${settings.style} ${settings.color}` : 'none',
                }}
              >
                Aa Bb Cc
              </div>
            </div>
          </div>

          {/* Shading */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1 font-medium">
              <Paintbrush size={12} /> Background Color (Shading)
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={settings.bgColor || '#ffffff'}
                onChange={e => setSettings(s => ({ ...s, bgColor: e.target.value }))}
                className="w-8 h-8 rounded border border-border cursor-pointer"
              />
              <span className="text-xs text-muted-foreground">{settings.bgColor || 'None'}</span>
              {settings.bgColor && (
                <button className="text-xs text-destructive hover:underline ml-2 touch-target" onClick={() => setSettings(s => ({ ...s, bgColor: '' }))}>Clear</button>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-4 pb-4">
          <button className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent touch-target" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 text-sm bg-lo-green text-white rounded-md hover:bg-lo-green-dark touch-target" onClick={handleApply}>Apply</button>
        </div>
      </div>
    </div>
  );
}
