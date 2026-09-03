'use client';

import React from 'react';

interface RulerProps {
  zoom: number;
  orientation: 'portrait' | 'landscape';
  margins: { top: number; bottom: number; left: number; right: number };
}

function HorizontalRuler({ zoom, orientation, margins }: { zoom: number; orientation: 'portrait' | 'landscape'; margins: RulerProps['margins'] }) {
  const pageWidth = orientation === 'landscape' ? 297 : 210;
  const totalWidth = pageWidth;
  const scale = zoom / 100;

  // Generate tick marks (every 5mm = ~0.2in)
  const ticks: React.ReactNode[] = [];
  const totalMM = Math.ceil(totalWidth);

  for (let mm = 0; mm <= totalMM; mm++) {
    const pos = (mm / totalMM) * 100;
    const isMajor = mm % 10 === 0;
    const isMid = mm % 5 === 0;
    const height = isMajor ? 12 : isMid ? 8 : 4;
    const label = isMajor ? `${mm / 10}` : '';

    ticks.push(
      <div key={`h-${mm}`} className="absolute top-0" style={{ left: `${pos}%` }}>
        <div className="w-px bg-muted-foreground/40" style={{ height: `${height * scale}px` }} />
        {label && <span className="absolute text-[8px] text-muted-foreground" style={{ top: `${(height + 2) * scale}px`, transform: 'translateX(-50%)' }}>{label}</span>}
      </div>
    );
  }

  // Margin markers
  const leftMarginPct = (margins.left / totalWidth) * 100;
  const rightMarginPct = ((totalWidth - margins.right) / totalWidth) * 100;

  return (
    <div className="relative h-6 bg-secondary/50 border-b border-border select-none" style={{ width: `${totalWidth * scale}mm`, margin: '0 auto' }}>
      {ticks}
      {/* Left margin marker */}
      <div className="absolute top-0 h-full w-0.5 bg-lo-green z-10" style={{ left: `${leftMarginPct}%` }}>
        <div className="absolute -top-0.5 -left-1 w-2.5 h-2 bg-lo-green rounded-b-sm" />
      </div>
      {/* Right margin marker */}
      <div className="absolute top-0 h-full w-0.5 bg-lo-green z-10" style={{ left: `${rightMarginPct}%` }}>
        <div className="absolute -top-0.5 -left-1 w-2.5 h-2 bg-lo-green rounded-b-sm" />
      </div>
    </div>
  );
}

function VerticalRuler({ zoom, orientation, margins }: { zoom: number; orientation: 'portrait' | 'landscape'; margins: RulerProps['margins'] }) {
  const pageHeight = orientation === 'landscape' ? 210 : 297;
  const scale = zoom / 100;

  const ticks: React.ReactNode[] = [];
  const totalMM = Math.ceil(pageHeight);

  for (let mm = 0; mm <= totalMM; mm++) {
    const pos = (mm / totalMM) * 100;
    const isMajor = mm % 10 === 0;
    const isMid = mm % 5 === 0;
    const width = isMajor ? 12 : isMid ? 8 : 4;
    const label = isMajor ? `${mm / 10}` : '';

    ticks.push(
      <div key={`v-${mm}`} className="absolute left-0" style={{ top: `${pos}%` }}>
        <div className="h-px bg-muted-foreground/40" style={{ width: `${width * scale}px` }} />
        {label && <span className="absolute text-[8px] text-muted-foreground whitespace-nowrap" style={{ left: `${(width + 2) * scale}px`, transform: 'translateY(-50%)' }}>{label}</span>}
      </div>
    );
  }

  const topMarginPct = (margins.top / pageHeight) * 100;
  const bottomMarginPct = ((pageHeight - margins.bottom) / pageHeight) * 100;

  return (
    <div className="relative w-6 bg-secondary/50 border-r border-border select-none shrink-0" style={{ height: `${pageHeight * scale}mm` }}>
      {ticks}
      <div className="absolute left-0 w-full h-0.5 bg-lo-green z-10" style={{ top: `${topMarginPct}%` }}>
        <div className="absolute -left-0.5 -top-1 h-2.5 w-2 bg-lo-green rounded-r-sm" />
      </div>
      <div className="absolute left-0 w-full h-0.5 bg-lo-green z-10" style={{ top: `${bottomMarginPct}%` }}>
        <div className="absolute -left-0.5 -top-1 h-2.5 w-2 bg-lo-green rounded-r-sm" />
      </div>
    </div>
  );
}

export default function Ruler({ zoom, orientation, margins }: RulerProps) {
  return (
    <>
      <div className="flex overflow-hidden justify-center bg-secondary/30">
        <div className="w-6 shrink-0" /> {/* corner space for vertical ruler */}
        <HorizontalRuler zoom={zoom} orientation={orientation} margins={margins} />
      </div>
      <div className="flex overflow-y-auto lo-scrollbar">
        <VerticalRuler zoom={zoom} orientation={orientation} margins={margins} />
      </div>
    </>
  );
}
