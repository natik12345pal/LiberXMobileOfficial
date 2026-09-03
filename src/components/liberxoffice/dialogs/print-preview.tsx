'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { X, Printer } from 'lucide-react';
import { printDocument } from '@/lib/file-service';

interface PrintPreviewProps {
  contentRef: React.RefObject<HTMLDivElement | null>;
}

export default function PrintPreview({ contentRef }: PrintPreviewProps) {
  const { showPrintPreview, togglePrintPreview, fileName } = useAppStore();
  const [content, setContent] = useState('');

  useEffect(() => {
    if (showPrintPreview && contentRef.current) {
      setContent(contentRef.current.innerHTML);
    }
  }, [showPrintPreview, contentRef]);

  if (!showPrintPreview) return null;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black/60" onClick={togglePrintPreview}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-zinc-800 border-b border-border" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold">Print Preview - {fileName}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-lo-green text-white rounded-md hover:bg-lo-green-dark transition-colors touch-target"
            onClick={() => { togglePrintPreview(); setTimeout(printDocument, 200); }}
          >
            <Printer size={14} /> Print
          </button>
          <button className="lo-toolbar-btn w-8 h-8" onClick={togglePrintPreview}><X size={16} /></button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto lo-scrollbar bg-[#808080]/20 p-8 flex justify-center">
        <div
          className="bg-white shadow-2xl"
          style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '20mm',
            fontFamily: 'Times New Roman, serif',
            fontSize: '12pt',
            lineHeight: '1.6',
            color: '#000',
          }}
        >
          {/* Header */}
          <div style={{ borderBottom: '1px solid #ccc', paddingBottom: '8px', marginBottom: '16px', fontSize: '9pt', color: '#666', textAlign: 'center' }}>
            {fileName}
          </div>

          {/* Content */}
          <div dangerouslySetInnerHTML={{ __html: content }} />

          {/* Footer with page number */}
          <div style={{ borderTop: '1px solid #ccc', paddingTop: '8px', marginTop: '16px', fontSize: '9pt', color: '#666', textAlign: 'center' }}>
            Page 1 of 1
          </div>
        </div>
      </div>
    </div>
  );
}
