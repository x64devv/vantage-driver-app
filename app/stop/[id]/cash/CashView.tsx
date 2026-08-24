'use client';

/* 6 · Money at the door — take money without ever implying it has reached the
 * ledger.
 *
 * ⚠⚠ COPY-RULES.md IS SPEC ON THIS SCREEN, NOT TONE OF VOICE. It comes from
 * TVSH-SDD-TRP-004 §6.3 and the $70 incident of 2026-08-14. A reviewer should be
 * able to fail the build on these sentences:
 *
 *   · "Recorded on this device, not yet in the ledger."
 *     NEVER "Payment received", "Paid" or "Posted".
 *   · NEVER a balance. The figure that came down with the run is labelled as
 *     what it is and is not a balance. "I cannot see this account from here —
 *     the branch can tell them."
 *   · The receipt number is PAY-<store>-<terminal>-<sequence>, minted on the
 *     device, terminal inside the number. NO `OFF-PAY-` PREFIX, EVER. Gaps are
 *     correct and are an audit feature.
 *
 * ⚠ The part-payment amount is TYPED BY THE DRIVER. The handoff hardcoded
 * "USD 600.00" — a figure from nowhere, on a receipt. Nothing on this screen
 * invents an amount, and nothing subtracts one figure from another to imply what
 * is left owing.
 */

import { useRouter } from 'next/navigation';
import { CAPTURED, RECEIPT_NO, TRIP, stopById } from '@/lib/run';
import { canCompleteCash, useRun } from '@/lib/state';
import { ACC, Btn, Card, DIV, Fact, Note, SURF, SectionHead, WarnPanel } from '@/components/ui';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '←'];

export default function CashView({ id }: { id: number }) {
  const router = useRouter();
  const { s, set, completeStop } = useRun();
  const stop = stopById(id);
  const ready = canCompleteCash(s);

  if (!stop.cash) {
    return (
      <div style={{ padding: '14px 18px 26px' }}>
        <Card>
          <SectionHead>To collect on this stop</SectionHead>
          <div style={{ font: '800 40px/1 Archivo, system-ui', letterSpacing: '-.02em', marginTop: 8 }}>
            Nothing
          </div>
          <div style={{ fontSize: 12, opacity: 0.72, marginTop: 6 }}>This stop is delivery only.</div>
        </Card>
        <Btn
          kind="primary"
          height={56}
          fontSize={15}
          style={{ width: '100%', marginTop: 16 }}
          onClick={() => {
            completeStop();
            router.push(`/stop/${stop.id}/closed`);
          }}
        >
          Complete stop {stop.seq}
        </Btn>
      </div>
    );
  }

  const cur = stop.cash.currency;
  const typed = s.partAmount;

  const press = (k: string) =>
    set((prev) => {
      const d = prev.partAmount;
      if (k === '←') return { partAmount: d.slice(0, -1) };
      if (k === '.') return { partAmount: d.includes('.') ? d : d === '' ? '0.' : d + '.' };
      const next = d + k;
      // two decimals, and nothing silly long
      if (/^\d{0,7}(\.\d{0,2})?$/.test(next)) return { partAmount: next };
      return {};
    });

  const receiptAmount =
    s.cashPick === 'full' ? stop.cash.amount : `${cur} ${typed} of ${stop.cash.amount}`;

  return (
    <div style={{ padding: '14px 18px 26px' }}>
      {/* ── What came down with the run ─────────────────────────────────── */}
      <Card>
        <SectionHead>To collect on this stop</SectionHead>
        <div style={{ font: '800 40px/1 Archivo, system-ui', letterSpacing: '-.02em', marginTop: 8 }}>
          {stop.cash.amount}
        </div>
        <div style={{ fontSize: 12, opacity: 0.72, marginTop: 6 }}>{stop.cash.what}</div>
      </Card>

      {/* ⚠⚠ The honesty panel. This is the sentence the $70 incident bought. */}
      <div style={{ marginTop: 12 }}>
        <WarnPanel head="I cannot see this account from here">
          The figure above came down with the run at {TRIP.downloadedAt}. If the customer asks for a
          balance, the branch tells them — this device never quotes one.
        </WarnPanel>
      </div>

      <div style={{ marginTop: 16 }}>
        <SectionHead>What happened at the door</SectionHead>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        <CashRow
          label="Took the full amount"
          sub={`${stop.cash.amount} in cash, counted in front of the receiver`}
          picked={s.cashPick === 'full'}
          onClick={() => set({ cashPick: 'full', partAmount: '' })}
        />
        <CashRow
          label="Took part of it"
          sub="The balance stays owing. This device quotes no figure for it."
          picked={s.cashPick === 'part'}
          onClick={() => set({ cashPick: 'part' })}
        />
        <CashRow
          label="Customer would not pay"
          sub="Reason PaymentNotMade · the goods come back with you"
          picked={s.cashPick === 'none'}
          /* ⚠ Straight to the failed screen with the reason preselected. Not
             paying is an outcome with a fault on it, not a variant of paying. */
          onClick={() => {
            set({ cashPick: 'none', failReason: 'PaymentNotMade' });
            router.push(`/stop/${stop.id}/failed`);
          }}
        />
      </div>

      {/* ── The amount the driver actually counted ──────────────────────── */}
      {s.cashPick === 'part' && (
        <Card style={{ marginTop: 16 }}>
          <SectionHead>Amount you counted</SectionHead>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              marginTop: 8,
              minHeight: 52,
              border: `1px solid ${DIV}`,
              padding: '10px 12px',
            }}
          >
            <span style={{ font: '600 15px Archivo, system-ui', opacity: 0.6 }}>{cur}</span>
            <span style={{ font: '800 26px/1 Archivo, system-ui', letterSpacing: '-.02em' }}>
              {typed || '—'}
            </span>
          </div>
          {/* ⚠ No remainder is computed here, and none is shown anywhere. */}
          {/* ⚠ Slimmed 21 Aug, but the second half is COPY-RULES and stays: this
              device never works out what is left. */}
          <div style={{ fontSize: 11, opacity: 0.65, marginTop: 6 }}>
            Type what you counted. This device does not work out what is left.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
            {KEYS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => press(k)}
                className="keypad tap8"
                style={{
                  minHeight: 56,
                  border: `1px solid ${DIV}`,
                  background: 'transparent',
                  font: '600 20px Archivo, system-ui',
                  cursor: 'pointer',
                  color: 'inherit',
                  borderRadius: 0,
                }}
              >
                {k}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* ── The receipt ─────────────────────────────────────────────────── */}
      {(s.cashPick === 'full' || (s.cashPick === 'part' && ready)) && (
        <Card style={{ marginTop: 16 }}>
          <SectionHead>Receipt minted on this device</SectionHead>
          <div style={{ font: '800 22px Archivo, system-ui', letterSpacing: '-.01em', marginTop: 7 }}>
            {RECEIPT_NO}
          </div>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12, fontSize: 12 }}
          >
            <Fact label="Amount" value={receiptAmount} />
            <Fact label="Terminal" value={TRIP.terminal.terminalNo} />
            <Fact label="Taken" value={`${CAPTURED.cash} · offline`} />
            {/* ⚠ Not "nearest branch" — the driver chooses at the debrief and the
                nearest is not always the one he picks. See the debrief screen. */}
            <Fact label="Deposit at" value="Chosen at debrief" />
          </div>
          <Note style={{ marginTop: 12 }}>
            <strong>Recorded on this device, not yet in the ledger.</strong> The customer&rsquo;s receipt
            shows this number, the amount and the date. No balance is printed.
          </Note>
        </Card>
      )}

      <Btn
        kind="primary"
        height={56}
        fontSize={15}
        dim={!ready}
        style={{ width: '100%', marginTop: 16 }}
        onClick={() => {
          completeStop();
          router.push(`/stop/${stop.id}/closed`);
        }}
      >
        {ready
          ? `Complete stop ${stop.seq}`
          : s.cashPick === 'part'
            ? 'Type the amount you counted'
            : 'Say what happened to the money'}
      </Btn>
    </div>
  );
}

function CashRow({
  label,
  sub,
  picked,
  onClick,
}: {
  label: string;
  sub: string;
  picked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={picked ? undefined : 'tappable'}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        minHeight: 58,
        padding: 12,
        border: `1px solid ${DIV}`,
        borderLeft: `4px solid ${picked ? ACC : 'transparent'}`,
        background: picked ? SURF : 'transparent',
        color: 'inherit',
        fontFamily: 'inherit',
        cursor: 'pointer',
        borderRadius: 0,
      }}
    >
      <span style={{ display: 'block', font: '600 14px Archivo, system-ui' }}>{label}</span>
      <span className="pretty" style={{ display: 'block', fontSize: 11, opacity: 0.7, marginTop: 3 }}>
        {sub}
      </span>
    </button>
  );
}
