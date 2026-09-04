'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { usePersistence } from '@/hooks/use-persistence';
import StartCenter from '@/components/liberxoffice/start-center';
import WriterApp from '@/components/liberxoffice/writer/writer-app';
import CalcApp from '@/components/liberxoffice/calc/calc-app';
import ImpressApp from '@/components/liberxoffice/impress/impress-app';
import KeyboardShortcutsDialog from '@/components/liberxoffice/dialogs/keyboard-shortcuts';
import AboutDialog from '@/components/liberxoffice/dialogs/about-dialog';
import FilterDialog from '@/components/liberxoffice/dialogs/filter-dialog';

export default function AppPage() {
  const { currentView, goBack, darkMode } = useAppStore();

  // ★ Mount persistence ONCE — restores + auto-saves all user data
  usePersistence();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); goBack(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goBack]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const renderView = () => {
    switch (currentView) {
      case 'start-center': return <StartCenter />;
      case 'writer': return <WriterApp />;
      case 'calc': return <CalcApp />;
      case 'impress': return <ImpressApp />;
      default: return <StartCenter />;
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-background">
      {renderView()}
      <KeyboardShortcutsDialog />
      <AboutDialog />
      <FilterDialog />
    </div>
  );
}
