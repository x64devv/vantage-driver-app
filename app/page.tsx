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
import { TRIP, VEHICLE, fmtKm } from '@/lib/run';
import { useRun } from '@/lib/state';
import { Btn, DIV, Fact } from '@/components/ui';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '←'];

export default function SignIn() {
  const router = useRouter();
  const { s, set } = useRun();
  const [digits, setDigits] = useState('');

  const press = (k: string) =>
    setDigits((d) => (k === 'C' ? '' : k === '←' ? d.slice(0, -1) : (d + k).slice(0, 4)));

  return (
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '26px 26px 22px',
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
      <div style={{ font: '800 42px/.96 Archivo, system-ui', letterSpacing: '-.03em', marginTop: 8 }}>
        Driver
      </div>
      <div style={{ height: 2, background: DIV, margin: '12px 0' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 10px', fontSize: 12 }}>
        <Fact label="Terminal" value={`${TRIP.terminal.class} · ${TRIP.terminal.terminalNo}`} size={15} />
        <Fact label="Depot" value={TRIP.depot.short} size={15} />
        <Fact label="Build" value={TRIP.build} size={15} />
        <Fact label="Last sync" value={`${TRIP.downloadedAt} · depot wifi`} size={15} />
      </div>

      <div style={{ height: 2, background: DIV, margin: '12px 0' }} />

      {/* ⚠ Odometer out. Typed, like everything else about this vehicle that the
          app claims — a reading nobody entered is a reading nobody can be asked
          about. Ungated on purpose: a driver who cannot read the dial in the dark
          must still be able to start his run, and the debrief says plainly that
          it has no distance rather than inventing one. */}
      <label style={{ display: 'block' }}>
        <span
          style={{
            display: 'block',
            font: '600 10px Archivo, system-ui',
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            opacity: 0.55,
            marginBottom: 4,
          }}
        >
          Odometer out · km
        </span>
        <input
          className="input"
          inputMode="numeric"
          value={s.odoOut}
          placeholder={String(VEHICLE.lastOdometer)}
          onChange={(e) => set({ odoOut: e.target.value.replace(/[^\d]/g, '') })}
          style={{ minHeight: 44, borderRadius: 0, font: '600 15px Archivo, system-ui' }}
        />
      </label>
      <div style={{ fontSize: 11, opacity: 0.6, marginTop: 5 }}>
        Last on {VEHICLE.reg}: {fmtKm(VEHICLE.lastOdometer)} km · came down with the run
      </div>

      <div style={{ height: 2, background: DIV, margin: '12px 0' }} />
      <div className="pretty" style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.45 }}>
        Enter your staff PIN. This run was downloaded on the depot wifi at {TRIP.downloadedAt} and works
        with no signal all day.
      </div>

      <div style={{ display: 'flex', gap: 8, margin: '14px 0 6px' }}>
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
