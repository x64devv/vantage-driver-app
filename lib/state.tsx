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
  CAPTURED, CHECKS, RECEIPT_NO, SEEDED_TRAIL, STOPS, TRIP,
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
export type CashPick = 'full' | 'part' | 'none';
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
  cashPick: CashPick | null;
  /** ⚠⚠ Typed by the driver on the part-payment keypad. The app never invents an
   *  amount, and it never derives a balance from it. */
  partAmount: string;
  failReason: ReasonCode | null;
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
  cashPick: null,
  partAmount: '',
  failReason: null,
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
  completeStop: () => void;
  failStop: () => void;
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
  const completeStop = () => {
    const stop = stopById(s.stopId);
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

    if (s.cashPick === 'full' || s.cashPick === 'part') {
      const amount =
        s.cashPick === 'full'
          ? stop.cash!.amount
          : `${stop.cash!.currency} ${s.partAmount} of ${stop.cash!.amount}`;
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
  const failStop = () => {
    const stop = stopById(s.stopId);
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
export const canCompleteCash = (s: RunState) =>
  s.cashPick === 'full' || (s.cashPick === 'part' && /^[0-9]+(\.[0-9]{1,2})?$/.test(s.partAmount) && Number(s.partAmount) > 0);

export const queuedCount = (s: RunState) => s.trail.filter((t) => t.state !== 'Bound').length;

export const stopStatus = (s: RunState, id: number): 'delivered' | 'failed' | 'current' | 'pending' => {
  const d = s.done[id];
  if (d) return d;
  const order = s.orderAccepted ? TRIP.optimisedOrder : TRIP.dispatcherOrder;
  return order.find((x) => !s.done[x]) === id ? 'current' : 'pending';
};

export const allStops = STOPS;
