'use client';

/* 1 · Sign in — prove the device identity before the run, and show that the run
 * is already downloaded.
 *
 * ⚠ The PIN is not validated. It was not validated in the prototype either, and
 * pretending to authenticate against nothing would be a screen reporting work it
 * did not do — the worst defect class in this codebase. Any state signs in.
 *
 * ⚠ The PIN buffer is component state and is never written to localStorage. A
 * staff PIN has no business being persisted, even in a demo.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TRIP } from '@/lib/run';
import { useRun } from '@/lib/state';
import { Btn, DIV, Fact } from '@/components/ui';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '←'];

export default function SignIn() {
  const router = useRouter();
  const { set } = useRun();
  const [digits, setDigits] = useState('');

  const press = (k: string) =>
    setDigits((d) => (k === 'C' ? '' : k === '←' ? d.slice(0, -1) : (d + k).slice(0, 4)));

  return (
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '34px 26px 26px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          font: '600 10px/1 Archivo, system-ui',
          letterSpacing: '.16em',
          textTransform: 'uppercase',
          color: 'var(--color-accent)',
        }}
      >
        Vantage
      </div>
      <div style={{ font: '800 46px/.96 Archivo, system-ui', letterSpacing: '-.03em', marginTop: 10 }}>
        Driver
      </div>
      <div style={{ height: 2, background: DIV, margin: '20px 0' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 10px', fontSize: 12 }}>
        <Fact label="Terminal" value={`${TRIP.terminal.class} · ${TRIP.terminal.terminalNo}`} size={15} />
        <Fact label="Depot" value={TRIP.depot.short} size={15} />
        <Fact label="Build" value={TRIP.build} size={15} />
        <Fact label="Last sync" value={`${TRIP.downloadedAt} · depot wifi`} size={15} />
      </div>

      <div style={{ height: 2, background: DIV, margin: '20px 0' }} />
      <div className="pretty" style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.45 }}>
        Enter your staff PIN. This run was downloaded on the depot wifi at {TRIP.downloadedAt} and works
        with no signal all day.
      </div>

      <div style={{ display: 'flex', gap: 8, margin: '18px 0 6px' }}>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            style={{
              flex: 1,
              height: 52,
              border: `1px solid ${DIV}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              font: '800 22px Archivo, system-ui',
            }}
          >
            {digits.length > i ? '•' : ''}
          </span>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
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

      <Btn
        kind="primary"
        height={56}
        fontSize={15}
        style={{ width: '100%', marginTop: 12 }}
        onClick={() => {
          set({ signedIn: true });
          router.push('/run');
        }}
      >
        Sign in · {TRIP.driver.name}, {TRIP.driver.staffNo}
      </Btn>
    </div>
  );
}
