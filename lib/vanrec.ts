/* Van stock reconciliation — what went onto the truck, and where every unit of
 * it is now. Gain re-seed, Phase 2 (2.6); URD 10.11 "end-of-trip reconciliation"
 * and "stock returns from van to branch".
 *
 * ⚠⚠ DERIVED, NEVER TYPED. Every figure here comes from two places: the lines on
 * LD-000377 in lib/run.ts, and the outcome the driver recorded for each stop in
 * RunState.done. Nothing is estimated, nothing is rounded, and the balance line
 * is a sum the screen does in front of the room — so if it ever fails to
 * balance it says so instead of hiding it.
 *
 * ⚠ What a "unit" is. A case, a bag, a bale, a crate and the one freezer each
 * count as one — they are the units the dispatch tablet counted onto the load.
 * The screen says that out loud rather than pretending a bale of sugar and a
 * chest freezer are the same kind of thing.
 *
 * ⚠⚠ The transfer is NOT in the unit total. Stop 6 carries "Inter-branch
 * transfer, 4 lines" — the driver's run holds the line count, not the units,
 * because the branch counts them on its own receipt scan. Adding 4 lines to a
 * total of cases would mix two grades of a fact into one number, so the
 * transfer is reported on its own row, in lines, with who counts it.
 */

import { STOPS, TRIP, type Stop } from './run';

export type VanState = 'delivered' | 'comingBack' | 'onVan';

export type VanLine = {
  stopId: number;
  seq: number;
  customer: string;
  desc: string;
  qty: number;
  serial: string | null;
  state: VanState;
};

/** The one place a stop's outcome becomes a van state. A refusal at the door —
 *  including nothing collected on a cash stop — is recorded as `failed`, and the
 *  goods on a failed stop come back. They never become "delivered". */
export function vanState(done: Partial<Record<number, string>>, stop: Stop): VanState {
  const o = done[stop.id];
  if (o === 'delivered') return 'delivered';
  if (o === 'failed') return 'comingBack';
  return 'onVan';
}

/** Where goods that come back are taken, and under what. */
export const COMING_BACK_TO = `${TRIP.depot.short} goods-in`;
export const SEALS_TEXT = TRIP.seals.join(' / ');

export function vanReconciliation(done: Partial<Record<number, string>>) {
  const customerStops = STOPS.filter((s) => !s.receiptScanAtFarEnd);
  const transferStop = STOPS.find((s) => s.receiptScanAtFarEnd) ?? null;

  const lines: VanLine[] = customerStops.flatMap((s) =>
    s.lines.map((l) => ({
      stopId: s.id,
      seq: s.seq,
      customer: s.customer,
      desc: l.desc,
      qty: l.qty,
      serial: l.serial,
      state: vanState(done, s),
    })),
  );

  const sum = (st?: VanState) => lines.filter((l) => !st || l.state === st).reduce((n, l) => n + l.qty, 0);
  const loaded = sum();
  const delivered = sum('delivered');
  const comingBack = sum('comingBack');
  const onVan = sum('onVan');

  const transfer = transferStop
    ? {
        stopId: transferStop.id,
        seq: transferStop.seq,
        customer: transferStop.customer,
        lines: transferStop.lines[0]?.qty ?? 0,
        state: vanState(done, transferStop),
      }
    : null;

  return {
    lines,
    loaded,
    delivered,
    comingBack,
    onVan,
    /** ⚠ The check itself. Stated, not assumed. */
    balances: loaded === delivered + comingBack + onVan,
    transfer,
  };
}
