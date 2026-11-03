'use client';

import type React from 'react';
import { ReactNode, useEffect, useRef, useState } from 'react';

/* ---------- Íconos (SVG inline, trazo uniforme: se ven iguales en todos los SO, a diferencia de los emojis) ---------- */

const Svg = ({ children, className = 'w-4 h-4' }: { children: ReactNode; className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const Icons = {
  eye: <Svg><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Svg>,
  dollar: <Svg><path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></Svg>,
  pencil: <Svg><path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z" /></Svg>,
  box: <Svg><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></Svg>,
  undo: <Svg><path d="M9 14L4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" /></Svg>,
  check: <Svg><path d="M20 6L9 17l-5-5" /></Svg>,
  refresh: <Svg><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></Svg>,
  file: <Svg><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></Svg>,
  receipt: <Svg><path d="M5 2h14v20l-3-2-2 2-2-2-2 2-2-2-3 2z" /><path d="M9 7h6M9 11h6M9 15h4" /></Svg>,
  trash: <Svg><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></Svg>,
  play: <Svg><path d="M6 4l14 8-14 8z" /></Svg>,
  clipboard: <Svg><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></Svg>,
  dots: <Svg><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></Svg>,
};

/* ---------- Modelo de acción ---------- */

export type ActionTone = 'primary' | 'success' | 'warning' | 'neutral' | 'danger';

export interface RowAction {
  key: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  tone?: ActionTone;
}

const solidTone: Record<ActionTone, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
  success: 'bg-green-600 hover:bg-green-700 text-white shadow-sm',
  warning: 'bg-amber-50 hover:bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200',
  neutral: 'bg-white hover:bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-200',
  danger: 'bg-red-50 hover:bg-red-100 text-red-700 ring-1 ring-inset ring-red-200',
};

/* ---------- Botones ---------- */

export function ActionButton({ action, block = false }: { action: RowAction; block?: boolean }) {
  return (
    <button
      type="button"
      onClick={action.onClick}
      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${solidTone[action.tone ?? 'neutral']} ${block ? 'w-full py-2 text-sm' : ''}`}
    >
      {action.icon}
      {action.label}
    </button>
  );
}

/** Botón chico solo-ícono (ej. editar fecha / pago al lado de un valor). */
export function IconButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <span className="[&>svg]:w-3.5 [&>svg]:h-3.5">{icon}</span>
    </button>
  );
}

/* ---------- Menú "⋯" ---------- */

export function ActionMenu({ actions, block = false }: { actions: RowAction[]; block?: boolean }) {
  const [pos, setPos] = useState<React.CSSProperties | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const open = pos !== null;
  const close = () => setPos(null);

  /** `position: fixed` para que no lo recorte el overflow de la tabla; abre hacia arriba si no entra abajo. */
  const toggle = () => {
    if (open) return close();
    const r = btnRef.current!.getBoundingClientRect();
    const MENU_H = 320;
    const vertical = r.bottom + MENU_H > window.innerHeight && r.top > MENU_H
      ? { bottom: window.innerHeight - r.top + 4 }
      : { top: r.bottom + 4 };
    const horizontal = block
      ? { left: r.left, width: r.width }
      : { right: window.innerWidth - r.right };
    setPos({ position: 'fixed', ...vertical, ...horizontal });
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  if (actions.length === 0) return null;

  const regular = actions.filter((a) => a.tone !== 'danger');
  const danger = actions.filter((a) => a.tone === 'danger');

  return (
    <div ref={ref} className={`relative ${block ? 'w-full' : ''}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Más acciones"
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-white text-gray-600 ring-1 ring-inset ring-gray-200 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${block ? 'w-full px-3 py-2 text-sm font-medium' : 'h-[30px] w-[30px]'}`}
      >
        {Icons.dots}
        {block && 'Más acciones'}
      </button>

      {open && (
        <div
          role="menu"
          style={pos}
          className="z-40 min-w-[12rem] rounded-xl bg-white py-1 shadow-lg ring-1 ring-black/5"
        >
          {regular.map((a) => (
            <MenuItem key={a.key} action={a} onDone={close} />
          ))}
          {danger.length > 0 && regular.length > 0 && <div className="my-1 border-t border-gray-100" />}
          {danger.map((a) => (
            <MenuItem key={a.key} action={a} onDone={close} />
          ))}
        </div>
      )}
    </div>
  );
}

function MenuItem({ action, onDone }: { action: RowAction; onDone: () => void }) {
  const danger = action.tone === 'danger';
  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        onDone();
        action.onClick();
      }}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'}`}
    >
      <span className={danger ? 'text-red-500' : 'text-gray-400'}>{action.icon}</span>
      {action.label}
    </button>
  );
}
