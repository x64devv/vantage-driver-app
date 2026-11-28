'use client';

/* The run, held on the device.
 *
 * No backend, no auth, no database — everything is client state persisted to
 * localStorage, which is also the honest shape of the real thing: the driver app
 * works with no signal for a whole day and reconciles later.
 *
 * ⚠ A hard reload must not lose the run. Someone will refresh the browser
 * mid-demo, or the projector will renegotiate and Chrome will reload the tab.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  CAPTURED, CHECKS, RECEIPT_NO, SEEDED_TRAIL, STOPS, TRIP, VEHICLE,
  stopById, type CheckId, type DepositCode, type ReasonCode, REASONS,
} from './run';

export type TrailState = 'Queued' | 'Held' | 'Bound';

export type TrailEntry = {
  ref: string;
  /** what was captured, in plain words */
  detail: string;
  /** ⚠ where it is going. COPY-RULES: a queued record always says where. */
  dest: string;
  state: TrailState;
};

export type StopLayout = 'checklist' | 'cards' | 'swipe';
export type NavMode = 'map' | 'list';
/* ⚠⚠ The three cash choice rows went on 21 Aug — the driver now types what he
   counted and the app reads the outcome off the figure. But ZERO IS STILL AN
   OUTCOME, NOT A NUMBER: nothing collected is a refusal with a fault on it and
   the goods come back, never a delivered stop that happened to earn nothing.
   COPY-RULES: never collapse two different sentences into one. */
export type CashOutcome = 'none' | 'part' | 'full' | 'over';
export type Outcome = 'delivered' | 'failed';

export type RunState = {
  signedIn: boolean;
  stopId: number;
  orderAccepted: boolean;
  /** ⚠ TRP-003 B11: a rejection is a recorded decision too, not a no-op. */
  orderDecision: 'none' | 'accepted' | 'kept';
  checks: Partial<Record<CheckId, 'yes' | 'no'>>;
  funcTest: 'pass' | 'fail' | null;
  swipeIdx: number;
  photos: { goods: boolean; id: boolean; refusal: boolean };
  sigInk: boolean;
  signer: string;
  idNo: string;
  /** ⚠⚠ What the driver counted at the door, exactly as he typed it. The app
   *  never invents an amount and never derives a balance from it — it only
   *  compares it to the figure that came down with the run, which is on the
   *  screen above it and labelled as what it is. */
  collected: string;
  failReason: ReasonCode | null;
  /* ⚠ Fuel and mileage, added 21 Aug. All three are TYPED BY THE DRIVER and held
     as the strings he typed — never parsed into a number and re-formatted, so
     what the trail records is what he entered. Blank means blank: the debrief
     says it cannot show a distance rather than inventing one. */
  odoOut: string;
  odoIn: string;
  litres: string;
  fuelCost: string;
  deposit: DepositCode;
  signedOff: boolean;
  done: Partial<Record<number, Outcome>>;
  trail: TrailEntry[];
  stopTrail: TrailEntry[];
  lastOutcome: Outcome | null;
  stopLayout: StopLayout;
  navMode: NavMode;
};

export const initialState = (): RunState => ({
  signedIn: false,
  stopId: 4,
  orderAccepted: false,
  orderDecision: 'none',
  checks: {},
  funcTest: null,
  swipeIdx: 0,
  photos: { goods: false, id: false, refusal: false },
  sigInk: false,
  signer: 'L. Mavuto',
  idNo: '63-1188774-B-42',
  collected: '',
  failReason: null,
  odoOut: '',
  odoIn: '',
  litres: '',
  fuelCost: '',
  deposit: 'BR',
  signedOff: false,
  /* Stops 1–3 were delivered this morning; the run starts mid-day at stop 4. */
  done: { 1: 'delivered', 2: 'delivered', 3: 'delivered' },
  /* ⚠ Two entries are seeded so the run starts with a queue that is already
     non-empty — an empty outbox on a device that has been offline since 06:41
     would be the lie. */
  trail: [...SEEDED_TRAIL],
  stopTrail: [],
  lastOutcome: null,
  stopLayout: 'checklist',
  navMode: 'map',
});

const KEY = 'vantage-driver-run-v1';

type Ctx = {
  s: RunState;
  set: (patch: Partial<RunState> | ((s: RunState) => Partial<RunState>)) => void;
  reset: () => void;
  /** ⚠ Pass the stop on screen. Without it these fall back to the last stop
   *  opened, which is how a stop reached by URL used to overwrite another. */
  completeStop: (stopId?: number) => void;
  failStop: (stopId?: number) => void;
  nextStop: () => number | null;
  ready: boolean;
};

const RunCtx = createContext<Ctx | null>(null);

export function RunProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<RunState>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setS({ ...initialState(), ...(JSON.parse(raw) as RunState) });
    } catch {
      /* A corrupt or unavailable store is not an error worth showing a driver;
         the run simply starts from the top. */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* Private mode, quota, or a locked-down kiosk. The demo still runs; it
         just will not survive a reload. Nothing on screen claims otherwise. */
    }
  }, [s, ready]);

  const set: Ctx['set'] = (patch) =>
    setS((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));

  const reset = () => {
    setS(initialState());
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* nothing to clear */
    }
  };

  /* ── What a delivered stop writes ─────────────────────────────────────
     ⚠ In this order, and every row says where it is going:
       POD-…            Queued   the outcome and the signature
       PAY-…            Queued   only if money was actually taken
       SERIAL #G-…      Bound    the consignment line, and the HTB contract line
       PROOF-MEDIA ×3   Held     photographs go out on wifi only

     ⚠⚠ The SERIAL row is the strongest argument in the whole specification.
     `Vantage HTB Contract Line."Serial No."` is declared in the codebase and has
     never been populated — VantageContractBuilder.AddLine has no caller — which
     means TVSH cannot today tell which physical fridge is on which hire-to-buy
     contract, and repossession is impossible. The dispatch scan is what makes it
     possible and this row is where it shows.

     ⚠ Stop 4 is a CASH sale, so it has no HTB contract line. The row says that
     out loud rather than going quiet: the field exists, it is populated when
     there is a contract, and this sale has none. Faking stop 4 as hire-to-buy to
     make the row appear would contradict the console's record and the invoice. */
  const completeStop = (stopId?: number) => {
    const stop = stopById(stopId ?? s.stopId);
    const serialLine = stop.lines.find((l) => l.serial?.startsWith('#G'));
    const photoCount = 2 + 1; // two photographs and the signature bitmap

    const entries: TrailEntry[] = [];

    entries.push({
      ref: `POD-${String(188402 + stop.id).padStart(9, '0')}`,
      detail:
        `Stop ${stop.seq} · ${stop.customer} · signed by ${s.signer} (${s.idNo}) at ${CAPTURED.signature} · ` +
        `arrival ${stop.arrival?.source === 'Geofence' ? 'by geofence' : 'by your button'} · ` +
        `functional test ${s.funcTest === 'pass' ? 'passed' : 'failed and recorded'}`,
      dest: 'Queued · outcome drain',
      state: 'Queued',
    });

    const outcome = stop.cash ? cashOutcome(s, stop.cash.amount) : null;
    if (outcome === 'full' || outcome === 'part' || outcome === 'over') {
      const amount =
        outcome === 'full'
          ? stop.cash!.amount
          : `${stop.cash!.currency} ${s.collected} of ${stop.cash!.amount}`;
      entries.push({
        ref: RECEIPT_NO,
        /* ⚠⚠ COPY-RULES: never "payment received", never "paid", never "posted",
           and never a balance. "Taken" is what happened; the ledger has not seen
           it. The part-payment figure is the one the driver typed, and no
           remainder is computed from it. */
        detail: `${amount} taken at ${CAPTURED.cash}, offline. Recorded on this device, not yet in the ledger. No balance quoted.`,
        dest: 'Queued · /api/credit/payments',
        state: 'Queued',
      });
    }

    if (serialLine) {
      entries.push({
        ref: `SERIAL ${serialLine.serial}`,
        detail: `Confirmed at handover against the dispatch binding on ${stop.consignment} line 1 · scanned, not typed`,
        dest: stop.htb
          ? 'Consignment line + HTB contract line'
          : 'Consignment line · this sale is not on hire-to-buy',
        state: 'Bound',
      });
    }

    entries.push({
      ref: `PROOF-MEDIA ×${photoCount}`,
      detail: 'Goods in place, receiver ID, signature bitmap · 2.9 MB',
      dest: 'Held for wifi',
      state: 'Held',
    });

    set((prev) => ({
      stopTrail: entries,
      trail: [...entries, ...prev.trail],
      done: { ...prev.done, [stop.id]: 'delivered' as Outcome },
      lastOutcome: 'delivered',
    }));
  };

  /* ⚠ A "no" is not an error. It is an outcome with a fault attached and a name
     on it, and the goods come back with the driver. */
  const failStop = (stopId?: number) => {
    /* ⚠⚠ The stop ON SCREEN, not the last one opened. Found on the 25 Nov
       cross-app walk: /stop/5/failed reached by URL after closing stop 4
       recorded the failure against stop 4 and overwrote its delivery. */
    const stop = stopById(stopId ?? s.stopId);
    const reason = REASONS.find((r) => r.code === s.failReason);
    if (!reason) return;
    const entry: TrailEntry = {
      ref: `EX-0000291${stop.id}${stop.seq}`,
      detail:
        `Stop ${stop.seq} · ${stop.customer} · ${reason.label} · fault ${reason.fault} · ` +
        `goods returned to ${TRIP.depot.code} in the transit bin` +
        (s.photos.refusal ? ' · door photographed, held for wifi' : ''),
      dest: 'Queued · exceptions queue, ageing',
      state: 'Queued',
    };
    set((prev) => ({
      stopTrail: [entry],
      trail: [entry, ...prev.trail],
      done: { ...prev.done, [stop.id]: 'failed' as Outcome },
      lastOutcome: 'failed',
    }));
  };

  /** The next stop on the order in force, or null when the run is done. */
  const nextStop = () => {
    const order = s.orderAccepted ? TRIP.optimisedOrder : TRIP.dispatcherOrder;
    const next = order.find((id) => !s.done[id]);
    return next ?? null;
  };

  return (
    <RunCtx.Provider value={{ s, set, reset, completeStop, failStop, nextStop, ready }}>
      {children}
    </RunCtx.Provider>
  );
}

export function useRun() {
  const c = useContext(RunCtx);
  if (!c) throw new Error('useRun outside RunProvider');
  return c;
}

/* ── The three gates, all load-bearing ────────────────────────────────────
   ⚠ Disabled means opacity .45 AND a label naming what is missing. The design
   never shows a dead control without saying what would un-deaden it. */

export const answeredCount = (s: RunState) => CHECKS.filter((c) => s.checks[c.id]).length;
export const failedChecks = (s: RunState) => CHECKS.filter((c) => s.checks[c.id] === 'no');
export const checksAllYes = (s: RunState) =>
  answeredCount(s) === CHECKS.length && failedChecks(s).length === 0;

/** Stop → Proof: all four checks yes, and the functional test answered. */
export const canTakeProof = (s: RunState) => checksAllYes(s) && s.funcTest !== null;

/** Proof → complete: both photographs and ink on the canvas. */
export const canConfirmProof = (s: RunState) => s.photos.goods && s.photos.id && s.sigInk;

/** Cash → complete: an explicit answer about the money, and — when part of it
 *  was taken — the amount the driver actually counted. */
/* ── The money at the door, read off one typed figure ────────────────────
   ⚠ `due` is the figure that came down with the run — already on the screen and
   already labelled as not a balance. Comparing against it is not quoting one. */
export const money = (v: string): number | null =>
  /^\d{1,7}(\.\d{1,2})?$/.test(v.trim()) ? Number(v.trim()) : null;

/** "USD 1 150.00" → 1150. Handles the thin spaces the design uses as separators. */
export const dueAmount = (amount: string): number | null => {
  const n = Number(amount.replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
};

export function cashOutcome(s: RunState, amount: string): CashOutcome | null {
  const got = money(s.collected);
  if (got === null) return null;
  if (got === 0) return 'none';
  const due = dueAmount(amount);
  if (due === null) return 'part';
  if (got === due) return 'full';
  return got > due ? 'over' : 'part';
}

/** Cash → complete needs a figure, and that figure must not be zero — zero goes
 *  down the exception path instead, because the goods come back. */
export const canCompleteCash = (s: RunState, amount: string) => {
  const o = cashOutcome(s, amount);
  return o === 'full' || o === 'part' || o === 'over';
};

export const queuedCount = (s: RunState) => s.trail.filter((t) => t.state !== 'Bound').length;

export const stopStatus = (s: RunState, id: number): 'delivered' | 'failed' | 'current' | 'pending' => {
  const d = s.done[id];
  if (d) return d;
  const order = s.orderAccepted ? TRIP.optimisedOrder : TRIP.dispatcherOrder;
  return order.find((x) => !s.done[x]) === id ? 'current' : 'pending';
};

export const allStops = STOPS;

/* ── Fuel and mileage ────────────────────────────────────────────────────
   ⚠ Distance is the difference between two readings the driver typed, and
   nothing else. If either is missing there is no distance — the screen says so
   rather than falling back to the routed estimate, which measures a different
   thing (the plan, not the wheels). */
const num = (v: string) => (/^\d{1,7}(\.\d{1,2})?$/.test(v.trim()) ? Number(v.trim()) : null);

export const odoDistance = (s: RunState): number | null => {
  const a = num(s.odoOut);
  const b = num(s.odoIn);
  if (a === null || b === null || b < a) return null;
  return b - a;
};

export const litresDrawn = (s: RunState) => num(s.litres);

/** ⚠⚠ Deliberately absent: a km/l for this run. Litres drawn is a tank fill, not
 *  fuel burned. 62.4 L over 106 km would print 1.7 km/l against a 6.64 standard
 *  and read as a disaster that did not happen. Efficiency needs two consecutive
 *  fills; the app captures the pair and refuses to divide half of it. */
export const VEHICLE_REG = VEHICLE.reg;
