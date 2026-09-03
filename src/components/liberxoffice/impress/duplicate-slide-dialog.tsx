'use client';

import React, { useState } from 'react';
import { useImpressStore } from '@/stores/impress-store';
import { useAppStore } from '@/stores/app-store';
import { X, Copy } from 'lucide-react';

export default function DuplicateSlideDialog() {
  const { showDuplicateDialog, toggleDuplicateDialog } = useAppStore();
  const { activeSlideIndex, duplicateSlide } = useImpressStore();
  const [clearContent, setClearContent] = useState(false);
  const [copies, setCopies] = useState(1);
  const [insertBefore, setInsertBefore] = useState(false);

  if (!showDuplicateDialog) return null;

  const handleDuplicate = () => {
    duplicateSlide(activeSlideIndex, { clearContent, copies: Math.min(10, Math.max(1, copies)), insertBefore });
    toggleDuplicateDialog();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={toggleDuplicateDialog}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-2xl w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-base font-semibold flex items-center gap-2"><Copy size={16} /> Duplicate Slide {activeSlideIndex + 1}</h2>
          <button className="lo-toolbar-btn w-8 h-8" onClick={toggleDuplicateDialog}><X size={16} /></button>
        </div>
        <div className="p-4 space-y-4">
          {/* Content Option */}
          <div className="flex items-center justify-between">
            <label className="text-sm">Clear content on copies</label>
            <button
              className={`w-10 h-6 rounded-full transition-colors relative ${clearContent ? 'bg-lo-green' : 'bg-border'}`}
              onClick={() => setClearContent(!clearContent)}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${clearContent ? 'left-5' : 'left-1'}`} />
            </button>
          </div>

          {/* Number of copies */}
          <div>
            <label className="text-sm">Number of copies</label>
            <div className="flex items-center gap-2 mt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  className={`w-8 h-8 rounded text-sm font-medium transition-colors touch-target ${n === copies ? 'bg-lo-green text-white' : 'border border-border hover:bg-accent'}`}
                  onClick={() => setCopies(n)}
                >{n}</button>
              ))}
            </div>
          </div>

          {/* Insert position */}
          <div>
            <label className="text-sm">Insert position</label>
            <div className="flex gap-2 mt-1">
              <button
                className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors touch-target ${!insertBefore ? 'border-lo-green bg-lo-green/10 text-lo-green font-medium' : 'border-border hover:bg-accent'}`}
                onClick={() => setInsertBefore(false)}
              >After Current</button>
              <button
                className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors touch-target ${insertBefore ? 'border-lo-green bg-lo-green/10 text-lo-green font-medium' : 'border-border hover:bg-accent'}`}
                onClick={() => setInsertBefore(true)}
              >Before Current</button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">This will create {copies} duplicate slide{copies > 1 ? 's' : ''} {clearContent ? 'without content' : 'with content offset by 20px'}.</p>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <button className="flex-1 px-3 py-2 text-sm font-medium bg-lo-green text-white rounded-md hover:bg-lo-green-dark transition-colors touch-target" onClick={handleDuplicate}>
              Duplicate
            </button>
            <button className="px-4 py-2 text-sm rounded-md border border-border hover:bg-accent transition-colors touch-target" onClick={toggleDuplicateDialog}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
