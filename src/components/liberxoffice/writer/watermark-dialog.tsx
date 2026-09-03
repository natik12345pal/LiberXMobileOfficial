'use client';

import React, { useState, useEffect } from 'react';
import { Droplets, X } from 'lucide-react';

interface WatermarkDialogProps {
  show: boolean;
  onClose: () => void;
  onApply: (text: string, fontSize: number, color: string, rotation: number, opacity: number) => void;
  onRemove: () => void;
  currentWatermark: {
    text: string;
    fontSize: number;
    color: string;
    rotation: number;
    opacity: number;
  } | null;
}

export default function WatermarkDialog({ show, onClose, onApply, onRemove, currentWatermark }: WatermarkDialogProps) {
  const [text, setText] = useState('DRAFT');
  const [fontSize, setFontSize] = useState(60);
  const [color, setColor] = useState('#cccccc');
  const [rotation, setRotation] = useState(-30);
  const [opacity, setOpacity] = useState(0.3);

  useEffect(() => {
    if (show && currentWatermark) {
      setText(currentWatermark.text);
      setFontSize(currentWatermark.fontSize);
      setColor(currentWatermark.color);
      setRotation(currentWatermark.rotation);
      setOpacity(currentWatermark.opacity);
    } else if (show && !currentWatermark) {
      setText('DRAFT');
      setFontSize(60);
      setColor('#cccccc');
      setRotation(-30);
      setOpacity(0.3);
    }
  }, [show, currentWatermark]);

  if (!show) return null;

  const handleApply = () => {
    if (!text.trim()) return;
    onApply(text.trim(), fontSize, color, rotation, opacity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-2xl w-[420px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Droplets size={16} />
            Watermark
          </h2>
          <button className="lo-toolbar-btn w-8 h-8" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="p-4 space-y-4">
          {/* Watermark text */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Watermark Text</label>
            <input
              type="text"
              className="w-full h-10 px-3 text-sm border border-border rounded-md bg-transparent"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="e.g. DRAFT, CONFIDENTIAL"
              autoFocus
            />
          </div>

          {/* Font size slider */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Font Size: {fontSize}px</label>
            <input
              type="range" min={30} max={120} value={fontSize}
              onChange={e => setFontSize(parseInt(e.target.value))}
              className="w-full h-2 accent-lo-green"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground"><span>30</span><span>120</span></div>
          </div>

          {/* Color */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Color</label>
            <div className="flex gap-2 items-center">
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 rounded border border-border cursor-pointer" />
              <span className="text-xs text-muted-foreground">{color}</span>
              <div className="flex gap-1 ml-auto">
                {['#cccccc', '#ff0000', '#0000ff', '#008000', '#ff9900'].map(c => (
                  <button key={c} className={`w-6 h-6 rounded border ${color === c ? 'border-lo-green ring-1 ring-lo-green' : 'border-border'}`} style={{ backgroundColor: c }} onClick={() => setColor(c)} />
                ))}
              </div>
            </div>
          </div>

          {/* Rotation slider */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Rotation: {rotation}°</label>
            <input
              type="range" min={-90} max={90} value={rotation}
              onChange={e => setRotation(parseInt(e.target.value))}
              className="w-full h-2 accent-lo-green"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground"><span>-90°</span><span>0°</span><span>90°</span></div>
          </div>

          {/* Opacity slider */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Opacity: {opacity.toFixed(2)}</label>
            <input
              type="range" min={10} max={50} value={Math.round(opacity * 100)}
              onChange={e => setOpacity(parseInt(e.target.value) / 100)}
              className="w-full h-2 accent-lo-green"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground"><span>Light</span><span>Strong</span></div>
          </div>

          {/* Preview */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block font-medium">Preview</label>
            <div className="bg-secondary/30 rounded-md p-4 h-24 flex items-center justify-center overflow-hidden relative">
              <div
                className="whitespace-nowrap font-bold select-none"
                style={{
                  fontSize: `${Math.min(fontSize, 40)}px`,
                  color,
                  opacity,
                  transform: `rotate(${rotation}deg)`,
                }}
              >
                {text || 'DRAFT'}
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-4 pb-4">
          {currentWatermark && (
            <button className="px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md touch-target" onClick={() => { onRemove(); onClose(); }}>Remove</button>
          )}
          <button className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent touch-target" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 text-sm bg-lo-green text-white rounded-md hover:bg-lo-green-dark touch-target" onClick={handleApply}>Apply</button>
        </div>
      </div>
    </div>
  );
}
