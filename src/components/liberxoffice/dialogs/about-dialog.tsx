'use client';

import React from 'react';
import { useAppStore } from '@/stores/app-store';
import { X } from 'lucide-react';

export default function AboutDialog() {
  const { showAbout, toggleAbout } = useAppStore();
  if (!showAbout) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40" onClick={toggleAbout}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-2xl w-[460px] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        {/* Header with logo */}
        <div className="flex items-center gap-4 px-6 pt-6 pb-4">
          <img src="/logo.png" alt="LiberXMobile" className="w-14 h-14 rounded-xl object-contain" />
          <div>
            <h1 className="text-xl font-bold">LiberXMobile</h1>
            <p className="text-sm text-muted-foreground">Version 1.0.0</p>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-3 text-sm">
          <p>
            A customized, LibreOffice-inspired office suite optimized for students and classrooms.
            Built with love for the Indian education community.
          </p>
          <div className="bg-secondary/50 rounded-md p-3 space-y-1 text-xs text-muted-foreground">
            <p><strong>Writer</strong> — Full-featured document editor with formatting, tables, image insertion, find & replace, and export.</p>
            <p><strong>Calc</strong> — Spreadsheet with 30+ formulas, charts, sorting, number formatting, and multi-sheet support.</p>
            <p><strong>Impress</strong> — Presentation editor with slide transitions, themes, element positioning, and fullscreen presentation mode.</p>
          </div>
          <div className="border-t border-border pt-3 space-y-1 text-xs text-muted-foreground">
            <p>100% free and open-source. No ads, no accounts, no tracking, no backend required.</p>
            <p>Works offline. All data stays on your device (localStorage).</p>
            <p>Touch-optimized for Smart Boards, tablets, and laptops.</p>
          </div>
          <div className="border-t border-border pt-3 text-[11px] text-muted-foreground/70">
            <p>LiberXMobile is inspired by <strong>LibreOffice</strong>, the world&apos;s most popular free office suite.</p>
            <p>LibreOffice is a trademark of The Document Foundation. LiberXMobile is not affiliated with or endorsed by The Document Foundation.</p>
            <p>Source code structure follows LibreOffice&apos;s module organization (Writer, Calc, Impress) as a tribute.</p>
            <p className="mt-1">License: Mozilla Public License v2.0 (MPLv2)</p>
          </div>
        </div>

        <div className="flex justify-end px-6 pb-4">
          <button
            className="px-4 py-2 text-sm font-medium bg-lo-green text-white rounded-md hover:bg-lo-green-dark transition-colors"
            onClick={toggleAbout}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
