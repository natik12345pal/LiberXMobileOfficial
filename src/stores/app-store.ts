import { create } from 'zustand';

export type AppView = 'start-center' | 'writer' | 'calc' | 'impress';
export type ToolPanel = 'properties' | 'styles' | 'gallery' | 'navigator' | 'none';

interface AppState {
  currentView: AppView;
  previousView: AppView | null;
  fileName: string;
  isModified: boolean;
  sidebarOpen: boolean;
  activeToolPanel: ToolPanel;
  zoomLevel: number;
  isFullscreen: boolean;
  recentDocuments: RecentDocument[];
  darkMode: boolean;
  showFindReplace: boolean;
  showShortcuts: boolean;
  showAbout: boolean;
  showPageSetup: boolean;
  showTableInsert: boolean;
  showSortDialog: boolean;
  showChartDialog: boolean;
  showPrintPreview: boolean;
  showFilterDialog: boolean;
  showConditionalFormatDialog: boolean;
  showDataValidationDialog: boolean;
  showNamedRangesDialog: boolean;
  showPivotTableDialog: boolean;
  showSlideSorter: boolean;
  showSlideMaster: boolean;
  showDuplicateDialog: boolean;
  showNotesPanel: boolean;
  showSplitView: boolean;
  showCellBorderDialog: boolean;
  showTextToColumnsDialog: boolean;
  showGoalSeekDialog: boolean;
  showSaveAsDialog: boolean;

  // Navigation
  navigateTo: (view: AppView, fileName?: string) => void;
  goBack: () => void;

  // Document state
  setFileName: (name: string) => void;
  setModified: (modified: boolean) => void;

  // UI state
  toggleSidebar: () => void;
  setToolPanel: (panel: ToolPanel) => void;
  setZoom: (level: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  toggleFullscreen: () => void;
  toggleDarkMode: () => void;

  // Dialogs
  toggleFindReplace: () => void;
  toggleShortcuts: () => void;
  toggleAbout: () => void;
  togglePageSetup: () => void;
  toggleTableInsert: () => void;
  toggleSortDialog: () => void;
  toggleChartDialog: () => void;
  togglePrintPreview: () => void;
  toggleFilterDialog: () => void;
  toggleConditionalFormatDialog: () => void;
  toggleDataValidationDialog: () => void;
  toggleNamedRangesDialog: () => void;
  togglePivotTableDialog: () => void;
  toggleSlideSorter: () => void;
  toggleSlideMaster: () => void;
  toggleDuplicateDialog: () => void;
  toggleNotesPanel: () => void;
  toggleSplitView: () => void;
  toggleCellBorderDialog: () => void;
  toggleTextToColumnsDialog: () => void;
  toggleGoalSeekDialog: () => void;
  toggleSaveAsDialog: () => void;
  closeAllDialogs: () => void;

  // Recent documents
  addRecentDocument: (doc: RecentDocument) => void;
}

export interface RecentDocument {
  id: string;
  name: string;
  type: AppView;
  lastOpened: Date;
  thumbnail?: string;
}

// Load dark mode from localStorage
const savedDarkMode = typeof window !== 'undefined'
  ? localStorage.getItem('liberxoffice_darkmode') === 'true'
  : false;

export const useAppStore = create<AppState>((set, get) => ({
  currentView: 'start-center',
  previousView: null,
  fileName: 'Untitled',
  isModified: false,
  sidebarOpen: true,
  activeToolPanel: 'properties',
  zoomLevel: 100,
  isFullscreen: false,
  darkMode: savedDarkMode,
  showFindReplace: false,
  showShortcuts: false,
  showAbout: false,
  showPageSetup: false,
  showTableInsert: false,
  showSortDialog: false,
  showChartDialog: false,
  showPrintPreview: false,
  showFilterDialog: false,
  showConditionalFormatDialog: false,
  showDataValidationDialog: false,
  showNamedRangesDialog: false,
  showPivotTableDialog: false,
  showSlideSorter: false,
  showSlideMaster: false,
  showDuplicateDialog: false,
  showNotesPanel: false,
  showSplitView: false,
  showCellBorderDialog: false,
  showTextToColumnsDialog: false,
  showGoalSeekDialog: false,
  showSaveAsDialog: false,
  recentDocuments: [
    { id: '1', name: 'My Science Project Report', type: 'writer', lastOpened: new Date(2026, 7, 28) },
    { id: '2', name: 'Mathematics Data Analysis', type: 'calc', lastOpened: new Date(2026, 7, 27) },
    { id: '3', name: 'History Presentation - Mughal Empire', type: 'impress', lastOpened: new Date(2026, 7, 25) },
    { id: '4', name: 'English Letter Writing Practice', type: 'writer', lastOpened: new Date(2026, 7, 24) },
    { id: '5', name: 'Science Lab Results', type: 'calc', lastOpened: new Date(2026, 7, 22) },
  ],

  navigateTo: (view, fileName) => {
    const { currentView, addRecentDocument } = get();
    set({
      previousView: currentView,
      currentView: view,
      fileName: fileName || 'Untitled',
      isModified: false,
    } as Partial<AppState>);
    // Close all dialogs on navigation
    set({ showFindReplace: false, showShortcuts: false, showAbout: false, showPageSetup: false, showTableInsert: false, showSortDialog: false, showChartDialog: false, showPrintPreview: false, showFilterDialog: false, showConditionalFormatDialog: false, showDataValidationDialog: false, showNamedRangesDialog: false, showPivotTableDialog: false, showSlideSorter: false, showSlideMaster: false, showDuplicateDialog: false, showNotesPanel: false, showSplitView: false, showCellBorderDialog: false, showTextToColumnsDialog: false, showGoalSeekDialog: false, showSaveAsDialog: false });
    if (fileName) {
      addRecentDocument({ id: Date.now().toString(), name: fileName, type: view, lastOpened: new Date() });
    }
  },

  goBack: () => {
    const { previousView } = get();
    if (previousView) {
      set({ currentView: previousView, previousView: null });
    } else {
      set({ currentView: 'start-center' });
    }
  },

  setFileName: (name) => set({ fileName: name }),
  setModified: (modified) => set({ isModified: modified }),

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setToolPanel: (panel) => set({ activeToolPanel: panel, sidebarOpen: panel !== 'none' }),
  setZoom: (level) => set({ zoomLevel: Math.max(25, Math.min(300, level)) }),
  zoomIn: () => set((s) => ({ zoomLevel: Math.min(300, s.zoomLevel + 10) })),
  zoomOut: () => set((s) => ({ zoomLevel: Math.max(25, s.zoomLevel - 10) })),
  toggleFullscreen: () => {
    const isFs = !get().isFullscreen;
    if (isFs) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
    set({ isFullscreen: isFs });
  },
  toggleDarkMode: () => set((s) => {
    const next = !s.darkMode;
    localStorage.setItem('liberxoffice_darkmode', String(next));
    return { darkMode: next };
  }),

  toggleFindReplace: () => set((s) => ({ showFindReplace: !s.showFindReplace })),
  toggleShortcuts: () => set((s) => ({ showShortcuts: !s.showShortcuts })),
  toggleAbout: () => set((s) => ({ showAbout: !s.showAbout })),
  togglePageSetup: () => set((s) => ({ showPageSetup: !s.showPageSetup })),
  toggleTableInsert: () => set((s) => ({ showTableInsert: !s.showTableInsert })),
  toggleSortDialog: () => set((s) => ({ showSortDialog: !s.showSortDialog })),
  toggleChartDialog: () => set((s) => ({ showChartDialog: !s.showChartDialog })),
  togglePrintPreview: () => set((s) => ({ showPrintPreview: !s.showPrintPreview })),
  toggleFilterDialog: () => set((s) => ({ showFilterDialog: !s.showFilterDialog })),
  toggleConditionalFormatDialog: () => set((s) => ({ showConditionalFormatDialog: !s.showConditionalFormatDialog })),
  toggleDataValidationDialog: () => set((s) => ({ showDataValidationDialog: !s.showDataValidationDialog })),
  toggleNamedRangesDialog: () => set((s) => ({ showNamedRangesDialog: !s.showNamedRangesDialog })),
  togglePivotTableDialog: () => set((s) => ({ showPivotTableDialog: !s.showPivotTableDialog })),
  toggleSlideSorter: () => set((s) => ({ showSlideSorter: !s.showSlideSorter })),
  toggleSlideMaster: () => set((s) => ({ showSlideMaster: !s.showSlideMaster })),
  toggleDuplicateDialog: () => set((s) => ({ showDuplicateDialog: !s.showDuplicateDialog })),
  toggleNotesPanel: () => set((s) => ({ showNotesPanel: !s.showNotesPanel })),
  toggleSplitView: () => set((s) => ({ showSplitView: !s.showSplitView })),
  toggleCellBorderDialog: () => set((s) => ({ showCellBorderDialog: !s.showCellBorderDialog })),
  toggleTextToColumnsDialog: () => set((s) => ({ showTextToColumnsDialog: !s.showTextToColumnsDialog })),
  toggleGoalSeekDialog: () => set((s) => ({ showGoalSeekDialog: !s.showGoalSeekDialog })),
  toggleSaveAsDialog: () => set((s) => ({ showSaveAsDialog: !s.showSaveAsDialog })),
  closeAllDialogs: () => set({
    showFindReplace: false, showShortcuts: false, showAbout: false,
    showPageSetup: false, showTableInsert: false, showSortDialog: false, showChartDialog: false, showPrintPreview: false, showFilterDialog: false,
    showConditionalFormatDialog: false, showDataValidationDialog: false, showNamedRangesDialog: false, showPivotTableDialog: false,
    showSlideSorter: false, showSlideMaster: false, showDuplicateDialog: false, showNotesPanel: false, showSplitView: false,
    showCellBorderDialog: false, showTextToColumnsDialog: false, showGoalSeekDialog: false,
    showSaveAsDialog: false,
  }),

  addRecentDocument: (doc) =>
    set((s) => ({
      recentDocuments: [doc, ...s.recentDocuments.filter((d) => d.id !== doc.id)].slice(0, 10),
    })),
}));
