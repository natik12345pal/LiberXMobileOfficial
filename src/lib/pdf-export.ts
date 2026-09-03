'use client';

// Simple PDF export using browser print-to-PDF or jsPDF-like approach
// We use a lightweight approach: create a printable HTML and trigger print

export function exportWriterToPDF(fileName: string, htmlContent: string) {
  // Create a new window with print-friendly content
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    // Fallback: use window.print
    window.print();
    return;
  }

  const styles = `
    @page { size: A4; margin: 20mm 25mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      max-width: 100%;
      margin: 0;
      padding: 0;
    }
    h1 { font-size: 20pt; margin: 12pt 0 8pt; }
    h2 { font-size: 16pt; margin: 10pt 0 6pt; }
    h3 { font-size: 14pt; margin: 8pt 0 4pt; }
    p { margin: 6pt 0; text-align: justify; }
    ul, ol { margin: 6pt 0; padding-left: 24pt; }
    li { margin: 2pt 0; }
    table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
    td, th { border: 1px solid #999; padding: 6pt; text-align: left; }
    th { background: #18A303; color: white; font-weight: bold; }
    img { max-width: 100%; height: auto; }
    hr { border: none; border-top: 1px solid #ccc; margin: 12pt 0; }
    blockquote { border-left: 3px solid #18A303; padding-left: 12pt; margin: 8pt 0; color: #555; }
    sup { color: #18A303; font-weight: bold; }
    .liberx-toc { border: 1px solid #ccc; padding: 8pt 12pt; margin: 8pt 0; background: #f5f5f5; }
    .liberx-toc a { color: #1a73e8; text-decoration: none; }
    .liberx-bookmark { display: none; }
  `;

  printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${fileName}</title><style>${styles}</style></head><body>${htmlContent}</body></html>`);
  printWindow.document.close();

  // Wait for images to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };
}

export function exportCalcToPDF(fileName: string, sheets: Record<string, Record<string, { raw: string; computed: string; bold?: boolean; italic?: boolean; align?: string; bg?: string; color?: string }>>) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) { window.print(); return; }

  let html = '';
  const sheetNames = Object.keys(sheets);

  sheetNames.forEach((sheetName, sheetIdx) => {
    if (sheetIdx > 0) html += '<div style="page-break-before:always;"></div>';
    const data = sheets[sheetName];
    if (!data || Object.keys(data).length === 0) return;

    // Find used range
    let maxR = 0, maxC = 0;
    Object.keys(data).forEach(k => {
      const m = k.match(/^([A-Z]+)(\d+)$/i);
      if (!m) return;
      const r = parseInt(m[2]), c = m[1].split('').reduce((acc, ch) => acc * 26 + (ch.charCodeAt(0) - 64), 0);
      if (r > maxR) maxR = r;
      if (c > maxC) maxC = c;
    });

    html += `<h2 style="margin-bottom:8pt;">${sheetName}</h2>`;
    html += '<table style="border-collapse:collapse;width:100%;font-size:10pt;">';

    for (let r = 1; r <= maxR; r++) {
      html += '<tr>';
      for (let c = 1; c <= maxC; c++) {
        const col = String.fromCharCode(64 + c);
        if (col > 'Z') continue; // Skip beyond Z for simplicity
        const cellId = `${col}${r}`;
        const cell = data[cellId];
        const val = cell?.computed || cell?.raw || '';
        const isBold = cell?.bold ? 'font-weight:bold;' : '';
        const isItalic = cell?.italic ? 'font-style:italic;' : '';
        const align = cell?.align ? `text-align:${cell.align};` : 'text-align:left;';
        const bg = cell?.bg ? `background:${cell.bg};` : '';
        html += `<td style="border:1px solid #bbb;padding:4pt 6pt;${isBold}${isItalic}${align}${bg}">${val}</td>`;
      }
      html += '</tr>';
    }
    html += '</table>';
  });

  const styles = `@page{size:landscape;margin:10mm;}body{font-family:Arial,sans-serif;font-size:10pt;}table{border-collapse:collapse;}td{border:1px solid #bbb;padding:4pt 6pt;}h2{font-size:14pt;}`;
  printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${fileName}</title><style>${styles}</style></head><body>${html}</body></html>`);
  printWindow.document.close();
  printWindow.onload = () => { setTimeout(() => { printWindow.print(); printWindow.close(); }, 300); };
}

export function exportImpressToPDF(fileName: string, slides: Array<{ background?: string; elements: Array<{ type: string; content: string; x: number; y: number; width: number; height: number; fontSize?: number; fontWeight?: string; color?: string; textAlign?: string; bgColor?: string; src?: string }> }>) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) { window.print(); return; }

  let html = '';
  const scale = 0.56; // Scale to fit A4

  slides.forEach((slide, i) => {
    if (i > 0) html += '<div style="page-break-after:always;"></div>';
    html += `<div style="width:720px;height:405px;background:${slide.background || '#fff'};position:relative;overflow:hidden;transform:scale(${scale});transform-origin:top left;margin-bottom:${405 * (1 - scale)}px;">`;
    slide.elements.forEach(el => {
      const style = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;font-size:${el.fontSize || 12}px;font-weight:${el.fontWeight || 'normal'};color:${el.color || '#000'};text-align:${el.textAlign || 'left'};line-height:1.4;white-space:pre-wrap;word-break:break-word;overflow:hidden;${el.bgColor ? `background:${el.bgColor};` : ''}`;
      if (el.type === 'text') {
        html += `<div style="${style}">${el.content}</div>`;
      } else if (el.type === 'image' && el.src) {
        html += `<div style="${style}"><img src="${el.src}" style="width:100%;height:100%;object-fit:contain;" /></div>`;
      } else if (el.type === 'shape') {
        html += `<div style="${style}"></div>`;
      }
    });
    html += '</div>';
  });

  const styles = `@page{size:A4;margin:10mm;}body{margin:0;padding:0;}`;
  printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${fileName}</title><style>${styles}</style></head><body>${html}</body></html>`);
  printWindow.document.close();
  printWindow.onload = () => { setTimeout(() => { printWindow.print(); printWindow.close(); }, 500); };
}
