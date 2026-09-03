'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useImpressStore } from '@/stores/impress-store';
import { useAppStore } from '@/stores/app-store';
import { X, GripVertical, Plus, Trash2, ArrowRightLeft } from 'lucide-react';

const SLIDE_WIDTH = 720;
const SLIDE_HEIGHT = 405;

export default function SlideSorter() {
  const { slides, activeSlideIndex, setActiveSlide, deleteSlide, addSlide, moveSlide, pushUndo } = useImpressStore();
  const { toggleSlideSorter } = useAppStore();
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => setDragIdx(idx);

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverIdx(idx);
  };

  const handleDrop = (targetIdx: number) => {
    if (dragIdx !== null && dragIdx !== targetIdx) {
      pushUndo();
      moveSlide(dragIdx, targetIdx);
    }
    setDragIdx(null);
    setOverIdx(null);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setOverIdx(null);
  };

  const handleDoubleClick = (idx: number) => {
    setActiveSlide(idx);
    toggleSlideSorter();
  };

  const handleAdd = () => {
    addSlide('title');
  };

  const handleDelete = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (slides.length > 1) {
      pushUndo();
      deleteSlide(idx);
    }
  };

  const getTransitionLabel = (t: string) => {
    if (t === 'none') return null;
    return t;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-lo-toolbar">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">Slide Sorter</h2>
          <span className="text-xs text-muted-foreground">{slides.length} slides</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1"><ArrowRightLeft size={12} /> Drag to reorder • Double-click to edit</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="lo-toolbar-btn" onClick={handleAdd} title="Add Slide"><Plus size={16} /></button>
          <button className="lo-toolbar-btn w-8 h-8" onClick={toggleSlideSorter}><X size={16} /></button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto lo-scrollbar p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`group relative rounded-lg border-2 transition-all cursor-grab active:cursor-grabbing ${
                index === activeSlideIndex ? 'border-lo-green shadow-md' :
                overIdx === index && dragIdx !== index ? 'border-lo-green/50 border-dashed' :
                dragIdx === index ? 'opacity-50' : 'border-border hover:border-lo-green/40'
              }`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => { e.stopPropagation(); handleDrop(index); }}
              onDragEnd={handleDragEnd}
              onClick={() => setActiveSlide(index)}
              onDoubleClick={() => handleDoubleClick(index)}
            >
              {/* Slide Number Badge */}
              <div className="absolute top-2 left-2 z-10 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                {index + 1}
              </div>

              {/* Transition Indicator */}
              {getTransitionLabel(slide.transition) && (
                <div className="absolute top-2 right-2 z-10 bg-lo-green/80 text-white text-[10px] px-1.5 py-0.5 rounded">
                  {slide.transition}
                </div>
              )}

              {/* Notes Indicator */}
              {slide.notes && (
                <div className="absolute bottom-2 left-2 z-10 bg-yellow-500/80 text-white text-[10px] px-1.5 py-0.5 rounded">
                  📝
                </div>
              )}

              {/* Delete button */}
              <button
                className="absolute bottom-2 right-2 z-10 bg-red-500/80 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                onClick={(e) => handleDelete(index, e)}
                title="Delete Slide"
              >
                <Trash2 size={12} />
              </button>

              {/* Thumbnail */}
              <div
                className="rounded-t-md overflow-hidden relative"
                style={{ aspectRatio: '16/9', background: slide.background?.startsWith('data:') ? undefined : (slide.background || '#fff') }}
              >
                {slide.background?.startsWith('data:') && (
                  <img src={slide.background} className="absolute inset-0 w-full h-full object-cover" alt="" />
                )}
                <div className="relative w-full h-full p-2">
                  {slide.elements.slice(0, 6).map((el) => (
                    <div key={el.id} className="absolute overflow-hidden"
                      style={{
                        left: `${(el.x / SLIDE_WIDTH) * 100}%`, top: `${(el.y / SLIDE_HEIGHT) * 100}%`,
                        width: `${(el.width / SLIDE_WIDTH) * 100}%`, height: `${(el.height / SLIDE_HEIGHT) * 100}%`,
                        fontSize: `${(el.fontSize || 12) * 0.25}px`, fontWeight: el.fontWeight, color: el.color, textAlign: el.textAlign,
                        backgroundColor: el.type === 'shape' ? el.bgColor : (el.type === 'text' && el.bgColor ? el.bgColor : 'transparent'),
                        borderRadius: el.borderRadius ? `${el.borderRadius * 0.25}px` : 0,
                        lineHeight: 1.2,
                      }}
                    >
                      {el.type === 'text' && <span className="line-clamp-2">{el.content}</span>}
                      {el.type === 'image' && el.src && <img src={el.src} className="w-full h-full object-cover" alt="" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Label */}
              <div className="px-2 py-1.5 flex items-center justify-center gap-1">
                <GripVertical size={12} className="text-muted-foreground opacity-40" />
                <span className="text-xs text-muted-foreground">Slide {index + 1}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
