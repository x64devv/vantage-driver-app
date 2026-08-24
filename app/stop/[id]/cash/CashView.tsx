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
 *     what it is. "I cannot see this account from here — the branch can tell
 *     them." Nothing on this screen subtracts one figure from another.
 *   · The receipt number is PAY-<store>-<terminal>-<sequence>, minted on the
 *     device, terminal inside the number. NO `OFF-PAY-` PREFIX, EVER. Gaps are
 *     correct and are an audit feature.
 *
 * ⚠⚠ Rebuilt 21 Aug: the three choice rows are gone and the driver types what he
 * counted, straight away. Everything the rows used to say is now read off that
 * one figure — but ZERO IS STILL AN OUTCOME, NOT A NUMBER. Nothing collected is
 * a refusal with a fault attached and the goods come back; it is never a
 * delivered stop that happened to earn nothing. Collapsing those two would be
 * exactly the failure COPY-RULES exists to prevent, in a different noun.
 */

import { useRouter } from 'next/navigation';
import { CAPTURED, RECEIPT_NO, TRIP, stopById } from '@/lib/run';
import { canCompleteCash, cashOutcome, useRun } from '@/lib/state';
import { ACC, Btn, Card, DIV, Fact, Note, SectionHead, WarnPanel } from '@/components/ui';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '←'];

export default function CashView({ id }: { id: number }) {
  const router = useRouter();
  const { s, set, completeStop } = useRun();
  const stop = stopById(id);

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
  const typed = s.collected;
  const outcome = cashOutcome(s, stop.cash.amount);
  const ready = canCompleteCash(s, stop.cash.amount);
  const refused = outcome === 'none';

  const press = (k: string) =>
    set((prev) => {
      const d = prev.collected;
      if (k === '←') return { collected: d.slice(0, -1) };
      if (k === '.') return { collected: d.includes('.') ? d : d === '' ? '0.' : d + '.' };
      const next = d + k;
      if (/^\d{0,7}(\.\d{0,2})?$/.test(next)) return { collected: next };
      return {};
    });

  /* ⚠ What the typed figure means, in one sentence each. Every one of these is
     COPY-RULES: the part-payment line refuses to quote what is left, and the
     over line points at the figure that came down rather than at an account
     this device cannot see. */
  const reading =
    outcome === 'full'
      ? 'The full amount, counted in front of the receiver.'
      : outcome === 'part'
        ? 'Part of it. The balance stays owing, and this device quotes no figure for it.'
        : outcome === 'over'
          ? 'More than the figure that came down with the run. Check it before you close the stop.'
          : typed === ''
            ? 'Count it in front of the receiver, then type it.'
            : '';

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

      {/* ── The one thing the driver does here ──────────────────────────── */}
      <div style={{ marginTop: 16 }}>
        <SectionHead>How much did you collect?</SectionHead>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          marginTop: 10,
          minHeight: 64,
          border: `1px solid ${DIV}`,
          borderLeft: `4px solid ${typed === '' ? 'transparent' : refused ? 'var(--color-text)' : ACC}`,
          padding: '12px 14px',
        }}
      >
        <span style={{ font: '600 15px Archivo, system-ui', opacity: 0.6 }}>{cur}</span>
        <span style={{ font: '800 34px/1 Archivo, system-ui', letterSpacing: '-.02em' }}>
          {typed || '—'}
        </span>
      </div>
      {reading && (
        <div className="pretty" style={{ fontSize: 11, opacity: 0.68, marginTop: 6, lineHeight: 1.45 }}>
          {reading}
        </div>
      )}

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

      {/* ── ⚠⚠ Zero is a refusal, not a delivery ────────────────────────── */}
      {refused && (
        <div style={{ marginTop: 16 }}>
          <WarnPanel head="Nothing collected is a refusal, not a delivery">
            Reason <strong>PaymentNotMade</strong>, fault Customer. Record it and the goods come back
            with you — they are not left at the door.
          </WarnPanel>
        </div>
      )}

      {/* ── The receipt ─────────────────────────────────────────────────── */}
      {ready && (
        <Card style={{ marginTop: 16 }}>
          <SectionHead>Receipt minted on this device</SectionHead>
          <div style={{ font: '800 22px Archivo, system-ui', letterSpacing: '-.01em', marginTop: 7 }}>
            {RECEIPT_NO}
          </div>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12, fontSize: 12 }}
          >
            <Fact
              label="Amount"
              value={outcome === 'full' ? stop.cash.amount : `${cur} ${typed} of ${stop.cash.amount}`}
            />
            <Fact label="Terminal" value={TRIP.terminal.terminalNo} />
            <Fact label="Taken" value={`${CAPTURED.cash} · offline`} />
            {/* ⚠ Not "nearest branch" — the driver chooses at the debrief, and
                the nearest is not always the one he picks. */}
            <Fact label="Deposit at" value="Chosen at debrief" />
          </div>
          <Note style={{ marginTop: 12 }}>
            <strong>Recorded on this device, not yet in the ledger.</strong> The customer&rsquo;s receipt
            shows this number, the amount and the date. No balance is printed.
          </Note>
        </Card>
      )}

      {/* ⚠ One primary action, and which one it is depends on the figure. A
          refusal never wears the same button as a delivery. */}
      <Btn
        kind="primary"
        height={56}
        fontSize={15}
        dim={!ready && !refused}
        style={{ width: '100%', marginTop: 16 }}
        onClick={() => {
          if (refused) {
            set({ failReason: 'PaymentNotMade' });
            router.push(`/stop/${stop.id}/failed`);
            return;
          }
          if (!ready) return;
          completeStop();
          router.push(`/stop/${stop.id}/closed`);
        }}
      >
        {refused
          ? 'Record the exception'
          : ready
            ? `Complete stop ${stop.seq}`
            : 'Type what you collected'}
      </Btn>
    </div>
  );
}
