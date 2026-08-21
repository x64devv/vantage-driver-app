'use client';

/* 4 · Stop detail — everything the driver must confirm before a signature can be
 * asked for.
 *
 * ⚠ Order matters. TRP-004 §3.2 step 6 puts the functional test BEFORE the
 * signature is requested, which is why the test sits on this screen and not the
 * next one.
 *
 * ⚠⚠ The gate: all four checks answered yes AND the test answered. A single "no"
 * swaps the primary action for "Record the exception". Disabled means opacity
 * .45 and a label naming what is missing — never a dead control.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CHECKS, STOPS, TRIP, stopById } from '@/lib/run';
import {
  answeredCount, canTakeProof, failedChecks, useRun, type StopLayout,
} from '@/lib/state';
import {
  ACC, BG, Btn, Card, DIV, INK, MUT, SURF, SectionHead, WarnPanel, gmapsHref,
} from '@/components/ui';

export default function StopView({ id }: { id: number }) {
  const router = useRouter();
  const { s, set } = useRun();
  const stop = stopById(id);

  // Keep the store's idea of the current stop in step with the URL, so the left
  // rail's jump buttons and the app bar agree with what is on screen.
  useEffect(() => {
    if (s.stopId !== id) set({ stopId: id });
  }, [id, s.stopId, set]);

  const answered = answeredCount(s);
  const failed = failedChecks(s);
  const ready = canTakeProof(s);

  return (
    <div style={{ padding: '14px 18px 26px' }}>
      {/* ── Header card ─────────────────────────────────────────────────── */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ font: '800 18px/1.15 Archivo, system-ui' }}>{stop.customer}</div>
            <div className="pretty" style={{ fontSize: 12, opacity: 0.75, marginTop: 4, lineHeight: 1.4 }}>
              {stop.addressFull}
            </div>
            <div style={{ fontSize: 12, marginTop: 6 }}>
              <a href={`tel:${stop.phone.replace(/\s/g, '')}`}>{stop.phone}</a>
            </div>
          </div>
          <div style={{ flex: 'none', textAlign: 'right' }}>
            <div
              style={{
                font: '600 9px Archivo, system-ui',
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                opacity: 0.55,
              }}
            >
              {stop.arrival ? 'Arrived' : 'Not arrived'}
            </div>
            <div style={{ font: '800 16px Archivo, system-ui', marginTop: 3 }}>
              {stop.arrival ? stop.arrival.at : '—'}
            </div>
            {/* ⚠ COPY-RULES: arrival always says HOW it was known. "By geofence"
                and "By your button" are different grades of fact and the app
                never silently picks one. */}
            <div
              style={{
                font: '600 9px Archivo, system-ui',
                letterSpacing: '.08em',
                color: ACC,
                marginTop: 3,
              }}
            >
              {stop.arrival ? (stop.arrival.source === 'Geofence' ? 'By geofence' : 'By your button') : 'Arrive to record'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <Btn href={gmapsHref(stop.latlng[0], stop.latlng[1])} style={{ flex: 1 }}>
            Navigate ↗
          </Btn>
          <Btn flush={false} style={{ flex: 'none' }} onClick={() => router.push('/run/route')}>
            Route
          </Btn>
        </div>
      </Card>

      {/* ── Consignment ─────────────────────────────────────────────────── */}
      <div style={{ marginTop: 14, border: `1px solid ${DIV}` }}>
        <div
          style={{
            padding: '10px 12px',
            borderBottom: `1px solid ${DIV}`,
            font: '600 10px Archivo, system-ui',
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            opacity: 0.6,
          }}
        >
          On the truck · {stop.consignment}
        </div>
        {stop.lines.map((line, i) => {
          const serialised = !!line.serial?.startsWith('#G');
          return (
            <div key={i} style={{ padding: '11px 12px', borderBottom: `1px solid ${DIV}` }}>
              <div style={{ font: '600 13px/1.3 Archivo, system-ui' }}>{line.desc}</div>
              <div style={{ fontSize: 11, opacity: 0.65, marginTop: 3 }}>
                {line.sku} · qty {line.qty}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 8,
                  padding: '7px 9px',
                  background: SURF,
                }}
              >
                <span style={{ width: 7, height: 7, background: ACC, display: 'block', flex: 'none' }} />
                <span style={{ font: '600 11px Archivo, system-ui', letterSpacing: '.02em' }}>
                  {serialised
                    ? `Serial ${line.serial} · bound at dispatch ${line.boundAt ?? ''}`.trim()
                    : line.serial ?? 'Not serialised'}
                </span>
              </div>
              {/* ⚠ COPY-RULES: a serial says HOW it was captured. Scanned and
                  typed are different grades of fact, and an unserialised line
                  says so plainly rather than showing a blank where a serial
                  would be. */}
              <div className="pretty" style={{ fontSize: 10, opacity: 0.6, marginTop: 5 }}>
                {serialised
                  ? `${line.capturedBy === 'Scanned' ? 'Scanned' : 'Typed'} onto load ${line.boundOnLoadUnit ?? TRIP.load} by you. Not typed — a different grade of fact.`
                  : 'This line is not serialised, so no serial gate applies.'}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── The four checks ─────────────────────────────────────────────── */}
      <div style={{ marginTop: 18 }}>
        <SectionHead
          right={
            <div style={{ font: '600 11px Archivo, system-ui', color: ACC }}>
              {answered} of {CHECKS.length} answered
            </div>
          }
        >
          The four checks
        </SectionHead>
      </div>

      <Checks layout={s.stopLayout} />

      {failed.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <WarnPanel head={'A “no” becomes an exception with your name on it'}>
            “{failed[0].label}” was answered no. Record it and the goods come back with you — they are
            not left at the door.
            <Btn
              kind="primary"
              height={46}
              style={{ width: '100%', marginTop: 10 }}
              onClick={() => router.push(`/stop/${stop.id}/failed`)}
            >
              Record the exception
            </Btn>
          </WarnPanel>
        </div>
      )}

      {/* ── Functional test ─────────────────────────────────────────────── */}
      <Card style={{ marginTop: 18 }}>
        <SectionHead>Functional test — before any signature</SectionHead>
        <div style={{ font: '600 15px/1.25 Archivo, system-ui', marginTop: 8 }}>
          Switch it on in front of the receiver
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <Choice
            label="Passed"
            picked={s.funcTest === 'pass'}
            tone="yes"
            height={48}
            onClick={() => set({ funcTest: 'pass' })}
          />
          <Choice
            label="Failed"
            picked={s.funcTest === 'fail'}
            tone="no"
            height={48}
            onClick={() => set({ funcTest: 'fail' })}
          />
        </div>
      </Card>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <Btn
        kind="primary"
        height={56}
        fontSize={15}
        dim={!ready}
        style={{ width: '100%', marginTop: 16 }}
        onClick={() => router.push(`/stop/${stop.id}/proof`)}
      >
        {ready ? 'Take proof of delivery →' : missingLabel(answered, s.funcTest !== null)}
      </Btn>
      <Btn
        kind="ghost"
        height={46}
        style={{ width: '100%', marginTop: 6 }}
        onClick={() => router.push(`/stop/${stop.id}/failed`)}
      >
        Cannot deliver this stop
      </Btn>
    </div>
  );
}

/** ⚠ A dimmed control must say what is missing. This is that label. */
function missingLabel(answered: number, testDone: boolean) {
  if (answered < CHECKS.length && !testDone) return 'Answer all four checks and the test';
  if (answered < CHECKS.length) return `Answer ${CHECKS.length - answered} more of the four checks`;
  return 'Answer the functional test';
}

/* ── The three layouts ────────────────────────────────────────────────────
   ⚠ All three ship as live switches. They are the point of the left rail: the
   room chooses which one a driver in a doorway should actually get. */
function Checks({ layout }: { layout: StopLayout }) {
  const { s, set } = useRun();

  const answer = (id: (typeof CHECKS)[number]['id'], v: 'yes' | 'no') =>
    set((prev) => ({
      checks: { ...prev.checks, [id]: v },
      swipeIdx: v === 'yes' ? Math.min(CHECKS.length - 1, prev.swipeIdx + 1) : prev.swipeIdx,
    }));

  if (layout === 'checklist') {
    return (
      <div style={{ marginTop: 10, borderTop: `2px solid ${DIV}` }}>
        {CHECKS.map((c, i) => {
          const v = s.checks[c.id];
          return (
            <div key={c.id} style={{ padding: '12px 0', borderBottom: `1px solid ${DIV}` }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span
                  style={{ font: '800 12px Archivo, system-ui', color: ACC, flex: 'none', paddingTop: 2 }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', font: '600 14px/1.3 Archivo, system-ui' }}>{c.label}</span>
                  <span className="pretty" style={{ display: 'block', fontSize: 11, opacity: 0.65, marginTop: 3 }}>
                    {c.hint}
                  </span>
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <Choice label="Yes" picked={v === 'yes'} tone="yes" onClick={() => answer(c.id, 'yes')} />
                <Choice label="No" picked={v === 'no'} tone="no" onClick={() => answer(c.id, 'no')} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (layout === 'cards') {
    return (
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {CHECKS.map((c, i) => {
          const v = s.checks[c.id];
          const edge = v === 'yes' ? ACC : v === 'no' ? INK : 'transparent';
          return (
            <div
              key={c.id}
              style={{
                border: `1px solid ${DIV}`,
                borderLeft: `4px solid ${edge}`,
                background: SURF,
                padding: 13,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ font: '800 26px/1 Archivo, system-ui', color: ACC }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  style={{
                    font: '600 9px Archivo, system-ui',
                    letterSpacing: '.12em',
                    textTransform: 'uppercase',
                    color: v ? INK : MUT,
                  }}
                >
                  {v === 'yes' ? 'Yes' : v === 'no' ? 'No — exception' : 'Unanswered'}
                </span>
              </div>
              <div style={{ font: '600 16px/1.25 Archivo, system-ui', marginTop: 10 }}>{c.label}</div>
              <div className="pretty" style={{ fontSize: 12, opacity: 0.7, marginTop: 5, lineHeight: 1.4 }}>
                {c.hint}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <Choice label="Yes" picked={v === 'yes'} tone="yes" height={46} onClick={() => answer(c.id, 'yes')} />
                <Choice label="No" picked={v === 'no'} tone="no" height={46} onClick={() => answer(c.id, 'no')} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // swipe — one question at a time
  const idx = Math.min(s.swipeIdx, CHECKS.length - 1);
  const c = CHECKS[idx];
  return (
    <div
      style={{
        marginTop: 10,
        border: `1px solid ${DIV}`,
        padding: 16,
        minHeight: 250,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', gap: 5 }}>
        {CHECKS.map((x, i) => (
          <span
            key={x.id}
            style={{
              flex: 1,
              height: 5,
              display: 'block',
              background: s.checks[x.id] ? ACC : i === idx ? INK : 'rgba(32,30,29,.18)',
            }}
          />
        ))}
      </div>
      <div
        style={{
          font: '600 10px Archivo, system-ui',
          letterSpacing: '.12em',
          textTransform: 'uppercase',
          opacity: 0.5,
          marginTop: 16,
        }}
      >
        Check {String(idx + 1).padStart(2, '0')} of {CHECKS.length}
      </div>
      <div style={{ font: '800 25px/1.1 Archivo, system-ui', letterSpacing: '-.01em', marginTop: 8 }}>
        {c.label}
      </div>
      <div className="pretty" style={{ fontSize: 13, opacity: 0.72, marginTop: 8, lineHeight: 1.45 }}>
        {c.hint}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        <Btn kind="primary" height={56} fontSize={15} style={{ flex: 1 }} onClick={() => answer(c.id, 'yes')}>
          Yes
        </Btn>
        <Btn height={56} fontSize={15} style={{ flex: 1 }} onClick={() => answer(c.id, 'no')}>
          No
        </Btn>
      </div>
    </div>
  );
}

/** ⚠ Selected state is a FILL, not a tick — accent for affirmative, ink for
 *  negative. A "no" being ink rather than red is deliberate: a refusal is not an
 *  error. */
export function Choice({
  label,
  picked,
  tone,
  onClick,
  height = 44,
}: {
  label: string;
  picked: boolean;
  tone: 'yes' | 'no';
  onClick: () => void;
  height?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={picked ? undefined : 'tap8'}
      style={{
        flex: 1,
        minHeight: height,
        border: `1px solid ${DIV}`,
        background: picked ? (tone === 'yes' ? ACC : INK) : 'transparent',
        color: picked ? BG : INK,
        font: '600 13px Archivo, system-ui',
        cursor: 'pointer',
        textAlign: 'left',
        paddingLeft: 12,
        borderRadius: 0,
      }}
    >
      {label}
    </button>
  );
}
