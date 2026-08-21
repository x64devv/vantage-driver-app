'use client';

/* 2 · Today's run — the whole day at a glance, and one tap into either the route
 * or the next stop.
 */

import { useRouter } from 'next/navigation';
import { STOPS, TRIP } from '@/lib/run';
import { kmLeft } from '@/lib/derive';
import { stopStatus, useRun } from '@/lib/state';
import { ACC, BG, Btn, DIV, INK, MUT, SURF } from '@/components/ui';

export default function TodaysRun() {
  const router = useRouter();
  const { s } = useRun();

  const delivered = STOPS.filter((x) => s.done[x.id] === 'delivered').length;
  const failed = STOPS.filter((x) => s.done[x.id] === 'failed').length;
  const closed = delivered + failed;
  const remaining = STOPS.length - closed;
  const pct = Math.round((delivered / STOPS.length) * 100);

  return (
    <div style={{ padding: '16px 18px 26px' }}>
      {/* Trip card */}
      <div style={{ border: `1px solid ${DIV}`, padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <div style={{ font: '800 16px Archivo, system-ui' }}>{TRIP.id}</div>
          <div
            style={{
              font: '600 11px Archivo, system-ui',
              letterSpacing: '.06em',
              color: ACC,
              textAlign: 'right',
              flex: 'none',
            }}
          >
            {TRIP.zone}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12 }}>
          <Small label="Vehicle" value={TRIP.vehicle} />
          <Small label="Load" value={`${TRIP.load} · sealed`} />
          <Small label="Crew" value={String(TRIP.crewSize)} />
        </div>
        <div style={{ marginTop: 12, height: 8, background: 'color-mix(in srgb, var(--color-text) 12%, transparent)' }}>
          <div style={{ height: 8, background: ACC, width: `${pct}%` }} />
        </div>
        {/* ⚠ "N km left" is the road distance still to drive on the order in
            force — from lib/routes-cache.ts, not a straight line and not the
            handoff's placeholder 41. It changes when the driver confirms the
            optimised order, because the run then takes a different road. */}
        <div style={{ marginTop: 7, fontSize: 11, letterSpacing: '.04em', opacity: 0.7 }}>
          {delivered} of {STOPS.length} delivered · {remaining} to go · {kmLeft(s.orderAccepted)} left
          {failed ? ` · ${failed} not delivered` : ''}
        </div>
      </div>

      <Btn
        kind="primary"
        height={52}
        fontSize={14}
        style={{ width: '100%', marginTop: 12 }}
        onClick={() => router.push('/run/route')}
      >
        Route all {remaining} remaining stops →
      </Btn>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '20px 0 10px',
          paddingRight: 2,
        }}
      >
        <div
          style={{
            font: '600 10px Archivo, system-ui',
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            opacity: 0.55,
          }}
        >
          Stops · {s.orderAccepted ? 'optimised order, you confirmed it' : "dispatcher's order"}
        </div>
        <button
          type="button"
          onClick={() => router.push('/debrief')}
          style={{
            border: 0,
            background: 'transparent',
            font: '600 11px Archivo, system-ui',
            letterSpacing: '.04em',
            color: 'var(--color-accent-700)',
            cursor: 'pointer',
            padding: '6px 0',
          }}
        >
          Debrief
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {STOPS.map((x) => {
          const st = stopStatus(s, x.id);
          const tags: string[] = [];
          if (x.cash) tags.push(`CASH ${x.cash.currency}`);
          if (x.htb) tags.push('HTB');
          if (x.lines.some((l) => l.serial?.startsWith('#G'))) tags.push('SERIALISED');
          if (x.receiptScanAtFarEnd) tags.push('RECEIPT SCAN');

          const edge =
            st === 'current' ? ACC : st === 'pending' ? 'transparent' : 'rgba(32,30,29,.25)';
          const chipBg = st === 'current' ? ACC : st === 'pending' ? INK : BG;
          const chipFg = st === 'current' ? BG : st === 'pending' ? BG : INK;
          const statusText =
            st === 'delivered' ? 'Delivered' : st === 'failed' ? 'Not delivered' : st === 'current' ? 'Next' : 'Pending';

          return (
            <button
              key={x.id}
              type="button"
              className="tappable"
              /* ⚠ Tapping a stop that is already closed does nothing. It stays on
                 the run rather than reopening a record that is already written. */
              onClick={() => {
                if (!s.done[x.id]) router.push(`/stop/${x.id}`);
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '12px 12px 12px 14px',
                background: SURF,
                border: `1px solid ${DIV}`,
                borderLeft: `4px solid ${edge}`,
                cursor: s.done[x.id] ? 'default' : 'pointer',
                color: 'inherit',
                fontFamily: 'inherit',
                borderRadius: 0,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span
                  style={{
                    flex: 'none',
                    width: 30,
                    height: 30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    font: '800 14px Archivo, system-ui',
                    background: chipBg,
                    color: chipFg,
                  }}
                >
                  {x.seq}
                </span>
                <span style={{ flex: 1, minWidth: 0, display: 'block' }}>
                  <span
                    style={{
                      display: 'block',
                      font: '600 15px/1.2 Archivo, system-ui',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {x.customer}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 12,
                      opacity: 0.7,
                      marginTop: 3,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {x.address}
                  </span>
                  <span style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                    {tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          border: `1px solid ${DIV}`,
                          font: '600 9px Archivo, system-ui',
                          letterSpacing: '.08em',
                          padding: '3px 7px',
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </span>
                </span>
                <span style={{ flex: 'none', textAlign: 'right' }}>
                  <span style={{ display: 'block', font: '600 12px Archivo, system-ui' }}>{x.window}</span>
                  <span
                    style={{
                      display: 'block',
                      font: '600 9px Archivo, system-ui',
                      letterSpacing: '.1em',
                      textTransform: 'uppercase',
                      marginTop: 5,
                      color: st === 'current' ? ACC : MUT,
                    }}
                  >
                    {statusText}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Small({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ opacity: 0.55, fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ font: '600 13px Archivo, system-ui' }}>{value}</div>
    </div>
  );
}
