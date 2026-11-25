'use client';

/* The demo framing: a title block, screen jumps, and the phone.
 *
 * ⚠⚠ Slimmed 21 Aug on internal feedback — the demo read as too busy for an
 * executive audience. Removed: the five assumptions (Wyne says them out loud),
 * the two variant switchers, and the live record trail rail.
 *
 * ⚠ Nothing was deleted, only taken off the screen. All of it is still reachable
 * by URL, so the design review after the 26th does not have to rebuild it:
 *
 *     ?layout=checklist | cards | swipe     the stop-detail layout
 *     ?nav=map | list                       the route arrangement
 *     ?trail=1                              the live record trail rail
 *     ?bare=1                               drop the rail, phone only (projector)
 *
 * ⚠⚠ Losing the trail rail costs the demo its most visible argument — that no
 * action is a claim without a record behind it. It is NOT gone from the product:
 * the Recorded screen still shows what each stop wrote and where it went, and
 * the queue chip in the app bar still counts what is waiting. But the room now
 * only sees that when the driver closes a stop. If beat 13 is to land, somebody
 * has to point at the Recorded screen while it is up.
 */

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, type ReactNode } from 'react';
import { CLOCKS, STOPS, TRIP, stopById } from '@/lib/run';
import { queuedCount, useRun, type NavMode, type StopLayout } from '@/lib/state';
import { ACC, AC7, BG, DIV, INK, SURF, TrailRow } from './ui';

const P = { bezelW: 413, bezelH: 872, screenW: 393, screenH: 852 };

type ScreenKey =
  | 'signin' | 'run' | 'route' | 'stop' | 'proof' | 'cash' | 'failed' | 'closed' | 'debrief';

function screenOf(pathname: string): { key: ScreenKey; stopId: number | null } {
  const p = pathname.replace(/\/+$/, '') || '/';
  if (p === '/') return { key: 'signin', stopId: null };
  if (p === '/run') return { key: 'run', stopId: null };
  if (p === '/run/route') return { key: 'route', stopId: null };
  if (p === '/debrief') return { key: 'debrief', stopId: null };
  const m = p.match(/^\/stop\/(\d+)(?:\/(proof|cash|failed|closed))?$/);
  if (m) return { key: (m[2] as ScreenKey) ?? 'stop', stopId: Number(m[1]) };
  return { key: 'run', stopId: null };
}

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ShellInner>{children}</ShellInner>
    </Suspense>
  );
}

function ShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const bare = params.get('bare') === '1';
  const showTrail = params.get('trail') === '1';
  const { s, set, reset, ready } = useRun();

  /* ⚠ The variant switchers left the rail, so the URL is the only way in. Applied
     once the store has loaded, so it wins over whatever localStorage held. */
  const layoutParam = params.get('layout');
  const navParam = params.get('nav');
  useEffect(() => {
    if (!ready) return;
    const patch: { stopLayout?: StopLayout; navMode?: NavMode } = {};
    if (layoutParam === 'checklist' || layoutParam === 'cards' || layoutParam === 'swipe') {
      if (layoutParam !== s.stopLayout) patch.stopLayout = layoutParam;
    }
    if (navParam === 'map' || navParam === 'list') {
      if (navParam !== s.navMode) patch.navMode = navParam;
    }
    if (Object.keys(patch).length) set(patch);
  }, [ready, layoutParam, navParam, s.stopLayout, s.navMode, set]);

  const { key, stopId } = screenOf(pathname);
  const stop = stopById(stopId ?? s.stopId);
  const remaining = STOPS.filter((x) => !s.done[x.id]).length;

  const clock = key === 'signin' ? CLOCKS.signin : key === 'debrief' ? CLOCKS.debrief : CLOCKS.run;

  const TITLES: Record<ScreenKey, [string, string]> = {
    signin: ['', ''],
    run: [TRIP.kicker, "Today's run"],
    route: [`TRIP ${TRIP.id}`, `Route · ${remaining} stops`],
    stop: [`STOP ${stop.seq} OF ${STOPS.length} · ${stop.consignment}`, stop.customer],
    proof: ['PROOF OF DELIVERY', stop.customer],
    cash: ['MONEY AT THE DOOR', stop.cash ? stop.cash.amount : 'Nothing to collect'],
    failed: [`STOP ${stop.seq} · NOT DELIVERED`, 'Name the reason'],
    closed: [`STOP ${stop.seq} CLOSED`, 'Recorded'],
    debrief: [`BACK AT ${TRIP.depot.code} · ${CLOCKS.debrief}`, 'Debrief'],
  };

  const BACK: Record<ScreenKey, string> = {
    signin: '/',
    run: '/',
    route: '/run',
    stop: '/run',
    proof: `/stop/${stop.id}`,
    cash: `/stop/${stop.id}/proof`,
    failed: `/stop/${stop.id}`,
    closed: '/run',
    debrief: '/run',
  };

  const [kicker, title] = TITLES[key];
  const chromeOn = key !== 'signin';
  const go = (href: string) => router.push(href);

  const phone = (
    <div
      style={{
        flex: 'none',
        width: P.bezelW,
        height: P.bezelH,
        background: '#141312',
        padding: 10,
        borderRadius: 44, // ⚠ hardware, not UI. Every other radius in this app is 0.
        boxShadow: '0 24px 60px rgba(32,30,29,.34)',
      }}
    >
      <div
        /* ⚠ Marks the boundary of the phone, so scripts/verify.mjs can assert
           copy rules inside it without catching the rail's own text. */
        data-phone="screen"
        style={{
          position: 'relative',
          width: P.screenW,
          height: P.screenH,
          background: BG,
          borderRadius: 34,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          color: INK,
        }}
      >
        {/* Status bar */}
        <div
          style={{
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 38,
            padding: '0 22px',
            font: '600 12px Archivo, system-ui',
            letterSpacing: '.02em',
          }}
        >
          <span>{clock}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 9, letterSpacing: '.08em' }}>no signal</span>
            <span
              style={{
                display: 'block',
                width: 20,
                height: 10,
                border: `1.5px solid ${INK}`,
                position: 'relative',
              }}
            >
              <span
                style={{ position: 'absolute', left: 1, top: 1, bottom: 1, width: 11, background: INK, display: 'block' }}
              />
            </span>
          </span>
        </div>

        {/* App bar */}
        {chromeOn && (
          <div style={{ flex: 'none', padding: '6px 18px 12px', borderBottom: `2px solid ${DIV}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                aria-label="Back"
                onClick={() => go(BACK[key])}
                className="tap8"
                style={{
                  width: 32,
                  height: 32,
                  flex: 'none',
                  border: `1px solid ${DIV}`,
                  background: 'transparent',
                  cursor: 'pointer',
                  font: '600 15px Archivo, system-ui',
                  color: 'inherit',
                  borderRadius: 0,
                }}
              >
                ←
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    font: '600 9px/1 Archivo, system-ui',
                    letterSpacing: '.14em',
                    textTransform: 'uppercase',
                    color: ACC,
                  }}
                >
                  {kicker}
                </div>
                <div
                  style={{
                    font: '800 19px/1.15 Archivo, system-ui',
                    letterSpacing: '-.01em',
                    marginTop: 4,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {title}
                </div>
              </div>
              {/* ⚠⚠ With the trail rail gone, this chip is the only thing on screen
                  saying anything is still waiting to leave the device. It carries
                  more weight than it used to. */}
              <div
                style={{
                  flex: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 8px',
                  border: `1px solid ${DIV}`,
                }}
                title="Records waiting to leave this device"
              >
                <span style={{ width: 7, height: 7, background: ACC, display: 'block' }} />
                <span style={{ font: '600 10px/1 Archivo, system-ui', letterSpacing: '.06em' }}>
                  {queuedCount(s)} queued
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="scr" style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
          {ready ? children : null}
        </div>

        {/* Gesture bar */}
        <div
          style={{
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 26,
            borderTop: `1px solid ${DIV}`,
          }}
        >
          <span style={{ display: 'block', width: 118, height: 4, background: INK, opacity: 0.55 }} />
        </div>
      </div>
    </div>
  );

  /* ⚠⚠ Gain re-seed, 25 Nov 2026. Every identity in this build is illustrative
     (../GAIN-RESEED.md), and the room must be able to see that without anyone
     saying it — so the tag sits outside the phone, on every route, in bare mode
     too. It is deliberately NOT inside [data-phone="screen"]: it is a fact about
     the demo, not something the driver's app would ever print. */
  const illustrative = (
    <div
      data-illustrative="1"
      style={{
        position: 'fixed',
        top: 12,
        right: 16,
        zIndex: 50,
        padding: '6px 10px',
        border: `2px solid ${ACC}`,
        background: 'var(--color-bg, #fff)',
        font: '700 11px/1 Archivo, system-ui',
        letterSpacing: '.12em',
        textTransform: 'uppercase',
        color: ACC,
      }}
    >
      Illustrative data — not Gain's records
    </div>
  );

  if (bare) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: 'var(--font-body)',
        }}
      >
        {phone}
        {illustrative}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: 48,
        padding: '48px 56px',
        fontFamily: 'var(--font-body)',
        color: INK,
      }}
    >
      <Rail />
      {phone}
      {showTrail && <TrailRail />}
      {illustrative}
    </div>
  );

  /* ── The rail: a title block and the screen jumps. Nothing else. ──────── */
  function Rail() {
    const jumps: [string, string][] = [
      ['Sign in', '/'],
      ["Today's run", '/run'],
      ['Route', '/run/route'],
      ['Stop', `/stop/${s.stopId}`],
      ['Proof', `/stop/${s.stopId}/proof`],
      ['Cash', `/stop/${s.stopId}/cash`],
      ['Failed stop', `/stop/${s.stopId}/failed`],
      ['Debrief', '/debrief'],
    ];

    return (
      <div style={{ width: 320, flex: 'none', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              font: '600 10px/1 Archivo, system-ui',
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: ACC,
            }}
          >
            Gain Logistics · Demo · Driver app
          </div>
          <h1 style={{ font: '800 40px/1.02 Archivo, system-ui', letterSpacing: '-.02em', margin: 0 }}>
            Vantage Driver
          </h1>
          <p
            className="pretty"
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.5,
              color: 'color-mix(in srgb, var(--color-text) 72%, transparent)',
            }}
          >
            One run, one truck, one driver — assigned stops, an optimised multi-stop route, proof at
            the door, and money that never lies about where it is.
          </p>
        </div>
        <div style={{ height: 2, background: DIV }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div
            style={{
              font: '600 10px/1 Archivo, system-ui',
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: 'color-mix(in srgb, var(--color-text) 55%, transparent)',
            }}
          >
            Jump to a screen
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {jumps.map(([label, href]) => (
              <button
                key={href + label}
                type="button"
                onClick={() => go(href)}
                className="tap8"
                style={{
                  minHeight: 36,
                  padding: '0 12px',
                  border: `1px solid ${DIV}`,
                  background: 'transparent',
                  font: '600 13px Archivo, system-ui',
                  cursor: 'pointer',
                  color: 'inherit',
                  borderRadius: 0,
                }}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                reset();
                go('/');
              }}
              style={{
                minHeight: 36,
                padding: '0 8px',
                border: 0,
                background: 'transparent',
                font: '600 13px Archivo, system-ui',
                cursor: 'pointer',
                color: AC7,
              }}
            >
              Reset run
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ⚠ Off by default since 21 Aug; `?trail=1` brings it back for a design review
     or a rehearsal where the room needs to see the outbox filling up. */
  function TrailRail() {
    return (
      <div style={{ width: 330, flex: 'none', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div
            style={{
              font: '600 10px Archivo, system-ui',
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: ACC,
            }}
          >
            Live record trail
          </div>
          <h2 style={{ font: '800 24px/1.05 Archivo, system-ui', letterSpacing: '-.02em', margin: '8px 0 0' }}>
            Everything the driver does, and where it went
          </h2>
        </div>
        <div style={{ height: 2, background: DIV }} />
        <div style={{ display: 'flex', flexDirection: 'column', borderTop: `1px solid ${DIV}` }}>
          {s.trail.map((t, i) => (
            <TrailRow key={t.ref + i} entry={t} showDest={false} />
          ))}
        </div>
        <div style={{ padding: 12, background: SURF, fontSize: 12, lineHeight: 1.5 }} className="pretty">
          <strong style={{ fontFamily: 'Archivo, system-ui' }}>Not designed here.</strong> The dispatch
          serial scan, the load-and-seal flow and the receipt scan at a far-end branch live upstream of
          this run — the app reads their result at the door.
        </div>
      </div>
    );
  }
}
