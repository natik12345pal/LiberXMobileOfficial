'use client';

// All local file operations - no backend required

export function downloadJSON(fileName: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadHTML(fileName: string, htmlContent: string) {
  const fullHTML = `<!DOCTYPE html>\n<html><head><meta charset="utf-8"><title>${fileName}</title>\n<style>body{font-family:'Times New Roman',serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.6;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #999;padding:6px;text-align:left;}img{max-width:100%;}</style></head><body>${htmlContent}</body></html>`;
  const blob = new Blob([fullHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadTXT(fileName: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadCSV(fileName: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function openFile(accept: string): Promise<{ name: string; content: string }> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) { reject(new Error('No file selected')); return; }
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name.replace(/\.[^.]+$/, ''), content: reader.result as string });
      reader.onerror = reject;
      reader.readAsText(file);
    };
    input.click();
  });
}

export function openImageFile(): Promise<{ dataUrl: string; name: string }> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) { reject(new Error('No file selected')); return; }
      const reader = new FileReader();
      reader.onload = () => resolve({ dataUrl: reader.result as string, name: file.name });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    };
    input.click();
  });
}

export function autoSave(key: string, data: string) {
  try {
    localStorage.setItem(`liberxoffice-${key}`, data);
  } catch {}
}

export function loadAutoSave(key: string): string | null {
  try {
    return localStorage.getItem(`liberxoffice-${key}`);
  } catch {
    return null;
  }
}

export function clearAutoSave(key: string) {
  try {
    localStorage.removeItem(`liberxoffice-${key}`);
  } catch {}
}

export function printDocument() {
  window.print();
}

// --- DOCX Export ---

async function extractInlineRuns(el: HTMLElement, docxModule: Record<string, any>): Promise<any[]> {
  const runs: any[] = [];
  const children = el.childNodes;
  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    if (node.nodeType === Node.TEXT_NODE) {
      runs.push(new docxModule.TextRun({ text: node.textContent || '' }));
    } else if (node instanceof HTMLElement) {
      const tag = node.tagName.toLowerCase();
      const props: Record<string, any> = { text: node.textContent || '' };
      if (tag === 'b' || tag === 'strong' || node.style.fontWeight === 'bold' || parseInt(node.style.fontWeight) >= 700) {
        props.bold = true;
      }
      if (tag === 'i' || tag === 'em' || node.style.fontStyle === 'italic') {
        props.italics = true;
      }
      if (tag === 'u' || node.style.textDecoration?.includes('underline')) {
        props.underline = { type: docxModule.UnderlineType.SINGLE };
      }
      if (tag === 's' || tag === 'del' || tag === 'strike' || node.style.textDecoration?.includes('line-through')) {
        props.strike = true;
      }
      if (tag === 'sup' || node.style.verticalAlign === 'super') {
        props.superScript = true;
      }
      if (tag === 'sub' || node.style.verticalAlign === 'sub') {
        props.subScript = true;
      }
      if (node.style.color) {
        const c = node.style.color.replace(/rgb\(|\)/g, '').split(',').map(s => parseInt(s.trim()));
        if (c.length === 3) {
          props.color = docxModule.RgbColor.fromHex('#' + c.map(n => n.toString(16).padStart(2, '0')).join(''));
        } else {
          props.color = node.style.color.startsWith('#') ? docxModule.RgbColor.fromHex(node.style.color) : undefined;
        }
      }
      if (node.style.fontSize) {
        props.size = Math.round(parseFloat(node.style.fontSize) * 2);
      }
      runs.push(new docxModule.TextRun(props));
    }
  }
  return runs;
}

export async function downloadDOCX(fileName: string, htmlContent: string) {
  const docxModule = await import('docx');
  const { saveAs } = await import('file-saver');
  const {
    Document, Packer, Paragraph, TextRun, AlignmentType,
    Table, TableRow, TableCell, BorderStyle, WidthType,
    UnderlineType, ExternalHyperlink
  } = docxModule;

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${htmlContent}</div>`, 'text/html');
  const root = doc.body.firstElementChild!;
  const children = Array.from(root.children);
  const paragraphs: any[] = [];

  for (const child of children) {
    const tag = child.tagName.toLowerCase();

    if (tag === 'div' && (child.className?.includes('liberx-toc') || child.className?.includes('section-break'))) {
      // Skip TOC divs and section breaks in DOCX export
      continue;
    }

    if (tag === 'hr') {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: '─'.repeat(40) })],
        spacing: { before: 200, after: 200 },
      }));
      continue;
    }

    if (tag === 'table') {
      const rows = Array.from(child.querySelectorAll('tr'));
      const tableRows: any[] = [];
      for (const tr of rows) {
        const cells = Array.from(tr.querySelectorAll('td, th'));
        const tableCells: any[] = [];
        for (const tc of cells) {
          const runs = await extractInlineRuns(tc as HTMLElement, docxModule as any);
          tableCells.push(new TableCell({
            children: [new Paragraph({ children: runs.length > 0 ? runs : [new TextRun({ text: '' })] })],
            width: { size: Math.floor(100 / cells.length), type: WidthType.PERCENTAGE },
          }));
        }
        tableRows.push(new TableRow({ children: tableCells }));
      }
      if (tableRows.length > 0) {
        paragraphs.push(new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        }) as any);
      }
      continue;
    }

    if (tag === 'ul' || tag === 'ol') {
      const items = Array.from(child.querySelectorAll(':scope > li'));
      for (const li of items) {
        const runs = await extractInlineRuns(li as HTMLElement, docxModule as any);
        const bullet = tag === 'ul' ? { bullet: { level: 0 } } : {};
        const numbering = tag === 'ol' ? { numbering: { reference: 'default-numbering', level: 0 } } : {};
        paragraphs.push(new Paragraph({
          children: runs,
          spacing: { before: 40, after: 40 },
          ...bullet,
          ...numbering,
        }));
      }
      continue;
    }

    if (tag === 'img') {
      const img = child as HTMLImageElement;
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: `[Image: ${img.alt || 'image'}]`, italics: true, color: '999999' })],
        alignment: AlignmentType.CENTER,
      }));
      continue;
    }

    // Block elements: h1, h2, h3, p, blockquote, pre, div
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'blockquote', 'pre', 'div'].includes(tag)) {
      const runs = await extractInlineRuns(child as HTMLElement, docxModule as any);
      const headingMap: Record<string, string> = {
        h1: 'HEADING_1',
        h2: 'HEADING_2',
        h3: 'HEADING_3',
        h4: 'HEADING_4',
        h5: 'HEADING_5',
        h6: 'HEADING_6',
      };
      const heading = headingMap[tag];
      const textAlign = (child as HTMLElement).style.textAlign;
      const alignMap: Record<string, string> = {
        center: 'CENTER',
        right: 'RIGHT',
        justify: 'BOTH',
      };
      paragraphs.push(new Paragraph({
        children: runs,
        heading: heading as any,
        alignment: (textAlign ? alignMap[textAlign] : undefined) as any,
        spacing: { before: 120, after: 120 },
      }));
    }
  }

  if (paragraphs.length === 0) {
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
  }

  const document = new Document({
    numbering: {
      config: [{
        reference: 'default-numbering',
        levels: [{
          level: 0,
          format: docxModule.LevelFormat.DECIMAL as any,
          text: '%1.',
          alignment: AlignmentType.START,
        }],
      }],
    },
    sections: [{
      properties: {},
      children: paragraphs as any,
    }],
  });

  const blob = await Packer.toBlob(document);
  saveAs(blob, `${fileName}.docx`);
}

// --- DOCX Import ---

export async function openDOCXFile(): Promise<{ name: string; htmlContent: string }> {
  const JSZip = (await import('jszip')).default;

  // 1. Open file picker for .docx
  const file = await new Promise<File>((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.docx';
    input.onchange = () => {
      const f = input.files?.[0];
      if (f) resolve(f); else reject(new Error('No file selected'));
    };
    input.click();
  });

  // 2. Read as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const name = file.name.replace(/\.docx$/i, '');

  // 3. Unzip with JSZip
  const zip = await JSZip.loadAsync(arrayBuffer);
  const docXml = zip.file('word/document.xml');
  if (!docXml) throw new Error('Invalid DOCX: missing word/document.xml');
  const xmlStr = await docXml.async('text');

  // 4. Parse XML
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlStr, 'application/xml');
  const nsResolver = (prefix: string) => {
    const ns: Record<string, string> = { w: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main' };
    return ns[prefix] || null;
  };

  // Collect numbering definitions for list detection
  const numberingXml = zip.file('word/numbering.xml');
  const numMap = new Map<string, { isOrdered: boolean; level: number }>();
  if (numberingXml) {
    const numDoc = parser.parseFromString(await numberingXml.async('text'), 'application/xml');
    const abstractNums = numDoc.querySelectorAll('abstractNum');
    for (const an of abstractNums) {
      const anId = an.getAttribute('w:abstractNumId') || '';
      const levels = an.querySelectorAll('lvl');
      for (const lvl of levels) {
        const numFmt = lvl.querySelector('numFmt');
        const lvlText = lvl.querySelector('lvlText');
        const isBullet = numFmt?.getAttribute('w:val') === 'bullet' ||
          (lvlText?.textContent?.includes('•') ?? false);
        numMap.set(`${anId}-${lvl.getAttribute('w:ilvl') || '0'}`, {
          isOrdered: !isBullet,
          level: parseInt(lvl.getAttribute('w:ilvl') || '0'),
        });
      }
    }
  }

  // Helper: get direct children with namespace
  const wTag = (parent: Element, localName: string) => {
    return parent.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', localName);
  };

  // Helper: resolve paragraph style to heading level
  const headingFromStyle = (pStyle: string | null): string | null => {
    if (!pStyle) return null;
    const map: Record<string, string> = {
      'Heading1': 'h1', 'Heading2': 'h2', 'Heading3': 'h3',
      'Heading4': 'h4', 'Heading5': 'h5', 'Heading6': 'h6',
      'Title': 'h1', 'Subtitle': 'h2',
    };
    return map[pStyle] || (/^heading\d*$/i.test(pStyle) ? `h${pStyle.replace(/\D/g, '') || '1'}` : null);
  };

  // Helper: convert a w:r element to HTML span
  const runToHtml = (r: Element): string => {
    const rPr = wTag(r, 'rPr')[0];
    let bold = false, italic = false, underline = false, strike = false, superScript = false, subScript = false;
    let color = '', fontSize = '';

    if (rPr) {
      bold = wTag(rPr, 'b').length > 0;
      italic = wTag(rPr, 'i').length > 0;
      underline = wTag(rPr, 'u').length > 0;
      strike = wTag(rPr, 'strike').length > 0;
      superScript = wTag(rPr, 'vertAlign')[0]?.getAttribute('w:val') === 'superscript';
      subScript = wTag(rPr, 'vertAlign')[0]?.getAttribute('w:val') === 'subscript';
      const colEl = wTag(rPr, 'color')[0];
      if (colEl) color = colEl.getAttribute('w:val') || '';
      const szEl = wTag(rPr, 'sz')[0];
      if (szEl) fontSize = (parseInt(szEl.getAttribute('w:val') || '24') / 2) + 'px';
    }

    const texts = wTag(r, 't');
    let text = '';
    for (const t of texts) {
      text += (t.textContent || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    if (!text) return '';

    let html = '';
    const tags: string[] = [];
    if (bold) tags.push('b');
    if (italic) tags.push('i');
    if (underline) tags.push('u');
    if (strike) tags.push('s');
    if (superScript) tags.push('sup');
    if (subScript) tags.push('sub');

    let style = '';
    if (color && color !== 'auto') style += `color:#${color};`;
    if (fontSize) style += `font-size:${fontSize};`;

    for (const t of tags) html += `<${t}>`;
    html += style ? `<span style="${style}">${text}</span>` : text;
    for (let i = tags.length - 1; i >= 0; i--) html += `</${tags[i]}>`;
    return html;
  };

  // 5. Convert paragraphs to HTML
  const body = xmlDoc.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'body')[0];
  const bodyChildren = Array.from(body.children);
  let htmlContent = '';
  let inTable = false;

  for (const child of bodyChildren) {
    const localName = child.localName;

    if (localName === 'p') {
      // Check numbering (list)
      const pPr = wTag(child, 'pPr')[0];
      const numPr = wTag(pPr, 'numPr')[0] || null;
      const pStyle = wTag(pPr, 'pStyle')[0]?.getAttribute('w:val') || null;
      const jc = wTag(pPr, 'jc')[0]?.getAttribute('w:val') || '';

      const heading = headingFromStyle(pStyle);
      let alignment = '';
      if (jc === 'center') alignment = 'text-align:center;';
      else if (jc === 'right') alignment = 'text-align:right;';
      else if (jc === 'both') alignment = 'text-align:justify;';

      const runs = Array.from(wTag(child, 'r'));
      let paraHtml = runs.map(runToHtml).join('');

      // Determine list type
      let listPrefix = '';
      let listSuffix = '';
      if (numPr) {
        const ilvl = wTag(numPr, 'ilvl')[0]?.getAttribute('w:val') || '0';
        const numId = wTag(numPr, 'numId')[0]?.getAttribute('w:val') || '0';
        const key = `${numId}-${ilvl}`;
        const numInfo = numMap.get(key);
        const indent = parseInt(ilvl) * 36;
        const isOrdered = numInfo ? numInfo.isOrdered : false;
        listPrefix = isOrdered
          ? `<li style="padding-left:${indent}px;">`
          : `<li style="padding-left:${indent}px;list-style-type:disc;">`;
        listSuffix = '</li>';
        // Track list state
        if (!inTable) {
          const tag = isOrdered ? 'ol' : 'ul';
          paraHtml = `<${tag} style="margin:4px 0;">${listPrefix}${paraHtml}${listSuffix}</${tag}>`;
        }
      } else {
        const tag = heading || 'p';
        const style = alignment ? ` style="${alignment}"` : '';
        paraHtml = `<${tag}${style}>${paraHtml}</${tag}>`;
      }

      htmlContent += paraHtml;
    } else if (localName === 'tbl') {
      // Table
      htmlContent += '<table style="border-collapse:collapse;width:100%;margin:8px 0;">';
      const rows = wTag(child, 'tr');
      for (const tr of rows) {
        htmlContent += '<tr>';
        const cells = wTag(tr, 'tc');
        for (const tc of cells) {
          const cellParas = wTag(tc, 'p');
          let cellHtml = '';
          for (const cp of cellParas) {
            const cRuns = wTag(cp, 'r');
            cellHtml += Array.from(cRuns).map(runToHtml).join('');
          }
          htmlContent += `<td style="border:1px solid #999;padding:6px;">${cellHtml}</td>`;
        }
        htmlContent += '</tr>';
      }
      htmlContent += '</table>';
    } else if (localName === 'sdt') {
      // Structured document tag - process children
      const sdtContent = wTag(child, 'sdtContent')[0];
      if (sdtContent) {
        const paras = wTag(sdtContent, 'p');
        for (const p of paras) {
          const pPr = wTag(p, 'pPr')[0];
          const pStyle = wTag(pPr, 'pStyle')[0]?.getAttribute('w:val') || null;
          const heading = headingFromStyle(pStyle);
          const runs = Array.from(wTag(p, 'r'));
          const paraHtml = runs.map(runToHtml).join('');
          const tag = heading || 'p';
          htmlContent += `<${tag}>${paraHtml}</${tag}>`;
        }
      }
    }
  }

  return { name, htmlContent };
}

// ===== XLSX Export =====
export async function downloadXLSX(fileName: string, sheetsData: Record<string, Record<string, { raw: string; computed: string; bold?: boolean; italic?: boolean; underline?: boolean; align?: string; numberFormat?: string; fontSize?: number; bg?: string; color?: string }>>) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  for (const [sheetName, data] of Object.entries(sheetsData)) {
    const rows: (string | number)[][] = [];
    // Collect all cells and organize by row
    const cellMap: Record<number, Record<number, string | number>> = {};
    let maxRow = 0, maxCol = 0;
    for (const [cellRef, cell] of Object.entries(data)) {
      const m = cellRef.match(/^([A-Z]+)(\d+)$/i);
      if (!m) continue;
      const col = m[1].split('').reduce((a, c) => a * 26 + (c.charCodeAt(0) - 64), 0);
      const row = parseInt(m[2]);
      if (row > maxRow) maxRow = row;
      if (col > maxCol) maxCol = col;
      if (!cellMap[row]) cellMap[row] = {};
      cellMap[row][col] = cell.computed || cell.raw;
    }
    // Build 2D array
    for (let r = 1; r <= maxRow; r++) {
      const row: (string | number)[] = [];
      let hasData = false;
      for (let c = 1; c <= maxCol; c++) {
        const val = cellMap[r]?.[c];
        if (val !== undefined && val !== '') {
          const num = Number(val);
          row.push(!isNaN(num) && val !== '' ? num : val);
          hasData = true;
        } else {
          row.push('' as string);
        }
      }
      if (hasData) rows.push(row);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

// ===== XLSX Import =====
export async function openXLSXFile(): Promise<{ name: string; sheets: Record<string, Record<string, { raw: string; computed: string }>> }> {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.xlsx,.xls,.csv';
  return new Promise((resolve, reject) => {
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) { reject(new Error('No file')); return; }
      const buffer = await file.arrayBuffer();
      const XLSX = await import('xlsx');
      const wb = XLSX.read(buffer);
      const sheets: Record<string, Record<string, { raw: string; computed: string }>> = {};
      for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        const data: Record<string, { raw: string; computed: string }> = {};
        if (ws['!ref']) {
          const range = XLSX.utils.decode_range(ws['!ref']);
          for (let r = range.s.r; r <= range.e.r; r++) {
            for (let c = range.s.c; c <= range.e.c; c++) {
              const addr = XLSX.utils.encode_cell({ r, c });
              const cell = ws[addr];
              if (cell) {
                data[addr] = { raw: String(cell.v ?? ''), computed: String(cell.w ?? cell.v ?? '') };
              }
            }
          }
        }
        sheets[sheetName] = data;
      }
      resolve({ name: file.name.replace(/\.[^.]+$/, ''), sheets });
    };
    input.click();
  });
}

// ===== PPTX Export =====
export async function downloadPPTX(fileName: string, slides: Array<{
  background?: string; elements: Array<{
    type: string; x: number; y: number; width: number; height: number;
    content?: string; src?: string; fontSize?: number; fontWeight?: string;
    color?: string; bgColor?: string; textAlign?: string; borderRadius?: number;
    fontStyle?: string; textDecoration?: string; gradient?: string;
    shadow?: boolean; borderWidth?: number; borderColor?: string;
    rotation?: number;
  }>
}>) {
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  for (const slide of slides) {
    const s = pptx.addSlide();
    if (slide.background?.startsWith('#')) s.background = { color: slide.background };
    else if (slide.background?.startsWith('data:')) s.background = { path: slide.background };
    for (const el of slide.elements) {
      if (el.type === 'text') {
        s.addText(el.content || '', {
          x: el.x / 720 * 10, y: el.y / 405 * 7.5,
          w: el.width / 720 * 10, h: el.height / 405 * 7.5,
          fontSize: (el.fontSize || 18) * 0.75,
          bold: el.fontWeight === 'bold',
          italic: el.fontStyle === 'italic',
      underline: el.textDecoration === 'underline' ? { style: 'sng' } : undefined,
      color: el.color || '#333333',
      align: (el.textAlign || 'left') as 'left' | 'center' | 'right',
      fill: el.bgColor ? { color: el.bgColor } : undefined,
      shadow: el.shadow ? { type: 'outer', color: '000000', blur: 6, offset: 2, angle: 45 } : undefined,
      rotate: el.rotation ? el.rotation * (180 / Math.PI) : undefined,
    });
    } else if (el.type === 'shape') {
      s.addShape(pptx.ShapeType.rect, {
        x: el.x / 720 * 10, y: el.y / 405 * 7.5,
        w: el.width / 720 * 10, h: el.height / 405 * 7.5,
        fill: { color: el.bgColor || '#18A303' },
        shadow: el.shadow ? { type: 'outer', color: '000000', blur: 6, offset: 2, angle: 45 } : undefined,
        rectRadius: (el.borderRadius || 0) * 0.01,
      });
    } else if (el.type === 'image' && el.src) {
      s.addImage({
        data: el.src,
        x: el.x / 720 * 10, y: el.y / 405 * 7.5,
        w: el.width / 720 * 10, h: el.height / 405 * 7.5,
      });
    }
    }
  }
  await pptx.writeFile({ fileName: `${fileName}.pptx` });
}

