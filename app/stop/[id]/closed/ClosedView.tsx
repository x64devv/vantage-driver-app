'use client';

/* 8 · Recorded — show that the stop produced RECORDS, not claims.
 *
 * ⚠⚠ This screen is the argument of the whole app. No screen makes a claim that
 * has no record behind it, and every record says where it is going and whether
 * it has got there. If you shorten one row here, shorten the claim it supports
 * first.
 */

import { useRouter } from 'next/navigation';
import { stopById } from '@/lib/run';
import { useRun } from '@/lib/state';
import { Btn, DIV, SectionHead, TrailRow } from '@/components/ui';

export default function ClosedView({ id }: { id: number }) {
  const router = useRouter();
  const { s, set, nextStop } = useRun();
  const stop = stopById(id);
  const outcome = s.done[stop.id] ?? s.lastOutcome ?? 'delivered';
  const failed = outcome === 'failed';

  /* ⚠ The next stop follows the order in force — the dispatcher's, or the
     optimised one if the driver confirmed it. Walking the stop list in id order
     would quietly undo the decision he took on the route screen. */
  const nextId = nextStop();
  const next = nextId === null ? null : stopById(nextId);

  return (
    <div style={{ padding: '18px 18px 26px' }}>
      <div style={{ font: '800 30px/1.05 Archivo, system-ui', letterSpacing: '-.02em' }}>
        {failed ? 'Not delivered, and recorded' : `Stop ${stop.seq} closed`}
      </div>
      <div className="pretty" style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.78, marginTop: 8 }}>
        {failed
          ? 'The consignment goes back to READY for re-planning, and the exception is on the dispatch board within seconds of signal — ageing, with your name on it.'
          : 'Nothing here is a claim. Every line below is a record, with the place it is going and whether it has got there yet.'}
      </div>

      <div style={{ height: 2, background: DIV, margin: '16px 0' }} />
      <SectionHead>What this stop wrote, and where it is going</SectionHead>

      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 10, borderTop: `1px solid ${DIV}` }}>
        {s.stopTrail.map((t, i) => (
          <TrailRow key={t.ref + i} entry={t} />
        ))}
      </div>

      <Btn
        kind="primary"
        height={56}
        fontSize={15}
        style={{ width: '100%', marginTop: 18 }}
        onClick={() => {
          if (!next) {
            router.push('/debrief');
            return;
          }
          /* ⚠ Moving on resets the per-stop state — checks, test, photographs,
             signature, cash and reason. A carried-over "yes" from the last
             doorway would be a lie about this one. */
          set({
            stopId: next.id,
            checks: {},
            funcTest: null,
            swipeIdx: 0,
            photos: { goods: false, id: false, refusal: false },
            sigInk: false,
            cashPick: null,
            partAmount: '',
            failReason: null,
            stopTrail: [],
          });
          router.push(`/stop/${next.id}`);
        }}
      >
        {next ? `Next stop · ${next.customer} →` : 'All stops done · go to debrief'}
      </Btn>
      <Btn height={48} style={{ width: '100%', marginTop: 8 }} onClick={() => router.push('/run')}>
        Back to the run
      </Btn>
    </div>
  );
}
