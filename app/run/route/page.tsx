'use client';

/* 3 · Route — see the day's shape, accept or reject a better order, launch
 * turn-by-turn.
 *
 * ⚠⚠ The app suggests; the driver confirms. Accepting logs the change against
 * the trip with his name on it. Rejecting is a recorded decision too — TRP-003
 * B11: "a planner rejects a suggestion and the rejection is queryable". Neither
 * is a silent no-op.
 *
 * ⚠ Per-stop turn-by-turn is a hand-off, not a feature: Google Maps opens in a
 * new tab with the destination. This app does not pretend to be a navigator.
 */

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { STOPS, TRIP, stopById } from '@/lib/run';
import { currentOrder, km1, legText, mins, routeFor, suggestion } from '@/lib/derive';
import { useRun, type TrailEntry } from '@/lib/state';
import { ACC, BG, Btn, DIV, INK, gmapsHref } from '@/components/ui';

const RunMap = dynamic(() => import('@/components/RunMap'), {
  ssr: false,
  loading: () => <div style={{ height: '100%', background: '#dddbda' }} />,
});

export default function RouteScreen() {
  const router = useRouter();
  const { s, set } = useRun();
  const list = s.navMode === 'list';
  const sug = suggestion(s.orderAccepted);
  const ids = currentOrder(s.orderAccepted);
  const route = routeFor(ids);

  const record = (entry: TrailEntry) =>
    set((prev) => ({ trail: [entry, ...prev.trail] }));

  const accept = () => {
    if (s.orderAccepted) return;
    set({ orderAccepted: true, orderDecision: 'accepted' });
    const opt = routeFor(TRIP.optimisedOrder)!;
    const disp = routeFor(TRIP.dispatcherOrder)!;
    record({
      ref: `TRIP ${TRIP.id} · order changed`,
      detail:
        `${TRIP.driver.name} confirmed the shorter order — Borrowdale, Avondale and Hatfield before ` +
        `Msasa. ${km1(disp.km - opt.km)} and ${Math.round(disp.min - opt.min)} minutes saved by road. ` +
        `Msasa now runs after its 15:10 window.`,
      dest: 'Queued · trip amendment',
      state: 'Queued',
    });
  };

  const keep = () => {
    /* ⚠ Rejecting is not "do nothing". The planner — or here the driver — usually
       knows something the geometry does not, and the record has to say he chose. */
    if (s.orderDecision === 'kept' && !s.orderAccepted) return;
    set({ orderAccepted: false, orderDecision: 'kept' });
    record({
      ref: `TRIP ${TRIP.id} · order kept`,
      detail: `${TRIP.driver.name} kept the dispatcher's order and declined the shorter one. The time windows are the reason on the screen.`,
      dest: 'Queued · trip amendment',
      state: 'Queued',
    });
  };

  const SuggestionCard = (
    <div style={{ border: `1px solid ${DIV}`, padding: 12 }}>
      <div style={{ font: '800 15px Archivo, system-ui' }}>{sug.head}</div>
      <div className="pretty" style={{ fontSize: 12, lineHeight: 1.45, opacity: 0.75, marginTop: 5 }}>
        {sug.body}
      </div>
      {/* ⚠ The figures above come from OSRM by way of lib/routes-cache.ts. The
          handoff's "11.4 km and about 24 minutes" was a placeholder, and its
          suggested order measured WORSE than the dispatcher's. See lib/derive.ts. */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <Btn kind="primary" height={46} onClick={accept} style={{ flex: 1 }}>
          {s.orderAccepted ? 'Order confirmed' : 'Use this order'}
        </Btn>
        <Btn height={46} onClick={keep} style={{ flex: 1 }}>
          Keep dispatcher&rsquo;s
        </Btn>
      </div>
      {s.orderDecision !== 'none' && (
        <div style={{ fontSize: 11, opacity: 0.6, marginTop: 8 }}>
          {s.orderDecision === 'accepted'
            ? 'Change logged against the trip, with your name on it.'
            : 'Your decision to keep the plan is recorded against the trip.'}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {list && <div style={{ flex: 'none', padding: '12px 18px 0' }}>{SuggestionCard}</div>}

      <div style={{ flex: 1, minHeight: list ? 210 : 360, width: '100%' }}>
        <RunMap
          accepted={s.orderAccepted}
          done={s.done}
          onSelect={(id) => set({ stopId: id })}
        />
      </div>

      <div
        className="scr"
        style={{
          flex: 'none',
          borderTop: `2px solid ${DIV}`,
          background: BG,
          maxHeight: list ? 420 : 330,
          overflowY: 'auto',
        }}
      >
        {!list && (
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${DIV}` }}>{SuggestionCard}</div>
        )}

        {route && (
          <div
            style={{
              padding: '8px 16px',
              borderBottom: `1px solid ${DIV}`,
              fontSize: 11,
              opacity: 0.65,
            }}
          >
            {km1(route.km)} by road · {mins(route.min)} driving, {STOPS.filter((x) => !s.done[x.id]).length} stops
          </div>
        )}

        {ids
          .filter((id) => !s.done[id])
          .map((id, i) => {
            const x = stopById(id);
            const orderIndex = ids.indexOf(id);
            return (
              <div
                key={id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 16px',
                  borderBottom: `1px solid ${DIV}`,
                }}
              >
                <span
                  style={{
                    flex: 'none',
                    width: 26,
                    height: 26,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    font: '800 12px Archivo, system-ui',
                    background: i === 0 ? ACC : INK,
                    color: BG,
                  }}
                >
                  {orderIndex + 1}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      font: '600 13px/1.2 Archivo, system-ui',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {x.customer}
                  </span>
                  {/* ⚠ This line wraps to two on a 393px screen rather than
                      ellipsing, which is the one place the design's "ellipse, do
                      not wrap" rule is broken on purpose: truncating would cut
                      the distance or the minutes, and those are the figures the
                      driver is reading the row for. */}
                  <span
                    style={{ display: 'block', fontSize: 11, lineHeight: 1.35, opacity: 0.65, marginTop: 2 }}
                  >
                    {legText(s.orderAccepted, orderIndex)}
                  </span>
                </span>
                <Btn
                  height={40}
                  fontSize={11}
                  flush={false}
                  href={gmapsHref(x.latlng[0], x.latlng[1])}
                  style={{ flex: 'none' }}
                >
                  Google Maps ↗
                </Btn>
                <Btn
                  kind="primary"
                  height={40}
                  fontSize={11}
                  flush={false}
                  style={{ flex: 'none' }}
                  onClick={() => {
                    set({ stopId: x.id });
                    router.push(`/stop/${x.id}`);
                  }}
                >
                  Open
                </Btn>
              </div>
            );
          })}
      </div>
    </div>
  );
}
