'use client';

import React, { useEffect, useState, useRef } from 'react';

/**
 * LiberXMobile Fluid Liquid Loading Animation (Figma-style)
 *
 * A circular container fills with green liquid that morphs and rises.
 * The official logo sits on top, with a liquid blob effect behind it.
 * Medium size (140px) — centered on screen (not inside buttons).
 *
 * Uses SVG turbulence filter for organic liquid morphing.
 */

interface FluidLoadingAnimationProps {
  loading: boolean;
}

export default function FluidLoadingAnimation({
  loading,
}: FluidLoadingAnimationProps) {
  const [progress, setProgress] = useState(0);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!loading) {
      setProgress(0);
      return;
    }
    startRef.current = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const t = Math.min(elapsed / 3000, 1);
      const eased = 1 - Math.pow(1 - t, 2.5);
      setProgress(eased * 100);
    }, 50);
    return () => clearInterval(interval);
  }, [loading]);

  if (!loading) return null;

  // Liquid fill height based on progress
  const fillHeight = Math.max(0, Math.min(100, progress));

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* SVG filter for liquid morphing */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <filter id="liquid-morph" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015 0.025"
              numOctaves="2"
              seed="1"
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                dur="8s"
                keyTimes="0;0.5;1"
                values="0.015 0.025;0.025 0.015;0.015 0.025"
                repeatCount="indefinite"
              />
              <animate
                attributeName="seed"
                dur="6s"
                keyTimes="0;0.5;1"
                values="1;5;1"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="18" xChannelSelector="R" yChannelSelector="G" />
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
          <filter id="liquid-glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Gradient for the liquid */}
          <linearGradient id="liquid-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#0d7a02" />
            <stop offset="40%" stopColor="#18A303" />
            <stop offset="80%" stopColor="#4fc3f7" />
            <stop offset="100%" stopColor="#18A303" />
          </linearGradient>
          {/* Clip path for the circle */}
          <clipPath id="circle-clip">
            <circle cx="70" cy="70" r="68" />
          </clipPath>
        </defs>
      </svg>

      {/* Main liquid container — 140px medium size */}
      <div className="relative" style={{ width: 140, height: 140 }}>
        {/* Outer glow */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(24, 163, 3, 0.35) 0%, transparent 70%)',
            filter: 'blur(24px)',
            animation: 'fluidGlowPulse 2s ease-in-out infinite',
            transform: 'scale(1.2)',
          }}
        />

        {/* Liquid circle SVG */}
        <svg
          width="140"
          height="140"
          viewBox="0 0 140 140"
          className="absolute inset-0"
          style={{ overflow: 'visible' }}
        >
          {/* Circle outline (container) */}
          <circle
            cx="70"
            cy="70"
            r="67"
            fill="rgba(255, 255, 255, 0.06)"
            stroke="rgba(24, 163, 3, 0.5)"
            strokeWidth="2"
          />

          {/* Liquid fill — clipped to circle, rises based on progress */}
          <g clipPath="url(#circle-clip)">
            {/* Liquid body with morphing wave */}
            <g filter="url(#liquid-morph)">
              {/* The liquid rectangle — its height grows with progress */}
              <rect
                x="-10"
                y={140 - (fillHeight / 100) * 140}
                width="160"
                height={(fillHeight / 100) * 140 + 20}
                fill="url(#liquid-gradient)"
                opacity="0.9"
              />
              {/* Wave surface — animated sine wave on top of the liquid */}
              <path
                d={`M -10 ${140 - (fillHeight / 100) * 140}
                    Q 35 ${140 - (fillHeight / 100) * 140 - 8} 70 ${140 - (fillHeight / 100) * 140}
                    T 150 ${140 - (fillHeight / 100) * 140}
                    L 150 160 L -10 160 Z`}
                fill="url(#liquid-gradient)"
                opacity="0.95"
              >
                <animate
                  attributeName="d"
                  dur="3s"
                  repeatCount="indefinite"
                  values={`M -10 ${140 - (fillHeight / 100) * 140} Q 35 ${140 - (fillHeight / 100) * 140 - 8} 70 ${140 - (fillHeight / 100) * 140} T 150 ${140 - (fillHeight / 100) * 140} L 150 160 L -10 160 Z;
                          M -10 ${140 - (fillHeight / 100) * 140} Q 35 ${140 - (fillHeight / 100) * 140 + 8} 70 ${140 - (fillHeight / 100) * 140} T 150 ${140 - (fillHeight / 100) * 140} L 150 160 L -10 160 Z;
                          M -10 ${140 - (fillHeight / 100) * 140} Q 35 ${140 - (fillHeight / 100) * 140 - 8} 70 ${140 - (fillHeight / 100) * 140} T 150 ${140 - (fillHeight / 100) * 140} L 150 160 L -10 160 Z`}
                />
              </path>
            </g>

            {/* Bubbles rising inside the liquid */}
            {fillHeight > 5 && Array.from({ length: 5 }).map((_, i) => (
              <circle
                key={i}
                cx={20 + i * 25}
                cy={140 - (fillHeight / 100) * 140 + 30 + (i % 3) * 20}
                r={2 + (i % 2)}
                fill="rgba(255, 255, 255, 0.5)"
              >
                <animate
                  attributeName="cy"
                  dur={`${2 + i * 0.5}s`}
                  repeatCount="indefinite"
                  values={`${140 - (fillHeight / 100) * 140 + 30 + (i % 3) * 20};
                          ${140 - (fillHeight / 100) * 140 - 10};
                          ${140 - (fillHeight / 100) * 140 + 30 + (i % 3) * 20}`}
                />
                <animate
                  attributeName="opacity"
                  dur={`${2 + i * 0.5}s`}
                  repeatCount="indefinite"
                  values="0;0.6;0"
                />
              </circle>
            ))}

            {/* Logo on top of the liquid */}
            <image
              href="/logo-circle.png"
              x="35"
              y="35"
              width="70"
              height="70"
              opacity="0.95"
              filter="url(#liquid-glow)"
            />
          </g>

          {/* Rotating accent ring outside the circle */}
          <circle
            cx="70"
            cy="70"
            r="72"
            fill="none"
            stroke="rgba(24, 163, 3, 0.6)"
            strokeWidth="1.5"
            strokeDasharray="4 8"
            strokeLinecap="round"
            style={{ transformOrigin: 'center', animation: 'fluidRingSpin 3s linear infinite' }}
          />
        </svg>
      </div>

      {/* Brand text */}
      <div className="mt-7 text-center">
        <h2
          className="text-lg font-extrabold tracking-tight"
          style={{ color: '#ffffff' }}
        >
          <span style={{ color: '#ffffff' }}>Liber</span>
          <span style={{ color: '#18A303', textShadow: '0 0 10px rgba(24, 163, 3, 0.7)' }}>X</span>
          <span style={{ color: '#ffffff' }}>Mobile</span>
        </h2>
      </div>

      <style jsx global>{`
        @keyframes fluidGlowPulse {
          0%, 100% { opacity: 0.5; transform: scale(1.2); }
          50% { opacity: 0.9; transform: scale(1.35); }
        }
        @keyframes fluidRingSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
