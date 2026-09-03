'use client';

import React, { useEffect, useState, useRef } from 'react';

/**
 * LiberXMobile Inline Loading Animation — Book Fold + Shine
 *
 * Plays INSIDE the button (not a full-screen overlay).
 * The logo performs a continuous book-fold animation with shine.
 * Small size (36px) — fits inside buttons.
 */

interface InlineLoadingAnimationProps {
  message?: string;
}

export default function InlineLoadingAnimation({ message }: InlineLoadingAnimationProps) {
  return (
    <span className="relative inline-flex items-center justify-center gap-2.5">
      {/* Book Fold Animation — 36px (fits in button) */}
      <span className="relative inline-block" style={{ width: 30, height: 30, perspective: '200px' }}>
        {/* Glow behind */}
        <span
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)',
            filter: 'blur(6px)',
            animation: 'inlinePulseGlow 1.5s ease-in-out infinite',
          }}
        />

        {/* Book fold container */}
        <span className="absolute inset-0 flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
          <span className="relative inline-block" style={{ width: 28, height: 28 }}>
            {/* Left half */}
            <span
              className="absolute top-0 left-0 overflow-hidden"
              style={{
                width: 14,
                height: 28,
                transformStyle: 'preserve-3d',
                transformOrigin: 'right center',
                animation: 'inlineBookFoldLeft 2s ease-in-out infinite',
              }}
            >
              <img
                src="/logo-circle.png"
                alt=""
                className="absolute top-0 left-0 select-none pointer-events-none"
                draggable={false}
                style={{ width: 28, height: 28, maxWidth: 'none', objectFit: 'cover' }}
              />
              <span
                className="absolute top-0 left-0 pointer-events-none"
                style={{
                  width: 14,
                  height: 28,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'inlineShine 2s ease-in-out infinite',
                }}
              />
            </span>

            {/* Right half */}
            <span
              className="absolute top-0 overflow-hidden"
              style={{
                width: 14,
                height: 28,
                left: 14,
                transformStyle: 'preserve-3d',
                transformOrigin: 'left center',
                animation: 'inlineBookFoldRight 2s ease-in-out infinite',
              }}
            >
              <img
                src="/logo-circle.png"
                alt=""
                className="absolute top-0 select-none pointer-events-none"
                draggable={false}
                style={{ width: 28, height: 28, left: -14, maxWidth: 'none', objectFit: 'cover' }}
              />
              <span
                className="absolute top-0 pointer-events-none"
                style={{
                  width: 14,
                  height: 28,
                  left: 0,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'inlineShine 2s ease-in-out infinite',
                  animationDelay: '0.15s',
                }}
              />
            </span>

            {/* Center spine shadow */}
            <span
              className="absolute top-0 pointer-events-none"
              style={{
                width: 2,
                height: 28,
                left: 13,
                background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.3) 50%, transparent)',
                opacity: 0.4,
                zIndex: 5,
              }}
            />
          </span>
        </span>
      </span>

      {/* Message text */}
      {message && <span className="text-sm font-semibold">{message}</span>}

      <style jsx>{`
        @keyframes inlineBookFoldLeft {
          0%, 100% { transform: rotateY(0deg); }
          25% { transform: rotateY(-75deg); }
          50% { transform: rotateY(-150deg); }
          75% { transform: rotateY(-75deg); }
        }
        @keyframes inlineBookFoldRight {
          0%, 100% { transform: rotateY(0deg); }
          25% { transform: rotateY(75deg); }
          50% { transform: rotateY(150deg); }
          75% { transform: rotateY(75deg); }
        }
        @keyframes inlineShine {
          0%, 100% { background-position: -100% 0; opacity: 0; }
          20% { opacity: 1; }
          50% { background-position: 100% 0; opacity: 1; }
          80% { opacity: 1; }
        }
        @keyframes inlinePulseGlow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.15); }
        }
      `}</style>
    </span>
  );
}
