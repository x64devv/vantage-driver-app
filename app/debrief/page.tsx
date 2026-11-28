'use client';

/* 9 · Debrief — close the run, put the cash somewhere the system knows about,
 * and hand back the vehicle with a reading on it.
 *
 * ⚠⚠ The deposit branch is the point of this screen. TRP-004 §6.4: the money is
 * recorded against WHERE IT ACTUALLY WENT, not against the branch that raised the
 * invoice — which is what turns reconciliation into a query instead of a
 * spreadsheet. The console's TM-4 records this deposit at BR Borrowdale.
 * Changing the branch here means changing the console too.
 *
 * ⚠ The distances are real road distances from the run's final stop, measured by
 * OSRM (lib/routes-cache.ts). The NEAREST tag goes wherever OSRM says, which is
 * Avondale, not Borrowdale.
 *
 * ⚠⚠ Fuel and mileage, added 21 Aug. Both readings are TYPED. The distance is the
 * difference between them and nothing else — not the routed estimate, which
 * measures the plan rather than the wheels. And there is deliberately NO km/l:
 * litres drawn is a tank fill, not fuel burned. See lib/run.ts §VEHICLE.
 */

import { useRouter } from 'next/navigation';
import { DEBRIEF, STOPS, TRIP, VEHICLE, fmtKm, stopById } from '@/lib/run';
import { depositNote, depositRows } from '@/lib/derive';
import { litresDrawn, money, odoDistance, queuedCount, useRun, type TrailEntry } from '@/lib/state';
import { COMING_BACK_TO, SEALS_TEXT, vanReconciliation, type VanState } from '@/lib/vanrec';
import { ACC, BG, Btn, Card, DIV, Note, SURF, SectionHead } from '@/components/ui';

export default function Debrief() {
  const router = useRouter();
  const { s, set } = useRun();

  const delivered = STOPS.filter((x) => s.done[x.id] === 'delivered').length;
  const failed = STOPS.filter((x) => s.done[x.id] === 'failed').length;

  /* ⚠ Cash held is what the driver actually took — the amount he typed for a part
     payment, or the full figure, and nothing at all if he took nothing. It is
     never the sum of what was due. */
  const cashStop = stopById(4);
  const collected = money(s.collected);
  const usdHeld = collected !== null && collected > 0 ? `USD ${s.collected}` : 'USD 0.00';
  void cashStop;

  const rows = depositRows(s.orderAccepted);
  const distance = odoDistance(s);
  const litres = litresDrawn(s);
  const van = vanReconciliation(s.done);
  const balanceLine =
    `${van.loaded} loaded = ${van.delivered} delivered + ${van.comingBack} coming back + ${van.onVan} not worked`;

  const signOff = () => {
    if (s.signedOff) return;
    const branch = rows.find((b) => b.code === s.deposit)!;
    const entries: TrailEntry[] = [];

    entries.push({
      ref: `DEP-${s.deposit}-${TRIP.date}-0014`,
      detail:
        `${usdHeld} handed to the safe at ${branch.label.split(' · ')[1]}, ` +
        `${s.deposit === 'VE' ? 'which also raised the invoice' : 'not the branch that raised the invoice'}. ` +
        `Signed off ${DEBRIEF.signedOffAt} by ${TRIP.driver.name}.`,
      dest: 'Queued · deposit register',
      state: 'Queued',
    });

    /* ⚠ The van reconciliation goes up with the deposit: the goods and the money
       are both handed back at the end of the run, and both are a record with
       the driver's name on it. Every figure is derived from the run and the
       outcomes he recorded — see lib/vanrec.ts. */
    entries.push({
      ref: `VANREC-${VEHICLE.reg}-${TRIP.load}`,
      detail:
        `${balanceLine} — ${van.balances ? 'balances' : 'does not balance'}. ` +
        (van.comingBack > 0 ? `${van.comingBack} back to ${COMING_BACK_TO} under seals ${SEALS_TEXT}. ` : '') +
        (van.transfer
          ? `Transfer to ${van.transfer.customer}: ${van.transfer.lines} lines, counted by the branch on its receipt scan.`
          : ''),
      dest: 'Queued · van reconciliation',
      state: 'Queued',
    });

    /* ⚠ Only written when there is something to write. A vehicle row with no
       reading behind it is the defect this whole app exists to argue against. */
    if (s.odoIn) {
      entries.push({
        ref: `ODO-${VEHICLE.reg}-${s.odoIn}`,
        detail:
          `Closing odometer ${fmtKm(Number(s.odoIn))} km, typed by you` +
          (distance !== null ? ` · ${fmtKm(distance)} km on this run` : ' · no opening reading, so no distance'),
        dest: 'Queued · vehicle log',
        state: 'Queued',
      });
    }

    if (litres !== null) {
      entries.push({
        ref: `FUEL-${VEHICLE.reg}-${s.odoIn || '—'}`,
        /* ⚠⚠ This row is the argument. TM-5 shows a fleet-wide efficiency figure
           (6.12 km/l, illustrative) and no reliable per-vehicle split.
           Litres against a registration and an odometer reading is what makes
           one. ⚠ It claims a fill, never a burn rate. */
        detail:
          `${litres} L drawn at ${s.odoIn ? fmtKm(Number(s.odoIn)) + ' km' : 'an unrecorded reading'}` +
          (s.fuelCost ? ` · ${s.fuelCost} on the fuel card, typed by you` : ' · card') +
          '. One fill is not an efficiency figure — this reading and the next make the pair.',
        dest: 'Queued · fleet cost, per-vehicle',
        state: 'Queued',
      });
    }

    set((prev) => ({ signedOff: true, trail: [...entries, ...prev.trail] }));
  };

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

      {/* ── Vehicle back at the depot ─────────────────────────────────────── */}
      <Card style={{ marginTop: 16, padding: 12 }}>
        <SectionHead>Vehicle back at {TRIP.depot.code} · {VEHICLE.reg}</SectionHead>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <Capture
            label="Odometer in · km"
            value={s.odoIn}
            placeholder={String(VEHICLE.expectedClosing)}
            onChange={(v) => set({ odoIn: v.replace(/[^\d]/g, '') })}
          />
          <Capture
            label="Fuel drawn · L"
            value={s.litres}
            placeholder={VEHICLE.expectedLitres}
            onChange={(v) => set({ litres: v.replace(/[^\d.]/g, '') })}
          />
          <Capture
            label="Fuel card · optional"
            value={s.fuelCost}
            placeholder="not entered"
            onChange={(v) => set({ fuelCost: v })}
          />
          <div>
            <Lbl>Distance this run</Lbl>
            {/* ⚠ Two typed readings, subtracted. Nothing else. If either is
                missing the screen says which, and does not reach for the routed
                estimate — that measures the plan, not the wheels. */}
            <div style={{ font: '600 15px Archivo, system-ui', marginTop: 2 }}>
              {distance !== null ? `${fmtKm(distance)} km` : '—'}
            </div>
            <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>
              {distance !== null
                ? 'by odometer, typed by you'
                : s.odoOut
                  ? 'needs the closing reading'
                  : 'no opening reading was taken'}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
          <div>
            <Lbl>Seals returned</Lbl>
            <div style={{ font: '600 15px Archivo, system-ui', marginTop: 2 }}>{DEBRIEF.sealsReturned}</div>
          </div>
          <div>
            <Lbl>Cash variance</Lbl>
            <div style={{ font: '600 15px Archivo, system-ui', marginTop: 2 }}>
              {s.signedOff ? 'None · counted' : 'Count at the safe'}
            </div>
          </div>
        </div>

        {/* ⚠⚠ The sentence that keeps this feature honest, and the one that makes
            it worth having. Never divide one fill by one run's distance. */}
        {litres !== null && (
          <Note style={{ marginTop: 12, fontSize: 11 }}>
            One fill is not an efficiency figure — this reading and the next one make the pair. The
            fleet runs at {VEHICLE.standardKmPerL} km/l as a standard; there is no per-vehicle figure
            today, and this is the capture that makes one.
          </Note>
        )}
      </Card>

      {/* ── Van stock: what went on, and where it is now ──────────────────── */}
      {/* ⚠⚠ Derived, never typed (lib/vanrec.ts). The balance line is a sum done
          on screen, and it says so if it does not balance rather than hiding it.
          The transfer is reported in LINES on its own row — the branch counts
          its units on its own receipt scan, and adding lines to cases would mix
          two grades of a fact into one number. */}
      <Card style={{ marginTop: 16, padding: 12 }}>
        <div data-testid="van-rec">
          <SectionHead right={<span style={{ fontSize: 10, opacity: 0.6 }}>derived from the run</span>}>
            Van stock · {TRIP.load}
          </SectionHead>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 1,
              background: DIV,
              marginTop: 10,
            }}
          >
            <VanStat label="Loaded" value={van.loaded} testid="van-loaded" />
            <VanStat label="Delivered" value={van.delivered} testid="van-delivered" />
            <VanStat label="Coming back" value={van.comingBack} testid="van-back" accent={van.comingBack > 0} />
            <VanStat label="Not worked" value={van.onVan} testid="van-onvan" />
          </div>

          <div
            data-testid="van-balance"
            style={{
              marginTop: 8,
              padding: '8px 10px',
              borderLeft: `4px solid ${van.balances ? 'var(--color-text)' : ACC}`,
              background: SURF,
              fontFamily: 'Archivo, system-ui', fontVariantNumeric: 'tabular-nums',
              fontSize: 12,
              lineHeight: 1.4,
            }}
          >
            {balanceLine} — {van.balances ? 'balances' : 'does not balance · count it at goods-in'}
          </div>
          <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4 }}>
            Units as loaded: a case, a bag, a bale, a crate and the freezer each count as one.
          </div>

          <div style={{ marginTop: 10 }}>
            {van.lines.map((l, i) => (
              <div
                key={`${l.stopId}-${i}`}
                data-testid={`van-line-${l.stopId}`}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 8,
                  padding: '6px 0',
                  borderBottom: `1px solid ${DIV}`,
                  fontSize: 12,
                }}
              >
                <span style={{ fontFamily: 'Archivo, system-ui', fontVariantNumeric: 'tabular-nums', opacity: 0.6, flex: 'none', width: 22 }}>S{l.seq}</span>
                <span style={{ flex: 1, minWidth: 0 }}>{l.desc}</span>
                <span style={{ fontFamily: 'Archivo, system-ui', fontVariantNumeric: 'tabular-nums', flex: 'none' }}>{l.qty}</span>
                <VanTag state={l.state} />
              </div>
            ))}
            {van.transfer && (
              <div
                data-testid="van-transfer"
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 8,
                  padding: '6px 0',
                  borderBottom: `1px solid ${DIV}`,
                  fontSize: 12,
                }}
              >
                <span style={{ fontFamily: 'Archivo, system-ui', fontVariantNumeric: 'tabular-nums', opacity: 0.6, flex: 'none', width: 22 }}>S{van.transfer.seq}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  Transfer to {van.transfer.customer}
                  <span style={{ display: 'block', fontSize: 10, opacity: 0.6 }}>
                    counted by the branch on its receipt scan, not by you · not in the total
                  </span>
                </span>
                <span style={{ fontFamily: 'Archivo, system-ui', fontVariantNumeric: 'tabular-nums', flex: 'none' }}>{van.transfer.lines} lines</span>
                <VanTag state={van.transfer.state} handedOver />
              </div>
            )}
          </div>

          {van.comingBack > 0 && (
            <Note style={{ marginTop: 10, fontSize: 11 }}>
              {van.comingBack} back to {COMING_BACK_TO} under seals {SEALS_TEXT} — the tablet&rsquo;s
              Coming back tab receives them against your exception.
            </Note>
          )}
        </div>
      </Card>

      <Btn
        kind="primary"
        height={56}
        fontSize={15}
        style={{ width: '100%', marginTop: 16 }}
        onClick={signOff}
      >
        {s.signedOff
          ? `Signed off ${DEBRIEF.signedOffAt} · handed to the safe`
          : 'Sign off the run and hand over the cash'}
      </Btn>

      {s.signedOff && (
        <div style={{ fontSize: 11, opacity: 0.6, marginTop: 8 }}>
          {`DEP-${s.deposit}-${TRIP.date}-0014`} · still on this device until depot wifi.
        </div>
      )}

      <Btn height={48} style={{ width: '100%', marginTop: 8 }} onClick={() => router.push('/run')}>
        Back to the run
      </Btn>
    </div>
  );
}

function Lbl({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ opacity: 0.55, fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase' }}>
      {children}
    </div>
  );
}

/** A typed vehicle reading. ⚠ Every one of these is labelled as typed wherever it
 *  is printed downstream — the app makes the same distinction for a serial
 *  (scanned or typed) and for an arrival (geofence or button). */
function Capture({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <label style={{ display: 'block' }}>
      <Lbl>{label}</Lbl>
      <input
        className="input"
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ minHeight: 44, borderRadius: 0, marginTop: 2, font: '600 15px Archivo, system-ui' }}
      />
    </label>
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
      <Lbl>{label}</Lbl>
      <div style={{ font: `800 ${size}px Archivo, system-ui`, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ font: '600 11px Archivo, system-ui', opacity: 0.7 }}>{sub}</div>}
    </div>
  );
}

function VanStat({ label, value, testid, accent }: { label: string; value: number; testid: string; accent?: boolean }) {
  return (
    <div style={{ background: BG, padding: '8px 8px 9px' }}>
      <Lbl>{label}</Lbl>
      <div
        data-testid={testid}
        style={{ font: '800 20px Archivo, system-ui', fontVariantNumeric: 'tabular-nums', marginTop: 3, color: accent ? ACC : undefined }}
      >
        {value}
      </div>
    </div>
  );
}

const VAN_LABEL: Record<VanState, string> = {
  delivered: 'Delivered',
  comingBack: 'Coming back',
  onVan: 'Not worked',
};

/** ⚠ A line coming back is the one state that needs somebody at goods-in, so it
 *  is the one drawn in accent. Delivered and not-worked are both plain facts. */
function VanTag({ state, handedOver }: { state: VanState; handedOver?: boolean }) {
  const back = state === 'comingBack';
  return (
    <span
      style={{
        flex: 'none',
        font: '600 9px Archivo, system-ui',
        letterSpacing: '.08em',
        textTransform: 'uppercase',
        padding: '3px 5px',
        border: `1px solid ${back ? ACC : DIV}`,
        color: back ? ACC : undefined,
        background: state === 'delivered' ? SURF : 'transparent',
        minWidth: 74,
        textAlign: 'center',
      }}
    >
      {handedOver && state === 'delivered' ? 'Handed over' : VAN_LABEL[state]}
    </span>
  );
}
