'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useImpressStore } from '@/stores/impress-store';
import { X, ChevronLeft, ChevronRight, MonitorSpeaker, Clock } from 'lucide-react';

const SLIDE_WIDTH = 960;
const SLIDE_HEIGHT = 540;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getAnimClass(transition: string, direction: 'out' | 'in'): string {
  const t = direction === 'out' ? 'out' : 'in';
  switch (transition) {
    case 'fade': return `animate-fade-${t}`;
    case 'slide-left': return direction === 'out' ? 'animate-slide-out-left' : 'animate-slide-in-right';
    case 'slide-right': return direction === 'out' ? 'animate-slide-out-right' : 'animate-slide-in-left';
    case 'zoom': return `animate-zoom-${t}`;
    case 'flip': return `animate-flip-${t}`;
    case 'dissolve': return `animate-dissolve-${t}`;
    case 'wipe-right': return direction === 'out' ? 'animate-wipe-out-right' : 'animate-wipe-in-right';
    case 'wipe-left': return direction === 'out' ? 'animate-wipe-out-left' : 'animate-wipe-in-left';
    case 'wipe-down': return direction === 'out' ? 'animate-wipe-out-down' : 'animate-wipe-in-down';
    case 'wipe-up': return direction === 'out' ? 'animate-wipe-out-up' : 'animate-wipe-in-up';
    case 'push-left': return direction === 'out' ? 'animate-push-out-left' : 'animate-push-in-right';
    case 'push-right': return direction === 'out' ? 'animate-push-out-right' : 'animate-push-in-left';
    case 'cover': return direction === 'out' ? '' : 'animate-cover-in';
    case 'uncover': return direction === 'out' ? 'animate-uncover-out' : '';
    default: return '';
  }
}

function getTransitionDuration(transition: string): number {
  if (transition === 'none') return 0;
  if (transition === 'dissolve') return 600;
  return 350;
}

export default function PresentationMode() {
  const { slides, activeSlideIndex, setActiveSlide, setPresenting } = useImpressStore();
  const [currentIndex, setCurrentIndex] = useState(activeSlideIndex);
  const [animating, setAnimating] = useState(false);
  const [animClass, setAnimClass] = useState('');
  const [speakerView, setSpeakerView] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const goNext = useCallback(() => {
    const idx = currentIndexRef.current;
    if (idx >= slides.length - 1) return;
    setAnimating(true);
    const t = slides[idx]?.transition || 'none';
    const outClass = getAnimClass(t, 'out');
    setAnimClass(outClass);
    const dur = getTransitionDuration(t);
    timeoutRef.current = setTimeout(() => {
      const next = idx + 1;
      setActiveSlide(next);
      setCurrentIndex(next);
      currentIndexRef.current = next;
      const inClass = getAnimClass(t, 'in');
      setAnimClass(inClass);
      setTimeout(() => { setAnimating(false); setAnimClass(''); }, dur || 300);
    }, dur || 0);
  }, [slides, setActiveSlide]);

  const goPrev = useCallback(() => {
    const idx = currentIndexRef.current;
    if (idx <= 0) return;
    const t = slides[idx - 1]?.transition || 'none';
    setAnimating(true);
    const dur = getTransitionDuration(t);
    setAnimClass(getAnimClass(t, 'out'));
    timeoutRef.current = setTimeout(() => {
      const prev = idx - 1;
      setActiveSlide(prev);
      setCurrentIndex(prev);
      currentIndexRef.current = prev;
      setAnimClass(getAnimClass(t, 'in'));
      setTimeout(() => { setAnimating(false); setAnimClass(''); }, dur || 300);
    }, dur || 0);
  }, [slides, setActiveSlide]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape': setPresenting(false); break;
        case 'ArrowRight': case ' ': case 'PageDown': e.preventDefault(); goNext(); break;
        case 'ArrowLeft': case 'PageUp': e.preventDefault(); goPrev(); break;
        case 'Home': { setActiveSlide(0); setCurrentIndex(0); currentIndexRef.current = 0; break; }
        case 'End': { const last = slides.length - 1; setActiveSlide(last); setCurrentIndex(last); currentIndexRef.current = last; break; }
        case 's': case 'S': setSpeakerView((v) => !v); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, setPresenting, goNext, goPrev, setActiveSlide]);

  useEffect(() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const currentSlide = slides[currentIndex];
  const nextSlide = slides[currentIndex + 1];
  if (!currentSlide) return null;

  // Helper to render slide elements
  const renderSlideElements = (slide: typeof currentSlide, s: number) => (
    <>
      {slide.elements.map((el) => (
        <div key={el.id} className="absolute" style={{
          left: el.x * s, top: el.y * s, width: el.width * s, height: el.height * s,
          fontSize: (el.fontSize || 12) * s, fontWeight: el.fontWeight, fontStyle: el.fontStyle, textDecoration: el.textDecoration,
          color: el.color, textAlign: el.textAlign,
          backgroundColor: el.type === 'shape' ? el.bgColor : (el.type === 'text' && el.bgColor ? el.bgColor : 'transparent'),
          backgroundImage: el.gradient || undefined,
          borderRadius: el.borderRadius ? `${el.borderRadius * s}px` : 0,
          border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor || '#000'}` : undefined,
          boxShadow: el.shadow ? `2px 2px 8px ${el.shadowColor || 'rgba(0,0,0,0.3)'}` : undefined,
          lineHeight: 1.4, whiteSpace: 'pre-wrap', overflow: 'hidden',
        }}>
          {el.type === 'text' ? el.content : null}
          {el.type === 'image' && el.src && <img src={el.src} className="w-full h-full object-contain" alt="slide image" />}
        </div>
      ))}
    </>
  );

  // Background style helper
  const getBgStyle = (slide: typeof currentSlide): React.CSSProperties => {
    if (slide.background?.startsWith('data:')) {
      return { backgroundImage: `url(${slide.background})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    }
    return { background: slide.background || '#fff' };
  };

  // Speaker View
  if (speakerView) {
    return (
      <div className="fixed inset-0 z-50 bg-zinc-900 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 text-white">
          <div className="flex items-center gap-3">
            <MonitorSpeaker size={16} className="text-lo-green" />
            <span className="text-sm font-medium">Speaker View</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-yellow-300">
              <Clock size={14} />
              <span className="font-mono">{formatTime(elapsed)}</span>
            </div>
            <span className="text-sm text-white/60">{currentIndex + 1} / {slides.length}</span>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10" onClick={(e) => { e.stopPropagation(); setSpeakerView(false); }}><X size={18} /></button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Current slide (large) */}
          <div className="flex-1 flex items-center justify-center p-4 relative" onClick={goNext}>
            <div className={`relative bg-white ${animClass}`} style={{ width: '100%', maxWidth: 960, aspectRatio: '16/9', ...getBgStyle(currentSlide) }} onClick={(e) => e.stopPropagation()}>
              {renderSlideElements(currentSlide, 1)}
            </div>
          </div>

          {/* Right panel: next slide + notes */}
          <div className="w-72 bg-zinc-800 flex flex-col border-l border-zinc-700">
            {/* Next slide */}
            {nextSlide && (
              <div className="p-3 border-b border-zinc-700">
                <div className="text-xs text-white/50 mb-2 font-medium">Next Slide</div>
                <div className="rounded overflow-hidden relative bg-white" style={{ aspectRatio: '16/9', ...getBgStyle(nextSlide) }}>
                  <div style={{ transform: 'scale(1)', width: '100%', height: '100%' }}>
                    {renderSlideElements(nextSlide, 0.22)}
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="flex-1 p-3 overflow-y-auto lo-scrollbar">
              <div className="text-xs text-white/50 mb-2 font-medium">Speaker Notes</div>
              <div className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                {currentSlide.notes || 'No notes for this slide.'}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="flex items-center justify-center gap-3 px-4 py-3 bg-zinc-800 border-t border-zinc-700">
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors touch-target" onClick={(e) => { e.stopPropagation(); goPrev(); }}><ChevronLeft size={20} /></button>
          <span className="min-w-[80px] text-center text-white/70 text-sm">{currentIndex + 1} / {slides.length}</span>
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors touch-target" onClick={(e) => { e.stopPropagation(); goNext(); }}><ChevronRight size={20} /></button>
          <div className="h-6 w-px bg-zinc-600 mx-2" />
          <button className="px-3 py-1.5 text-xs rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors touch-target" onClick={() => setSpeakerView(false)}>
            Exit Speaker View
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/10">
          <div className="h-full bg-lo-green transition-all duration-300" style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }} />
        </div>
      </div>
    );
  }

  // Normal presentation view
  const scaleX = typeof window !== 'undefined' ? window.innerWidth / SLIDE_WIDTH : 1;
  const scaleY = typeof window !== 'undefined' ? (window.innerHeight - 60) / SLIDE_HEIGHT : 1;
  const scale = Math.min(scaleX, scaleY);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center" onClick={goNext}>
      <button className="absolute top-4 right-4 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors touch-target" onClick={(e) => { e.stopPropagation(); setPresenting(false); }}><X size={24} /></button>

      {/* Speaker view toggle + timer */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm transition-colors touch-target" onClick={(e) => { e.stopPropagation(); setSpeakerView(true); }}>
          <MonitorSpeaker size={16} /> Speaker View
        </button>
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/10 text-white text-sm font-mono">
          <Clock size={14} className="text-yellow-300" />
          {formatTime(elapsed)}
        </div>
      </div>

      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-3 text-white/70 text-sm">
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors touch-target" onClick={(e) => { e.stopPropagation(); goPrev(); }}><ChevronLeft size={20} /></button>
        <span className="min-w-[80px] text-center">{currentIndex + 1} / {slides.length}</span>
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors touch-target" onClick={(e) => { e.stopPropagation(); goNext(); }}><ChevronRight size={20} /></button>
      </div>
      <div className={`bg-white relative ${animClass}`} style={{ width: SLIDE_WIDTH * scale, height: SLIDE_HEIGHT * scale, ...getBgStyle(currentSlide), transition: animating ? 'opacity 0.3s' : undefined }} onClick={(e) => e.stopPropagation()}>
        {renderSlideElements(currentSlide, scale)}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <div className="h-full bg-lo-green transition-all duration-300" style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }} />
      </div>
    </div>
  );
}
