'use client';

/* 9 · Debrief — close the run and put the cash somewhere the system knows about.
 *
 * ⚠⚠ The deposit branch is the point of this screen. TRP-004 §6.4: the money is
 * recorded against WHERE IT ACTUALLY WENT, not against the branch that raised the
 * invoice — which is what turns reconciliation into a query instead of a
 * spreadsheet. The console's TM-4 records this deposit at BR Borrowdale.
 * Changing the branch here means changing the console too.
 *
 * ⚠ The distances are real road distances from the run's final stop, measured by
 * OSRM (lib/routes-cache.ts), and they move when the driver confirms the
 * optimised order — because the run then ends at Msasa instead of Hatfield. The
 * NEAREST tag goes wherever OSRM says, which is Avondale, not Borrowdale.
 */

import { useRouter } from 'next/navigation';
import { DEBRIEF, STOPS, TRIP, stopById } from '@/lib/run';
import { depositNote, depositRows } from '@/lib/derive';
import { queuedCount, useRun } from '@/lib/state';
import { ACC, BG, Btn, Card, DIV, Fact, Note, SURF, SectionHead } from '@/components/ui';

export default function Debrief() {
  const router = useRouter();
  const { s, set } = useRun();

  const delivered = STOPS.filter((x) => s.done[x.id] === 'delivered').length;
  const failed = STOPS.filter((x) => s.done[x.id] === 'failed').length;

  /* ⚠ Cash held is what the driver actually took on this run — the amount he
     typed for a part payment, or the full figure, and nothing at all if he took
     nothing. It is never the sum of what was due. */
  const cashStop = stopById(4);
  const usdHeld =
    s.cashPick === 'full'
      ? cashStop.cash!.amount
      : s.cashPick === 'part' && s.partAmount
        ? `USD ${s.partAmount}`
        : 'USD 0.00';

  const rows = depositRows(s.orderAccepted);
  const lastStop = stopById(
    (s.orderAccepted ? TRIP.optimisedOrder : TRIP.dispatcherOrder).slice(-1)[0],
  );

  return (
    <div style={{ padding: '14px 18px 26px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: DIV }}>
        <Stat label="Delivered" value={`${delivered} of ${STOPS.length}`} />
        <Stat label="Failed" value={String(failed)} />
        <Stat label="Cash held" value={usdHeld} size={20} sub={DEBRIEF.cashZwg} />
        <Stat label="Queued" value={String(queuedCount(s))} sub="clears on depot wifi" />
      </div>

      <div style={{ marginTop: 16 }}>
        <SectionHead>Deposit the cash at</SectionHead>
      </div>
      <div style={{ fontSize: 11, opacity: 0.6, marginTop: 6 }}>
        Distances by road from {lastStop.area}, your last stop.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        {rows.map((b) => {
          const on = s.deposit === b.code;
          return (
            <button
              key={b.code}
              type="button"
              onClick={() => set({ deposit: b.code })}
              className={on ? undefined : 'tappable'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                minHeight: 52,
                padding: '11px 12px',
                border: `1px solid ${DIV}`,
                borderLeft: `4px solid ${on ? ACC : 'transparent'}`,
                background: on ? SURF : 'transparent',
                color: 'inherit',
                fontFamily: 'inherit',
                cursor: 'pointer',
                textAlign: 'left',
                borderRadius: 0,
              }}
            >
              <span>
                <span style={{ display: 'block', font: '600 14px Archivo, system-ui' }}>{b.label}</span>
                <span style={{ display: 'block', fontSize: 11, opacity: 0.68, marginTop: 2 }}>{b.note}</span>
              </span>
              <span
                style={{
                  font: '600 9px Archivo, system-ui',
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  opacity: 0.6,
                  flex: 'none',
                  paddingLeft: 8,
                }}
              >
                {b.tag}
              </span>
            </button>
          );
        })}
      </div>

      <Note style={{ marginTop: 12 }}>{depositNote(s.deposit)}</Note>

      <Card style={{ marginTop: 16, padding: 12 }}>
        <SectionHead>Vehicle back at {TRIP.depot.code}</SectionHead>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10, fontSize: 12 }}>
          <Fact label="Odometer" value={DEBRIEF.odometer} />
          <Fact label="Fuel drawn" value={DEBRIEF.fuelDrawn} />
          <Fact label="Seals returned" value={DEBRIEF.sealsReturned} />
          <Fact label="Variance" value={s.signedOff ? 'None · counted' : 'Count at the safe'} />
        </div>
      </Card>

      <Btn
        kind="primary"
        height={56}
        fontSize={15}
        style={{ width: '100%', marginTop: 16 }}
        onClick={() => {
          if (s.signedOff) return;
          const branch = rows.find((b) => b.code === s.deposit)!;
          set((prev) => ({
            signedOff: true,
            trail: [
              {
                /* ⚠ The deposit reference carries the branch it went to, so the
                   money can be found later by where it actually landed. */
                ref: `DEP-${s.deposit}-${TRIP.date}-0014`,
                detail:
                  `${usdHeld} handed to the safe at ${branch.label.split(' · ')[1]}, ` +
                  `${s.deposit === 'VE' ? 'which also raised the invoice' : 'not the branch that raised the invoice'}. ` +
                  `Signed off ${DEBRIEF.signedOffAt} by ${TRIP.driver.name}. Reconciliation follows the money.`,
                dest: 'Queued · deposit register',
                state: 'Queued' as const,
              },
              ...prev.trail,
            ],
          }));
        }}
      >
        {s.signedOff
          ? `Signed off ${DEBRIEF.signedOffAt} · handed to the safe`
          : 'Sign off the run and hand over the cash'}
      </Btn>

      {s.signedOff && (
        <div style={{ fontSize: 11, opacity: 0.6, marginTop: 8 }}>
          Reference {`DEP-${s.deposit}-${TRIP.date}-0014`} · still on this device until depot wifi.
        </div>
      )}

      <Btn height={48} style={{ width: '100%', marginTop: 8 }} onClick={() => router.push('/run')}>
        Back to the run
      </Btn>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  size = 28,
}: {
  label: string;
  value: string;
  sub?: string;
  size?: number;
}) {
  return (
    <div style={{ background: BG, padding: 12 }}>
      <div
        style={{
          font: '600 9px Archivo, system-ui',
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          opacity: 0.55,
        }}
      >
        {label}
      </div>
      <div style={{ font: `800 ${size}px Archivo, system-ui`, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ font: '600 11px Archivo, system-ui', opacity: 0.7 }}>{sub}</div>}
    </div>
  );
}
