'use client';

/* The signature canvas.
 *
 * ⚠⚠ THE TRAP: the backing store is 321 × 150 and the element is displayed at
 * 100% of its container, which on a 393px phone screen is wider than 321. If the
 * pointer coordinates are not scaled by canvas.width / rect.width the ink lands
 * away from the finger — badly enough to be obvious from the back of a room.
 * Scale both axes; do not assume the height matches either.
 *
 * ⚠ `touch-action: none` or the browser scrolls the screen instead of drawing.
 * It must take ink from a mouse AND a touchscreen — someone will try it on a
 * phone in the room.
 */

import { useEffect, useRef } from 'react';

const INK = '#201e1d';

export default function Signature({
  inked,
  onInk,
  clearSignal,
}: {
  inked: boolean;
  onInk: () => void;
  /** Bumped by the parent to clear the canvas. */
  clearSignal: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.getContext('2d')?.clearRect(0, 0, c.width, c.height);
  }, [clearSignal]);

  const ctx = () => {
    const c = ref.current;
    if (!c) return null;
    const g = c.getContext('2d');
    if (!g) return null;
    g.lineWidth = 2.4;
    g.lineJoin = 'round';
    g.lineCap = 'round';
    g.strokeStyle = INK;
    return g;
  };

  /** ⚠⚠ The scaling that makes the ink land under the finger. */
  const point = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const c = ref.current!;
    const r = c.getBoundingClientRect();
    return [(e.clientX - r.left) * (c.width / r.width), (e.clientY - r.top) * (c.height / r.height)];
  };

  return (
    <canvas
      ref={ref}
      width={321}
      height={150}
      onPointerDown={(e) => {
        const g = ctx();
        if (!g) return;
        (e.target as HTMLCanvasElement).setPointerCapture?.(e.pointerId);
        drawing.current = true;
        const [x, y] = point(e);
        g.beginPath();
        g.moveTo(x, y);
        // A single dot is ink too — a tap must register, not only a stroke.
        g.lineTo(x, y);
        g.stroke();
        if (!inked) onInk();
      }}
      onPointerMove={(e) => {
        if (!drawing.current) return;
        const g = ctx();
        if (!g) return;
        const [x, y] = point(e);
        g.lineTo(x, y);
        g.stroke();
      }}
      onPointerUp={() => {
        drawing.current = false;
      }}
      onPointerLeave={() => {
        drawing.current = false;
      }}
      style={{
        display: 'block',
        width: '100%',
        height: 150,
        marginTop: 8,
        background: 'var(--color-bg)',
        border: '1px dashed var(--color-divider)',
        touchAction: 'none',
        cursor: 'crosshair',
      }}
    />
  );
}
