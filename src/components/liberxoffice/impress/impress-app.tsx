'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useImpressStore } from '@/stores/impress-store';
import { useAppStore } from '@/stores/app-store';
import { downloadJSON, openFile, autoSave, loadAutoSave } from '@/lib/file-service';
import MenuBar from '../shared/menu-bar';
import StatusBar from '../shared/status-bar';
import ImpressToolbar from './impress-toolbar';
import PresentationMode from './presentation-mode';
import SlideMasterDialog from './slide-master';
import SlideSorter from './slide-sorter';
import DuplicateSlideDialog from './duplicate-slide-dialog';
import SaveAsDialog from '../dialogs/save-as-dialog';
import { Copy, Trash2, ChevronLeft, ChevronRight, Maximize2, ZoomIn, ZoomOut, Plus, GripVertical, StickyNote, LayoutGrid, Files, Grid3X3 } from 'lucide-react';

const SLIDE_WIDTH = 720;
const SLIDE_HEIGHT = 405;

export default function ImpressApp() {
  const {
    slides, activeSlideIndex, selectedElementId, isPresenting, isEditingText, zoomLevel,
    addSlide, deleteSlide, duplicateSlide, setActiveSlide, selectElement,
    setPresenting, setZoom, updateElement, deleteElement, undo, pushUndo,
    moveSlide, redo, copyElement, pasteElement, addElement, setEditingText, setSlideNotes,
    snapToGrid, setSnapToGrid, snapValue,
  } = useImpressStore();
  const { fileName, setFileName, setModified, sidebarOpen, showSlideSorter, showNotesPanel,
    toggleSlideSorter, toggleNotesPanel, toggleDuplicateDialog, showSaveAsDialog, toggleSaveAsDialog } = useAppStore();
  const activeSlide = slides[activeSlideIndex];

  // Drag state for elements
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragElStart, setDragElStart] = useState({ x: 0, y: 0 });
  const slidePanelRef = useRef<HTMLDivElement>(null);
  const [dragSlideIdx, setDragSlideIdx] = useState<number | null>(null);

  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0, elX: 0, elY: 0 });

  // Auto-save + load
  React.useEffect(() => {
    const i = setInterval(() => autoSave('impress', JSON.stringify(useImpressStore.getState().slides)), 30000);
    return () => clearInterval(i);
  }, []);

  React.useEffect(() => {
    const saved = loadAutoSave('impress');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (Array.isArray(data) && data.length > 0) {
          useImpressStore.setState({ slides: data });
        }
      } catch {}
    }
  }, []);

  // Auto-save thumbnails for recent files
  React.useEffect(() => {
    const saveThumbnails = () => {
      try {
        const slides = useImpressStore.getState().slides;
        const mini = slides.slice(0, 4).map((s) => ({
          bg: s.background,
          elements: s.elements.slice(0, 4).map((e) => ({ t: e.type, x: e.x, y: e.y, w: e.width, h: e.height, c: e.content.slice(0, 40), bg: e.bgColor, col: e.color })),
        }));
        localStorage.setItem('liberxoffice-impress-thumb', JSON.stringify(mini));
      } catch {}
    };
    const i = setInterval(saveThumbnails, 30000);
    saveThumbnails();
    return () => clearInterval(i);
  }, []);

  const handleSave = () => {
    downloadJSON(fileName, useImpressStore.getState().slides);
    setModified(false);
  };

  const handleOpen = async () => {
    try {
      const { name, content } = await openFile('.json');
      const data = JSON.parse(content);
      if (Array.isArray(data)) { useImpressStore.setState({ slides: data, activeSlideIndex: 0 }); setFileName(name); setModified(false); }
    } catch {}
  };

  // Element single-click = select (for move/resize)
  const handleElementMouseDown = (elementId: string, e: React.MouseEvent) => {
    if (isEditingText && selectedElementId === elementId) return;
    e.stopPropagation();
    selectElement(elementId);
    const el = activeSlide?.elements.find((x) => x.id === elementId);
    if (!el) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragElStart({ x: el.x, y: el.y });
  };

  // Double-click on text element = enter edit mode
  const handleElementDoubleClick = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const el = activeSlide?.elements.find((x) => x.id === elementId);
    if (!el || el.type !== 'text') return;
    setIsDragging(false);
    selectElement(elementId);
    setEditingText(true);
    setTimeout(() => {
      const dom = document.querySelector(`[data-element-id="${elementId}"]`);
      if (dom) {
        (dom as HTMLElement).focus();
        const range = document.createRange();
        range.selectNodeContents(dom);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 50);
  };

  const exitEditMode = () => {
    if (isEditingText) setEditingText(false);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing && selectedElementId && resizeHandle) {
      const scale = zoomLevel / 100;
      const dx = (e.clientX - resizeStart.x) / scale;
      const dy = (e.clientY - resizeStart.y) / scale;
      const MIN_SIZE = 20;
      let newX = resizeStart.elX;
      let newY = resizeStart.elY;
      let newW = resizeStart.w;
      let newH = resizeStart.h;

      if (resizeHandle.includes('e')) newW = Math.max(MIN_SIZE, resizeStart.w + dx);
      if (resizeHandle.includes('w')) { newW = Math.max(MIN_SIZE, resizeStart.w - dx); newX = resizeStart.elX + dx; }
      if (resizeHandle.includes('s')) newH = Math.max(MIN_SIZE, resizeStart.h + dy);
      if (resizeHandle.includes('n')) { newH = Math.max(MIN_SIZE, resizeStart.h - dy); newY = resizeStart.elY + dy; }

      if (snapToGrid) {
        newX = snapValue(newX); newY = snapValue(newY);
        newW = snapValue(newW); newH = snapValue(newH);
      }
      newW = Math.max(MIN_SIZE, newW); newH = Math.max(MIN_SIZE, newH);

      updateElement(activeSlideIndex, selectedElementId, { x: newX, y: newY, width: newW, height: newH });
      setModified(true);
      return;
    }
    if (!isDragging || !selectedElementId) return;
    const scale = zoomLevel / 100;
    let dx = (e.clientX - dragStart.x) / scale;
    let dy = (e.clientY - dragStart.y) / scale;
    if (snapToGrid) { dx = snapValue(dragElStart.x + dx) - dragElStart.x; dy = snapValue(dragElStart.y + dy) - dragElStart.y; }
    updateElement(activeSlideIndex, selectedElementId, {
      x: Math.max(0, Math.min(SLIDE_WIDTH - 20, dragElStart.x + dx)),
      y: Math.max(0, Math.min(SLIDE_HEIGHT - 20, dragElStart.y + dy)),
    });
    setModified(true);
  }, [isDragging, isResizing, selectedElementId, activeSlideIndex, zoomLevel, dragStart, dragElStart, resizeStart, resizeHandle, snapToGrid, snapValue, updateElement, setModified]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  const handleResizeStart = (elementId: string, handle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const el = activeSlide?.elements.find((x) => x.id === elementId);
    if (!el) return;
    pushUndo();
    setIsResizing(true);
    setResizeHandle(handle);
    setResizeStart({ x: e.clientX, y: e.clientY, w: el.width, h: el.height, elX: el.x, elY: el.y });
  };

  React.useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Slide drag reorder
  const handleSlideDragStart = (idx: number, e: React.DragEvent) => {
    setDragSlideIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSlideDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleSlideDrop = (targetIdx: number) => {
    if (dragSlideIdx !== null && dragSlideIdx !== targetIdx) {
      pushUndo();
      moveSlide(dragSlideIdx, targetIdx);
    }
    setDragSlideIdx(null);
  };

  const handleSlideClick = () => { selectElement(null); exitEditMode(); };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isEditingText) { setEditingText(false); (e.target as HTMLElement).blur(); return; }
      selectElement(null);
      return;
    }
    if (selectedElementId && activeSlide) {
      if (isEditingText) return;
      const el = activeSlide.elements.find((x) => x.id === selectedElementId);
      if (!el) return;
      const step = e.shiftKey ? 10 : 1;
      switch (e.key) {
        case 'ArrowUp': e.preventDefault(); updateElement(activeSlideIndex, selectedElementId, { y: el.y - step }); break;
        case 'ArrowDown': e.preventDefault(); updateElement(activeSlideIndex, selectedElementId, { y: el.y + step }); break;
        case 'ArrowLeft': e.preventDefault(); updateElement(activeSlideIndex, selectedElementId, { x: el.x - step }); break;
        case 'ArrowRight': e.preventDefault(); updateElement(activeSlideIndex, selectedElementId, { x: el.x + step }); break;
        case 'Delete': case 'Backspace':
          e.preventDefault(); pushUndo(); deleteElement(activeSlideIndex, selectedElementId); break;
      }
    }
  }, [selectedElementId, activeSlide, activeSlideIndex, isEditingText, updateElement, deleteElement, pushUndo, setEditingText, selectElement]);

  if (isPresenting) return <PresentationMode />;
  if (showSlideSorter) return <SlideSorter />;

  // Helper to get background style for a slide
  const getSlideBgStyle = (bg?: string): React.CSSProperties => {
    if (bg?.startsWith('data:')) {
      return { backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    }
    return { background: bg || '#fff' };
  };

  // Helper to get element styles
  const getElementStyle = (el: typeof slides[0]['elements'][0], scale: number): React.CSSProperties => {
    const bgImage = el.gradient || undefined;
    return {
      left: el.x * scale,
      top: el.y * scale,
      width: el.width * scale,
      height: el.height * scale,
      fontSize: (el.fontSize || 12) * scale,
      fontWeight: el.fontWeight,
      fontStyle: el.fontStyle,
      textDecoration: el.textDecoration,
      color: el.color,
      textAlign: el.textAlign,
      backgroundColor: el.type === 'shape' ? el.bgColor : (el.type === 'text' && el.bgColor && !el.gradient ? el.bgColor : el.gradient ? undefined : 'transparent'),
      backgroundImage: bgImage,
      borderRadius: el.borderRadius ? `${el.borderRadius * scale}px` : 0,
      border: el.borderWidth ? `${el.borderWidth * scale}px solid ${el.borderColor || '#000'}` : undefined,
      boxShadow: el.shadow ? `2px 2px 8px ${el.shadowColor || 'rgba(0,0,0,0.3)'}` : undefined,
      transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
      lineHeight: 1.4,
      userSelect: isEditingText && selectedElementId === el.id ? 'text' : 'none',
      outline: 'none',
      cursor: isEditingText && selectedElementId === el.id ? 'text' : selectedElementId === el.id ? (isDragging ? 'grabbing' : 'grab') : 'default',
      overflow: 'hidden',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    };
  };

  return (
    <div className="flex flex-col h-full" onKeyDown={handleKeyDown} tabIndex={0}>
      <MenuBar
        currentView="impress"
        onNewDocument={() => { useImpressStore.setState({ slides: [{ id: `slide-${Date.now()}`, layout: 'title', transition: 'none', background: '#ffffff', elements: [
          { id: `el-${Date.now()}-1`, type: 'text', x: 50, y: 150, width: 620, height: 80, content: 'New Presentation', fontSize: 36, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center' },
          { id: `el-${Date.now()}-2`, type: 'text', x: 100, y: 260, width: 520, height: 40, content: 'Click to add subtitle', fontSize: 18, fontWeight: 'normal', color: '#666666', textAlign: 'center' },
        ]}], activeSlideIndex: 0, selectedElementId: null }); useAppStore.getState().setFileName('Untitled Presentation'); }}
        onSave={handleSave}
        onOpen={handleOpen}
        onUndo={() => undo()}
        onRedo={() => redo()}
        onExport={handleSave}
        onPrint={() => window.print()}
      />
      <ImpressToolbar />

      {/* Dialogs */}
      <SlideMasterDialog />
      <DuplicateSlideDialog />
      <SaveAsDialog open={showSaveAsDialog} onClose={toggleSaveAsDialog} onSave={(name) => {
        downloadJSON(name, useImpressStore.getState().slides);
        setModified(false);
      }} />

      <div className="flex flex-1 overflow-hidden">
        {/* Slide Panel */}
        <div className={`bg-lo-slide-panel border-r border-border flex flex-col transition-all duration-200 ${sidebarOpen ? 'w-56' : 'w-0 overflow-hidden'}`}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground">Slides</span>
            <button className="lo-toolbar-btn w-7 h-7" onClick={() => { pushUndo(); addSlide('title'); }} title="Add Slide"><Plus size={14} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2 lo-scrollbar" ref={slidePanelRef}>
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`slide-thumbnail ${index === activeSlideIndex ? 'slide-thumbnail-active' : ''} cursor-grab active:cursor-grabbing`}
                onClick={() => setActiveSlide(index)}
                draggable
                onDragStart={(e) => handleSlideDragStart(index, e)}
                onDragOver={handleSlideDragOver}
                onDrop={(e) => { e.stopPropagation(); handleSlideDrop(index); }}
              >
                <div className="bg-white rounded-sm overflow-hidden relative" style={{ aspectRatio: '16/9', ...getSlideBgStyle(slide.background) }}>
                  <div className="absolute top-0.5 left-1 text-[8px] text-muted-foreground z-10">{index + 1}</div>
                  {/* Notes indicator on thumbnail */}
                  {slide.notes && (
                    <div className="absolute top-0.5 right-1 z-10 text-[10px]" title="Has notes">📝</div>
                  )}
                  <div className="relative w-full h-full p-1">
                    {slide.elements.slice(0, 4).map((el) => (
                      <div key={el.id} className="absolute overflow-hidden"
                        style={{ left: `${(el.x / SLIDE_WIDTH) * 100}%`, top: `${(el.y / SLIDE_HEIGHT) * 100}%`,
                          width: `${(el.width / SLIDE_WIDTH) * 100}%`, height: `${(el.height / SLIDE_HEIGHT) * 100}%`,
                          fontSize: `${(el.fontSize || 12) * 0.3}px`, fontWeight: el.fontWeight, color: el.color, textAlign: el.textAlign,
                          backgroundColor: el.type === 'shape' ? el.bgColor : (el.type === 'text' && el.bgColor ? el.bgColor : 'transparent'),
                          backgroundImage: el.gradient || undefined,
                          borderRadius: el.borderRadius ? `${el.borderRadius * 0.3}px` : 0, lineHeight: 1.2 }}>
                        {el.type === 'text' && <span className="line-clamp-2">{el.content}</span>}
                        {el.type === 'image' && el.src && <img src={el.src} className="w-full h-full object-cover" alt="" />}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-center text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                  <GripVertical size={10} className="opacity-40" />
                  Slide {index + 1}
                  {slide.transition !== 'none' && <span className="text-[9px] text-lo-green">*</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#808080]/10">
          <div className="flex items-center justify-center gap-2 py-1.5 bg-lo-toolbar/50 border-b border-border">
            <button className="lo-toolbar-btn w-7 h-7" onClick={() => setZoom(zoomLevel - 10)}><ZoomOut size={14} /></button>
            <span className="text-xs text-muted-foreground w-12 text-center">{zoomLevel}%</span>
            <button className="lo-toolbar-btn w-7 h-7" onClick={() => setZoom(zoomLevel + 10)}><ZoomIn size={14} /></button>
            <div className="w-px h-6 bg-border mx-1" />
            <button className={`lo-toolbar-btn w-7 h-7 ${snapToGrid ? 'lo-toolbar-btn-active' : ''}`} onClick={() => setSnapToGrid(!snapToGrid)} title="Snap to Grid"><Grid3X3 size={14} /></button>
          </div>

          <div className="flex-1 overflow-auto lo-scrollbar flex items-center justify-center p-8">
            <div className="bg-white shadow-xl relative" style={{ width: SLIDE_WIDTH * (zoomLevel / 100), height: SLIDE_HEIGHT * (zoomLevel / 100), ...getSlideBgStyle(activeSlide?.background) }} onClick={handleSlideClick}>
              {activeSlide?.elements.map((el) => {
                const isEditing = isEditingText && selectedElementId === el.id && el.type === 'text';
                const isSelected = selectedElementId === el.id;
                const scale = zoomLevel / 100;

                const handlePositions: Record<string, React.CSSProperties & { cursor: string }> = {
                  nw: { top: -4, left: -4, cursor: 'nw-resize' },
                  n: { top: -4, left: '50%', marginLeft: -4, cursor: 'n-resize' },
                  ne: { top: -4, right: -4, cursor: 'ne-resize' },
                  w: { top: '50%', left: -4, marginTop: -4, cursor: 'w-resize' },
                  e: { top: '50%', right: -4, marginTop: -4, cursor: 'e-resize' },
                  sw: { bottom: -4, left: -4, cursor: 'sw-resize' },
                  s: { bottom: -4, left: '50%', marginLeft: -4, cursor: 's-resize' },
                  se: { bottom: -4, right: -4, cursor: 'se-resize' },
                };

                return (
                <div key={el.id} data-element-id={el.id}
                  className={`absolute ${isSelected ? (isEditing ? 'ring-2 ring-lo-green ring-offset-1' : 'ring-2 ring-primary ring-offset-1') : ''} ${el.animation && el.animation !== 'none' ? `animate-el-${el.animation}` : ''}`}
                  style={getElementStyle(el, zoomLevel / 100)}
                  onMouseDown={(e) => handleElementMouseDown(el.id, e)}
                  onDoubleClick={(e) => handleElementDoubleClick(el.id, e)}
                  contentEditable={isEditing}
                  suppressContentEditableWarning
                  onBlur={(e) => { if (el.type === 'text' && isEditingText) { pushUndo(); updateElement(activeSlideIndex, el.id, { content: e.currentTarget.innerText }); setModified(true); setEditingText(false); } }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') { setEditingText(false); (e.target as HTMLElement).blur(); }
                  }}>
                  {el.type === 'text' ? el.content : null}
                  {el.type === 'image' && el.src && <img src={el.src} className="w-full h-full object-contain" alt="" draggable={false} />}
                  {el.type === 'table' && el.tableData && (
                    <div className="w-full h-full overflow-auto text-[10px]">
                      <table className="w-full h-full border-collapse" style={{ borderColor: el.borderColor || '#333' }}>
                        <tbody>
                          {el.tableData.map((row, ri) => (
                            <tr key={ri}>
                              {row.map((cell, ci) => (
                                <td key={ci} className="border px-1 py-0.5"
                                  style={{ borderColor: el.borderColor || '#333', minWidth: `${60 * scale}px` }}
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => {
                                    const newData = el.tableData!.map(r => [...r]);
                                    newData[ri][ci] = e.currentTarget.innerText;
                                    pushUndo(); updateElement(activeSlideIndex, el.id, { tableData: newData }); setModified(true);
                                  }}
                                  dangerouslySetInnerHTML={{ __html: cell }}
                                />
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {isSelected && !isEditing && (['nw','n','ne','w','e','sw','s','se'] as const).map((h) => {
                    const pos = handlePositions[h];
                    return (
                      <div key={h} className="absolute w-2.5 h-2.5 bg-white border-2 border-primary rounded-sm z-20"
                        style={{ ...pos, cursor: pos.cursor }}
                        onMouseDown={(e) => handleResizeStart(el.id, h, e)} />
                    );
                  })}
                </div>
                );
              })}
              {activeSlide?.elements.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">Double-click to add text, or use the toolbar to add elements</div>
              )}
            </div>
          </div>

          {/* Notes Panel */}
          {showNotesPanel && (
            <div className="border-t border-border bg-white dark:bg-zinc-800">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-lo-toolbar/50">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1"><StickyNote size={12} /> Speaker Notes - Slide {activeSlideIndex + 1}</span>
                <button className="lo-toolbar-btn w-6 h-6" onClick={toggleNotesPanel} title="Close Notes">✕</button>
              </div>
              <textarea
                className="w-full h-24 px-3 py-2 text-sm bg-transparent resize-none outline-none lo-scrollbar"
                placeholder="Type your speaker notes here..."
                value={activeSlide?.notes || ''}
                onChange={(e) => { setSlideNotes(activeSlideIndex, e.target.value); setModified(true); }}
              />
            </div>
          )}

          {/* Bottom Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-lo-toolbar border-t border-border">
            <div className="flex items-center gap-1">
              <button className="lo-toolbar-btn w-7 h-7" onClick={() => setActiveSlide(Math.max(0, activeSlideIndex - 1))} disabled={activeSlideIndex === 0}><ChevronLeft size={14} /></button>
              <span className="text-xs text-muted-foreground px-2">Slide {activeSlideIndex + 1} of {slides.length}</span>
              <button className="lo-toolbar-btn w-7 h-7" onClick={() => setActiveSlide(Math.min(slides.length - 1, activeSlideIndex + 1))} disabled={activeSlideIndex === slides.length - 1}><ChevronRight size={14} /></button>
            </div>
            <div className="flex items-center gap-1">
              <button className="lo-toolbar-btn" onClick={() => { pushUndo(); duplicateSlide(activeSlideIndex); }} title="Duplicate"><Copy size={14} /></button>
              <button className="lo-toolbar-btn" onClick={toggleDuplicateDialog} title="Duplicate with Options"><Files size={14} /></button>
              <button className={`lo-toolbar-btn ${showNotesPanel ? 'lo-toolbar-btn-active' : ''}`} onClick={toggleNotesPanel} title="Notes Panel"><StickyNote size={14} /></button>
              <button className={`lo-toolbar-btn ${showSlideSorter ? 'lo-toolbar-btn-active' : ''}`} onClick={toggleSlideSorter} title="Slide Sorter"><LayoutGrid size={14} /></button>
              <button className="lo-toolbar-btn w-7 h-7 text-destructive" onClick={() => { pushUndo(); deleteSlide(activeSlideIndex); }} disabled={slides.length <= 1} title="Delete"><Trash2 size={14} /></button>
            </div>
            <button className="flex items-center gap-2 px-4 py-1.5 bg-lo-green text-white rounded-md text-sm font-medium hover:bg-lo-green-dark transition-colors touch-target"
              onClick={() => setPresenting(true)}>
              <Maximize2 size={14} />
              <span className="hidden sm:inline">Start Presentation</span>
              <span className="sm:hidden">Present</span>
            </button>
          </div>
        </div>
      </div>
      <StatusBar currentView="impress" extraInfo={`Slide ${activeSlideIndex + 1}/${slides.length}${activeSlide?.transition !== 'none' ? ` | Transition: ${activeSlide.transition}` : ''}${activeSlide?.notes ? ' | 📝' : ''} | Single-click: select & drag, Double-click: edit text`} />
    </div>
  );
}
