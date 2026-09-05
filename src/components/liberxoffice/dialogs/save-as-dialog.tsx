'use client';
import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { FileText, FileType2, FileCode, FileSpreadsheet, FileJson, Presentation } from 'lucide-react';

export type SaveFormat = 'docx' | 'html' | 'txt' | 'xlsx' | 'csv' | 'json' | 'pptx';

interface SaveAsDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, format: SaveFormat) => void;
  /** Which app is calling — determines which formats to show */
  appType?: 'writer' | 'calc' | 'impress';
}

const WRITER_FORMATS: { value: SaveFormat; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'docx', label: 'Word Document', desc: '.docx — MS Word, Google Docs', icon: <FileText size={18} /> },
  { value: 'html', label: 'Web Page', desc: '.html — Opens in browser', icon: <FileCode size={18} /> },
  { value: 'txt', label: 'Plain Text', desc: '.txt — Simple text only', icon: <FileType2 size={18} /> },
];

const CALC_FORMATS: { value: SaveFormat; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'xlsx', label: 'Excel Spreadsheet', desc: '.xlsx — MS Excel, Google Sheets', icon: <FileSpreadsheet size={18} /> },
  { value: 'csv', label: 'CSV (Comma Separated)', desc: '.csv — Universal data format', icon: <FileType2 size={18} /> },
  { value: 'json', label: 'JSON Data', desc: '.json — Full data backup', icon: <FileJson size={18} /> },
];

const IMPRESS_FORMATS: { value: SaveFormat; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'pptx', label: 'PowerPoint Presentation', desc: '.pptx — MS PowerPoint', icon: <Presentation size={18} /> },
  { value: 'json', label: 'JSON Data', desc: '.json — Full data backup', icon: <FileJson size={18} /> },
];

export default function SaveAsDialog({ open, onClose, onSave, appType = 'writer' }: SaveAsDialogProps) {
  const { fileName } = useAppStore();
  const [name, setName] = useState(fileName);

  // Default format per app type
  const formats = appType === 'calc' ? CALC_FORMATS : appType === 'impress' ? IMPRESS_FORMATS : WRITER_FORMATS;
  const defaultFormat = appType === 'calc' ? 'xlsx' : appType === 'impress' ? 'pptx' : 'docx';
  const [format, setFormat] = useState<SaveFormat>(defaultFormat);

  useEffect(() => {
    if (open) {
      setName(fileName);
      setFormat(defaultFormat);
    }
  }, [open, fileName, defaultFormat]);

  if (!open) return null;

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    useAppStore.getState().setFileName(trimmed);
    onSave(trimmed, format);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-800 rounded-xl shadow-2xl w-[460px] max-w-[92vw] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-base font-semibold">Save Document</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Choose a name and format for your file</p>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* File name input */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">File Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white dark:bg-zinc-700 dark:text-white focus:ring-2 focus:ring-lo-green focus:border-lo-green outline-none"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose(); }}
              placeholder="My Document"
            />
          </div>

          {/* Format selector */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Save as type</label>
            <div className="space-y-1.5">
              {formats.map((fmt) => (
                <button
                  key={fmt.value}
                  type="button"
                  onClick={() => setFormat(fmt.value)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                    format === fmt.value
                      ? 'border-lo-green bg-lo-green/5'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  {/* Radio indicator */}
                  <span
                    className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      format === fmt.value ? 'border-lo-green' : 'border-muted-foreground/40'
                    }`}
                  >
                    {format === fmt.value && <span className="w-2 h-2 rounded-full bg-lo-green" />}
                  </span>
                  {/* Icon */}
                  <span className={`flex-shrink-0 ${format === fmt.value ? 'text-lo-green' : 'text-muted-foreground'}`}>
                    {fmt.icon}
                  </span>
                  {/* Label + description */}
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium">{fmt.label}</span>
                    <span className="block text-[11px] text-muted-foreground truncate">{fmt.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* File preview name */}
          <div className="px-3 py-2 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              File will be saved as: <span className="font-mono font-medium text-foreground">{name.trim() || 'Untitled'}.{format}</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-border bg-muted/30">
          <button
            className="px-5 py-2.5 text-sm rounded-lg border border-border hover:bg-accent min-h-[40px] font-medium"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-5 py-2.5 text-sm rounded-lg bg-lo-green text-white hover:bg-lo-green-dark min-h-[40px] font-medium flex items-center gap-2"
            onClick={handleSave}
          >
            <FileText size={14} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
