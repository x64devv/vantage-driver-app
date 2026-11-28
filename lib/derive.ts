/* Everything the screens print that is a number, derived in one place.
 *
 * ⚠⚠ THE RULE: never quote a figure you cannot stand behind. Every kilometre and
 * every minute below is arithmetic over lib/routes-cache.ts, which holds what
 * OSRM actually returned. Nothing here rounds a number to a friendlier one and
 * nothing invents a saving. If a figure appears on a screen and does not come
 * through this file, it is a defect.
 *
 * The whole of COPY-RULES.md is this rule made into sentences.
 */

import { CACHED_ROUTES, DEPOSIT_LEGS, RAN_ROUTE, type CachedRoute } from './routes-cache';
import { DEPOSIT_BRANCHES, STOPS, TRIP, stopById, type DepositCode } from './run';

export const orderKey = (ids: number[]) => ids.join('>');

export const routeFor = (ids: number[]): CachedRoute | undefined => CACHED_ROUTES[orderKey(ids)];

export const ranRoute = RAN_ROUTE;

/** 15.267 → "15.3 km". One decimal, because that is the precision OSRM's answer
 *  deserves at city scale — not because it looks tidier. */
export const km1 = (km: number) => `${km.toFixed(1)} km`;
/** 57.045 → "57 km". Whole kilometres where the sentence is about the shape of a
 *  day rather than a leg. */
export const km0 = (km: number) => `${Math.round(km)} km`;
export const mins = (min: number) => `${Math.round(min)} min`;

export const dispatcherRoute = () => routeFor(TRIP.dispatcherOrder)!;
export const optimisedRoute = () => routeFor(TRIP.optimisedOrder)!;

export type Saving = { km: number; min: number };

/** What the optimised order actually saves against the plan that came down with
 *  the run. Both figures are OSRM's, differenced — nothing else. */
export function saving(): Saving {
  const a = dispatcherRoute();
  const b = optimisedRoute();
  return { km: a.km - b.km, min: a.min - b.min };
}

export const currentOrder = (accepted: boolean) =>
  accepted ? TRIP.optimisedOrder : TRIP.dispatcherOrder;

/** Road kilometres still to drive on the order in force. */
export function kmLeft(accepted: boolean) {
  const r = routeFor(currentOrder(accepted));
  return r ? km0(r.km) : '—';
}

/* ── The suggestion card ──────────────────────────────────────────────────
   ⚠⚠ The handoff's sentence read: "Taking Avondale before Borrowdale saves 11.4
   km and about 24 minutes. Time windows still hold." Measured against real
   roads on 20 Aug 2026, BOTH halves were false.

   The saving: the handoff's own order (Greendale > Msasa > Avondale > Borrowdale
   > Hatfield) is 58.43 km / 80.2 min against the dispatcher's 57.05 / 78.0. It
   is 1.4 km and 2.2 minutes WORSE. Shipping "saves 11.4 km" would have put a
   backwards claim on a boardroom screen.

   The windows: the five remaining stops carry windows 13:45 / 15:10 / 16:00 /
   16:45 / 17:30 — in dispatcher order. The dispatcher's order IS the window
   order, so EVERY reorder breaks one. "Time windows still hold" cannot be true
   of any suggestion at all.

   So the card now suggests OSRM's real answer and names what it costs. That is
   the better screen anyway: the app suggests, says the price, and the driver
   decides. Wyne's call, 20 Aug. */
export function suggestion(accepted: boolean) {
  const s = saving();
  if (accepted) {
    return {
      head: 'Running your confirmed order',
      body:
        `Borrowdale, Avondale and Hatfield before Msasa. ${km1(s.km)} and ${Math.round(s.min)} minutes ` +
        `saved against the plan — the change is logged against the trip with your name on it. ` +
        `Msasa is now last, after its 15:10 window.`,
    };
  }
  return {
    head: 'A shorter order exists',
    body:
      `Taking Borrowdale, Avondale and Hatfield before Msasa saves ${km1(s.km)} and about ` +
      `${Math.round(s.min)} minutes. Msasa moves from its 15:10 window to last — that is the cost. ` +
      `Nothing changes until you say so.`,
  };
}

/** The stop-sheet row line: "Greendale · 13:45 · 1.7 km, 2 min".
 *  Leg i of a cached route is the drive INTO the i-th stop of that order. */
export function legText(accepted: boolean, index: number) {
  const ids = currentOrder(accepted);
  const stop = stopById(ids[index]);
  const r = routeFor(ids);
  const leg = r?.legs[index];
  if (!leg) {
    // ⚠ No road answer means no road figure. The row says so rather than
    //   substituting a straight line — see the console's TripMap, same rule.
    return `${stop.area} · ${stop.window} · distance not routed`;
  }
  return `${stop.area} · ${stop.window} · ${km1(leg.km)}, ${mins(leg.min)}`;
}

/** Coordinates for the polyline through the order in force, driver position first. */
export function orderedPoints(accepted: boolean): [number, number][] {
  return [TRIP.startPosition, ...currentOrder(accepted).map((id) => stopById(id).latlng)];
}

/* ── Deposit branches ─────────────────────────────────────────────────────
   ⚠ The distance is from the stop the run actually finishes on, which changes
   when the driver confirms the optimised order (Hatfield → Msasa). The NEAREST
   tag goes to whichever branch OSRM says is nearest, not to whichever one the
   design happened to put first.

   ⚠⚠ Avondale IS the nearest, both ways round — 11.5 km from Hatfield, 14.6 km
   from Msasa, against Borrowdale's 19.6 and 19.1. The handoff put "NEAREST" on
   Borrowdale and gave it 2.1 km, which is not a distance between any two points
   on this run. Borrowdale keeps its place as the demo's chosen deposit because
   the driver was standing inside it at 16:00 — it is stop 6 — and because the
   console's TM-4 records the deposit there. The teaching point survives intact
   and is arguably stronger: the money went where the driver went, which is
   neither the nearest branch nor the one that raised the invoice. */
export function depositRows(accepted: boolean) {
  const ids = currentOrder(accepted);
  const last = ids[ids.length - 1];
  return DEPOSIT_BRANCHES.map((b) => {
    const leg = DEPOSIT_LEGS[`${last}>${b.code}`];
    const note = leg ? `${km1(leg.km)} from your last stop` : b.note;
    return { ...b, note: b.code === 'BR' ? `${b.note} · ${leg ? km1(leg.km) : '—'}` : note };
  });
}

/** ⚠ The note under the branch rows. The handoff's sentence is kept verbatim for
 *  every branch that is not the selling one, because it is the point of the
 *  screen. Picking VE would make that sentence false, so VE gets an honest
 *  variant rather than a sentence that contradicts the row above it. */
export function depositNote(code: DepositCode) {
  const b = DEPOSIT_BRANCHES.find((x) => x.code === code)!;
  const name = b.label.split(' · ')[1];
  if (code === 'VE') {
    return (
      'Willowvale raised this invoice and is where you debrief — today the two coincide. ' +
      'The deposit is still recorded against where the money actually went, so reconciliation is a ' +
      'query and not a spreadsheet.'
    );
  }
  return (
    `${name} is not the branch that raised the invoice — and that is the point. The deposit is ` +
    'recorded against where the money actually went, so reconciliation is a query and not a spreadsheet.'
  );
}

export const remainingStops = (done: Record<number, string>) =>
  STOPS.filter((s) => !done[s.id]);
