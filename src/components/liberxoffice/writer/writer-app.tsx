'use client';

import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { useAppStore } from '@/stores/app-store';
import { openImageFile, downloadHTML, downloadTXT, openFile, autoSave, loadAutoSave, clearAutoSave, printDocument, downloadDOCX, openDOCXFile } from '@/lib/file-service';
import { persist, load } from '@/lib/persistence';
import MenuBar from '../shared/menu-bar';
import StatusBar from '../shared/status-bar';
import WriterToolbar from './writer-toolbar';
import WriterSidebar from './writer-sidebar';
import FindReplace from '../shared/find-replace';
import SpecialChars from '../shared/special-chars';
import TableInsert from '../dialogs/table-insert';
import PrintPreview from '../dialogs/print-preview';
import WordCountDialog from './word-count-dialog';
import { FootnoteDialog, FootnotesListDialog, FootnoteItem, loadFootnotes, saveFootnotes, generateFootnoteId } from './footnotes';
import { InsertBookmarkDialog, CrossRefDialog, BookmarkEntry, loadBookmarks, saveBookmarks } from './bookmarks';
import { useContextMenu } from '../shared/context-menu';
import TemplateDialog from '../shared/template-dialog';
import Ruler from './ruler';
import PageSetup from '../dialogs/page-setup';
import HyperlinkDialog from './hyperlink-dialog';
import ParaBordersDialog from './para-borders-dialog';
import WatermarkDialog from './watermark-dialog';
import SaveAsDialog from '../dialogs/save-as-dialog';
import SpellCheckDialog from '../dialogs/spell-check-dialog';
import AutoTextDialog from '../dialogs/autotext-dialog';
import TrackChangesDialog, { getTrackChangesEnabled } from '../dialogs/track-changes-dialog';
import { Scissors, Copy, ClipboardPaste, Trash2, Table, ImagePlus, Minus, AlignLeft, Heading1, Heading2, Heading3, Type, Quote, Bookmark as BookmarkIcon, FileText, Hash, Columns2, Link, RectangleHorizontal, Droplets, Pilcrow, Section, FileDown } from 'lucide-react';

const DEFAULT_CONTENT = `
<h1>Formal Letter Writing</h1>
<p>This is a sample document to help you practice letter writing for your Class 10 English examination. In CBSE and ICSE board exams, letter writing carries significant marks and requires proper format.</p>
<h2>Format of a Formal Letter</h2>
<p><strong>Sender's Address</strong><br />123, Sector 15<br />New Delhi - 110001</p>
<p><strong>Date:</strong> 30 August 2026</p>
<p><strong>The Principal</strong><br />Delhi Public School<br />New Delhi - 110001</p>
<p><strong>Subject:</strong> Application for Leave of Absence</p>
<p>Respected Madam,</p>
<p>Most respectfully, I beg to state that I am a student of Class X-A, bearing roll number 25. I have been suffering from viral fever since last three days, as confirmed by my doctor. Therefore, I am unable to attend school for the next five days.</p>
<p>I request you to kindly grant me leave of absence from 30 August to 3 September 2026. I shall be grateful for your kind consideration.</p>
<p>Thanking you,</p>
<p>Yours obediently,<br /><strong>Aarav Sharma</strong><br />Class X-A, Roll No. 25</p>
<hr />
<h2>Key Points for Letter Writing</h2>
<ul>
  <li>Always include sender's address at the top right</li>
  <li>Write the date below the sender's address</li>
  <li>Include the receiver's designation and address</li>
  <li>Write a clear and concise subject line</li>
  <li>Use proper salutation (Respected Sir/Madam)</li>
  <li>Body should be divided into 2-3 paragraphs</li>
  <li>End with proper closing (Yours obediently/sincerely)</li>
</ul>
<p>This document was created in <strong>LiberXOffice Writer</strong>, optimized for Indian school students.</p>
`;

const FORMAL_LETTER = `<p><strong>Sender's Address</strong></p><p>123, Sector 15<br />New Delhi - 110001</p><p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p><p><strong>The Principal</strong><br />[School Name]<br />[City] - [PIN Code]</p><p><strong>Subject:</strong> [Write Subject Here]</p><p>Respected Sir/Madam,</p><p>&nbsp;&nbsp;&nbsp;&nbsp;Most respectfully, I beg to state that [write the purpose of your letter in 2-3 sentences].</p><p>&nbsp;&nbsp;&nbsp;&nbsp;[Add another paragraph with supporting details or reasons].</p><p>&nbsp;&nbsp;&nbsp;&nbsp;I request you to kindly [state what you want the recipient to do]. I shall be grateful for your kind consideration.</p><p>Thanking you,</p><p>Yours obediently,<br /><strong>[Your Name]</strong><br />Class [X-A], Roll No. [XX]</p>`;

const INFORMAL_LETTER = `<p>[Your Address]</p><p>${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p><p>Dear [Friend's Name],</p><p>&nbsp;&nbsp;&nbsp;&nbsp;I hope this letter finds you in good health and spirits. I am writing to share [the main purpose of your letter].</p><p>&nbsp;&nbsp;&nbsp;&nbsp;[Add details about what you want to convey in 2-3 sentences].</p><p>&nbsp;&nbsp;&nbsp;&nbsp;[Share any other news, plans, or feelings you want to express].</p><p>&nbsp;&nbsp;&nbsp;&nbsp;Do write back soon. I am eagerly waiting for your reply.</p><p>With love,</p><p><strong>[Your Name]</strong></p>`;

const ESSAY_OUTLINE = `<h1>[Essay Title]</h1><h2>Introduction</h2><p>[Write an engaging opening sentence that introduces the topic. Provide brief background context. State your thesis or main argument clearly.]</p><h2>Body Paragraph 1</h2><p><strong>Topic Sentence:</strong> [First main point]</p><p>[Supporting details, examples, and explanations for this point.]</p><h2>Body Paragraph 2</h2><p><strong>Topic Sentence:</strong> [Second main point]</p><p>[Supporting details and evidence.]</p><h2>Body Paragraph 3</h2><p><strong>Topic Sentence:</strong> [Third main point]</p><p>[Supporting details.]</p><h2>Conclusion</h2><p>[Restate your thesis. Summarize key points. End with a strong closing statement.]</p>`;

const LAB_REPORT = `<h1>[Experiment Name]</h1><p><strong>Subject:</strong> [Physics/Chemistry/Biology]<br /><strong>Class:</strong> X<br /><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p><hr /><h2>Aim</h2><p>[State the objective of the experiment clearly.]</p><h2>Materials Required</h2><ul><li>[Item 1]</li><li>[Item 2]</li><li>[Item 3]</li></ul>
<h2>Theory</h2><p>[Brief explanation of the scientific principle.]</p><h2>Procedure</h2><ol><li>[Step 1]</li><li>[Step 2]</li><li>[Step 3]</li></ol>
<h2>Observations</h2><table style="border-collapse:collapse;width:100%"><tr style="background:#18A303;color:white"><th style="border:1px solid #999;padding:6px;text-align:left">S.No.</th><th style="border:1px solid #999;padding:6px;text-align:left">Observation</th><th style="border:1px solid #999;padding:6px;text-align:left">Reading</th></tr><tr><td style="border:1px solid #999;padding:6px">1</td><td style="border:1px solid #999;padding:6px">[Observation]</td><td style="border:1px solid #999;padding:6px">[Value]</td></tr></table>
<h2>Result</h2><p>[State the conclusion.]</p>`;

// --- Roman numeral helpers ---
function toRoman(num: number, upper: boolean = false): string {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = upper
    ? ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I']
    : ['m', 'cm', 'd', 'cd', 'c', 'xc', 'l', 'xl', 'x', 'ix', 'v', 'iv', 'i'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (num >= vals[i]) { result += syms[i]; num -= vals[i]; }
  }
  return result;
}

function toLetter(num: number): string {
  return String.fromCharCode(96 + ((num - 1) % 26) + 1);
}

function formatPageNumber(num: number, format: string): string {
  switch (format) {
    case 'roman-lower': return toRoman(num, false);
    case 'roman-upper': return toRoman(num, true);
    case 'letter-lower': return toLetter(num);
    default: return String(num);
  }
}

// --- Image resize state ---
interface ImageResizeState {
  img: HTMLImageElement;
  startX: number;
  startY: number;
  startW: number;
  startH: number;
  handle: string;
  shiftKey: boolean;
}

export default function WriterApp() {
  const editorRef = useRef<HTMLDivElement>(null);
  const mirrorEditorRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const { fileName, setFileName, setModified, sidebarOpen, showSplitView, zoomLevel } = useAppStore();
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [lineCount, setLineCount] = useState(0);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showSpecialChars, setShowSpecialChars] = useState(false);
  const [showHeaderFooter, setShowHeaderFooter] = useState(false);
  const [headerContent, setHeaderContent] = useState('');
  const [footerContent, setFooterContent] = useState('');
  const [pageMargins, setPageMargins] = useState({ top: 20, bottom: 20, left: 25, right: 25 });
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pageNumberFormat, setPageNumberFormat] = useState('arabic');
  const [activeFormats, setActiveFormats] = useState({
    bold: false, italic: false, underline: false, strikethrough: false,
    align: 'left', orderedList: false, unorderedList: false,
  });
  const [showRuler, setShowRuler] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('liberxoffice-show-ruler') === 'true';
  });

  // Writer feature states
  const [showWordCount, setShowWordCount] = useState(false);
  const [showFootnoteDialog, setShowFootnoteDialog] = useState(false);
  const [footnoteType, setFootnoteType] = useState<'footnote' | 'endnote'>('footnote');
  const [showFootnotesList, setShowFootnotesList] = useState(false);
  const [footnotes, setFootnotes] = useState<FootnoteItem[]>([]);
  const [showBookmarkDialog, setShowBookmarkDialog] = useState(false);
  const [showCrossRefDialog, setShowCrossRefDialog] = useState(false);
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);
  const [showWordGoalDialog, setShowWordGoalDialog] = useState(false);
  const [wordGoal, setWordGoal] = useState<number | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateMode, setTemplateMode] = useState<'save' | 'load'>('save');

  // New feature states
  const [showHyperlinkDialog, setShowHyperlinkDialog] = useState(false);
  const [showParaBordersDialog, setShowParaBordersDialog] = useState(false);
  const [showWatermarkDialog, setShowWatermarkDialog] = useState(false);
  const [columnCount, setColumnCount] = useState(1);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [watermark, setWatermark] = useState<{ text: string; fontSize: number; color: string; rotation: number; opacity: number } | null>(null);
  const [showSpellCheckDialog, setShowSpellCheckDialog] = useState(false);
  const [showAutoTextDialog, setShowAutoTextDialog] = useState(false);
  const [showTrackChangesDialog, setShowTrackChangesDialog] = useState(false);
  const { showSaveAsDialog, toggleSaveAsDialog } = useAppStore();

  // Image resize state
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [resizeOverlay, setResizeOverlay] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const resizeStateRef = useRef<ImageResizeState | null>(null);

  const { show: showCtxMenu, hide: hideCtxMenu, menuEl: contextMenuEl } = useContextMenu();

  // Initialize header/footer with default content
  useEffect(() => {
    setHeaderContent(fileName || 'Untitled Document');
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    setFooterContent(today);
  }, []);

  // Load saved data
  useEffect(() => {
    setFootnotes(loadFootnotes());
    setBookmarks(loadBookmarks());
    const savedGoal = localStorage.getItem('liberxoffice-writer-goal');
    if (savedGoal) setWordGoal(parseInt(savedGoal));
  }, []);

  // Calculate line numbers
  const lineNumbers = useMemo(() => {
    if (!editorRef.current || !showLineNumbers) return [];
    const text = editorRef.current.innerText || '';
    const lines = text.split('\n');
    const nums: number[] = [];
    let count = 0;
    for (const line of lines) {
      count++;
      if (line.trim() === '') {
        nums.push(-1); // blank
      } else {
        nums.push(count);
      }
    }
    return nums;
  }, [showLineNumbers, wordCount, charCount, lineCount]);

  // Resize handle positions helper
  const getResizeHandles = useCallback(() => {
    if (!resizeOverlay) return [];
    return [
      { pos: 'nw', left: -5, top: -5, cursor: 'nw-resize' },
      { pos: 'n', left: '50%', top: -5, cursor: 'n-resize' },
      { pos: 'ne', left: resizeOverlay.w - 4, top: -5, cursor: 'ne-resize' },
      { pos: 'e', left: resizeOverlay.w - 4, top: '50%', cursor: 'e-resize' },
      { pos: 'se', left: resizeOverlay.w - 4, top: resizeOverlay.h - 4, cursor: 'se-resize' },
      { pos: 's', left: '50%', top: resizeOverlay.h - 4, cursor: 's-resize' },
      { pos: 'sw', left: -5, top: resizeOverlay.h - 4, cursor: 'sw-resize' },
      { pos: 'w', left: -5, top: '50%', cursor: 'w-resize' },
    ];
  }, [resizeOverlay]);

  // Watermark repeated text
  const watermarkStyle = useMemo(() => {
    if (!watermark) return {};
    return {
      position: 'absolute' as const,
      inset: 0,
      overflow: 'hidden' as const,
      pointerEvents: 'none' as const,
      zIndex: 1,
    };
  }, [watermark]);

  // Listen for menu actions dispatched from menu-bar
  useEffect(() => {
    const handler = async (e: Event) => {
      const action = (e as CustomEvent).detail;
      switch (action) {
        case 'exportpdf':
          if (editorRef.current) {
            import('@/lib/pdf-export').then(({ exportWriterToPDF }) => {
              exportWriterToPDF(fileName, editorRef.current!.innerHTML);
            });
          }
          break;
        case 'exportdocx':
          if (editorRef.current) downloadDOCX(fileName, editorRef.current.innerHTML);
          break;
        case 'opendocx': {
          try {
            const { name, htmlContent } = await openDOCXFile();
            if (editorRef.current && htmlContent) {
              editorRef.current.innerHTML = htmlContent;
              setFileName(name);
              setModified(true);
              updateCounts();
            }
          } catch {}
          break;
        }
        case 'savetemplate': setShowTemplateDialog(true); setTemplateMode('save'); break;
        case 'loadtemplate': setShowTemplateDialog(true); setTemplateMode('load'); break;
        case 'inserttoc': generateTOC(); break;
        case 'insertfootnote': setFootnoteType('footnote'); setShowFootnoteDialog(true); break;
        case 'insertendnote': setFootnoteType('endnote'); setShowFootnoteDialog(true); break;
        case 'insertbookmark': setShowBookmarkDialog(true); break;
        case 'insertcrossref': setShowCrossRefDialog(true); break;
        case 'insertspecialchar': setShowSpecialChars(true); break;
        case 'inserthyperlink': setShowHyperlinkDialog(true); break;
        case 'insertsectionbreak': insertSectionBreak(); break;
        case 'wordcount': setShowWordCount(true); break;
        case 'setwordgoal': setShowWordGoalDialog(true); break;
        case 'toggleautocorrect': {
          import('@/lib/auto-correct').then(({ isAutoCorrectEnabled, setAutoCorrectEnabled }) => {
            setAutoCorrectEnabled(!isAutoCorrectEnabled());
          });
          break;
        }
        case 'zoomtofit': zoomToFit(); break;
        case 'toggleruler': {
          setShowRuler(prev => {
            const next = !prev;
            localStorage.setItem('liberxoffice-show-ruler', String(next));
            return next;
          });
          break;
        }
        case 'togglelinenumbers': setShowLineNumbers(p => !p); break;
        case 'paraborders': setShowParaBordersDialog(true); break;
        case 'watermark': setShowWatermarkDialog(true); break;
        case 'dropcap': toggleDropCap(); break;
        case 'setcolumns1': setColumnCount(1); break;
        case 'setcolumns2': setColumnCount(2); break;
        case 'setcolumns3': setColumnCount(3); break;
        case 'increasetab': {
          const sel = window.getSelection();
          if (sel?.anchorNode) {
            const el = (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode as HTMLElement);
            const p = el?.closest('p,div,h1,h2,h3,h4,h5,h6,li') as HTMLElement | null;
            if (p) p.style.paddingLeft = (parseInt(p.style.paddingLeft || '0') + 36) + 'px';
          }
          break;
        }
        case 'decreasetab': {
          const sel = window.getSelection();
          if (sel?.anchorNode) {
            const el = (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode as HTMLElement);
            const p = el?.closest('p,div,h1,h2,h3,h4,h5,h6,li') as HTMLElement | null;
            if (p) p.style.paddingLeft = Math.max(0, parseInt(p.style.paddingLeft || '0') - 36) + 'px';
          }
          break;
        }
        case 'spellcheck': setShowSpellCheckDialog(true); break;
        case 'autotext': setShowAutoTextDialog(true); break;
        case 'trackchanges': setShowTrackChangesDialog(true); break;
      }
    };
    window.addEventListener('liberx-action', handler);
    return () => window.removeEventListener('liberx-action', handler);
  }, [fileName, columnCount]);

  function updateCounts() {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
    setCharCount(text.length);
    setLineCount(text.split('\n').length);
  }

  function updateActiveFormats() {
    if (!editorRef.current) return;
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikethrough: document.queryCommandState('strikeThrough'),
      align: document.queryCommandState('justifyCenter') ? 'center' : document.queryCommandState('justifyRight') ? 'right' : document.queryCommandState('justifyFull') ? 'justify' : 'left',
      orderedList: document.queryCommandState('insertOrderedList'),
      unorderedList: document.queryCommandState('insertUnorderedList'),
    });
  }

  async function handleInsertImage() {
    try {
      const { name, dataUrl } = await openImageFile();
      editorRef.current?.focus();
      document.execCommand('insertHTML', false, `<img src="${dataUrl}" alt="${name}" style="max-width:100%;height:auto;margin:8px 0;" />`);
      setModified(true);
    } catch {}
  }

  function handleExport() {
    if (!editorRef.current) return;
    downloadHTML(fileName, editorRef.current.innerHTML);
    setModified(false);
  }

  async function handleOpen() {
    try {
      const { name, content } = await openFile('.html,.htm,.txt');
      if (editorRef.current) {
        const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        editorRef.current.innerHTML = bodyMatch ? bodyMatch[1] : content;
        setFileName(name);
        setModified(false);
        updateCounts();
      }
    } catch {}
  }

  function handleSave() {
    // Open Save As dialog so user can choose format (.docx, .html, .txt)
    toggleSaveAsDialog();
  }

  function handleTableInsert(rows: number, cols: number, header: boolean) {
    if (!editorRef.current) return;
    editorRef.current.focus();
    let html = '<table style="border-collapse:collapse;width:100%;margin:8px 0;">';
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        const tag = r === 0 && header ? 'th' : 'td';
        const style = r === 0 && header ? 'border:1px solid #999;padding:6px;background:#18A303;color:white;font-weight:bold;text-align:center;' : 'border:1px solid #999;padding:6px;';
        html += `<${tag} style="${style}">${r === 0 && header ? `Column ${c + 1}` : '&nbsp;'}</${tag}>`;
      }
      html += '</tr>';
    }
    html += '</table><p><br/></p>';
    document.execCommand('insertHTML', false, html);
    setModified(true);
    updateCounts();
  }

  function generateTOC() {
    if (!editorRef.current) return;
    const headings = editorRef.current.querySelectorAll('h1, h2, h3');
    if (headings.length === 0) return;
    headings.forEach((h, i) => { if (!h.id) h.id = `heading-${i + 1}`; });
    let tocHtml = '<div class="liberx-toc" style="border:1px solid #ccc;padding:12px 16px;margin:8px 0;background:#f9f9f9;border-radius:4px;">';
    tocHtml += '<p style="margin:0 0 8px 0;font-weight:bold;font-size:16px;color:#333;">Table of Contents</p>';
    headings.forEach((h) => {
      const level = parseInt(h.tagName[1]);
      const indent = (level - 1) * 20;
      tocHtml += `<p style="margin:4px 0;padding-left:${indent}px;"><a href="#${h.id}" style="color:#1a73e8;text-decoration:none;font-size:${14 - level + 1}px;">${h.textContent || ''}</a></p>`;
    });
    tocHtml += '</div><p><br/></p>';
    editorRef.current.focus();
    document.execCommand('insertHTML', false, tocHtml);
    setModified(true); updateCounts();
  }

  function handleInsertFootnote(text: string) {
    if (!editorRef.current) return;
    const fnType = footnoteType;
    const existingFns = footnotes.filter(f => f.type === fnType);
    const number = existingFns.length + 1;
    const id = generateFootnoteId();
    const newFn: FootnoteItem = { id, number, type: fnType, text };
    const updated = [...footnotes, newFn];
    setFootnotes(updated);
    saveFootnotes(updated);
    const color = fnType === 'footnote' ? '#18A303' : '#1a73e8';
    editorRef.current.focus();
    document.execCommand('insertHTML', false, `<sup style="color:${color};cursor:pointer;font-weight:bold;" title="${text}" data-fnid="${id}">${number}</sup>`);
    setModified(true); updateCounts();
  }

  function handleDeleteFootnote(id: string) {
    const updated = footnotes.filter(f => f.id !== id);
    const fnNotes = updated.filter(f => f.type === 'footnote').map((f, i) => ({ ...f, number: i + 1 }));
    const enNotes = updated.filter(f => f.type === 'endnote').map((f, i) => ({ ...f, number: i + 1 }));
    setFootnotes([...fnNotes, ...enNotes]);
    saveFootnotes([...fnNotes, ...enNotes]);
  }

  function handleInsertBookmark(name: string) {
    if (!editorRef.current) return;
    const id = `bm-${Date.now()}`;
    const newBm: BookmarkEntry = { id, name };
    const updated = [...bookmarks, newBm];
    setBookmarks(updated);
    saveBookmarks(updated);
    editorRef.current.focus();
    document.execCommand('insertHTML', false, `<span id="${name}" class="liberx-bookmark" style="display:inline-block;width:2px;height:16px;background:#18A303;vertical-align:middle;margin:0 2px;" title="Bookmark: ${name}"></span>`);
    setModified(true);
  }

  function handleInsertCrossRef(bookmarkName: string) {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('insertHTML', false, `<a href="#${bookmarkName}" style="color:#1a73e8;text-decoration:underline;">[Ref: ${bookmarkName}]</a>`);
    setModified(true); updateCounts();
  }

  function handleSetWordGoal(goal: number) {
    setWordGoal(goal);
    localStorage.setItem('liberxoffice-writer-goal', String(goal));
    setShowWordGoalDialog(false);
  }

  function getGoalProgress(): { pct: number; color: string } | null {
    if (!wordGoal) return null;
    const pct = Math.min(100, Math.round((wordCount / wordGoal) * 100));
    const color = pct < 50 ? '#ef4444' : pct < 80 ? '#eab308' : '#22c55e';
    return { pct, color };
  }

  // Debounced zoom-to-fit calculation
  const zoomToFitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function zoomToFit() {
    if (zoomToFitTimeoutRef.current) clearTimeout(zoomToFitTimeoutRef.current);
    zoomToFitTimeoutRef.current = setTimeout(() => {
      const docArea = document.querySelector('.lo-document-area') as HTMLElement | null;
      if (!docArea) return;
      const containerWidth = docArea.clientWidth - 64;
      const pageWidthMM = orientation === 'landscape' ? 297 : 210;
      const pageWidthPx = pageWidthMM * 3.78;
      const newZoom = Math.floor((containerWidth / pageWidthPx) * 100);
      useAppStore.getState().setZoom(Math.max(25, Math.min(300, newZoom)));
    }, 150);
  }

  // Sync mirror editor content from main editor (for split view)
  useEffect(() => {
    if (showSplitView && editorRef.current && mirrorEditorRef.current) {
      mirrorEditorRef.current.innerHTML = editorRef.current.innerHTML;
    }
  }, [showSplitView]);

  // --- Hyperlink insert/edit ---
  function handleInsertHyperlink(displayText: string, url: string) {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const html = `<a href="${url}" style="color:#1a73e8;text-decoration:underline">${displayText}</a>`;
    document.execCommand('insertHTML', false, html);
    setModified(true);
    updateCounts();
  }

  // --- Paragraph borders apply ---
  function handleApplyParaBorders(settings: any) {
    if (!editorRef.current) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    let node = sel.anchorNode;
    while (node && node !== editorRef.current && !(node instanceof HTMLParagraphElement) && !(node instanceof HTMLHeadingElement)) {
      node = node.parentNode;
    }
    if (node && node instanceof HTMLElement) {
      const bs = `${settings.width}px ${settings.style} ${settings.color}`;
      if (settings.top) node.style.borderTop = bs; else node.style.borderTop = 'none';
      if (settings.bottom) node.style.borderBottom = bs; else node.style.borderBottom = 'none';
      if (settings.left) node.style.borderLeft = bs; else node.style.borderLeft = 'none';
      if (settings.right) node.style.borderRight = bs; else node.style.borderRight = 'none';
      node.style.backgroundColor = settings.bgColor || 'transparent';
      node.style.padding = '8px';
      setModified(true);
    }
  }

  // --- Drop Cap toggle ---
  function toggleDropCap() {
    if (!editorRef.current) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    let node = sel.anchorNode;
    while (node && node !== editorRef.current && !(node instanceof HTMLParagraphElement)) {
      node = node.parentNode;
    }
    if (!node || node === editorRef.current) return;
    const p = node as HTMLParagraphElement;
    const existingDrop = p.querySelector('span[data-drop-cap]');
    if (existingDrop) {
      // Remove drop cap
      const letter = existingDrop.textContent || '';
      const parent = existingDrop.parentNode;
      parent?.replaceChild(document.createTextNode(letter), existingDrop);
      p.normalize();
    } else {
      // Add drop cap
      const text = p.textContent || '';
      if (!text) return;
      const firstChar = text[0];
      const rest = text.slice(1);
      p.innerHTML = `<span data-drop-cap style="float:left;font-size:3.5em;line-height:0.8;padding-right:8px;padding-top:4px;font-weight:bold;color:currentColor">${firstChar}</span>${rest}`;
    }
    setModified(true);
  }

  // --- Section break ---
  function insertSectionBreak() {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('insertHTML', false, '<div class="section-break" style="border-top:2px dashed #18A303;margin:16px 0;"></div><p><br/></p>');
    setModified(true);
    updateCounts();
  }

  // --- Image resize/move handling ---
  function handleEditorClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      setSelectedImage(img);
      const rect = img.getBoundingClientRect();
      setResizeOverlay({ x: rect.left, y: rect.top, w: rect.width, h: rect.height });
    } else {
      setSelectedImage(null);
      setResizeOverlay(null);
    }
  }

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!resizeStateRef.current || !selectedImage) return;
      const state = resizeStateRef.current;
      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;
      const handle = state.handle;

      let newW = state.startW;
      let newH = state.startH;

      if (handle.includes('e')) newW = state.startW + dx;
      if (handle.includes('w')) newW = state.startW - dx;
      if (handle.includes('s')) newH = state.startH + dy;
      if (handle.includes('n')) newH = state.startH - dy;

      // Proportional resize with Shift
      if (e.shiftKey || state.shiftKey) {
        const ratio = state.startW / Math.max(1, state.startH);
        if (handle === 'n' || handle === 's') {
          newW = newH * ratio;
        } else {
          newH = newW / ratio;
        }
      }

      newW = Math.max(30, newW);
      newH = Math.max(30, newH);

      selectedImage.style.width = `${newW}px`;
      selectedImage.style.height = `${newH}px`;
      selectedImage.style.maxWidth = 'none';

      const rect = selectedImage.getBoundingClientRect();
      setResizeOverlay({ x: rect.left, y: rect.top, w: rect.width, h: rect.height });
    }

    function handleMouseUp() {
      resizeStateRef.current = null;
      setModified(true);
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [selectedImage, setModified]);

  function handleResizeStart(e: React.MouseEvent, handle: string) {
    if (!selectedImage) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = selectedImage.getBoundingClientRect();
    resizeStateRef.current = {
      img: selectedImage,
      startX: e.clientX,
      startY: e.clientY,
      startW: rect.width,
      startH: rect.height,
      handle,
      shiftKey: e.shiftKey,
    };
  }

  // --- Effects ---
  useEffect(() => {
    if (editorRef.current) {
      // Try new persistence system first, fall back to old
      const savedNew = load<string>('writer');
      const savedOld = loadAutoSave('writer');
      const saved = savedNew ?? savedOld;
      if (saved && !editorRef.current.innerHTML.trim()) editorRef.current.innerHTML = saved;
      else if (!editorRef.current.innerHTML.trim()) editorRef.current.innerHTML = DEFAULT_CONTENT;
      updateCounts();
    }
  }, []);

  // Auto-save Writer content on input (debounced via persistence layer)
  useEffect(() => {
    const interval = setInterval(() => {
      if (editorRef.current?.innerHTML) {
        persist('writer', editorRef.current.innerHTML);
        // Also save to old key for backward compat
        autoSave('writer', editorRef.current.innerHTML);
      }
    }, 5000); // Save every 5s (was 30s)
    return () => clearInterval(interval);
  }, []);

  // Also save on every input (debounced)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const handleInput = () => {
      if (editor.innerHTML) {
        persist('writer', editor.innerHTML);
      }
    };
    editor.addEventListener('input', handleInput);
    return () => editor.removeEventListener('input', handleInput);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'f') { e.preventDefault(); setShowFindReplace(true); }
        if (e.key === 'o') { e.preventDefault(); handleOpen(); }
        if (e.key === 'p') { e.preventDefault(); printDocument(); }
        if (e.key === 'e') { e.preventDefault(); handleExport(); }
        if (e.key === 'W' && e.shiftKey) { e.preventDefault(); setShowWordCount(true); }
        if (e.key === 'k') { e.preventDefault(); setShowHyperlinkDialog(true); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  function handleInput() {
    setModified(true); updateCounts(); updateActiveFormats();
    if (showSplitView && mirrorEditorRef.current && editorRef.current) {
      mirrorEditorRef.current.innerHTML = editorRef.current.innerHTML;
    }
  }

  const handleFormat = useCallback((command: string, value?: string) => {
    editorRef.current?.focus();
    if (command === 'superscript') { document.execCommand('superscript'); }
    else if (command === 'subscript') { document.execCommand('subscript'); }
    else if (command === 'formatBlock' && value) { document.execCommand('formatBlock', false, `<${value}>`); }
    else { document.execCommand(command, false, value); }
    setModified(true);
    updateActiveFormats();
  }, [setModified]);

  const handleInsert = useCallback((type: string) => {
    editorRef.current?.focus();
    switch (type) {
      case 'horizontal-rule': document.execCommand('insertHorizontalRule'); break;
      case 'page-break': document.execCommand('insertHTML', false, '<div style="page-break-after:always;"></div><p><br/></p>'); break;
      case 'date': document.execCommand('insertHTML', false, `<p>${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>`); break;
      case 'special-char': setShowSpecialChars(true); break;
      case 'image': handleInsertImage(); break;
      case 'export-html': if (editorRef.current) downloadHTML(fileName, editorRef.current.innerHTML); break;
      case 'export-txt': if (editorRef.current) downloadTXT(fileName, editorRef.current.innerText || ''); break;
      case 'table-3x3': handleTableInsert(3, 3, true); break;
      case 'formal-letter': document.execCommand('insertHTML', false, FORMAL_LETTER); setModified(true); updateCounts(); break;
      case 'informal-letter': document.execCommand('insertHTML', false, INFORMAL_LETTER); setModified(true); updateCounts(); break;
      case 'essay-outline': document.execCommand('insertHTML', false, ESSAY_OUTLINE); setModified(true); updateCounts(); break;
      case 'lab-report': document.execCommand('insertHTML', false, LAB_REPORT); setModified(true); updateCounts(); break;
      case 'toc': generateTOC(); break;
      case 'footnote': setFootnoteType('footnote'); setShowFootnoteDialog(true); break;
      case 'endnote': setFootnoteType('endnote'); setShowFootnoteDialog(true); break;
      case 'bookmark': setShowBookmarkDialog(true); break;
      case 'crossref': setShowCrossRefDialog(true); break;
      case 'wordcount': setShowWordCount(true); break;
      case 'wordgoal': setShowWordGoalDialog(true); break;
      case 'hyperlink': setShowHyperlinkDialog(true); break;
      case 'paraborders': setShowParaBordersDialog(true); break;
      case 'watermark': setShowWatermarkDialog(true); break;
      case 'dropcap': toggleDropCap(); break;
      case 'sectionbreak': insertSectionBreak(); break;
      case 'exportdocx': if (editorRef.current) downloadDOCX(fileName, editorRef.current.innerHTML); break;
      default: break;
    }
    setModified(true);
    updateCounts();
  }, [setModified, fileName, columnCount]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b': e.preventDefault(); handleFormat('bold'); break;
        case 'i': e.preventDefault(); handleFormat('italic'); break;
        case 'u': e.preventDefault(); handleFormat('underline'); break;
        case 's': e.preventDefault(); handleSave(); break;
      }
      if (e.shiftKey && e.key === '=') { e.preventDefault(); handleFormat('superscript'); }
    }
    // Tab key handling (Feature 7: Tab Stops)
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
      setModified(true);
    }
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    showCtxMenu(e, [
      { label: 'Cut', shortcut: 'Ctrl+X', icon: <Scissors size={14} />, action: () => document.execCommand('cut') },
      { label: 'Copy', shortcut: 'Ctrl+C', icon: <Copy size={14} />, action: () => document.execCommand('copy') },
      { label: 'Paste', shortcut: 'Ctrl+V', icon: <ClipboardPaste size={14} />, action: () => document.execCommand('paste') },
      { label: '', divider: true },
      { label: 'Select All', shortcut: 'Ctrl+A', action: () => document.execCommand('selectAll') },
      { label: 'Delete', icon: <Trash2 size={14} />, action: () => document.execCommand('delete') },
      { label: '', divider: true },
      { label: 'Paragraph Style', subMenu: [
        { label: 'Heading 1', icon: <Heading1 size={14} />, action: () => handleFormat('formatBlock', 'h1') },
        { label: 'Heading 2', icon: <Heading2 size={14} />, action: () => handleFormat('formatBlock', 'h2') },
        { label: 'Heading 3', icon: <Heading3 size={14} />, action: () => handleFormat('formatBlock', 'h3') },
        { label: 'Normal', icon: <Type size={14} />, action: () => handleFormat('formatBlock', 'p') },
        { label: 'Blockquote', icon: <Quote size={14} />, action: () => handleFormat('formatBlock', 'blockquote') },
      ]},
      { label: '', divider: true },
      { label: 'Insert Table', icon: <Table size={14} />, action: () => useAppStore.getState().toggleTableInsert() },
      { label: 'Insert Image', icon: <ImagePlus size={14} />, action: () => handleInsertImage() },
      { label: 'Insert Hyperlink', shortcut: 'Ctrl+K', icon: <Link size={14} />, action: () => setShowHyperlinkDialog(true) },
      { label: 'Insert Line', icon: <Minus size={14} />, action: () => handleInsert('horizontal-rule') },
      { label: '', divider: true },
      { label: 'Insert Bookmark', icon: <BookmarkIcon size={14} />, action: () => handleInsert('bookmark') },
      { label: 'Insert TOC', icon: <FileText size={14} />, action: () => handleInsert('toc') },
      { label: 'Word Count', icon: <Hash size={14} />, action: () => setShowWordCount(true) },
    ]);
  }

  const isLandscape = orientation === 'landscape';
  const goalProgress = getGoalProgress();

  // Build watermark repeated text elements
  const watermarkElements = useMemo(() => {
    if (!watermark) return null;
    const items: { left: number; top: number }[] = [];
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 3; col++) {
        items.push({ left: col * 35 + 5, top: row * 18 + 5 });
      }
    }
    return items;
  }, [watermark]);

  return (
    <div className="flex flex-col h-full">
      <MenuBar currentView="writer" onNewDocument={() => { if (editorRef.current) editorRef.current.innerHTML = '<p><br/></p>'; setFileName('Untitled'); setModified(false); clearAutoSave('writer'); updateCounts(); }} onSave={handleSave} onUndo={() => { document.execCommand('undo'); setModified(true); }} onRedo={() => { document.execCommand('redo'); setModified(true); }} />
      <WriterToolbar onFormat={handleFormat} onInsert={handleInsert} activeFormats={activeFormats} />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <div className="lo-sidebar overflow-y-auto lo-scrollbar">
            <WriterSidebar onInsert={handleInsert} onFormat={handleFormat} />
          </div>
        )}
        <div className="lo-document-area lo-scrollbar bg-[#808080]/10 relative flex flex-col">
          {/* Ruler */}
          {showRuler && (
            <Ruler zoom={zoomLevel} orientation={orientation} margins={pageMargins} />
          )}
          <div className={`flex-1 overflow-auto lo-scrollbar p-4 sm:p-8 relative ${showSplitView ? 'grid grid-cols-2 gap-4' : ''}`}>
            {/* Left column (main editor) */}
            <div className={showSplitView ? '' : 'flex flex-col items-center'}>
              {/* Header */}
              {showHeaderFooter && (
                <div
                  ref={headerRef}
                  className="document-page mb-0 !py-2 !px-8 text-xs text-muted-foreground border-b border-border text-center select-none"
                  style={{ margin: `0 auto ${pageMargins.top / 4}mm` }}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => { setHeaderContent((e.target as HTMLElement).innerText); setModified(true); }}
                >
                  {fileName}
                </div>
              )}

              {/* Editor with optional line numbers */}
              <div className="flex" style={{ position: 'relative' }}>
                {/* Line numbers gutter */}
                {showLineNumbers && (
                  <div
                    className="select-none lo-scrollbar overflow-hidden flex-shrink-0"
                    style={{
                      width: '40px',
                      fontSize: '11px',
                      color: '#999',
                      textAlign: 'right',
                      paddingTop: `${pageMargins.top}mm`,
                      paddingRight: '8px',
                      lineHeight: '1.6',
                      height: '100%',
                      overflowY: 'hidden',
                      userSelect: 'none',
                    }}
                  >
                    {Array.from({ length: Math.max(lineCount, 30) }, (_, i) => (
                      <div key={i} style={{ height: '1.6em' }}>{i + 1}</div>
                    ))}
                  </div>
                )}

                {/* Page wrapper */}
                <div className="relative" style={{ flex: 1 }}>
                  {/* Watermark */}
                  {watermark && (
                    <div style={watermarkStyle}>
                      {watermarkElements?.map((pos, i) => (
                        <div
                          key={i}
                          className="absolute whitespace-nowrap font-bold select-none"
                          style={{
                            left: `${pos.left}%`,
                            top: `${pos.top}%`,
                            fontSize: `${watermark.fontSize}px`,
                            color: watermark.color,
                            opacity: watermark.opacity,
                            transform: `rotate(${watermark.rotation}deg)`,
                          }}
                        >
                          {watermark.text}
                        </div>
                      ))}
                    </div>
                  )}

                  <div
                    ref={editorRef}
                    className={`document-page outline-none lo-scrollbar relative ${getTrackChangesEnabled() ? 'track-changes-on' : ''}`}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    onMouseUp={(e) => { updateActiveFormats(); handleEditorClick(e); }}
                    onKeyUp={updateActiveFormats
                    }
                    onContextMenu={handleContextMenu}
                    spellCheck
                    style={{
                      padding: `${pageMargins.top}mm ${pageMargins.right}mm ${pageMargins.bottom}mm ${showLineNumbers ? 8 : pageMargins.left}mm`,
                      ...(isLandscape ? { width: '297mm', minHeight: '210mm' } : { width: '210mm', minHeight: '297mm' }),
                      transform: `scale(${zoomLevel / 100})`,
                      transformOrigin: 'top center',
                      columnCount: columnCount > 1 ? columnCount : undefined,
                      columnGap: '20px',
                      position: 'relative',
                      zIndex: 2,
                    }}
                  />

                  {/* Image resize overlay */}
                  {selectedImage && resizeOverlay && (
                    <div className="fixed border-2 border-lo-green pointer-events-none" style={{
                        left: resizeOverlay.x - 1,
                        top: resizeOverlay.y - 1,
                        width: resizeOverlay.w + 2,
                        height: resizeOverlay.h + 2,
                        zIndex: 100,
                      }}
                    >
                      {/* 8 resize handles */}
                      {(['nw','n','ne','e','se','s','sw','w'] as const).map(h => {
                        const isCorner = h.length === 2;
                        const left = h.includes('w') ? -5 : h.includes('e') ? resizeOverlay.w - 4 : 'calc(50% - 5px)';
                        const top = h.includes('n') ? -5 : h.includes('s') ? resizeOverlay.h - 4 : 'calc(50% - 5px)';
                        return (
                          <div key={h}
                            className="absolute bg-lo-green border border-white rounded-sm cursor-"
                            style={{ left: typeof left === 'number' ? left : undefined, top: typeof top === 'number' ? top : undefined, width: 10, height: 10, cursor: `${h}-resize`, pointerEvents: 'all' }}
                            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleResizeStart(e, h); }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer with editable content and page number */}
              {showHeaderFooter && (
                <div
                  ref={footerRef}
                  className="document-page mt-0 !py-2 !px-8 text-xs text-muted-foreground border-t border-border select-none"
                  style={{ margin: `${pageMargins.bottom / 4}mm auto 0`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => { setFooterContent((e.target as HTMLElement).innerText); setModified(true); }}
                    style={{ flex: 1 }}
                  >
                    {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div style={{ flex: 'none', paddingLeft: '12px' }}>
                    Page {formatPageNumber(1, pageNumberFormat)}
                  </div>
                </div>
              )}

              {/* Endnotes section */}
              {footnotes.filter(f => f.type === 'endnote').length > 0 && (
                <div className="document-page mt-4 !py-4 !px-8" style={{ margin: '8px auto 0' }}>
                  <hr style={{ margin: '16px 0' }} />
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Endnotes</h3>
                  {footnotes.filter(f => f.type === 'endnote').map(fn => (
                    <p key={fn.id} style={{ fontSize: '12px', marginBottom: '4px' }}>
                      <sup style={{ color: '#1a73e8', fontWeight: 'bold' }}>{fn.number}</sup> {fn.text}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Right column (mirror editor in split view) */}
            {showSplitView && (
              <div className="border-l-2 border-lo-green/30 pl-4">
                <div
                  ref={mirrorEditorRef}
                  className="document-page outline-none lo-scrollbar relative pointer-events-none select-none"
                  suppressContentEditableWarning
                  spellCheck={false}
                  style={{
                    padding: `${pageMargins.top}mm ${pageMargins.right}mm ${pageMargins.bottom}mm ${pageMargins.left}mm`,
                    ...(isLandscape ? { width: '297mm', minHeight: '210mm' } : { width: '210mm', minHeight: '297mm' }),
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'top center',
                    columnCount: columnCount > 1 ? columnCount : undefined,
                    columnGap: '20px',
                  }}
                />
              </div>
            )}

            {showFindReplace && <FindReplace editorRef={editorRef} onClose={() => setShowFindReplace(false)} />}
            {showSpecialChars && <SpecialChars onInsert={(char) => { editorRef.current?.focus(); document.execCommand('insertText', false, char); setModified(true); }} onClose={() => setShowSpecialChars(false)} />}
            {contextMenuEl}
          </div>
        </div>
      </div>
      <StatusBar
        currentView="writer"
        extraInfo={
          `${wordCount} words | ${charCount} chars | ${lineCount} lines` +
          (columnCount > 1 ? ` | ${columnCount} cols` : '') +
          (showHeaderFooter ? ' | H/F On' : '') +
          (showLineNumbers ? ' | Ln#' : '') +
          (watermark ? ' | WM' : '') +
          (goalProgress ? ` | Goal: ${goalProgress.pct}%` : '') +
          (footnotes.length > 0 ? ` | ${footnotes.length} notes` : '') +
          (bookmarks.length > 0 ? ` | ${bookmarks.length} bookmarks` : '')
        }
        extraActions={
          <div className="flex items-center gap-2">
            {goalProgress && (
              <div className="flex items-center gap-1">
                <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${goalProgress.pct}%`, backgroundColor: goalProgress.color }} />
                </div>
                <button className="text-[10px] text-muted-foreground hover:text-destructive" onClick={() => { setWordGoal(null); localStorage.removeItem('liberxoffice-writer-goal'); }} title="Remove goal">x</button>
              </div>
            )}
            <button
              className={`text-[10px] px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${showSplitView ? 'bg-lo-green/10 border-lo-green/30 text-lo-green' : 'border-border hover:bg-accent'}`}
              onClick={() => useAppStore.getState().toggleSplitView()}
              title="Split Screen"
            >
              <Columns2 size={12} /> Split
            </button>
            <button
              className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${showHeaderFooter ? 'bg-lo-green/10 border-lo-green/30 text-lo-green' : 'border-border hover:bg-accent'}`}
              onClick={() => setShowHeaderFooter(!showHeaderFooter)}
            >
              Header/Footer
            </button>
            <button
              className="text-[10px] px-2 py-0.5 rounded border transition-colors flex items-center gap-1 hover:bg-accent"
              onClick={() => { if (editorRef.current) downloadDOCX(fileName, editorRef.current.innerHTML); }}
              title="Export as DOCX"
            >
              <FileDown size={12} /> DOCX
            </button>
          </div>
        }
      />

      {/* Dialogs */}
      <TableInsert onInsert={handleTableInsert} />
      <PrintPreview contentRef={editorRef} />
      <PageSetup
        pageMargins={pageMargins}
        orientation={orientation}
        pageNumberFormat={pageNumberFormat}
        onApply={(m, o, f) => { setPageMargins(m); setOrientation(o); setPageNumberFormat(f); }}
      />
      <WordCountDialog show={showWordCount} onClose={() => setShowWordCount(false)} getText={() => editorRef.current?.innerText || ''} getHtml={() => editorRef.current?.innerHTML || ''} />
      <FootnoteDialog show={showFootnoteDialog} onClose={() => setShowFootnoteDialog(false)} type={footnoteType} onInsert={handleInsertFootnote} nextNumber={footnotes.filter(f => f.type === footnoteType).length + 1} />
      <FootnotesListDialog show={showFootnotesList} onClose={() => setShowFootnotesList(false)} footnotes={footnotes} onDelete={handleDeleteFootnote} />
      <InsertBookmarkDialog show={showBookmarkDialog} onClose={() => setShowBookmarkDialog(false)} onInsert={handleInsertBookmark} existingBookmarks={bookmarks} />
      <CrossRefDialog show={showCrossRefDialog} onClose={() => setShowCrossRefDialog(false)} onInsert={handleInsertCrossRef} bookmarks={bookmarks} />
      <HyperlinkDialog show={showHyperlinkDialog} onClose={() => setShowHyperlinkDialog(false)} onInsert={handleInsertHyperlink} editorRef={editorRef} />
      <ParaBordersDialog show={showParaBordersDialog} onClose={() => setShowParaBordersDialog(false)} onApply={handleApplyParaBorders} editorRef={editorRef} />
      <WatermarkDialog show={showWatermarkDialog} onClose={() => setShowWatermarkDialog(false)} onApply={(text, fontSize, color, rotation, opacity) => setWatermark({ text, fontSize, color, rotation, opacity })} onRemove={() => setWatermark(null)} currentWatermark={watermark} />

      {/* Word Goal Dialog */}
      {showWordGoalDialog && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40" onClick={() => setShowWordGoalDialog(false)}>
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-2xl w-[360px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-base font-semibold">Set Word Goal</h2>
              <button className="lo-toolbar-btn w-8 h-8" onClick={() => setShowWordGoalDialog(false)}>x</button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Target word count</label>
                <input type="number" className="w-full h-10 px-3 text-sm border border-border rounded-md bg-transparent" placeholder="e.g. 500" autoFocus defaultValue={wordGoal || ''} onKeyDown={e => { if (e.key === 'Enter') handleSetWordGoal(parseInt((e.target as HTMLInputElement).value) || 0); }} />
              </div>
              <div className="flex gap-2 flex-wrap">
                {[200, 500, 1000, 1500, 2000, 3000].map(n => (
                  <button key={n} className="px-3 py-1.5 text-xs border border-border rounded-md hover:bg-accent touch-target" onClick={() => handleSetWordGoal(n)}>{n}</button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-4 pb-4">
              {wordGoal && <button className="px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md touch-target" onClick={() => { setWordGoal(null); localStorage.removeItem('liberxoffice-writer-goal'); setShowWordGoalDialog(false); }}>Remove Goal</button>}
              <button className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent touch-target" onClick={() => setShowWordGoalDialog(false)}>Cancel</button>
              <button className="px-4 py-2 text-sm bg-lo-green text-white rounded-md hover:bg-lo-green-dark touch-target" onClick={() => { const v = (document.querySelector('input[type=number]') as HTMLInputElement)?.value; if (v) handleSetWordGoal(parseInt(v)); }}>Set</button>
            </div>
          </div>
        </div>
      )}

      <SaveAsDialog open={showSaveAsDialog} appType="writer" onClose={toggleSaveAsDialog} onSave={async (name, format) => {
        if (!editorRef.current) return;
        const html = editorRef.current.innerHTML;
        if (format === 'docx') {
          await downloadDOCX(name, html);
        } else if (format === 'txt') {
          downloadTXT(name, editorRef.current.innerText);
        } else {
          // html
          downloadHTML(name, html);
        }
        setModified(false);
      }} />
      <SpellCheckDialog open={showSpellCheckDialog} onClose={() => setShowSpellCheckDialog(false)} editorRef={editorRef} />
      <AutoTextDialog open={showAutoTextDialog} onClose={() => setShowAutoTextDialog(false)} onInsert={(html) => {
        editorRef.current?.focus();
        document.execCommand('insertHTML', false, html);
        setModified(true);
      }} />
      <TrackChangesDialog open={showTrackChangesDialog} onClose={() => setShowTrackChangesDialog(false)} />

      <TemplateDialog
        show={showTemplateDialog}
        onClose={() => setShowTemplateDialog(false)}
        mode={templateMode}
        type="writer"
        currentContent={() => editorRef.current?.innerHTML || ''}
        onLoad={(data) => { if (editorRef.current) { editorRef.current.innerHTML = data; setModified(true); updateCounts(); } }}
        fileName={fileName}
      />
    </div>
  );
}
