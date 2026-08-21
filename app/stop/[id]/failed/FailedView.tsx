'use client';

/* 7 · Failed stop — a refusal is a first-class outcome with a fault attached.
 *
 * ⚠⚠ COPY-RULES: a "no" is NOT an error. It is an outcome with a fault
 * (Customer or TVSH) and a person's name on it. The goods COME BACK — never
 * "leave at the door". An exception is AGEING on the console, not "reported":
 * the driver should know somebody will chase it. And there is never a skip —
 * no supervisor code in the ordinary flow.
 */

import { useRouter } from 'next/navigation';
import { REASONS, stopById } from '@/lib/run';
import { useRun } from '@/lib/state';
import { ACC, Btn, Card, DIV, SURF } from '@/components/ui';

export default function FailedView({ id }: { id: number }) {
  const router = useRouter();
  const { s, set, failStop } = useRun();
  const stop = stopById(id);
  const picked = s.failReason;

  return (
    <div style={{ padding: '14px 18px 26px' }}>
      <div className="pretty" style={{ fontSize: 12, lineHeight: 1.5, opacity: 0.78 }}>
        Name the reason. Each one carries a fault, and the fault is what the console counts —{' '}
        {stop.customer}, stop {stop.seq}.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
        {REASONS.map((r) => {
          const on = picked === r.code;
          return (
            <button
              key={r.code}
              type="button"
              onClick={() => set({ failReason: r.code })}
              className={on ? undefined : 'tappable'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                textAlign: 'left',
                minHeight: 58,
                padding: 12,
                border: `1px solid ${DIV}`,
                borderLeft: `4px solid ${on ? ACC : 'transparent'}`,
                background: on ? SURF : 'transparent',
                color: 'inherit',
                fontFamily: 'inherit',
                cursor: 'pointer',
                borderRadius: 0,
              }}
            >
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', font: '600 14px Archivo, system-ui' }}>{r.label}</span>
                {/* ⚠ The code is a code in a record, not a headline. It sits
                    under the sentence a driver actually reads. */}
                <span style={{ display: 'block', fontSize: 11, opacity: 0.68, marginTop: 3 }}>{r.code}</span>
              </span>
              <span
                style={{
                  flex: 'none',
                  font: '600 9px Archivo, system-ui',
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  padding: '4px 7px',
                  border: `1px solid ${DIV}`,
                }}
              >
                {r.fault}
              </span>
            </button>
          );
        })}
      </div>

      {picked && (
        <Card style={{ marginTop: 16 }}>
          <div style={{ font: '800 15px Archivo, system-ui' }}>The goods come back with you</div>
          <div className="pretty" style={{ fontSize: 12, lineHeight: 1.5, marginTop: 6, opacity: 0.8 }}>
            Custody stays in the transit bin and the consignment returns to READY for re-planning.
            Photograph the door or the gate if you can — it is what settles the argument later.
          </div>
          <Btn
            height={48}
            style={{ width: '100%', marginTop: 10 }}
            onClick={() => set((prev) => ({ photos: { ...prev.photos, refusal: !prev.photos.refusal } }))}
          >
            {s.photos.refusal ? 'Photograph captured · held for wifi' : 'Photograph the door or gate'}
          </Btn>
        </Card>
      )}

      <Btn
        kind="primary"
        height={56}
        fontSize={15}
        dim={!picked}
        style={{ width: '100%', marginTop: 16 }}
        onClick={() => {
          failStop();
          router.push(`/stop/${stop.id}/closed`);
        }}
      >
        {picked ? 'Record the failed stop' : 'Pick a reason'}
      </Btn>
    </div>
  );
}
