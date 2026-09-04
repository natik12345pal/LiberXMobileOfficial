'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useCalcStore } from '@/stores/calc-store';
import { useImpressStore } from '@/stores/impress-store';
import { persist, load, persistImmediate, migrateOldKeys } from '@/lib/persistence';

/**
 * usePersistence Hook
 *
 * Mount this ONCE at the top of the /app page.
 * It:
 * 1. Migrates old localStorage keys to the new format
 * 2. Restores all saved state on mount
 * 3. Subscribes to store changes and auto-saves (debounced)
 * 4. Saves immediately on page hide / beforeunload
 *
 * All user data — Writer content, Calc sheets, Impress slides,
 * app settings, recent docs — is persisted and restored.
 */

const WRITER_KEY = 'writer';
const CALC_KEY = 'calc';
const IMPRESS_KEY = 'impress';
const APP_KEY = 'app-settings';
const RECENT_KEY = 'recent-documents';

export function usePersistence() {
  const hasRestored = useRef(false);

  // ─── Restore on mount ───
  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;

    // Migrate old keys first
    migrateOldKeys();

    // Restore app settings
    const appSettings = load<{
      currentView?: string;
      fileName?: string;
      zoomLevel?: number;
      sidebarOpen?: boolean;
      activeToolPanel?: string;
      showSplitView?: boolean;
      darkMode?: boolean;
    }>(APP_KEY);

    if (appSettings) {
      useAppStore.setState({
        currentView: (appSettings.currentView as 'start-center' | 'writer' | 'calc' | 'impress') || 'start-center',
        fileName: appSettings.fileName || 'Untitled',
        zoomLevel: appSettings.zoomLevel ?? 100,
        sidebarOpen: appSettings.sidebarOpen ?? true,
        activeToolPanel: (appSettings.activeToolPanel as 'properties' | 'styles' | 'gallery' | 'navigator' | 'none') || 'properties',
        showSplitView: appSettings.showSplitView ?? false,
        darkMode: appSettings.darkMode ?? false,
      });
    }

    // Restore recent documents
    const recent = load<Array<{ id: string; name: string; type: string; lastOpened: string }>>(RECENT_KEY);
    if (recent && recent.length > 0) {
      useAppStore.setState({
        recentDocuments: recent.map((d) => ({
          id: d.id,
          name: d.name,
          type: d.type as 'writer' | 'calc' | 'impress',
          lastOpened: new Date(d.lastOpened),
        })),
      });
    }

    // Restore Calc sheets
    const calcData = load<Record<string, Record<string, unknown>>>(CALC_KEY);
    if (calcData && Object.keys(calcData).length > 0) {
      useCalcStore.setState({ sheets: calcData as never });
    }

    // Restore Impress slides
    const impressData = load<unknown[]>(IMPRESS_KEY);
    if (impressData && Array.isArray(impressData) && impressData.length > 0) {
      useImpressStore.setState({ slides: impressData as never });
    }

    // Restore Writer content — applied to the contentEditable div by WriterApp itself
    // (WriterApp reads from load(WRITER_KEY) in its own useEffect)

    // Apply dark mode class
    const { darkMode } = useAppStore.getState();
    if (darkMode && typeof document !== 'undefined') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // ─── Subscribe to app store changes ───
  useEffect(() => {
    const unsub = useAppStore.subscribe((state) => {
      persist(APP_KEY, {
        currentView: state.currentView,
        fileName: state.fileName,
        zoomLevel: state.zoomLevel,
        sidebarOpen: state.sidebarOpen,
        activeToolPanel: state.activeToolPanel,
        showSplitView: state.showSplitView,
        darkMode: state.darkMode,
      });
      persist(RECENT_KEY, state.recentDocuments.map((d) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        lastOpened: d.lastOpened.toISOString(),
      })));
    });
    return unsub;
  }, []);

  // ─── Subscribe to Calc store ───
  useEffect(() => {
    const unsub = useCalcStore.subscribe((state) => {
      persist(CALC_KEY, state.sheets);
    });
    return unsub;
  }, []);

  // ─── Subscribe to Impress store ───
  useEffect(() => {
    const unsub = useImpressStore.subscribe((state) => {
      persist(IMPRESS_KEY, state.slides);
    });
    return unsub;
  }, []);

  // ─── Save immediately on page hide / unload ───
  useEffect(() => {
    const saveAll = () => {
      const appState = useAppStore.getState();
      const calcState = useCalcStore.getState();
      const impressState = useImpressStore.getState();
      // Save writer content from DOM (best effort)
      const editor = document.querySelector('[data-writer-editor]') as HTMLElement | null;
      if (editor?.innerHTML) {
        persistImmediate(WRITER_KEY, editor.innerHTML);
      }
      persistImmediate(APP_KEY, {
        currentView: appState.currentView,
        fileName: appState.fileName,
        zoomLevel: appState.zoomLevel,
        sidebarOpen: appState.sidebarOpen,
        activeToolPanel: appState.activeToolPanel,
        showSplitView: appState.showSplitView,
        darkMode: appState.darkMode,
      });
      persistImmediate(RECENT_KEY, appState.recentDocuments.map((d) => ({
        id: d.id, name: d.name, type: d.type, lastOpened: d.lastOpened.toISOString(),
      })));
      persistImmediate(CALC_KEY, calcState.sheets);
      persistImmediate(IMPRESS_KEY, impressState.slides);
    };

    const onHide = () => saveAll();
    const beforeUnload = () => saveAll();

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') onHide();
    });
    window.addEventListener('beforeunload', beforeUnload);
    window.addEventListener('pagehide', beforeUnload);

    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('pagehide', beforeUnload);
    };
  }, []);
}
