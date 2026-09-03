'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore, AppView } from '@/stores/app-store';
import { useCalcStore } from '@/stores/calc-store';
import { useImpressStore } from '@/stores/impress-store';
import { openImageFile } from '@/lib/file-service';
import {
  FileText, Table2, Presentation, Home,
  Undo2, Redo2, ZoomIn, ZoomOut,
  Moon, Sun, Maximize2, Minimize2
} from 'lucide-react';

type MenuId = 'file' | 'edit' | 'view' | 'insert' | 'format' | 'tools' | 'help' | null;

interface MenuBarProps {
  currentView: AppView;
  onNewDocument?: () => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onOpen?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
}

export default function MenuBar({ currentView, onNewDocument, onSave, onUndo, onRedo, onOpen, onExport, onPrint }: MenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<MenuId>(null);
  const { navigateTo, zoomIn, zoomOut, setZoom, toggleSidebar, fileName, isModified,
    darkMode, toggleDarkMode, toggleFindReplace, toggleShortcuts, toggleAbout,
    toggleSortDialog, toggleChartDialog, isFullscreen, toggleFullscreen, togglePrintPreview, toggleFilterDialog, togglePageSetup, toggleConditionalFormatDialog, toggleDataValidationDialog, toggleNamedRangesDialog, togglePivotTableDialog,
    toggleSlideSorter, toggleSlideMaster, toggleDuplicateDialog, toggleNotesPanel, toggleSplitView,
    toggleCellBorderDialog, toggleTextToColumnsDialog, toggleGoalSeekDialog, toggleSaveAsDialog, } = useAppStore();

  const viewLabels: Record<AppView, string> = {
    'start-center': 'LiberXMobile',
    writer: `Writer - ${fileName}${isModified ? ' *' : ''}`,
    calc: `Calc - ${fileName}${isModified ? ' *' : ''}`,
    impress: `Impress - ${fileName}${isModified ? ' *' : ''}`,
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F5') { e.preventDefault(); toggleSidebar(); }
      if (e.key === 'F1') { e.preventDefault(); toggleShortcuts(); }
      if (e.key === 'F11') { e.preventDefault(); toggleFullscreen(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); toggleFindReplace(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); onNewDocument?.(); }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') { e.preventDefault(); toggleSaveAsDialog(); }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 's') { e.preventDefault(); onSave?.(); }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === '0') { e.preventDefault(); setZoom(100); }
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) { e.preventDefault(); zoomIn(); }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') { e.preventDefault(); zoomOut(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleSidebar, toggleShortcuts, toggleFullscreen, toggleFindReplace, onNewDocument, onSave, setZoom, zoomIn, zoomOut, toggleSaveAsDialog]);

  const handleAction = (action: string) => {
    setActiveMenu(null);
    switch (action) {
      case 'new': onNewDocument?.(); break;
      case 'open': onOpen?.(); break;
      case 'save': onSave?.(); break;
      case 'saveas': toggleSaveAsDialog(); break;
      case 'export': onExport?.(); break;
      case 'print': onPrint?.(); break;
      case 'home': navigateTo('start-center'); break;
      case 'undo': onUndo?.(); break;
      case 'redo': onRedo?.(); break;
      case 'findreplace': toggleFindReplace(); break;
      case 'zoomin': zoomIn(); break;
      case 'zoomout': zoomOut(); break;
      case 'zoomreset': setZoom(100); break;
      case 'sidebar': toggleSidebar(); break;
      case 'fullscreen': toggleFullscreen(); break;
      case 'darkmode': toggleDarkMode(); break;
      case 'shortcuts': toggleShortcuts(); break;
      case 'about': toggleAbout(); break;
      case 'sort': toggleSortDialog(); break;
      case 'chart': toggleChartDialog(); break;
      case 'printpreview': togglePrintPreview(); break;
      case 'filter': toggleFilterDialog(); break;
      case 'pagesetup': togglePageSetup(); break;
      case 'conditionalformat': toggleConditionalFormatDialog(); break;
      case 'datavalidation': toggleDataValidationDialog(); break;
      case 'namedrange': toggleNamedRangesDialog(); break;
      case 'pivottable': togglePivotTableDialog(); break;
      case 'cellborder': toggleCellBorderDialog(); break;
      case 'texttocolumns': toggleTextToColumnsDialog(); break;
      case 'goalseek': toggleGoalSeekDialog(); break;
      case 'grouprows': window.dispatchEvent(new CustomEvent('liberx-action', { detail: 'grouprows' })); break;
      case 'ungrouprows': window.dispatchEvent(new CustomEvent('liberx-action', { detail: 'ungrouprows' })); break;
      case 'openxlsx': window.dispatchEvent(new CustomEvent('liberx-action', { detail: 'openxlsx' })); break;
      case 'autofitcol': useCalcStore.getState().autoFitColumn(useCalcStore.getState().selectedCell.replace(/\d+/, '')); break;
      // Impress-specific actions
      case 'slidemaster': toggleSlideMaster(); break;
      case 'slidesorter': toggleSlideSorter(); break;
      case 'notespanel': toggleNotesPanel(); break;
      case 'duplicatedialog': toggleDuplicateDialog(); break;
      case 'togglesplit': toggleSplitView(); break;
      case 'cut': document.execCommand('cut'); break;
      case 'copy': document.execCommand('copy'); break;
      case 'paste': document.execCommand('paste'); break;
      case 'selectall': document.execCommand('selectAll'); break;
      case 'bold': document.execCommand('bold'); break;
      case 'italic': document.execCommand('italic'); break;
      case 'underline': document.execCommand('underline'); break;
      case 'alignleft': document.execCommand('justifyLeft'); break;
      case 'aligncenter': document.execCommand('justifyCenter'); break;
      case 'alignright': document.execCommand('justifyRight'); break;
      case 'alignjustify': document.execCommand('justifyFull'); break;
      case 'spellcheck': window.dispatchEvent(new CustomEvent('liberx-action', { detail: 'spellcheck' })); break;
      case 'toggleruler': window.dispatchEvent(new CustomEvent('liberx-action', { detail: 'toggleruler' })); break;
      case 'setbgimage': {
        openImageFile().then(({ dataUrl }) => {
          useImpressStore.getState().pushUndo();
          useImpressStore.getState().setSlideBackground(useImpressStore.getState().activeSlideIndex, dataUrl);
        }).catch(() => {});
        break;
      }
      case 'cameracapture': {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.setAttribute('capture', 'environment');
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            const store = useImpressStore.getState();
            useImpressStore.getState().addElement(store.activeSlideIndex, {
              id: `el-${Date.now()}`, type: 'image', x: 110, y: 50, width: 360, height: 270,
              content: '', src: reader.result as string, borderRadius: 0,
            });
          };
          reader.readAsDataURL(file);
        };
        input.click();
        break;
      }
      // Writer-specific actions (dispatched via custom events)
      default:
        window.dispatchEvent(new CustomEvent('liberx-action', { detail: action }));
        break;
    }
  };

  // Build menus based on current view
  const getMenus = (): Record<string, { label: string; items: { label: string; shortcut?: string; action?: string; divider?: boolean; disabled?: boolean }[] }> => {
    const baseMenus: Record<string, { label: string; items: { label: string; shortcut?: string; action?: string; divider?: boolean; disabled?: boolean }[] }> = {
      file: {
        label: 'File',
        items: [
          { label: 'New', shortcut: 'Ctrl+N', action: 'new' },
          { label: 'Open...', shortcut: 'Ctrl+O', action: 'open' },
          { label: '', divider: true, action: '' },
          { label: 'Save', shortcut: 'Ctrl+S', action: 'save' },
          { label: 'Save As...', shortcut: 'Ctrl+Shift+S', action: 'saveas' },
          { label: 'Download as HTML', shortcut: 'Ctrl+E', action: 'export' },
          { label: '', divider: true, action: '' },
          { label: 'Print...', shortcut: 'Ctrl+P', action: 'print' },
          { label: 'Print Preview', action: 'printpreview' },
          { label: 'Page Setup...', action: 'pagesetup' },
          { label: '', divider: true, action: '' },
          { label: 'Return to Start Center', action: 'home' },
        ],
      },
      edit: {
        label: 'Edit',
        items: [
          { label: 'Undo', shortcut: 'Ctrl+Z', action: 'undo' },
          { label: 'Redo', shortcut: 'Ctrl+Y', action: 'redo' },
          { label: '', divider: true, action: '' },
          { label: 'Cut', shortcut: 'Ctrl+X', action: 'cut' },
          { label: 'Copy', shortcut: 'Ctrl+C', action: 'copy' },
          { label: 'Paste', shortcut: 'Ctrl+V', action: 'paste' },
          { label: '', divider: true, action: '' },
          { label: 'Find & Replace...', shortcut: 'Ctrl+F', action: 'findreplace' },
          { label: 'Track Changes...', action: 'trackchanges' },
          { label: '', divider: true, action: '' },
          { label: 'Select All', shortcut: 'Ctrl+A', action: 'selectall' },
        ],
      },
      view: {
        label: 'View',
        items: [
          { label: 'Zoom In', shortcut: 'Ctrl++', action: 'zoomin' },
          { label: 'Zoom Out', shortcut: 'Ctrl+-', action: 'zoomout' },
          { label: 'Reset Zoom', shortcut: 'Ctrl+0', action: 'zoomreset' },
          { label: '', divider: true, action: '' },
          { label: 'Toggle Sidebar', shortcut: 'F5', action: 'sidebar' },
          { label: 'Full Screen', shortcut: 'F11', action: 'fullscreen' },
          { label: '', divider: true, action: '' },
          { label: darkMode ? 'Light Mode' : 'Dark Mode', action: 'darkmode' },
        ],
      },
      format: {
        label: 'Format',
        items: [
          { label: 'Bold', shortcut: 'Ctrl+B', action: 'bold' },
          { label: 'Italic', shortcut: 'Ctrl+I', action: 'italic' },
          { label: 'Underline', shortcut: 'Ctrl+U', action: 'underline' },
          { label: '', divider: true, action: '' },
          { label: 'Align Left', action: 'alignleft' },
          { label: 'Align Center', action: 'aligncenter' },
          { label: 'Align Right', action: 'alignright' },
          { label: 'Justify', action: 'alignjustify' },
        ],
      },
      tools: {
        label: 'Tools',
        items: [
          { label: 'Spelling and Grammar', action: 'spellcheck' },
          { label: 'AutoText...', action: 'autotext' },
          { label: '', divider: true, action: '' },
          { label: 'Word Count', action: 'wordcount' },
        ],
      },
      help: {
        label: 'Help',
        items: [
          { label: 'Keyboard Shortcuts', shortcut: 'F1', action: 'shortcuts' },
          { label: 'About LiberXMobile', action: 'about' },
        ],
      },
    };

    // Writer-specific menus
    if (currentView === 'writer') {
      baseMenus.view = {
        label: 'View',
        items: [
          { label: 'Zoom In', shortcut: 'Ctrl++', action: 'zoomin' },
          { label: 'Zoom Out', shortcut: 'Ctrl+-', action: 'zoomout' },
          { label: 'Reset Zoom', shortcut: 'Ctrl+0', action: 'zoomreset' },
          { label: 'Zoom to Fit', action: 'zoomtofit' },
          { label: '', divider: true, action: '' },
          { label: 'Toggle Sidebar', shortcut: 'F5', action: 'sidebar' },
          { label: 'Full Screen', shortcut: 'F11', action: 'fullscreen' },
          { label: 'Split Screen', action: 'togglesplit' },
          { label: 'Ruler', action: 'toggleruler' },
          { label: 'Line Numbers', action: 'togglelinenumbers' },
          { label: '', divider: true, action: '' },
          { label: darkMode ? 'Light Mode' : 'Dark Mode', action: 'darkmode' },
        ],
      };
      baseMenus.file = {
        label: 'File',
        items: [
          { label: 'New', shortcut: 'Ctrl+N', action: 'new' },
          { label: 'Open...', shortcut: 'Ctrl+O', action: 'open' },
          { label: 'Open DOCX...', action: 'opendocx' },
          { label: '', divider: true, action: '' },
          { label: 'Save', shortcut: 'Ctrl+S', action: 'save' },
          { label: 'Save As...', shortcut: 'Ctrl+Shift+S', action: 'saveas' },
          { label: 'Download as HTML', shortcut: 'Ctrl+E', action: 'export' },
          { label: 'Export as PDF', action: 'exportpdf' },
          { label: 'Export as DOCX', action: 'exportdocx' },
          { label: '', divider: true, action: '' },
          { label: 'Save as Template...', action: 'savetemplate' },
          { label: 'Load Template...', action: 'loadtemplate' },
          { label: '', divider: true, action: '' },
          { label: 'Print...', shortcut: 'Ctrl+P', action: 'print' },
          { label: 'Print Preview', action: 'printpreview' },
          { label: 'Page Setup...', action: 'pagesetup' },
          { label: '', divider: true, action: '' },
          { label: 'Return to Start Center', action: 'home' },
        ],
      };
      baseMenus.insert = {
        label: 'Insert',
        items: [
          { label: 'Hyperlink...', shortcut: 'Ctrl+K', action: 'inserthyperlink' },
          { label: 'Table of Contents', action: 'inserttoc' },
          { label: 'Footnote', action: 'insertfootnote' },
          { label: 'Endnote', action: 'insertendnote' },
          { label: 'Bookmark', action: 'insertbookmark' },
          { label: 'Cross-Reference...', action: 'insertcrossref' },
          { label: 'Section Break', action: 'insertsectionbreak' },
          { label: '', divider: true, action: '' },
          { label: 'Special Characters', action: 'insertspecialchar' },
        ],
      };
      baseMenus.format = {
        label: 'Format',
        items: [
          { label: 'Bold', shortcut: 'Ctrl+B', action: 'bold' },
          { label: 'Italic', shortcut: 'Ctrl+I', action: 'italic' },
          { label: 'Underline', shortcut: 'Ctrl+U', action: 'underline' },
          { label: '', divider: true, action: '' },
          { label: 'Align Left', action: 'alignleft' },
          { label: 'Align Center', action: 'aligncenter' },
          { label: 'Align Right', action: 'alignright' },
          { label: 'Justify', action: 'alignjustify' },
          { label: '', divider: true, action: '' },
          { label: 'Drop Cap', action: 'dropcap' },
          { label: 'Paragraph Borders/Shading...', action: 'paraborders' },
          { label: 'Watermark...', action: 'watermark' },
          { label: '', divider: true, action: '' },
          { label: '1 Column', action: 'setcolumns1' },
          { label: '2 Columns', action: 'setcolumns2' },
          { label: '3 Columns', action: 'setcolumns3' },
          { label: '', divider: true, action: '' },
          { label: 'Increase Indent (Tab)', action: 'increasetab' },
          { label: 'Decrease Indent', action: 'decreasetab' },
        ],
      };
      baseMenus.tools = {
        label: 'Tools',
        items: [
          { label: 'Word Count...', shortcut: 'Ctrl+Shift+W', action: 'wordcount' },
          { label: 'Set Word Goal...', action: 'setwordgoal' },
          { label: '', divider: true, action: '' },
          { label: 'Auto-correct', action: 'toggleautocorrect' },
          { label: '', divider: true, action: '' },
          { label: 'Spelling and Grammar', action: 'spellcheck' },
          { label: 'AutoText...', action: 'autotext' },
          { label: 'Track Changes...', action: 'trackchanges' },
          { label: '', divider: true, action: '' },
          { label: 'Keyboard Shortcuts', shortcut: 'F1', action: 'shortcuts' },
        ],
      };
    }

    // Calc-specific menus
    if (currentView === 'calc') {
      baseMenus.file = {
        label: 'File',
        items: [
          { label: 'New', shortcut: 'Ctrl+N', action: 'new' },
          { label: 'Open...', shortcut: 'Ctrl+O', action: 'open' },
          { label: 'Open XLSX...', action: 'openxlsx' },
          { label: '', divider: true, action: '' },
          { label: 'Save', shortcut: 'Ctrl+S', action: 'save' },
          { label: 'Save As...', shortcut: 'Ctrl+Shift+S', action: 'saveas' },
          { label: 'Export as XLSX', action: 'export' },
          { label: '', divider: true, action: '' },
          { label: 'Print...', shortcut: 'Ctrl+P', action: 'print' },
          { label: 'Print Preview', action: 'printpreview' },
          { label: '', divider: true, action: '' },
          { label: 'Return to Start Center', action: 'home' },
        ],
      };
      baseMenus.format = {
        label: 'Format',
        items: [
          { label: 'Conditional Formatting...', action: 'conditionalformat' },
          { label: 'Cell Borders...', action: 'cellborder' },
          { label: 'Auto-fit Column', action: 'autofitcol' },
        ],
      };
      baseMenus.data = {
        label: 'Data',
        items: [
          { label: 'Validation...', action: 'datavalidation' },
          { label: 'Pivot Table...', action: 'pivottable' },
          { label: '', divider: true, action: '' },
          { label: 'AutoFilter...', action: 'filter' },
          { label: 'Text to Columns...', action: 'texttocolumns' },
          { label: '', divider: true, action: '' },
          { label: 'Group...', action: 'grouprows' },
          { label: 'Ungroup', action: 'ungrouprows' },
        ],
      };
      baseMenus.insert = {
        label: 'Insert',
        items: [
          { label: 'Named Range...', action: 'namedrange' },
        ],
      };
      baseMenus.tools = {
        label: 'Tools',
        items: [
          { label: 'Sort Data...', action: 'sort' },
          { label: 'Insert Chart...', action: 'chart' },
          { label: 'Conditional Formatting...', action: 'conditionalformat' },
          { label: 'Pivot Table...', action: 'pivottable' },
          { label: '', divider: true, action: '' },
          { label: 'Goal Seek...', action: 'goalseek' },
        ],
      };
    }

    // Impress-specific menus
    if (currentView === 'impress') {
      baseMenus.view = {
        label: 'View',
        items: [
          { label: 'Zoom In', shortcut: 'Ctrl++', action: 'zoomin' },
          { label: 'Zoom Out', shortcut: 'Ctrl+-', action: 'zoomout' },
          { label: 'Reset Zoom', shortcut: 'Ctrl+0', action: 'zoomreset' },
          { label: '', divider: true, action: '' },
          { label: 'Toggle Sidebar', shortcut: 'F5', action: 'sidebar' },
          { label: 'Full Screen', shortcut: 'F11', action: 'fullscreen' },
          { label: '', divider: true, action: '' },
          { label: 'Slide Master...', action: 'slidemaster' },
          { label: 'Slide Sorter', action: 'slidesorter' },
          { label: 'Notes Panel', action: 'notespanel' },
          { label: '', divider: true, action: '' },
          { label: darkMode ? 'Light Mode' : 'Dark Mode', action: 'darkmode' },
        ],
      };
      baseMenus.insert = {
        label: 'Insert',
        items: [
          { label: 'Image from Camera...', action: 'cameracapture' },
        ],
      };
      baseMenus.format = {
        label: 'Format',
        items: [
          { label: 'Bold', shortcut: 'Ctrl+B', action: 'bold' },
          { label: 'Italic', shortcut: 'Ctrl+I', action: 'italic' },
          { label: 'Underline', shortcut: 'Ctrl+U', action: 'underline' },
          { label: '', divider: true, action: '' },
          { label: 'Align Left', action: 'alignleft' },
          { label: 'Align Center', action: 'aligncenter' },
          { label: 'Align Right', action: 'alignright' },
          { label: '', divider: true, action: '' },
          { label: 'Slide Background' },
          { label: '  From Image...', action: 'setbgimage' },
        ],
      };
      baseMenus.edit = {
        label: 'Edit',
        items: [
          { label: 'Undo', shortcut: 'Ctrl+Z', action: 'undo' },
          { label: 'Redo', shortcut: 'Ctrl+Y', action: 'redo' },
          { label: '', divider: true, action: '' },
          { label: 'Cut', shortcut: 'Ctrl+X', action: 'cut' },
          { label: 'Copy', shortcut: 'Ctrl+C', action: 'copy' },
          { label: 'Paste', shortcut: 'Ctrl+V', action: 'paste' },
          { label: '', divider: true, action: '' },
          { label: 'Duplicate Slide with Options...', action: 'duplicatedialog' },
          { label: 'Track Changes...', action: 'trackchanges' },
          { label: '', divider: true, action: '' },
          { label: 'Select All', shortcut: 'Ctrl+A', action: 'selectall' },
        ],
      };
    }

    return baseMenus;
  };

  const menus = getMenus();

  return (
    <div className="lo-menubar select-none">
      {/* App Icon & Title */}
      <button className="flex items-center gap-2 px-2 py-1 rounded-sm hover:bg-black/6 mr-2 touch-target" onClick={() => navigateTo('start-center')} title="Return to Start Center">
        <img src="/logo.png" alt="LiberXMobile" className="w-5 h-5 rounded object-contain" />
        <span className="text-xs font-medium text-muted-foreground hidden sm:inline">{viewLabels[currentView]}</span>
      </button>

      {/* Menu Items */}
      {Object.entries(menus).map(([id, menu]) => (
        <div key={id} className="relative">
          <button className={`lo-menubar-item ${activeMenu === id ? 'bg-black/8' : ''}`}
            onClick={() => setActiveMenu(activeMenu === id ? null : id as MenuId)}
            onMouseEnter={() => activeMenu && setActiveMenu(id as MenuId)}>
            {menu.label}
          </button>
          {activeMenu === id && (
            <div className="absolute top-full left-0 z-50 min-w-[220px] bg-white dark:bg-zinc-800 border border-border rounded-md shadow-lg py-1"
              onMouseLeave={() => setActiveMenu(null)}>
              {menu.items.map((item, i) =>
                item.divider ? (
                  <div key={i} className="h-px bg-border my-1" />
                ) : (
                  <button key={i} className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent transition-colors touch-target"
                    onClick={() => item.action && handleAction(item.action)} disabled={item.disabled}>
                    <span className={item.disabled ? 'text-muted-foreground' : ''}>{item.label}</span>
                    {item.shortcut && <span className="text-xs text-muted-foreground ml-4">{item.shortcut}</span>}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      ))}

      {/* Quick actions */}
      <div className="ml-auto flex items-center gap-0.5">
        <button className="lo-toolbar-btn" onClick={() => onUndo?.()} title="Undo"><Undo2 size={16} /></button>
        <button className="lo-toolbar-btn" onClick={() => onRedo?.()} title="Redo"><Redo2 size={16} /></button>
        <div className="w-px h-5 bg-border mx-1" />
        <button className="lo-toolbar-btn" onClick={() => zoomOut()} title="Zoom Out"><ZoomOut size={16} /></button>
        <button className="lo-toolbar-btn" onClick={() => zoomIn()} title="Zoom In"><ZoomIn size={16} /></button>
        <div className="w-px h-5 bg-border mx-1" />
        <button className="lo-toolbar-btn" onClick={toggleDarkMode} title={darkMode ? 'Light Mode' : 'Dark Mode'}>
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button className="lo-toolbar-btn" onClick={toggleFullscreen} title="Full Screen">
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>
    </div>
  );
}