'use client';

/* The demo framing: left rail, the phone, right rail.
 *
 * ⚠ The rails are NOT part of the phone and are labelled as such. They exist so
 * a room can see the record trail while the driver's screen stays a driver's
 * screen. `?bare=1` drops both so the phone can go full-screen on a projector.
 */

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';
import { CLOCKS, STOPS, TRIP, stopById } from '@/lib/run';
import { queuedCount, useRun } from '@/lib/state';
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
  const { s, set, reset, ready } = useRun();

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
        /* ⚠ Marks the boundary of the phone. The rails quote sentences the app
           must NEVER say (assumption 04 quotes "payment received"), so a
           copy-rule check that reads the whole page will find them there and be
           wrong. scripts/verify.mjs asserts inside this element only. */
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
            {/* ⚠ "no signal" is a fact about the device, stated once. The queue
                chip below is the only other offline indicator — no banner. */}
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
              {/* Queue chip — the only offline indicator on the screen. */}
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
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 40,
        padding: '48px 56px',
        fontFamily: 'var(--font-body)',
        color: INK,
      }}
    >
      <LeftRail go={go} />
      {phone}
      <RightRail />
    </div>
  );

  function LeftRail({ go }: { go: (href: string) => void }) {
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

    const layoutNote =
      s.stopLayout === 'checklist'
        ? 'everything visible at once, fastest for a driver who knows the drill.'
        : s.stopLayout === 'cards'
          ? 'each check gets weight and a status of its own — good for training.'
          : 'one question filling the screen, hardest to answer without reading.';
    const navNote =
      s.navMode === 'map'
        ? 'the shape of the day, with the stop list underneath.'
        : 'the optimised order up top; the map confirms it.';

    return (
      <div style={{ width: 360, flex: 'none', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              font: '600 10px/1 Archivo, system-ui',
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: ACC,
            }}
          >
            TVSH Transport · Phase 0 · Driver app
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <RailLabel>What this design assumes</RailLabel>
          <div style={{ display: 'grid', gap: 10, fontSize: 13, lineHeight: 1.45 }}>
            {ASSUMPTIONS.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 10 }}>
                <span style={{ color: ACC, fontWeight: 600 }}>{String(i + 1).padStart(2, '0')}</span>
                <span className="pretty">{a}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: 2, background: DIV }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <RailLabel>Stop-detail layout</RailLabel>
          <Seg
            options={[
              ['checklist', 'Checklist'],
              ['cards', 'Cards'],
              ['swipe', 'One at a time'],
            ]}
            value={s.stopLayout}
            onPick={(v) => set({ stopLayout: v as typeof s.stopLayout, swipeIdx: 0 })}
          />
          <RailNote>
            Now: <strong>{s.stopLayout === 'checklist' ? 'Checklist' : s.stopLayout === 'cards' ? 'Cards' : 'One at a time'}</strong> — {layoutNote}
          </RailNote>

          <RailLabel style={{ marginTop: 6 }}>Navigation</RailLabel>
          <Seg
            options={[
              ['map', 'Map first'],
              ['list', 'Order first'],
            ]}
            value={s.navMode}
            onPick={(v) => set({ navMode: v as typeof s.navMode })}
          />
          <RailNote>
            Now: <strong>{s.navMode === 'map' ? 'Map first' : 'Order first'}</strong> — {navNote}
          </RailNote>
        </div>
        <div style={{ height: 2, background: DIV }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <RailLabel>Jump to a screen</RailLabel>
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
          <RailNote>
            The rails are not part of the phone. <strong>?bare=1</strong> drops both so the screen can
            go full width on a projector.
          </RailNote>
        </div>
      </div>
    );
  }

  function RightRail() {
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
          <p
            className="pretty"
            style={{
              margin: '8px 0 0',
              fontSize: 13,
              lineHeight: 1.5,
              color: 'color-mix(in srgb, var(--color-text) 70%, transparent)',
            }}
          >
            This panel is not part of the phone. It is here so the room can see that no action is a
            claim without a record behind it.
          </p>
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
        <div
          className="pretty"
          style={{ padding: 12, borderLeft: `4px solid ${ACC}`, background: BG, fontSize: 12, lineHeight: 1.5 }}
        >
          <strong style={{ fontFamily: 'Archivo, system-ui' }}>Next, if you want it:</strong> the
          dispatch scan with the mismatch block, a driver-side exceptions queue, and the same three
          screens in Shona.
        </div>
      </div>
    );
  }
}

const ASSUMPTIONS: ReactNode[] = [
  <>
    The device is a company terminal (T9, <strong>D204</strong>) — it mints its own receipt numbers
    offline, so nothing waits on signal.
  </>,
  <>
    Serials were bound by the <strong>dispatch scan</strong> at the warehouse. The driver at the door
    reads them; he does not choose them.
  </>,
  <>
    The functional test happens <strong>before</strong> a signature is asked for, and the line set
    locks at the signature.
  </>,
  <>
    Money says <em>“recorded on this device, not yet in the ledger”</em> — never “payment received”,
    and never a balance.
  </>,
  <>
    Arrival is a <strong>geofence</strong> fact where we have one, a button press where we don&rsquo;t
    — and the app says which.
  </>,
];

function RailLabel({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
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

function RailNote({ children }: { children: ReactNode }) {
  return (
    <div
      className="pretty"
      style={{
        fontSize: 12,
        lineHeight: 1.45,
        color: 'color-mix(in srgb, var(--color-text) 65%, transparent)',
      }}
    >
      {children}
    </div>
  );
}

function Seg({
  options,
  value,
  onPick,
}: {
  options: [string, string][];
  value: string;
  onPick: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', border: `1px solid ${DIV}` }}>
      {options.map(([v, label], i) => (
        <button
          key={v}
          type="button"
          onClick={() => onPick(v)}
          className={value === v ? undefined : 'tap8'}
          style={{
            flex: 1,
            minHeight: 44,
            padding: '0 10px',
            border: 0,
            borderLeft: i ? `1px solid ${DIV}` : undefined,
            background: value === v ? ACC : 'transparent',
            color: value === v ? BG : 'inherit',
            font: '600 12px Archivo, system-ui',
            textAlign: 'left',
            cursor: 'pointer',
            borderRadius: 0,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
