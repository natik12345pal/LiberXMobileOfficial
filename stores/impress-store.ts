'use client';

import { create } from 'zustand';

export interface SlideMaster {
  titleFont: string;
  titleSize: number;
  titleColor: string;
  bodyFont: string;
  bodySize: number;
  bodyColor: string;
  accentColor: string;
  defaultBackground: string;
}

export const DEFAULT_SLIDE_MASTER: SlideMaster = {
  titleFont: 'sans-serif',
  titleSize: 36,
  titleColor: '#1a1a1a',
  bodyFont: 'sans-serif',
  bodySize: 16,
  bodyColor: '#333333',
  accentColor: '#18A303',
  defaultBackground: '#ffffff',
};

export function loadSlideMaster(): SlideMaster {
  if (typeof window === 'undefined') return DEFAULT_SLIDE_MASTER;
  try {
    const raw = localStorage.getItem('liberxoffice-slide-master');
    if (raw) return { ...DEFAULT_SLIDE_MASTER, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SLIDE_MASTER;
}

export function saveSlideMaster(master: SlideMaster) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem('liberxoffice-slide-master', JSON.stringify(master)); } catch {}
}

export type AnimationType = 'none' | 'fadeIn' | 'slideInLeft' | 'slideInRight' | 'slideInUp' | 'slideInDown' | 'zoomIn' | 'bounceIn' | 'fadeOut' | 'slideOutLeft' | 'slideOutRight' | 'slideOutUp' | 'slideOutDown' | 'zoomOut' | 'pulse' | 'shake' | 'tada' | 'jello' | 'heartBeat' | 'fade-in' | 'slide-left' | 'slide-right' | 'zoom-in' | 'bounce' | 'fly-in';

export interface SlideElement {
  id: string;
  type: 'text' | 'shape' | 'image' | 'table';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  color?: string;
  bgColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  borderRadius?: number;
  src?: string;
  notes?: string;
  borderColor?: string;
  borderWidth?: number;
  shadow?: boolean;
  shadowColor?: string;
  gradient?: string;
  rotation?: number;
  animation?: AnimationType;
  zIndex?: number;
  // Table-specific fields
  tableData?: string[][];
  tableCols?: number;
  tableRows?: number;
}

export type SlideTransition = 'none' | 'fade' | 'slide-left' | 'slide-right' | 'zoom' | 'flip' | 'dissolve' | 'wipe-right' | 'wipe-left' | 'wipe-down' | 'wipe-up' | 'push-left' | 'push-right' | 'cover' | 'uncover';

export interface Slide {
  id: string;
  elements: SlideElement[];
  layout: 'blank' | 'title' | 'title-content' | 'two-column' | 'title-image';
  transition: SlideTransition;
  background?: string;
  notes?: string;
}

export const THEMES: Record<string, { bg: string; titleColor: string; bodyColor: string; accent: string }> = {
  default: { bg: '#ffffff', titleColor: '#1a1a1a', bodyColor: '#333333', accent: '#18A303' },
  dark: { bg: '#1a1a2e', titleColor: '#ffffff', bodyColor: '#e0e0e0', accent: '#4fc3f7' },
  nature: { bg: '#f1f8e9', titleColor: '#1b5e20', bodyColor: '#333333', accent: '#4caf50' },
  ocean: { bg: '#e3f2fd', titleColor: '#0d47a1', bodyColor: '#333333', accent: '#2196f3' },
  sunset: { bg: '#fff3e0', titleColor: '#e65100', bodyColor: '#333333', accent: '#ff9800' },
  minimal: { bg: '#fafafa', titleColor: '#212121', bodyColor: '#616161', accent: '#9e9e9e' },
};

export const ALL_TRANSITIONS: { value: SlideTransition; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'fade', label: 'Fade' },
  { value: 'slide-left', label: 'Slide Left' },
  { value: 'slide-right', label: 'Slide Right' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'flip', label: 'Flip' },
  { value: 'dissolve', label: 'Dissolve' },
  { value: 'wipe-right', label: 'Wipe Right' },
  { value: 'wipe-left', label: 'Wipe Left' },
  { value: 'wipe-down', label: 'Wipe Down' },
  { value: 'wipe-up', label: 'Wipe Up' },
  { value: 'push-left', label: 'Push Left' },
  { value: 'push-right', label: 'Push Right' },
  { value: 'cover', label: 'Cover' },
  { value: 'uncover', label: 'Uncover' },
];

interface DuplicateOptions {
  clearContent: boolean;
  copies: number;
  insertBefore: boolean;
}

interface ImpressState {
  slides: Slide[];
  activeSlideIndex: number;
  selectedElementId: string | null;
  isPresenting: boolean;
  isEditingText: boolean;
  zoomLevel: number;
  clipboard: SlideElement | null;
  slideTheme: string;
  snapToGrid: boolean;
  gridSize: number;
  undoStack: Slide[][];
  redoStack: Slide[][];
  addSlide: (layout?: Slide['layout']) => void;
  deleteSlide: (index: number) => void;
  duplicateSlide: (index: number, options?: DuplicateOptions) => void;
  moveSlide: (from: number, to: number) => void;
  setActiveSlide: (index: number) => void;
  selectElement: (id: string | null) => void;
  updateElement: (slideIndex: number, elementId: string, updates: Partial<SlideElement>) => void;
  addElement: (slideIndex: number, element: SlideElement) => void;
  deleteElement: (slideIndex: number, elementId: string) => void;
  setPresenting: (presenting: boolean) => void;
  setEditingText: (editing: boolean) => void;
  setZoom: (zoom: number) => void;
  copyElement: (slideIndex: number, elementId: string) => void;
  pasteElement: (slideIndex: number) => void;
  setSlideTransition: (slideIndex: number, transition: SlideTransition) => void;
  setSlideBackground: (slideIndex: number, bg: string) => void;
  setSlideTheme: (theme: string) => void;
  setSlideNotes: (slideIndex: number, notes: string) => void;
  setSnapToGrid: (enabled: boolean) => void;
  setGridSize: (size: number) => void;
  snapValue: (value: number) => number;
  pushUndo: () => void;
  undo: () => void;
  redo: () => void;
}

const defaultSlides: Slide[] = [
  {
    id: 'slide-1', layout: 'title', transition: 'fade',
    elements: [
      { id: 'el-1', type: 'text', x: 50, y: 120, width: 620, height: 80, content: 'Photosynthesis in Plants', fontSize: 36, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center' },
      { id: 'el-2', type: 'text', x: 100, y: 240, width: 520, height: 50, content: 'Class 10 - Biology - Chapter 6: Life Processes', fontSize: 18, fontWeight: 'normal', color: '#555555', textAlign: 'center' },
      { id: 'el-3', type: 'shape', x: 180, y: 310, width: 360, height: 6, content: '', bgColor: '#18A303', borderRadius: 3 },
    ],
  },
  {
    id: 'slide-2', layout: 'title-content', transition: 'slide-left',
    elements: [
      { id: 'el-4', type: 'text', x: 50, y: 30, width: 620, height: 50, content: 'What is Photosynthesis?', fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'left' },
      { id: 'el-5', type: 'shape', x: 50, y: 80, width: 100, height: 4, content: '', bgColor: '#18A303', borderRadius: 2 },
      { id: 'el-6', type: 'text', x: 50, y: 100, width: 620, height: 200, content: 'Photosynthesis is the process by which green plants make their own food using sunlight, carbon dioxide, and water.\n\nChemical Equation:\n6CO2 + 6H2O -> C6H12O6 + 6O2\n\nThis process takes place in the chloroplasts, which contain the green pigment chlorophyll.', fontSize: 16, fontWeight: 'normal', color: '#333333', textAlign: 'left' },
    ],
  },
  {
    id: 'slide-3', layout: 'two-column', transition: 'fade',
    elements: [
      { id: 'el-7', type: 'text', x: 50, y: 30, width: 620, height: 50, content: 'Factors Affecting Photosynthesis', fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'left' },
      { id: 'el-8', type: 'text', x: 50, y: 100, width: 300, height: 250, content: 'Light Intensity\n\n- More light = More photosynthesis\n- Optimum: Bright sunlight\n- No light = No photosynthesis', fontSize: 15, fontWeight: 'normal', color: '#333333', textAlign: 'left' },
      { id: 'el-9', type: 'text', x: 370, y: 100, width: 300, height: 250, content: 'Carbon Dioxide Concentration\n\n- More CO2 = More photosynthesis\n- Plants absorb CO2 from air\n- 0.03% in atmosphere', fontSize: 15, fontWeight: 'normal', color: '#333333', textAlign: 'left' },
    ],
  },
  {
    id: 'slide-4', layout: 'title-content', transition: 'slide-right',
    elements: [
      { id: 'el-10', type: 'text', x: 50, y: 30, width: 620, height: 50, content: 'Summary', fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'left' },
      { id: 'el-11', type: 'text', x: 50, y: 100, width: 620, height: 250, content: '- Photosynthesis converts light energy to chemical energy\n- Raw materials: CO2 and H2O\n- Products: Glucose (C6H12O6) and O2\n- Occurs in chloroplasts\n- Essential for life on Earth', fontSize: 16, fontWeight: 'normal', color: '#333333', textAlign: 'left' },
      { id: 'el-12', type: 'text', x: 150, y: 360, width: 420, height: 40, content: 'Thank You!', fontSize: 24, fontWeight: 'bold', color: '#18A303', textAlign: 'center' },
    ],
  },
];

export const useImpressStore = create<ImpressState>((set, get) => ({
  slides: defaultSlides,
  activeSlideIndex: 0,
  selectedElementId: null,
  isPresenting: false,
  isEditingText: false,
  zoomLevel: 100,
  clipboard: null,
  slideTheme: 'default',
  snapToGrid: false,
  gridSize: 20,
  undoStack: [],
  redoStack: [],

  pushUndo: () => {
    const { slides, undoStack, redoStack } = get();
    set({
      undoStack: [...undoStack.slice(-19), JSON.parse(JSON.stringify(slides))],
      redoStack: [],
    });
  },

  undo: () => {
    const { undoStack, slides } = get();
    if (!undoStack.length) return;
    const prev = undoStack[undoStack.length - 1];
    set({
      slides: prev,
      undoStack: undoStack.slice(0, -1),
      redoStack: [...get().redoStack, JSON.parse(JSON.stringify(slides))],
      activeSlideIndex: Math.min(get().activeSlideIndex, prev.length - 1),
    });
  },

  redo: () => {
    const { redoStack, slides } = get();
    if (!redoStack.length) return;
    const next = redoStack[redoStack.length - 1];
    set({
      slides: next,
      redoStack: redoStack.slice(0, -1),
      undoStack: [...get().undoStack, JSON.parse(JSON.stringify(slides))],
      activeSlideIndex: Math.min(get().activeSlideIndex, next.length - 1),
    });
  },

  addSlide: (layout = 'blank') => {
    get().pushUndo();
    const id = `slide-${Date.now()}`;
    const master = loadSlideMaster();
    const theme = THEMES[get().slideTheme] || THEMES.default;
    const bg = theme.bg || master.defaultBackground;
    const newSlide: Slide = { id, layout, transition: 'none', background: bg, elements: [] };
    if (layout === 'title') {
      newSlide.elements.push(
        { id: `el-${Date.now()}-1`, type: 'text', x: 50, y: 150, width: 620, height: 80, content: 'Click to add Title', fontSize: master.titleSize, fontWeight: 'bold', color: master.titleColor, textAlign: 'center' },
        { id: `el-${Date.now()}-2`, type: 'text', x: 100, y: 260, width: 520, height: 40, content: 'Click to add Subtitle', fontSize: 18, fontWeight: 'normal', color: '#666666', textAlign: 'center' },
      );
    }
    set((s) => {
      const slides = [...s.slides];
      slides.splice(s.activeSlideIndex + 1, 0, newSlide);
      return { slides, activeSlideIndex: s.activeSlideIndex + 1 };
    });
  },

  deleteSlide: (index) => {
    get().pushUndo();
    set((s) => {
      if (s.slides.length <= 1) return s;
      const slides = s.slides.filter((_, i) => i !== index);
      return { slides, activeSlideIndex: Math.min(s.activeSlideIndex, slides.length - 1) };
    });
  },

  duplicateSlide: (index, options) => {
    get().pushUndo();
    const { clearContent = false, copies = 1, insertBefore = false } = options || {};
    set((s) => {
      const original = s.slides[index];
      const newSlides: Slide[] = [];
      for (let i = 0; i < copies; i++) {
        const duplicate: Slide = {
          ...original,
          id: `slide-${Date.now()}-${i}`,
          elements: clearContent ? [] : original.elements.map((e) => ({
            ...e,
            id: `el-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
            x: e.x + 20,
            y: e.y + 20,
          })),
        };
        newSlides.push(duplicate);
      }
      const slides = [...s.slides];
      const insertIdx = insertBefore ? index : index + 1;
      slides.splice(insertIdx, 0, ...newSlides);
      const newActiveIdx = insertBefore ? index : index + 1;
      return { slides, activeSlideIndex: newActiveIdx };
    });
  },

  moveSlide: (from, to) => {
    get().pushUndo();
    set((s) => {
      const slides = [...s.slides];
      const [moved] = slides.splice(from, 1);
      slides.splice(to, 0, moved);
      return { slides, activeSlideIndex: to };
    });
  },

  setActiveSlide: (index) => set({ activeSlideIndex: index, selectedElementId: null }),
  selectElement: (id) => set({ selectedElementId: id }),

  updateElement: (slideIndex, elementId, updates) => {
    set((s) => {
      const newSlides = s.slides.map((slide, i) => {
        if (i !== slideIndex) return slide;
        return {
          ...slide,
          elements: slide.elements.map((el) =>
            el.id === elementId ? { ...el, ...updates } : el
          ),
        };
      });
      return { slides: newSlides };
    });
  },

  addElement: (slideIndex, element) =>
    set((s) => ({
      slides: s.slides.map((slide, i) =>
        i !== slideIndex ? slide : { ...slide, elements: [...slide.elements, element] }
      ),
      selectedElementId: element.id,
    })),

  deleteElement: (slideIndex, elementId) =>
    set((s) => ({
      slides: s.slides.map((slide, i) =>
        i !== slideIndex ? slide : { ...slide, elements: slide.elements.filter((el) => el.id !== elementId) }
      ),
      selectedElementId: null,
    })),

  setPresenting: (presenting) => set({ isPresenting: presenting, selectedElementId: null }),
  setEditingText: (editing) => set({ isEditingText: editing }),
  setZoom: (zoom) => set({ zoomLevel: Math.max(50, Math.min(200, zoom)) }),

  copyElement: (slideIndex, elementId) => {
    const el = get().slides[slideIndex]?.elements.find((e) => e.id === elementId);
    if (el) set({ clipboard: { ...el } });
  },

  pasteElement: (slideIndex) => {
    const { clipboard } = get();
    if (!clipboard) return;
    const newEl = { ...clipboard, id: `el-${Date.now()}`, x: clipboard.x + 20, y: clipboard.y + 20 };
    get().addElement(slideIndex, newEl);
  },

  setSlideTransition: (slideIndex, transition) =>
    set((s) => ({
      slides: s.slides.map((sl, i) => (i !== slideIndex ? sl : { ...sl, transition })),
    })),

  setSlideBackground: (slideIndex, bg) =>
    set((s) => ({
      slides: s.slides.map((sl, i) => (i !== slideIndex ? sl : { ...sl, background: bg })),
    })),

  setSlideTheme: (theme) => {
    const t = THEMES[theme] || THEMES.default;
    set((s) => ({
      slideTheme: theme,
      slides: s.slides.map((sl) => ({
        ...sl,
        background: sl.background === '#ffffff' || !sl.background ? t.bg : sl.background,
        elements: sl.elements.map((el) => ({
          ...el,
          color: el.type === 'text' && (!el.color || el.color === '#1a1a1a' || el.color === '#333333')
            ? (el.fontSize && el.fontSize >= 28 ? t.titleColor : t.bodyColor)
            : el.color,
        })),
      })),
    }));
  },

  setSlideNotes: (slideIndex, notes) =>
    set((s) => ({
      slides: s.slides.map((sl, i) => (i !== slideIndex ? sl : { ...sl, notes })),
    })),

  setSnapToGrid: (enabled) => set({ snapToGrid: enabled }),
  setGridSize: (size) => set({ gridSize: Math.max(5, Math.min(100, size)) }),
  snapValue: (value) => {
    const { snapToGrid, gridSize } = get();
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  },
}));
