'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAppStore, type AppView } from '@/stores/app-store';
import {
  FileText, Table2, Presentation, Clock, BookOpen,
  GraduationCap, FlaskConical, Globe, Calculator,
  History, Palette, ArrowRight, Star, ChevronRight,
  Shield, Smartphone, Download, Sparkles
} from 'lucide-react';

/* ── Data ──────────────────────────────────────────── */
const mainModules: { icon: React.ReactNode; label: string; type: AppView; color: string; gradient: string; description: string; features: string[] }[] = [
  {
    icon: <FileText size={44} />,
    label: 'Writer',
    type: 'writer',
    color: '#4A86C8',
    gradient: 'from-blue-500/20 to-blue-600/5',
    description: 'Documents, letters, essays, reports',
    features: ['DOCX Import/Export', 'Spell Check', 'Templates'],
  },
  {
    icon: <Table2 size={44} />,
    label: 'Calc',
    type: 'calc',
    color: '#43B88C',
    gradient: 'from-emerald-500/20 to-emerald-600/5',
    description: 'Spreadsheets, data analysis, charts',
    features: ['65+ Formulas', 'XLSX Support', 'Pivot Tables'],
  },
  {
    icon: <Presentation size={44} />,
    label: 'Impress',
    type: 'impress',
    color: '#D4573B',
    gradient: 'from-red-500/20 to-red-600/5',
    description: 'Presentations and slideshows',
    features: ['Animations', 'Slide Master', 'Speaker Notes'],
  },
];

const templates = [
  { icon: <BookOpen size={22} />, title: 'Formal Letter', description: 'School formal letters', type: 'writer' as AppView, color: '#4A86C8' },
  { icon: <FileText size={22} />, title: 'Essay Template', description: 'Structured essays', type: 'writer' as AppView, color: '#4A86C8' },
  { icon: <GraduationCap size={22} />, title: 'Lab Report', description: 'Science lab format', type: 'writer' as AppView, color: '#4A86C8' },
  { icon: <Calculator size={22} />, title: 'Marksheet', description: 'Marks & percentages', type: 'calc' as AppView, color: '#43B88C' },
  { icon: <FlaskConical size={22} />, title: 'Science Data', description: 'Experiment data', type: 'calc' as AppView, color: '#43B88C' },
  { icon: <History size={22} />, title: 'History Slides', description: 'Timeline slides', type: 'impress' as AppView, color: '#D4573B' },
  { icon: <Globe size={22} />, title: 'Geography Report', description: 'Project reports', type: 'writer' as AppView, color: '#4A86C8' },
  { icon: <Palette size={22} />, title: 'Art Project', description: 'Showcase art work', type: 'impress' as AppView, color: '#D4573B' },
];

const stats = [
  { value: '300+', label: 'Features' },
  { value: '65+', label: 'Calc Formulas' },
  { value: '15+', label: 'Slide Transitions' },
  { value: '100%', label: 'Free & Open Source' },
];

/* ── Animated Counter ──────────────────────────────── */
function AnimatedCounter({ value, label, delay }: { value: string; label: string; delay: number }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div ref={ref} className={`text-center transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="text-2xl font-bold text-lo-green">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

/* ── Hero Section ──────────────────────────────────── */
function HeroSection() {
  return (
    <div className="relative overflow-hidden rounded-2xl text-white">
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/bg-landing.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60" />

      <div className="relative z-10 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Custom Logo with glow ring */}
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-lo-green/30 blur-xl animate-pulse" />
            <img
              src="/logo-custom.png"
              alt="LiberXMobile"
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shadow-2xl anim-float"
            />
          </div>

          <div className="text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              {/* ★ SHINING TEXT ★ */}
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white text-shine">
                LiberXMobile
              </h1>
            </div>
            <p className="text-white/70 text-sm sm:text-base mb-3">
              Free Office Suite optimized for Schools — Class 9 &amp; 10
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="inline-flex items-center gap-1 text-xs bg-white/15 backdrop-blur px-2.5 py-1 rounded-full">
                <GraduationCap size={12} /> CBSE &amp; ICSE
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-white/15 backdrop-blur px-2.5 py-1 rounded-full">
                <Smartphone size={12} /> Smart Board Ready
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-white/15 backdrop-blur px-2.5 py-1 rounded-full">
                <Shield size={12} /> 100% Free
              </span>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-center gap-1 text-white/60 text-xs">
            <Sparkles size={20} className="text-yellow-300" />
            <span>Based on</span>
            <span className="font-semibold text-white text-glow-green">LibreOffice</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Start Center ─────────────────────────────── */
export default function StartCenter() {
  const { navigateTo, recentDocuments } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleNew = (type: AppView, name?: string) => {
    const names: Record<AppView, string> = {
      'start-center': 'Untitled',
      writer: name || 'Untitled Document',
      calc: name || 'Untitled Spreadsheet',
      impress: name || 'Untitled Presentation',
    };
    navigateTo(type, names[type]);
  };

  const viewIcons: Record<string, React.ReactNode> = {
    writer: <FileText size={16} className="text-[#4A86C8]" />,
    calc: <Table2 size={16} className="text-[#43B88C]" />,
    impress: <Presentation size={16} className="text-[#D4573B]" />,
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header bar */}
      <div className={`flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-border transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
        <img src="/logo-custom.png" alt="LiberXMobile" className="w-8 h-8 rounded-lg object-contain" />
        <div className="flex-1">
          <span className="text-base font-semibold tracking-tight text-shine text-foreground">LiberXMobile</span>
          <p className="text-[11px] text-muted-foreground hidden sm:block">Free Office Suite for Schools</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-lo-green bg-lo-green/10 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-lo-green animate-pulse" />
            Ready
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto lo-scrollbar">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-7">

          {/* ── Hero ─────────────────────── */}
          <div className={mounted ? 'anim-fade-up' : 'opacity-0'}>
            <HeroSection />
          </div>

          {/* ── Stats Bar ─────────────────── */}
          <div className={`grid grid-cols-4 gap-3 ${mounted ? 'anim-fade-up' : 'opacity-0'}`} style={{ animationDelay: '0.15s' }}>
            {stats.map((s, i) => (
              <AnimatedCounter key={i} value={s.value} label={s.label} delay={300 + i * 100} />
            ))}
          </div>

          {/* ── Create New ────────────────── */}
          <section className={mounted ? 'anim-fade-up' : 'opacity-0'} style={{ animationDelay: '0.25s' }}>
            <div className="flex items-center gap-2 mb-3">
              <Star size={16} className="text-lo-green" />
              <h2 className="text-sm font-semibold">Create New</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {mainModules.map((mod, i) => (
                <button
                  key={mod.type}
                  className={`shimmer-sweep group relative overflow-hidden rounded-xl border border-border bg-card p-5 text-left hover:shadow-lg hover:border-primary/30 transition-all duration-300 active:scale-[0.98] touch-target ${mounted ? 'anim-scale-in' : 'opacity-0'}`}
                  style={{ animationDelay: `${0.35 + i * 0.1}s` }}
                  onClick={() => handleNew(mod.type)}
                >
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${mod.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="relative z-10">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: `${mod.color}15`, color: mod.color }}
                    >
                      {mod.icon}
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-base block">{mod.label}</span>
                        <span className="text-xs text-muted-foreground">{mod.description}</span>
                      </div>
                      <ChevronRight size={18} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {mod.features.map((f, fi) => (
                        <span key={fi} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* ── Templates ─────────────────── */}
          <section className={mounted ? 'anim-fade-up' : 'opacity-0'} style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={16} className="text-lo-green" />
              <h2 className="text-sm font-semibold">Templates for Class 9 &amp; 10</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {templates.map((tmpl, i) => (
                <button
                  key={i}
                  className={`shimmer-sweep group relative overflow-hidden rounded-xl border border-border bg-card p-3 text-left hover:shadow-md hover:border-primary/20 transition-all duration-300 active:scale-[0.97] touch-target ${mounted ? 'anim-scale-in' : 'opacity-0'}`}
                  style={{ animationDelay: `${0.55 + i * 0.06}s` }}
                  onClick={() => handleNew(tmpl.type, tmpl.title)}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center mb-1.5 transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${tmpl.color}15`, color: tmpl.color }}
                  >
                    {tmpl.icon}
                  </div>
                  <span className="text-sm font-medium block">{tmpl.title}</span>
                  <span className="text-[11px] text-muted-foreground leading-tight">{tmpl.description}</span>
                </button>
              ))}
            </div>
          </section>

          {/* ── Recent Documents ──────────── */}
          {recentDocuments.length > 0 && (
            <section className={mounted ? 'anim-fade-up' : 'opacity-0'} style={{ animationDelay: '0.7s' }}>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} className="text-lo-green" />
                <h2 className="text-sm font-semibold">Recent Documents</h2>
              </div>
              <div className="rounded-xl border border-border overflow-hidden">
                {recentDocuments.map((doc, i) => (
                  <button
                    key={doc.id}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors touch-target border-b border-border last:border-b-0 ${mounted ? 'anim-fade-left' : 'opacity-0'}`}
                    style={{ animationDelay: `${0.75 + i * 0.05}s` }}
                    onClick={() => handleNew(doc.type, doc.name)}
                  >
                    {viewIcons[doc.type]}
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium">{doc.name}</div>
                      <div className="text-[11px] text-muted-foreground capitalize">
                        {doc.type} — {doc.lastOpened.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── Info Section ──────────────── */}
          <section className={mounted ? 'anim-fade-up' : 'opacity-0'} style={{ animationDelay: '0.85s' }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-start gap-2.5 p-3 rounded-xl border border-border bg-card">
                <div className="w-8 h-8 rounded-lg bg-lo-green/10 flex items-center justify-center shrink-0">
                  <GraduationCap size={16} className="text-lo-green" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Optimized for CBSE and ICSE Class 9 &amp; 10 practical syllabus — document formatting, spreadsheet formulas, and presentation skills.
                </p>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl border border-border bg-card">
                <div className="w-8 h-8 rounded-lg bg-lo-green/10 flex items-center justify-center shrink-0">
                  <Smartphone size={16} className="text-lo-green" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Touch-optimized for Android Smart Boards. Works with touch, stylus, keyboard, and mouse for flexible classroom use.
                </p>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl border border-border bg-card">
                <div className="w-8 h-8 rounded-lg bg-lo-green/10 flex items-center justify-center shrink-0">
                  <Download size={16} className="text-lo-green" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  100% free and open-source. Based on LibreOffice, the world&apos;s most popular free office suite. No ads, no paid features.
                </p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-4 text-center">
              LiberXMobile is a customized fork of LibreOffice. LibreOffice is a trademark of The Document Foundation.
              This project follows the Mozilla Public License v2.0 (MPLv2).
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
