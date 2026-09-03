'use client';

import React, { useState, useRef } from 'react';
import { useImpressStore, ALL_TRANSITIONS, SlideTransition, AnimationType } from '@/stores/impress-store';
import { openImageFile, downloadJSON, openFile, autoSave, printDocument, downloadPPTX } from '@/lib/file-service';
import { useAppStore } from '@/stores/app-store';

const THEMES: Record<string, { bg: string; titleColor: string; bodyColor: string; accent: string }> = {
  default: { bg: '#ffffff', titleColor: '#1a1a1a', bodyColor: '#333333', accent: '#18A303' },
  dark: { bg: '#1a1a2e', titleColor: '#ffffff', bodyColor: '#e0e0e0', accent: '#4fc3f7' },
  nature: { bg: '#f1f8e9', titleColor: '#1b5e20', bodyColor: '#333333', accent: '#4caf50' },
  ocean: { bg: '#e3f2fd', titleColor: '#0d47a1', bodyColor: '#333333', accent: '#2196f3' },
  sunset: { bg: '#fff3e0', titleColor: '#e65100', bodyColor: '#333333', accent: '#ff9800' },
  minimal: { bg: '#fafafa', titleColor: '#212121', bodyColor: '#616161', accent: '#9e9e9e' },
};

const GRADIENT_PRESETS = [
  { label: 'None', value: '' },
  { label: '→ Right', value: 'linear-gradient(to right, #18A303, #4fc3f7)' },
  { label: '↓ Down', value: 'linear-gradient(to bottom, #18A303, #4fc3f7)' },
  { label: '↘ Diagonal', value: 'linear-gradient(135deg, #ff9800, #e91e63)' },
  { label: '↗ Diagonal', value: 'linear-gradient(45deg, #2196f3, #9c27b0)' },
];

import {
  Type, Square, Circle, ImagePlus, Plus, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, Undo2, Redo2, Palette, Copy, ClipboardPaste,
  Camera, Image as ImageIcon, Frame, BoxSelect, Layers,
  RotateCw, ArrowUpToLine, ArrowDownToLine, Table as TableIcon, FileOutput, Sparkles, Maximize2, Minimize2
} from 'lucide-react';

const SLIDE_WIDTH = 720;
const SLIDE_HEIGHT = 405;

export default function ImpressToolbar() {
  const {
    activeSlideIndex, selectedElementId, slides, slideTheme,
    addSlide, addElement, updateElement, pushUndo, undo,
    setSlideTransition, setSlideBackground, setSlideTheme, copyElement, pasteElement,
  } = useImpressStore();
  const { fileName, setFileName, setModified, toggleSlideSorter, toggleNotesPanel } = useAppStore();

  const activeSlide = slides[activeSlideIndex];
  const selectedElement = activeSlide?.elements.find((e) => e.id === selectedElementId);
  const [showTransitions, setShowTransitions] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showGradientPicker, setShowGradientPicker] = useState(false);
  const [showAnimPicker, setShowAnimPicker] = useState(false);
  const [showRotateDialog, setShowRotateDialog] = useState(false);
  const [rotateAngle, setRotateAngle] = useState(0);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const i = setInterval(() => autoSave('impress', JSON.stringify(useImpressStore.getState().slides)), 30000);
    return () => clearInterval(i);
  }, []);

  const addTextElement = () => {
    addElement(activeSlideIndex, { id: `el-${Date.now()}`, type: 'text', x: 100 + Math.random() * 200, y: 100 + Math.random() * 100, width: 300, height: 60, content: 'Click to edit text', fontSize: 18, fontWeight: 'normal', color: '#333333', textAlign: 'left' });
  };
  const addShapeElement = () => {
    addElement(activeSlideIndex, { id: `el-${Date.now()}`, type: 'shape', x: 150 + Math.random() * 200, y: 100 + Math.random() * 100, width: 120, height: 80, content: '', bgColor: '#18A303', borderRadius: 4 });
  };
  const addImageElement = async () => {
    try {
      const { dataUrl } = await openImageFile();
      addElement(activeSlideIndex, { id: `el-${Date.now()}`, type: 'image', x: 100, y: 80, width: 300, height: 200, content: '', src: dataUrl, borderRadius: 0 });
    } catch {};
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      addElement(activeSlideIndex, { id: `el-${Date.now()}`, type: 'image', x: 110, y: 50, width: 360, height: 270, content: '', src: dataUrl, borderRadius: 0 });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Set image background
  const setBackgroundImage = async () => {
    try {
      const { dataUrl } = await openImageFile();
      pushUndo();
      setSlideBackground(activeSlideIndex, dataUrl);
    } catch {};
  };

  const toggleBold = () => { if (selectedElementId) updateElement(activeSlideIndex, selectedElementId, { fontWeight: selectedElement?.fontWeight === 'bold' ? 'normal' : 'bold' }); };
  const setAlign = (align: 'left' | 'center' | 'right') => { if (selectedElementId) updateElement(activeSlideIndex, selectedElementId, { textAlign: align }); };
  const setColor = (color: string) => { if (selectedElementId && selectedElement) { if (selectedElement.type === 'shape') updateElement(activeSlideIndex, selectedElementId, { bgColor: color }); else updateElement(activeSlideIndex, selectedElementId, { color }); } };

  const handleSave = () => { downloadJSON(fileName, useImpressStore.getState().slides); setModified(false); };
  const handleOpen = async () => {
    try {
      const { name, content } = await openFile('.json');
      const data = JSON.parse(content);
      if (Array.isArray(data)) { useImpressStore.setState({ slides: data, activeSlideIndex: 0 }); setFileName(name); setModified(false); }
    } catch {};
  };

  // Helper functions for element ordering
  const bringToFront = () => {
    const allSlides = useImpressStore.getState().slides;
    const els = [...(allSlides[activeSlideIndex]?.elements || [])];
    const idx = els.findIndex(e => e.id === selectedElementId);
    if (idx >= 0 && idx < els.length - 1) {
      const [removed] = els.splice(idx, 1);
      els.push(removed);
      const newSlides = [...allSlides];
      newSlides[activeSlideIndex] = { ...newSlides[activeSlideIndex], elements: els };
      useImpressStore.setState({ slides: newSlides });
    }
  };
  const sendToBack = () => {
    const allSlides = useImpressStore.getState().slides;
    const els = [...(allSlides[activeSlideIndex]?.elements || [])];
    const idx = els.findIndex(e => e.id === selectedElementId);
    if (idx > 0) {
      const [removed] = els.splice(idx, 1);
      els.unshift(removed);
      const newSlides = [...allSlides];
      newSlides[activeSlideIndex] = { ...newSlides[activeSlideIndex], elements: els };
      useImpressStore.setState({ slides: newSlides });
    }
  };

  return (
    <div className="lo-toolbar flex-wrap gap-0.5 relative">
      <button className="lo-toolbar-btn" onClick={() => pushUndo()} title="Undo"><Undo2 size={16} /></button>
      <button className="lo-toolbar-btn" onClick={() => useImpressStore.getState().redo()} title="Redo"><Redo2 size={16} /></button>

      <div className="w-px h-6 bg-border mx-1" />

      <button className="lo-toolbar-btn" onClick={() => addSlide('title')} title="Add Slide"><Plus size={16} /></button>
      <button className="lo-toolbar-btn" onClick={addTextElement} title="Insert Text Box"><Type size={16} /></button>
      <button className="lo-toolbar-btn" onClick={addShapeElement} title="Insert Rectangle"><Square size={16} /></button>
      <button className="lo-toolbar-btn" onClick={() => {
        addElement(activeSlideIndex, { id: `el-${Date.now()}`, type: 'shape', x: 150 + Math.random() * 200, y: 100 + Math.random() * 100, width: 100, height: 100, content: '', bgColor: '#2196F3', borderRadius: 50 });
      }} title="Insert Circle"><Circle size={16} /></button>
      <button className="lo-toolbar-btn" onClick={addImageElement} title="Insert Image"><ImagePlus size={16} /></button>
      <button className="lo-toolbar-btn" onClick={() => {
        const cols = prompt('Number of columns (1-10):', '3');
        const rows = prompt('Number of rows (1-20):', '3');
        if (cols && rows) {
          const c = Math.min(10, Math.max(1, parseInt(cols) || 3));
          const r = Math.min(20, Math.max(1, parseInt(rows) || 3));
          const tableData = Array.from({ length: r }, () => Array.from({ length: c }, () => ''));
          addElement(activeSlideIndex, { id: `el-${Date.now()}`, type: 'table', x: 80, y: 60, width: 560, height: 280, content: '', tableData, tableCols: c, tableRows: r, borderWidth: 1, borderColor: '#333333', fontSize: 14, color: '#333333' });
        }
      }} title="Insert Table"><TableIcon size={16} /></button>
      <button className="lo-toolbar-btn" onClick={() => cameraInputRef.current?.click()} title="Image from Camera"><Camera size={16} /></button>
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCameraCapture} />

      <div className="w-px h-6 bg-border mx-1" />

      <button className={`lo-toolbar-btn ${selectedElement?.fontWeight === 'bold' ? 'lo-toolbar-btn-active' : ''}`} onClick={toggleBold} title="Bold"><Bold size={16} /></button>
      <button className="lo-toolbar-btn" onClick={() => { if (selectedElementId) updateElement(activeSlideIndex, selectedElementId!, { fontStyle: selectedElement?.fontStyle === 'italic' ? 'normal' : 'italic' }); }} title="Italic"><Italic size={16} /></button>
      <button className="lo-toolbar-btn" onClick={() => { if (selectedElementId) updateElement(activeSlideIndex, selectedElementId!, { textDecoration: selectedElement?.textDecoration === 'underline' ? 'none' : 'underline' }); }} title="Underline"><Underline size={16} /></button>

      <div className="w-px h-6 bg-border mx-1" />

      <button className={`lo-toolbar-btn ${selectedElement?.textAlign === 'left' ? 'lo-toolbar-btn-active' : ''}`} onClick={() => setAlign('left')}><AlignLeft size={16} /></button>
      <button className={`lo-toolbar-btn ${selectedElement?.textAlign === 'center' ? 'lo-toolbar-btn-active' : ''}`} onClick={() => setAlign('center')}><AlignCenter size={16} /></button>
      <button className={`lo-toolbar-btn ${selectedElement?.textAlign === 'right' ? 'lo-toolbar-btn-active' : ''}`} onClick={() => setAlign('right')}><AlignRight size={16} /></button>

      {/* Element ordering & rotation */}
      {selectedElement && (
        <>
          <div className="w-px h-6 bg-border mx-1" />
          <button className="lo-toolbar-btn" onClick={bringToFront} title="Bring to Front"><ArrowUpToLine size={16} /></button>
          <button className="lo-toolbar-btn" onClick={sendToBack} title="Send to Back"><ArrowDownToLine size={16} /></button>
          <button className="lo-toolbar-btn" onClick={() => { setRotateAngle(selectedElement.rotation || 0); setShowRotateDialog(true); }} title="Rotate"><RotateCw size={16} /></button>
        </>
      )}

      {/* Rotation dialog */}
      {showRotateDialog && selectedElementId && (
        <div className="absolute top-full right-0 z-50 bg-white dark:bg-zinc-800 border border-border rounded-md shadow-lg p-3 flex items-center gap-2">
          <input type="range" min="-180" max="180" value={rotateAngle} onChange={e => { setRotateAngle(Number(e.target.value)); updateElement(activeSlideIndex, selectedElementId!, { rotation: Number(e.target.value) }); }} className="w-32" />
          <span className="text-xs w-10 text-right">{rotateAngle}°</span>
          <button className="text-xs px-2 py-1 bg-lo-green text-white rounded" onClick={() => setShowRotateDialog(false)}>OK</button>
        </div>
      )}

      {/* Text box formatting: border, shadow, gradient */}
      {selectedElement && selectedElement.type === 'text' && (
        <>
          <div className="w-px h-6 bg-border mx-1" />
          <button className="lo-toolbar-btn" onClick={() => {
            const bw = (selectedElement.borderWidth || 0) >= 3 ? 0 : (selectedElement.borderWidth || 0) + 1;
            updateElement(activeSlideIndex, selectedElementId!, { borderWidth: bw, borderColor: bw > 0 ? (selectedElement.borderColor || '#333333') : undefined });
          }} title="Border Width">
            <Frame size={16} />
            {selectedElement.borderWidth ? <span className="absolute -top-0.5 -right-0.5 text-[8px] bg-lo-green text-white rounded-full w-3 h-3 flex items-center justify-center">{selectedElement.borderWidth}</span> : null}
          </button>
          <button className={`lo-toolbar-btn ${selectedElement.shadow ? 'lo-toolbar-btn-active' : ''}`} onClick={() => {
            updateElement(activeSlideIndex, selectedElementId!, { shadow: !selectedElement.shadow, shadowColor: selectedElement.shadow ? undefined : 'rgba(0,0,0,0.3)' });
          }} title="Toggle Shadow"><BoxSelect size={16} /></button>
          <div className="relative">
            <button className="lo-toolbar-btn" onClick={() => setShowGradientPicker(!showGradientPicker)} title="Background Gradient"><Layers size={16} /></button>
            {showGradientPicker && (
              <div className="absolute top-full left-0 z-50 bg-white dark:bg-zinc-800 border border-border rounded-md shadow-lg py-1 min-w-[140px]">
                {GRADIENT_PRESETS.map((g) => (
                  <button key={g.label} className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent" onClick={() => { updateElement(activeSlideIndex, selectedElementId!, { gradient: g.value || undefined, bgColor: g.value ? undefined : selectedElement.bgColor }); setShowGradientPicker(false); }}>
                    <span className="inline-block w-4 h-3 rounded-sm mr-2 align-middle" style={{ background: g.value || '#ccc' }} />
                    {g.label}
                    {selectedElement.gradient === g.value && <span className="ml-auto text-lo-green">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className="w-px h-6 bg-border mx-1" />

      <div className="relative">
        <button className="lo-toolbar-btn" onClick={() => setShowThemes(!showThemes)} title="Slide Theme"><Palette size={16} /></button>
        {showThemes && (
          <div className="absolute top-full left-0 z-50 bg-white dark:bg-zinc-800 border border-border rounded-md shadow-lg py-2 min-w-[160px]">
            {Object.entries(THEMES).map(([key, t]) => (
              <button key={key} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent" onClick={() => { setSlideTheme(key); setShowThemes(false); }}>
                <div className="w-5 h-3 rounded-sm border border-border" style={{ background: t.bg }} />
                <span className="capitalize">{key}</span>
                {slideTheme === key && <span className="ml-auto text-lo-green">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <button className="lo-toolbar-btn" onClick={() => setShowTransitions(!showTransitions)} title="Slide Transition">Transition</button>
        {showTransitions && (
          <div className="absolute top-full left-0 z-50 bg-white dark:bg-zinc-800 border border-border rounded-md shadow-lg py-1 min-w-[160px] max-h-80 overflow-y-auto lo-scrollbar">
            {ALL_TRANSITIONS.map((t) => (
              <button key={t.value} className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent" onClick={() => { setSlideTransition(activeSlideIndex, t.value); setShowTransitions(false); }}>
                {t.label}
                {activeSlide?.transition === t.value && <span className="ml-auto text-lo-green">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Animation Effects Picker */}
      {selectedElement && (
        <div className="relative">
          <button className="lo-toolbar-btn" onClick={() => setShowAnimPicker(!showAnimPicker)} title="Animation"><Sparkles size={16} /></button>
          {showAnimPicker && (
            <div className="absolute top-full left-0 z-50 bg-white dark:bg-zinc-800 border border-border rounded-md shadow-lg py-1 min-w-[160px] max-h-60 overflow-y-auto lo-scrollbar">
              <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent font-medium" onClick={() => { updateElement(activeSlideIndex, selectedElementId!, { animation: 'none' }); setShowAnimPicker(false); }}>None</button>
              <div className="px-3 py-1 text-xs text-muted-foreground font-medium">Entrance</div>
              {(['fadeIn', 'slideInLeft', 'slideInRight', 'slideInUp', 'slideInDown', 'zoomIn', 'bounceIn'] as AnimationType[]).map(a => (
                <button key={a} className={`w-full text-left px-3 py-1.5 text-sm hover:bg-accent ${selectedElement.animation === a ? 'text-lo-green font-medium' : ''}`} onClick={() => { updateElement(activeSlideIndex, selectedElementId!, { animation: a }); setShowAnimPicker(false); }}>{a}</button>
              ))}
              <div className="px-3 py-1 text-xs text-muted-foreground font-medium">Exit</div>
              {(['fadeOut', 'slideOutLeft', 'slideOutRight', 'slideOutUp', 'slideOutDown', 'zoomOut'] as AnimationType[]).map(a => (
                <button key={a} className={`w-full text-left px-3 py-1.5 text-sm hover:bg-accent ${selectedElement.animation === a ? 'text-lo-green font-medium' : ''}`} onClick={() => { updateElement(activeSlideIndex, selectedElementId!, { animation: a }); setShowAnimPicker(false); }}>{a}</button>
              ))}
              <div className="px-3 py-1 text-xs text-muted-foreground font-medium">Emphasis</div>
              {(['pulse', 'shake', 'tada', 'jello', 'heartBeat'] as AnimationType[]).map(a => (
                <button key={a} className={`w-full text-left px-3 py-1.5 text-sm hover:bg-accent ${selectedElement.animation === a ? 'text-lo-green font-medium' : ''}`} onClick={() => { updateElement(activeSlideIndex, selectedElementId!, { animation: a }); setShowAnimPicker(false); }}>{a}</button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="w-px h-6 bg-border mx-1" />

      <button className="lo-toolbar-btn" onClick={setBackgroundImage} title="Set Image Background"><ImageIcon size={16} /></button>

      <button className="lo-toolbar-btn" onClick={() => setColor('#18A303')} title="Green"><div className="w-5 h-5 rounded-sm bg-[#18A303] border border-black/20" /></button>
      <button className="lo-toolbar-btn" onClick={() => setColor('#2196F3')} title="Blue"><div className="w-5 h-5 rounded-sm bg-[#2196F3] border border-black/20" /></button>
      <button className="lo-toolbar-btn" onClick={() => setColor('#FF5722')} title="Orange"><div className="w-5 h-5 rounded-sm bg-[#FF5722] border border-black/20" /></button>
      <button className="lo-toolbar-btn" onClick={() => setColor('#795548')} title="Brown"><div className="w-5 h-5 rounded-sm bg-[#795548] border border-black/20" /></button>
      <button className="lo-toolbar-btn" onClick={() => setColor('#333333')} title="Dark"><div className="w-5 h-5 rounded-sm bg-[#333333] border border-black/20" /></button>
      <button className="lo-toolbar-btn" onClick={() => setColor('#ffffff')} title="White"><div className="w-5 h-5 rounded-sm bg-white border border-black/20" /></button>

      <div className="w-px h-6 bg-border mx-1" />

      <button className="lo-toolbar-btn" onClick={() => { if (selectedElementId) { copyElement(activeSlideIndex, selectedElementId); } }} title="Copy"><Copy size={16} /></button>
      <button className="lo-toolbar-btn" onClick={() => pasteElement(activeSlideIndex)} title="Paste"><ClipboardPaste size={16} /></button>
    </div>
  );
}

export function getImpressHandlers() {
  return {
    save: () => { downloadJSON(useAppStore.getState().fileName, useImpressStore.getState().slides); useAppStore.getState().setModified(false); },
    open: async () => {
      try {
        const { name, content } = await openFile('.json');
        const data = JSON.parse(content);
        if (Array.isArray(data)) { useImpressStore.setState({ slides: data, activeSlideIndex: 0 }); useAppStore.getState().setFileName(name); useAppStore.getState().setModified(false); }
      } catch {}
    },
    print: () => printDocument(),
  };
}