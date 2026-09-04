'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import InlineLoadingAnimation from './inline-loading-animation';
import FluidLoadingAnimation from './fluid-loading-animation';

/**
 * LiberXMobile Landing Page
 *
 * Always shown when visiting `/` via web browser.
 * Two options:
 *   1. Continue with Web — opens the office suite in this browser tab
 *   2. Download for Android — installs the PWA (acts like an APK on Android)
 *
 * Branding:
 *   "Liber" = white, "X" = green (with glow), "Mobile" = white
 *   Logo is in a CIRCULAR frame (fixed, no movement).
 */

type LoadingState = 'idle' | 'web' | 'android';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function LandingPage() {
  const router = useRouter();
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Capture PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // If running as installed PWA (standalone), skip landing → go to /app
  useEffect(() => {
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      if (isStandalone) {
        router.replace('/app');
      }
    };
    checkStandalone();
  }, [router]);

  // Register service worker for offline + PWA install
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const handleContinueWithWeb = useCallback(async () => {
    setLoadingState('web');
    // Fluid loading animation plays centered for ~3s
    await new Promise((resolve) => setTimeout(resolve, 3000));
    router.push('/app');
  }, [router]);

  const handleDownloadForAndroid = useCallback(async () => {
    setLoadingState('android');
    await new Promise((resolve) => setTimeout(resolve, 2500));

    if (deferredPrompt) {
      setLoadingState('idle');
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (choice.outcome !== 'accepted') {
        setShowInstallHelp(true);
      }
    } else {
      setLoadingState('idle');
      setShowInstallHelp(true);
    }
  }, [deferredPrompt]);

  return (
    <>
      <main
        className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center px-4"
        style={{
          backgroundImage: 'url(/bg-promo.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Dark overlay so text/buttons stay readable on top of the image */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.75) 100%)',
          }}
        />

        {/* Animated background grid */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(24, 163, 3, 0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(24, 163, 3, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 0%, transparent 80%)',
          }}
        />

        {/* Floating particles — deterministic on SSR + client */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 25 }).map((_, i) => {
            const seed = (i * 137) % 100;
            const seed2 = (i * 73) % 100;
            const seed3 = (i * 41) % 100;
            return (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: `${1.5 + (seed3 % 3)}px`,
                  height: `${1.5 + (seed3 % 3)}px`,
                  background: `rgba(24, 163, 3, ${0.15 + (seed % 4) * 0.1})`,
                  left: `${seed}%`,
                  top: `${seed2}%`,
                  animation: `floatParticle ${4 + (i % 3)}s ease-in-out ${i * 0.3}s infinite`,
                }}
              />
            );
          })}
        </div>

        {/* Top glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(24, 163, 3, 0.2) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Center content */}
        <div
          className={`relative z-10 flex flex-col items-center transition-all duration-700 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* CIRCULAR LOGO — fixed, no movement, perfectly fitted */}
          <div className="relative mb-8">
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(24, 163, 3, 0.4) 0%, transparent 70%)',
                filter: 'blur(30px)',
                animation: 'pulseGlow 3s ease-in-out infinite',
              }}
            />
            <div
              className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(24,163,3,0.05) 100%)',
                border: '2px solid rgba(24, 163, 3, 0.3)',
                boxShadow: '0 0 30px rgba(24, 163, 3, 0.25), inset 0 0 20px rgba(0, 0, 0, 0.5)',
              }}
            >
              <img
                src="/logo-circle.png"
                alt="LiberXMobile Logo"
                className="w-full h-full object-cover select-none pointer-events-none"
                draggable={false}
                style={{ filter: 'drop-shadow(0 0 8px rgba(24, 163, 3, 0.3))' }}
              />
            </div>
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                border: '1px solid transparent',
                borderTopColor: 'rgba(24, 163, 3, 0.4)',
                borderRightColor: 'rgba(24, 163, 3, 0.15)',
                animation: 'ringRotate 8s linear infinite',
              }}
            />
          </div>

          {/* BRAND TEXT — "Liber" black, "X" green, "Mobile" black — vibrant with glass backdrop */}
          <div className="relative inline-block mb-5">
            {/* Glassmorphism backdrop card — tighter fit so it doesn't cover too much bg */}
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 rounded-3xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,250,240,0.9) 50%, rgba(220,240,220,0.95) 100%)',
                filter: 'blur(0px)',
                transform: 'scale(1.05, 1.2)',
                boxShadow: '0 0 40px rgba(24, 163, 3, 0.35), 0 0 70px rgba(24, 163, 3, 0.15)',
                borderRadius: '32px',
              }}
            />
            {/* Inner glow on the glass card */}
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 rounded-3xl"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(24,163,3,0.06) 0%, transparent 70%)',
                transform: 'scale(1.0, 1.15)',
              }}
            />
            <h1
              className="relative text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-center px-6 py-1.5"
              style={{
                letterSpacing: '-0.03em',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              {/* "Liber" — solid black, crisp */}
              <span
                style={{
                  color: '#0a0a0a',
                  WebkitTextStroke: '0.5px rgba(0,0,0,0.3)',
                }}
              >
                Liber
              </span>
              {/* "X" — sharp, crisp, solid green with animated glow behind (not on text) */}
              <span
                className="relative inline-block"
                style={{
                  color: '#18A303',
                  WebkitTextFillColor: '#18A303',
                  WebkitTextStroke: '0px',
                  textShadow: 'none',
                  display: 'inline-block',
                  fontSize: '0.72em', // smaller X so it doesn't dominate
                  verticalAlign: 'baseline',
                }}
              >
                {/* Animated glow layer BEHIND the sharp X (keeps text crisp) */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    color: '#18A303',
                    background: 'linear-gradient(120deg, #18A303 0%, #4fff3a 30%, #18A303 50%, #4fff3a 70%, #18A303 100%)',
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'xShimmer 2s linear infinite',
                    filter: 'blur(8px) drop-shadow(0 0 12px rgba(24,163,3,0.9))',
                    opacity: 0.9,
                    zIndex: 0,
                  }}
                >
                  X
                </span>
                {/* The sharp, crisp X on top */}
                <span
                  className="relative"
                  style={{
                    color: '#18A303',
                    WebkitTextFillColor: '#18A303',
                    position: 'relative',
                    zIndex: 2,
                    filter: 'drop-shadow(0 0 6px rgba(24,163,3,0.8))',
                  }}
                >
                  X
                </span>
              </span>
              {/* "Mobile" — solid black, crisp */}
              <span
                style={{
                  color: '#0a0a0a',
                  WebkitTextStroke: '0.5px rgba(0,0,0,0.3)',
                }}
              >
                Mobile
              </span>
            </h1>
            {/* Dramatic shine sweep overlay — brighter, wider, faster */}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl"
            >
              <div
                className="absolute top-0 bottom-0"
                style={{
                  width: '40%',
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 45%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.7) 55%, transparent 100%)',
                  filter: 'blur(1px)',
                  animation: 'sweepAcross 2.5s ease-in-out infinite',
                  transform: 'skewX(-15deg)',
                }}
              />
              {/* Secondary subtle shine — offset timing */}
              <div
                className="absolute top-0 bottom-0"
                style={{
                  width: '20%',
                  background: 'linear-gradient(90deg, transparent, rgba(24,163,3,0.3), transparent)',
                  filter: 'blur(3px)',
                  animation: 'sweepAcross 2.5s ease-in-out infinite',
                  animationDelay: '1.25s',
                }}
              />
            </div>
            {/* Bottom border accent — animated green line */}
            <div
              aria-hidden="true"
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 rounded-full"
              style={{
                width: '60%',
                background: 'linear-gradient(90deg, transparent, #18A303, transparent)',
                animation: 'borderGlow 2s ease-in-out infinite',
              }}
            />
          </div>

          {/* Tagline */}
          <p
            className={`text-base sm:text-lg text-white text-center mb-2 transition-all delay-200 duration-700 font-medium ${
              mounted ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 0 16px rgba(0,0,0,0.6)' }}
          >
            Free Office Suite optimized for Schools
          </p>
          <p
            className={`text-xs sm:text-sm text-white/80 text-center mb-10 transition-all delay-300 duration-700 ${
              mounted ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
          >
            Writer • Calc • Impress — 100% Free &amp; Open Source
          </p>

          {/* TWO BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <button
              onClick={handleContinueWithWeb}
              disabled={loadingState !== 'idle'}
              className="group relative flex-1 overflow-hidden rounded-xl px-6 py-4 font-semibold text-white transition-all duration-300 active:scale-[0.97] disabled:opacity-90 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #18A303 0%, #0d7a02 100%)',
                boxShadow: '0 4px 20px rgba(24, 163, 3, 0.4)',
              }}
            >
              {loadingState === 'idle' && (
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmerSweep 1.5s ease-in-out',
                  }}
                />
              )}
              <span className="relative flex items-center justify-center gap-2 text-base">
                {loadingState === 'web' ? (
                  <>Please wait...</>
                ) : (
                  <>
                    Continue with Web
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </span>
            </button>

            <button
              onClick={handleDownloadForAndroid}
              disabled={loadingState !== 'idle'}
              className="group relative flex-1 overflow-hidden rounded-xl px-6 py-4 font-semibold text-white transition-all duration-300 active:scale-[0.97] disabled:opacity-90 disabled:cursor-not-allowed border-2"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(24, 163, 3, 0.5)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <span className="relative flex items-center justify-center gap-2 text-base">
                {loadingState === 'android' ? (
                  <InlineLoadingAnimation message="Preparing..." />
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    Download for Android
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Feature badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {[
              { label: '100% Free', icon: '✓' },
              { label: 'Works Offline', icon: '⚡' },
              { label: 'No Sign-up', icon: '🔒' },
              { label: 'Open Source', icon: '★' },
            ].map((badge) => (
              <span
                key={badge.label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: 'rgba(24, 163, 3, 0.1)',
                  border: '1px solid rgba(24, 163, 3, 0.3)',
                  color: '#18A303',
                }}
              >
                <span>{badge.icon}</span>
                {badge.label}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="absolute bottom-4 left-0 right-0 text-center px-4">
          <p className="text-[11px] text-white/30">
            LiberXMobile v1.0 • Based on LibreOffice • MPLv2 License
          </p>
        </footer>

        <style jsx global>{`
          @keyframes shimmerSweep {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @keyframes sweepAcross {
            0% { left: -30%; }
            50% { left: 100%; }
            100% { left: 100%; }
          }
          @keyframes floatParticle {
            0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
            50% { transform: translateY(-30px) translateX(15px); opacity: 0.7; }
          }
          @keyframes pulseGlow {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
          }
          @keyframes ringRotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes xShimmer {
            0% { background-position: 200% center; }
            100% { background-position: -200% center; }
          }
          @keyframes borderGlow {
            0%, 100% { opacity: 0.4; width: 60%; }
            50% { opacity: 1; width: 80%; }
          }
        `}</style>
      </main>

      {/* Fluid liquid loading animation — centered on screen during Continue with Web */}
      <FluidLoadingAnimation loading={loadingState === 'web'} />

      {showInstallHelp && (
        <InstallHelpModal onClose={() => setShowInstallHelp(false)} />
      )}
    </>
  );
}

function InstallHelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="relative bg-zinc-900 border rounded-2xl shadow-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
        style={{ borderColor: 'rgba(24, 163, 3, 0.3)', boxShadow: '0 0 40px rgba(24, 163, 3, 0.3)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <img src="/logo-custom.png" alt="" className="w-7 h-7 rounded-full" />
            Install LiberXMobile
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/60"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-white/70 mb-4">
          To install LiberXMobile as an app on your Android device:
        </p>

        <ol className="space-y-3 text-sm text-white/80">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: 'rgba(24,163,3,0.2)', color: '#18A303' }}>1</span>
            <span>Tap the browser menu <strong className="text-white">⋮</strong> (top-right corner)</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: 'rgba(24,163,3,0.2)', color: '#18A303' }}>2</span>
            <span>Select <strong className="text-white">Add to Home screen</strong> or <strong className="text-white">Install app</strong></span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: 'rgba(24,163,3,0.2)', color: '#18A303' }}>3</span>
            <span>Tap <strong className="text-white">Install</strong> — the app will appear in your app drawer</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: 'rgba(24,163,3,0.2)', color: '#18A303' }}>4</span>
            <span>Open it anytime — it works offline and skips this landing page</span>
          </li>
        </ol>

        <div className="mt-5 p-3 rounded-lg" style={{ background: 'rgba(24,163,3,0.05)', border: '1px solid rgba(24,163,3,0.2)' }}>
          <p className="text-xs flex items-center gap-2" style={{ color: '#18A303' }}>
            <span>💡</span>
            The installed app uses your device&apos;s internal storage and works completely offline.
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-3 rounded-xl font-medium text-white transition-colors"
          style={{ background: 'linear-gradient(135deg, #18A303 0%, #0d7a02 100%)' }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
