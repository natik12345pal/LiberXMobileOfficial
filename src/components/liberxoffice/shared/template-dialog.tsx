'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Download, Trash2, FileText, Table2, Presentation } from 'lucide-react';
import { SavedTemplate, loadTemplates, saveTemplate, deleteTemplate, getTemplatesByType } from '@/lib/templates';

interface TemplateDialogProps {
  show: boolean;
  onClose: () => void;
  mode: 'save' | 'load';
  type: 'writer' | 'calc' | 'impress';
  currentContent: () => string; // function to get current content as JSON string
  onLoad: (data: string) => void; // called with template data
  fileName: string;
}

export default function TemplateDialog({ show, onClose, mode, type, currentContent, onLoad, fileName }: TemplateDialogProps) {
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (show) setTemplates(getTemplatesByType(type));
  }, [show, type]);

  if (!show) return null;

  function handleSave() {
    if (!templateName.trim()) return;
    saveTemplate({
      name: templateName.trim(),
      type,
      data: currentContent(),
    });
    setSaveSuccess(true);
    setTemplateName('');
    setTimeout(() => { setSaveSuccess(false); setTemplates(getTemplatesByType(type)); }, 1500);
  }

  function handleLoad(tpl: SavedTemplate) {
    onLoad(tpl.data);
    onClose();
  }

  function handleDelete(id: string) {
    deleteTemplate(id);
    setTemplates(getTemplatesByType(type));
  }

  const typeIcon = type === 'writer' ? <FileText size={16} /> : type === 'calc' ? <Table2 size={16} /> : <Presentation size={16} />;
  const typeLabel = type === 'writer' ? 'Document' : type === 'calc' ? 'Spreadsheet' : 'Presentation';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-2xl w-[500px] max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-base font-semibold flex items-center gap-2">{typeIcon} {mode === 'save' ? 'Save as Template' : 'Load Template'}</h2>
          <button className="lo-toolbar-btn w-8 h-8" onClick={onClose}><X size={16} /></button>
        </div>

        {mode === 'save' && (
          <div className="p-4 border-b border-border">
            <label className="text-xs text-muted-foreground mb-1 block">Template Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 h-10 px-3 text-sm border border-border rounded-md bg-transparent"
                placeholder={`My ${typeLabel} Template`}
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                autoFocus
              />
              <button
                className="px-4 py-2 text-sm bg-lo-green text-white rounded-md hover:bg-lo-green-dark transition-colors touch-target flex items-center gap-1"
                onClick={handleSave}
                disabled={!templateName.trim()}
              >
                <Save size={14} /> Save
              </button>
            </div>
            {saveSuccess && <p className="text-xs text-lo-green mt-2">Template saved successfully!</p>}
          </div>
        )}

        <div className="p-4 overflow-y-auto lo-scrollbar" style={{ maxHeight: mode === 'save' ? '300px' : '400px' }}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {mode === 'save' ? 'Existing Templates' : 'Available Templates'} ({templates.length})
          </h3>
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No templates saved yet.</p>
          ) : (
            <div className="space-y-2">
              {templates.map(tpl => (
                <div key={tpl.id} className="flex items-center gap-3 p-3 rounded-md border border-border hover:bg-accent/50 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tpl.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tpl.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  {mode === 'load' && (
                    <button className="lo-toolbar-btn shrink-0" onClick={() => handleLoad(tpl)} title="Load">
                      <Download size={14} className="text-lo-green" />
                    </button>
                  )}
                  <button className="lo-toolbar-btn shrink-0 opacity-60 hover:opacity-100" onClick={() => handleDelete(tpl.id)} title="Delete">
                    <Trash2 size={14} className="text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-border">
          <button className="w-full h-10 border border-border rounded-md hover:bg-accent transition-colors touch-target text-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
