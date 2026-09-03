'use client';

import React, { useEffect, useState, useCallback } from 'react';

export interface ContextMenuItem {
  label: string;
  shortcut?: string;
  icon?: React.ReactNode;
  action?: () => void;
  divider?: boolean;
  disabled?: boolean;
  subMenu?: ContextMenuItem[];
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  x: number;
  y: number;
  onClose: () => void;
}

export default function ContextMenu({ items, x, y, onClose }: ContextMenuProps) {
  const [pos, setPos] = useState({ x, y });
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    // Adjust position if menu would go off-screen
    const menuW = 200;
    const menuH = items.length * 32;
    const adjustedX = Math.min(x, (typeof window !== 'undefined' ? window.innerWidth : 1200) - menuW - 8);
    const adjustedY = Math.min(y, (typeof window !== 'undefined' ? window.innerHeight : 800) - menuH - 8);
    requestAnimationFrame(() => setPos({ x: Math.max(4, adjustedX), y: Math.max(4, adjustedY) }));
  }, [x, y, items.length]);

  useEffect(() => {
    const close = () => onClose();
    document.addEventListener('click', close);
    document.addEventListener('contextmenu', close);
    return () => { document.removeEventListener('click', close); document.removeEventListener('contextmenu', close); };
  }, [onClose]);

  return (
    <div className="fixed z-[55] bg-white dark:bg-zinc-800 border border-border rounded-md shadow-xl py-1 min-w-[180px]"
      style={{ left: pos.x, top: pos.y }} onClick={(e) => e.stopPropagation()}>
      {items.map((item, i) =>
        item.divider ? (
          <div key={i} className="h-px bg-border my-1" />
        ) : (
          <button
            key={i}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent transition-colors touch-target ${item.disabled ? 'opacity-40 pointer-events-none' : ''}`}
            onClick={() => { item.action?.(); onClose(); }}
            onMouseEnter={() => setHoveredIdx(i)}
            disabled={item.disabled}
          >
            {item.icon && <span className="w-4 h-4 flex items-center justify-center">{item.icon}</span>}
            <span className="flex-1 text-left">{item.label}</span>
            {item.shortcut && <span className="text-[10px] text-muted-foreground ml-2">{item.shortcut}</span>}
            {item.subMenu && <span className="text-xs text-muted-foreground">&#9656;</span>}
          </button>
        )
      )}
    </div>
  );
}

// Hook for right-click context menu
export function useContextMenu() {
  const [menu, setMenu] = useState<{ items: ContextMenuItem[]; x: number; y: number } | null>(null);

  const show = useCallback((e: React.MouseEvent | MouseEvent, items: ContextMenuItem[]) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ items, x: e.clientX, y: e.clientY });
  }, []);

  const hide = useCallback(() => setMenu(null), []);

  const menuEl = menu ? (
    <ContextMenu items={menu.items} x={menu.x} y={menu.y} onClose={hide} />
  ) : null;

  return { show, hide, menuEl };
}
