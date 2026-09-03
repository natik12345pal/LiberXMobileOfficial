'use client';

import React from 'react';
import { useAppStore, AppView } from '@/stores/app-store';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface StatusBarProps {
  currentView: AppView;
  extraInfo?: string;
  extraActions?: React.ReactNode;
}

export default function StatusBar({ currentView, extraInfo, extraActions }: StatusBarProps) {
  const { zoomLevel, zoomIn, zoomOut, isModified } = useAppStore();

  const viewLabels: Record<AppView, string> = {
    'start-center': 'Start Center',
    writer: 'LiberXMobile Writer',
    calc: 'LiberXMobile Calc',
    impress: 'LiberXMobile Impress',
  };

  return (
    <div className="lo-statusbar select-none">
      <div className="flex items-center gap-3 flex-1">
        <span className="flex items-center gap-1">
          {isModified && (
            <span className="inline-block w-2 h-2 rounded-full bg-lo-green" title="Modified" />
          )}
          <span>{viewLabels[currentView]}</span>
        </span>
        {extraInfo && (
          <>
            <span className="text-border">|</span>
            <span>{extraInfo}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        {extraActions}
        <button className="flex items-center gap-1 hover:text-foreground transition-colors touch-target px-1" onClick={zoomOut}>
          <ZoomOut size={12} />
        </button>
        <span className="w-10 text-center">{zoomLevel}%</span>
        <button className="flex items-center gap-1 hover:text-foreground transition-colors touch-target px-1" onClick={zoomIn}>
          <ZoomIn size={12} />
        </button>
      </div>
    </div>
  );
}
