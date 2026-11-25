'use client';

/* 5 · Proof of delivery — evidence, then a signature that locks the line set.
 *
 * ⚠⚠ The capture slots are SIMULATED. There is no camera behind them, and there
 * is deliberately no photograph of an identity document anywhere in this build —
 * not a real one and not a stock one. A slot that says CAMERA → TAKEN is honest;
 * a picture of somebody's ID is not, whoever's it is. The console makes the same
 * call on TM-4 and ships labelled placeholders. Wire a real camera in the Kotlin
 * build, not here.
 *
 * ⚠ Gate: both photographs AND ink on the canvas. Dimmed until then, with a
 * label saying which.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CAPTURED, PHOTO_SLOTS, stopById } from '@/lib/run';
import { canConfirmProof, useRun } from '@/lib/state';
import { ACC, BG, Btn, Card, DIV, INK, MUT, SURF, SectionHead } from '@/components/ui';
import Signature from '@/components/Signature';

export default function ProofView({ id }: { id: number }) {
  const router = useRouter();
  const { s, set, completeStop } = useRun();
  const stop = stopById(id);
  const [clearSignal, setClearSignal] = useState(0);
  const ready = canConfirmProof(s);

  const missing = !s.photos.goods || !s.photos.id
    ? !s.sigInk
      ? 'Two photographs and a signature first'
      : 'Two photographs first'
    : 'A signature first';

  return (
    <div style={{ padding: '14px 18px 26px' }}>
      {/* ⚠ The intro line ("Three pieces of evidence, then the signature…") went
          on 21 Aug. The screen already shows two photo slots above a signature,
          and the signature hint still says the line set locks when it is signed —
          the claim survives where it is acted on. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {PHOTO_SLOTS.map((p) => {
          const taken = s.photos[p.key];
          return (
            <button
              key={p.key}
              type="button"
              className="tappable"
              onClick={() => set((prev) => ({ photos: { ...prev.photos, [p.key]: !prev.photos[p.key] } }))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                textAlign: 'left',
                padding: 12,
                border: `1px solid ${DIV}`,
                borderLeft: `4px solid ${taken ? ACC : 'transparent'}`,
                background: SURF,
                cursor: 'pointer',
                color: 'inherit',
                fontFamily: 'inherit',
                minHeight: 64,
                borderRadius: 0,
              }}
            >
              <span
                style={{
                  flex: 'none',
                  width: 52,
                  height: 52,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: taken ? INK : SURF,
                  color: taken ? BG : MUT,
                  font: '600 9px Archivo, system-ui',
                  letterSpacing: '.06em',
                  textAlign: 'center',
                  padding: 4,
                  boxSizing: 'border-box',
                  border: taken ? 'none' : `1px solid ${DIV}`,
                }}
              >
                {taken ? 'TAKEN' : 'CAMERA'}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', font: '600 14px/1.2 Archivo, system-ui' }}>{p.label}</span>
                {/* ⚠ COPY-RULES: a photograph says it is HELD FOR WIFI. It never
                    implies it has been sent. */}
                <span className="pretty" style={{ display: 'block', fontSize: 11, opacity: 0.7, marginTop: 3 }}>
                  {taken ? `Captured ${p.at} · ${p.size} · held for wifi` : p.hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <Card style={{ marginTop: 16, padding: 12 }}>
        <SectionHead
          right={
            <button
              type="button"
              onClick={() => {
                setClearSignal((n) => n + 1);
                set({ sigInk: false });
              }}
              style={{
                border: 0,
                background: 'transparent',
                font: '600 11px Archivo, system-ui',
                color: 'var(--color-accent-700)',
                cursor: 'pointer',
                padding: '4px 0',
              }}
            >
              Clear
            </button>
          }
        >
          Signature
        </SectionHead>

        <Signature inked={s.sigInk} onInk={() => set({ sigInk: true })} clearSignal={clearSignal} />

        <div className="pretty" style={{ fontSize: 11, opacity: 0.6, marginTop: 6 }}>
          {s.sigInk
            ? `Signed on the glass at ${CAPTURED.signature}. The line set is now locked.`
            : 'Ask the receiver to sign here with a finger.'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          <Labelled label="Received by">
            <input
              className="input"
              value={s.signer}
              onChange={(e) => set({ signer: e.target.value })}
              style={{ minHeight: 44, borderRadius: 0 }}
            />
          </Labelled>
          <Labelled label="ID number">
            <input
              className="input"
              value={s.idNo}
              onChange={(e) => set({ idNo: e.target.value })}
              style={{ minHeight: 44, borderRadius: 0 }}
            />
          </Labelled>
        </div>
      </Card>

      {/* ⚠ The two-drains note (TRP-003 §3.2 — photographs go out on wifi only so
          a signature never queues behind megabytes) went on 21 Aug. It explained
          the mechanism; the claim it supports is still on every photo slot,
          which reads "held for wifi", and in the trail rows. Worth saying out
          loud if anyone asks why the photographs lag. */}

      <Btn
        kind="primary"
        height={56}
        fontSize={15}
        dim={!ready}
        style={{ width: '100%', marginTop: 14 }}
        onClick={() => {
          if (stop.cash) {
            router.push(`/stop/${stop.id}/cash`);
          } else {
            completeStop(stop.id);
            router.push(`/stop/${stop.id}/closed`);
          }
        }}
      >
        {!ready
          ? missing
          : stop.cash
            ? 'Confirm delivery, then take the money →'
            : `Confirm delivery of stop ${stop.seq}`}
      </Btn>
    </div>
  );
}

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span
        style={{
          display: 'block',
          font: '600 10px Archivo, system-ui',
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          opacity: 0.55,
          marginBottom: 4,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
