/**
 * LiberXMobile Centralized Persistence Layer
 *
 * Handles auto-save and restore for ALL user data:
 * - App settings (view, fileName, zoom, darkMode, sidebar, splitView)
 * - Writer content (HTML)
 * - Calc sheets (all sheets + cell data)
 * - Impress slides (all slides + elements)
 * - Custom dictionaries, autotext entries, templates
 * - Track changes log, recent documents
 *
 * Uses localStorage with debounced writes (1s delay) to avoid
 * performance issues from rapid state changes.
 */

'use client';

const PREFIX = 'liberxmobile:';
const DEBOUNCE_MS = 1000;

// Registry of debounced timers
const timers: Record<string, ReturnType<typeof setTimeout>> = {};

/** Save any JSON-serializable data under a key (debounced). */
export function persist<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  // Clear previous timer for this key
  if (timers[key]) clearTimeout(timers[key]);
  // Schedule new write
  timers[key] = setTimeout(() => {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(PREFIX + key, json);
    } catch (e) {
      // Quota exceeded or serialization error — silent fail
      console.warn(`[LiberXMobile] Failed to persist "${key}":`, e);
    }
  }, DEBOUNCE_MS);
}

/** Save immediately (no debounce) — use on unload/visibilitychange. */
export function persistImmediate<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  if (timers[key]) clearTimeout(timers[key]);
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.warn(`[LiberXMobile] Failed to persist immediately "${key}":`, e);
  }
}

/** Load data for a key (returns null if not found or invalid). */
export function load<T = unknown>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`[LiberXMobile] Failed to load "${key}":`, e);
    return null;
  }
}

/** Remove a key from storage. */
export function remove(key: string): void {
  if (typeof window === 'undefined') return;
  if (timers[key]) clearTimeout(timers[key]);
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {}
}

/** Clear ALL LiberXMobile data (factory reset). */
export function clearAll(): void {
  if (typeof window === 'undefined') return;
  Object.keys(timers).forEach((k) => clearTimeout(timers[k]));
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIX) || k.startsWith('liberxoffice-'))
    .forEach((k) => localStorage.removeItem(k));
}

/** Get total size of stored data (in KB, approximate). */
export function getStorageSize(): number {
  if (typeof window === 'undefined') return 0;
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith(PREFIX) || key.startsWith('liberxoffice-'))) {
      const value = localStorage.getItem(key) || '';
      total += key.length + value.length;
    }
  }
  return Math.round((total * 2) / 1024); // UTF-16 = 2 bytes per char
}

// ─── Migration: convert old "liberxoffice-" keys to new "liberxmobile:" prefix ───

export function migrateOldKeys(): void {
  if (typeof window === 'undefined') return;
  const migrations: Record<string, string> = {
    'liberxoffice-autosave-writer': PREFIX + 'writer',
    'liberxoffice-autosave-calc': PREFIX + 'calc',
    'liberxoffice-autosave-impress': PREFIX + 'impress',
    'liberxoffice-autotext': PREFIX + 'autotext',
    'liberxoffice-custom-dict': PREFIX + 'spellcheck-dict',
    'liberxoffice-changes-log': PREFIX + 'track-changes',
    'liberxoffice-track-changes': PREFIX + 'track-changes-enabled',
    'liberxoffice-templates': PREFIX + 'templates',
    'liberxoffice-autocorrect': PREFIX + 'autocorrect-enabled',
    'liberxmobile-dark-mode': PREFIX + 'dark-mode',
    'liberxmobile-slide-master': PREFIX + 'slide-master',
    'liberxmobile-impress-thumb': PREFIX + 'impress-thumbnail',
  };
  Object.entries(migrations).forEach(([oldKey, newKey]) => {
    const value = localStorage.getItem(oldKey);
    if (value !== null && localStorage.getItem(newKey) === null) {
      try {
        // Try to parse and re-stringify (normalize format)
        const parsed = JSON.parse(value);
        localStorage.setItem(newKey, JSON.stringify(parsed));
      } catch {
        // Not JSON — copy as-is
        localStorage.setItem(newKey, value);
      }
      localStorage.removeItem(oldKey);
    }
  });
}
