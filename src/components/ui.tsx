/** Piezas visuales compartidas. Todo con Tailwind, sin librerías externas. */

import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type Variant = 'lime' | 'amber' | 'ink' | 'dark' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  lime: 'bg-lime text-night active:bg-lime-dark',
  amber: 'bg-amber text-night active:bg-amber-dark',
  ink: 'bg-ink text-night active:bg-white/80',
  dark: 'bg-surface text-ink border border-white/12 active:bg-surface-2',
  ghost: 'bg-transparent text-ink/60 active:text-ink',
  danger: 'bg-red text-ink active:bg-red-dark',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  full?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'lime',
  full,
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const sizes = {
    sm: 'px-4 py-2.5 text-[13px] font-sans font-medium tracking-wide',
    md: 'px-5 py-4 text-[17px] font-display uppercase tracking-wide',
    lg: 'px-6 py-[19px] text-[21px] font-display uppercase tracking-wide',
  }[size];

  return (
    <button
      className={`rounded-full border-0 transition-transform duration-100 active:scale-[.98] disabled:opacity-40 ${
        full ? 'w-full' : ''
      } ${VARIANTS[variant]} ${sizes} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className = '',
  ...rest
}: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-white/8 bg-surface ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Stat({
  value,
  label,
  color,
  className = '',
}: {
  value: ReactNode;
  label: string;
  color?: string;
  className?: string;
}) {
  return (
    <div className={`flex-1 rounded-[14px] border border-white/8 bg-surface p-3 ${className}`}>
      <div className="font-display text-[26px] leading-none tabular" style={{ color }}>
        {value}
      </div>
      <div className="mt-1.5 text-[10px] leading-none font-medium tracking-[.12em] text-ink/60">
        {label}
      </div>
    </div>
  );
}

export function Kicker({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <div
      className="text-[11px] leading-none font-medium tracking-[.2em] uppercase text-ink/60"
      style={color ? { color } : undefined}
    >
      {children}
    </div>
  );
}

export function Title({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h1 className={`font-display uppercase leading-none ${className}`}>{children}</h1>
  );
}

/** Hoja que sube desde abajo (elegir vaso, corregir medida…). */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHost(document.getElementById('tmt-overlay'));
  }, []);

  if (!open || !host) return null;

  return createPortal(
    <div className="pointer-events-auto absolute inset-0 flex flex-col justify-end">
      <button
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className="relative max-h-[86%] overflow-y-auto no-scrollbar rounded-t-[26px] border-t border-white/12 bg-[#121110] pb-8"
        style={{ animation: 'var(--animate-sheet)' }}
      >
        <div className="sticky top-0 z-10 bg-[#121110] px-5 pt-4 pb-3">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[24px] leading-none uppercase">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-full border border-white/12 px-3 py-1.5 text-[11px] font-medium tracking-wider text-ink/60"
            >
              CERRAR
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>,
    host,
  );
}

export function Divider({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-white/10 ${className}`} />;
}

/* ── Iconos ──────────────────────────────────────────────────── */

export function CameraIcon({ size = 22, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.7l1-1.7A1.5 1.5 0 0 1 9.5 3.5h5a1.5 1.5 0 0 1 1.3.8l1 1.7h1.7A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.6" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function PlusIcon({ size = 22, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function CheckIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="m5 12.5 4.5 4.5L19 7"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BackIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M14 5l-7 7 7 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Vasito dibujado: cambia de forma según el tipo de bebida. */
export function GlassIcon({
  kind,
  size = 44,
  className = '',
}: {
  kind: string;
  size?: number;
  className?: string;
}) {
  const h = size;
  const w = size * 0.72;
  const fills: Record<string, string> = {
    cerveza: '#FFB020',
    trago: '#E8402A',
    vino: '#9B7BFF',
    shot: '#C6F24E',
    espumante: '#5AC8FA',
    sidra: '#5AC8FA',
  };
  const fill = fills[kind] ?? '#FFB020';

  if (kind === 'vino' || kind === 'espumante') {
    return (
      <svg width={w} height={h} viewBox="0 0 32 44" className={className}>
        <path d="M7 4h18l-2 14a7 7 0 0 1-14 0L7 4Z" fill="rgba(250,247,242,.08)" stroke="rgba(250,247,242,.3)" />
        <path d="M8.6 10h14.8l-1.3 8a7 7 0 0 1-12.2 0L8.6 10Z" fill={fill} opacity=".9" />
        <path d="M16 25v13M11 39h10" stroke="rgba(250,247,242,.35)" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === 'shot') {
    return (
      <svg width={w} height={h} viewBox="0 0 32 44" className={className}>
        <path d="M9 16h14l-1.6 20a3 3 0 0 1-3 2.6h-4.8a3 3 0 0 1-3-2.6L9 16Z" fill="rgba(250,247,242,.08)" stroke="rgba(250,247,242,.3)" />
        <path d="M10.2 24h11.6l-1 12a3 3 0 0 1-3 2.6h-3.6a3 3 0 0 1-3-2.6l-1-12Z" fill={fill} opacity=".9" />
      </svg>
    );
  }

  return (
    <svg width={w} height={h} viewBox="0 0 32 44" className={className}>
      <rect x="6" y="4" width="20" height="36" rx="4" fill="rgba(250,247,242,.07)" stroke="rgba(250,247,242,.28)" />
      <rect x="8" y="15" width="16" height="23" rx="3" fill={fill} opacity=".9" />
      <rect x="8" y="15" width="16" height="4" rx="2" fill="rgba(255,255,255,.55)" />
    </svg>
  );
}
