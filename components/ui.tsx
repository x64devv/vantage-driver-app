'use client';

/* Shared primitives. Deliberately thin — the Modernist sheet is the design
 * system and the screens use inline styles reading its var(--…) tokens, which is
 * the closest transfer of the prototype's own markup. ⚠ Never a literal colour
 * in a screen; every one comes from a token.
 */

import type { CSSProperties, ReactNode } from 'react';

export const ACC = 'var(--color-accent)';
export const INK = 'var(--color-text)';
export const BG = 'var(--color-bg)';
export const SURF = 'var(--color-surface)';
export const DIV = 'var(--color-divider)';
export const MUT = 'color-mix(in srgb, var(--color-text) 45%, transparent)';
export const AC7 = 'var(--color-accent-700)';

export const A = (s: string) => ({ font: `600 ${s} Archivo, system-ui` });

export function Kicker({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        font: '600 10px/1 Archivo, system-ui',
        letterSpacing: '.14em',
        textTransform: 'uppercase',
        color: 'color-mix(in srgb, var(--color-text) 55%, transparent)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{ opacity: 0.55, fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase' }}>
      {children}
    </div>
  );
}

/** A labelled fact: small uppercase label over a 600-weight value. */
export function Fact({ label, value, size = 14 }: { label: string; value: ReactNode; size?: number }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ font: `600 ${size}px Archivo, system-ui` }}>{value}</div>
    </div>
  );
}

export function Rule({ weight = 2, margin = '16px 0' }: { weight?: number; margin?: string }) {
  return <div style={{ height: weight, background: DIV, margin }} />;
}

type BtnProps = {
  kind?: 'primary' | 'secondary' | 'ghost';
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  /** ⚠ Disabled = opacity .45 AND a label that says what is missing. The label
   *  is the caller's job; this only dims and inerts. Never a dead control. */
  dim?: boolean;
  height?: number;
  fontSize?: number;
  style?: CSSProperties;
  flush?: boolean;
  title?: string;
  ariaDisabled?: boolean;
};

export function Btn({
  kind = 'secondary',
  children,
  onClick,
  href,
  dim = false,
  height = 44,
  fontSize = 13,
  flush = true,
  style,
  title,
}: BtnProps) {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: flush ? 'flex-start' : 'center',
    textAlign: 'left',
    gap: 6,
    minHeight: height,
    padding: flush ? `0 12px 0 ${fontSize >= 15 ? 14 : 12}px` : '0 12px',
    font: `600 ${fontSize}px Archivo, system-ui`,
    lineHeight: 1.2,
    cursor: dim ? 'default' : 'pointer',
    borderRadius: 0,
    opacity: dim ? 0.45 : 1,
    textDecoration: 'none',
    fontFamily: 'Archivo, system-ui',
    ...(kind === 'primary'
      ? { background: ACC, color: BG, border: '1px solid transparent' }
      : kind === 'secondary'
        ? { background: 'transparent', color: INK, border: `1px solid ${DIV}` }
        : { background: 'transparent', color: AC7, border: '1px solid transparent' }),
    ...style,
  };

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" style={base} title={title}>
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={dim ? undefined : onClick}
      aria-disabled={dim || undefined}
      className={kind === 'secondary' ? 'tap8' : undefined}
      style={base}
      title={title}
    >
      {children}
    </button>
  );
}

/** A bordered card — 1px divider, square, 12–13px padding. */
export function Card({
  children,
  padding = 13,
  style,
}: {
  children: ReactNode;
  padding?: number;
  style?: CSSProperties;
}) {
  return <div style={{ border: `1px solid ${DIV}`, padding, ...style }}>{children}</div>;
}

/** ⚠ The two warning panels: accent-100 fill, 1px accent border, 800 heading in
 *  accent-800, body in accent-900. Used for the "no" exception panel and the
 *  "I cannot see this account from here" panel — the two places the app says
 *  something the driver would rather not read. */
export function WarnPanel({ head, children }: { head: string; children: ReactNode }) {
  return (
    <div
      style={{
        border: `1px solid ${ACC}`,
        background: 'var(--color-accent-100)',
        padding: 12,
      }}
    >
      <div style={{ font: '800 13px Archivo, system-ui', color: 'var(--color-accent-800)' }}>{head}</div>
      <div
        className="pretty"
        style={{ fontSize: 12, lineHeight: 1.45, marginTop: 5, color: 'var(--color-accent-900)' }}
      >
        {children}
      </div>
    </div>
  );
}

/** A surface-filled note strip. */
export function Note({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      className="pretty"
      style={{ padding: '11px 12px', background: SURF, fontSize: 12, lineHeight: 1.5, ...style }}
    >
      {children}
    </div>
  );
}

export function SectionHead({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
      <div
        style={{
          font: '600 10px Archivo, system-ui',
          letterSpacing: '.14em',
          textTransform: 'uppercase',
          opacity: 0.55,
        }}
      >
        {children}
      </div>
      {right}
    </div>
  );
}

/** One row of the record trail. `Bound` prints in accent; Queued/Held in muted
 *  ink. ⚠ Every row names where the record is going. */
export function TrailRow({
  entry,
  showDest = true,
}: {
  entry: { ref: string; detail: string; dest: string; state: string };
  showDest?: boolean;
}) {
  return (
    <div style={{ padding: '11px 0', borderBottom: `1px solid ${DIV}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
        <span style={{ font: '600 13px Archivo, system-ui' }}>{entry.ref}</span>
        <span
          style={{
            flex: 'none',
            font: '600 9px Archivo, system-ui',
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            color: entry.state === 'Bound' ? ACC : MUT,
          }}
        >
          {entry.state}
        </span>
      </div>
      <div className="pretty" style={{ fontSize: 11, opacity: 0.7, marginTop: 3, lineHeight: 1.45 }}>
        {entry.detail}
        {showDest ? ` → ${entry.dest}` : ''}
      </div>
      {!showDest && (
        <div
          style={{
            font: '600 9px Archivo, system-ui',
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            opacity: 0.5,
            marginTop: 5,
          }}
        >
          {entry.dest}
        </div>
      )}
    </div>
  );
}

export const gmapsHref = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
