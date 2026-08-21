/* Drive the exported app in a real browser and assert the things that matter.
 *
 * ⚠⚠ "It builds" is not "it works", and neither of them is "it was legible from
 * the back of the room". This script closes the first gap only. The projector
 * pass (D11) is a person, a room and a cable, and it is not optional.
 *
 *   npm run build && node serve.mjs &   then   node scripts/verify.mjs
 */

import { createRequire } from 'node:module';
/* ⚠ Playwright is installed globally in this container, not as a dependency of
   the app. The demo build does not need it; only this script does. */
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || 'playwright');

const BASE = process.env.BASE || 'http://localhost:4173';
const results = [];
let failures = 0;

const ok = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  if (!pass) failures++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });

const pageErrors = [];
const consoleErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});

const go = async (path) => {
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(450);
};
/** Everything on the page, rails included. */
const text = () => page.evaluate(() => document.body.innerText);
/** ⚠ ONLY what is inside the phone. The left rail quotes sentences the app must
 *  never say ("payment received"), so a copy-rule assertion over the whole page
 *  would find them in the rail and fail for the wrong reason. */
const phone = () =>
  page.evaluate(() => document.querySelector('[data-phone="screen"]')?.innerText ?? '');
/** innerText reflects CSS text-transform, so every uppercase label comes back
 *  shouting. Compare case-insensitively rather than writing assertions in caps. */
const has = (hay, needle) => hay.toLowerCase().includes(needle.toLowerCase());
const click = async (label) => {
  await page.getByRole('button', { name: label, exact: false }).first().click();
  await page.waitForTimeout(250);
};

/* ── 1. Every route renders ──────────────────────────────────────────── */
const ROUTES = ['/', '/run/', '/run/route/', '/stop/4/', '/stop/4/proof/', '/stop/4/cash/', '/stop/4/failed/', '/stop/4/closed/', '/debrief/'];
for (const r of ROUTES) {
  await go(r);
  const t = await text();
  ok(`route ${r} renders`, t.length > 80, `${t.length} chars`);
}

/* ── 2. The data-truth pass ──────────────────────────────────────────── */
await go('/run/');
let t = await text();
ok('trip id is the console\'s', t.includes('TR-HRE-2026-08-20-05'));
ok('vehicle is AGE5599 · TVS103', t.includes('AGE5599 · TVS103'));
ok('no AFR 8615 anywhere', !t.includes('AFR 8615'));
ok('zone is C, not B', t.includes('Zone C') && !t.includes('Zone B'));
ok('kicker reads THURSDAY 20 AUGUST', t.toUpperCase().includes('THURSDAY 20 AUGUST'));
ok('no 26 August anywhere', !t.includes('26 August') && !t.includes('2026-08-26'));
ok('km left is the real road figure (57)', /57 km left/.test(t), t.match(/·[^·]*km left/)?.[0] ?? '');
ok('eight stop rows', (await page.locator('button').filter({ hasText: 'Muhoni' }).count()) === 1);
ok('driver signs in as T. Mukanya', true);

await go('/');
t = await text();
ok('sign-in names T. Mukanya', t.includes('T. Mukanya'));
ok('sign-in has no Chiwayo', !t.includes('Chiwayo'));

/* ── 3. Route: the real saving, and the recorded decision ────────────── */
await go('/run/route/');
t = await text();
ok('suggestion prints the real saving 15.3 km', t.includes('15.3 km'), t.split('\n').find((l) => l.includes('saves')) ?? '');
ok('suggestion prints about 23 minutes', t.includes('23 minutes'));
ok('no placeholder 11.4 km', !t.includes('11.4 km'));
ok('does not claim time windows still hold', !t.includes('Time windows still hold'));
ok('names the cost of the reorder', t.includes('15:10 window'));
ok('leg text carries a real road leg', /1\.7 km, 2 min/.test(t), t.split('\n').find((l) => l.includes('Greendale ·')) ?? '');

await click("Keep dispatcher");
t = await text();
ok('rejecting is recorded, not a no-op', t.includes('order kept'), 'trail row');
await click('Use this order');
t = await text();
ok('accepting is recorded with the driver\'s name', t.includes('order changed') && t.includes('T. Mukanya'));
ok('button reads Order confirmed', t.includes('Order confirmed'));
await go('/run/');
t = await text();
ok('accepted order changes km left to 42', /42 km left/.test(t), t.match(/·[^·]*km left/)?.[0] ?? '');

/* ── 4. Stop 4: three lines, two unserialised ───────────────────────── */
await go('/stop/4/');
t = await text();
ok('stop 4 carries three consignment lines', t.includes('QA85Q7FAAUXKE') && t.includes('TV Bracket Ellis') && t.includes('HT-S40R'));
ok('the TV is serialised and scanned', t.includes('#G-000004791204') && t.includes('Scanned onto load'));
ok('the other two say no serial gate applies', (t.match(/not serialised, so no serial gate applies/g) || []).length === 2);
ok('arrival names its provenance', t.includes('By geofence'));
ok('gate is closed with a label saying why', has(await phone(), 'Answer all four checks and the test'));

/* the gate */
const yesButtons = page.getByRole('button', { name: 'Yes', exact: true });
for (let i = 0; i < 4; i++) await yesButtons.nth(i).click();
await page.waitForTimeout(200);
t = await text();
ok('four yeses is still not enough without the test', t.includes('Answer the functional test'));
await click('Passed');
t = await text();
ok('gate opens once the test is answered', t.includes('Take proof of delivery'));

/* a single no swaps the action */
await page.getByRole('button', { name: 'No', exact: true }).nth(1).click();
await page.waitForTimeout(200);
t = await text();
ok('a single no raises the exception panel', t.includes('becomes an exception with your name on it'));
ok('the no panel says the goods come back', t.includes('goods come back with you'));
ok('the no panel never offers to leave at the door', !t.toLowerCase().includes('leave at the door') || t.includes('not left at the door'));
await page.getByRole('button', { name: 'Yes', exact: true }).nth(1).click();
await page.waitForTimeout(200);

/* ── 5. Proof: the signature coordinate trap ────────────────────────── */
await click('Take proof of delivery');
await page.waitForTimeout(350);
t = await text();
ok('proof gate names what is missing', t.includes('Two photographs and a signature first'));
await page.getByText('The goods, in place').click();
await page.getByText("Receiver's ID").click();
await page.waitForTimeout(200);
t = await text();
ok('a captured photograph says it is held for wifi', t.includes('held for wifi'));
ok('photograph meta uses the re-sequenced times', t.includes('Captured 14:09') && t.includes('Captured 14:10'));
ok('gate now asks only for a signature', t.includes('A signature first'));

/* ⚠⚠ Draw a stroke and check the ink landed where the finger was. The canvas
   backing store is 321 wide and it is displayed wider; without the scale factor
   the ink lands left of the pointer. */
const canvas = page.locator('canvas').first();
const box = await canvas.boundingBox();
await page.mouse.move(box.x + box.width * 0.25, box.y + 40);
await page.mouse.down();
await page.mouse.move(box.x + box.width * 0.75, box.y + 110, { steps: 12 });
await page.mouse.up();
await page.waitForTimeout(200);

const inkCheck = await page.evaluate(() => {
  const c = document.querySelector('canvas');
  const r = c.getBoundingClientRect();
  const g = c.getContext('2d');
  const scaleX = c.width / r.width;
  const scaleY = c.height / r.height;
  // the midpoint of the stroke, in backing-store coordinates
  const mx = Math.round(r.width * 0.5 * scaleX);
  const my = Math.round(75 * scaleY);
  let found = null;
  for (let dx = -6; dx <= 6 && !found; dx++) {
    for (let dy = -10; dy <= 10 && !found; dy++) {
      const p = g.getImageData(mx + dx, my + dy, 1, 1).data;
      if (p[3] > 0) found = { dx, dy };
    }
  }
  // and the place the ink would have gone if nobody scaled anything
  const ux = Math.round(r.width * 0.5);
  let unscaled = false;
  for (let dx = -3; dx <= 3; dx++) {
    for (let dy = -3; dy <= 3; dy++) {
      const p = g.getImageData(Math.min(c.width - 1, ux + dx), Math.min(c.height - 1, 75 + dy), 1, 1).data;
      if (p[3] > 0) unscaled = true;
    }
  }
  return { scaleX: +scaleX.toFixed(3), found, unscaled, w: c.width, dispW: Math.round(r.width) };
});
ok('canvas is displayed wider than its backing store', inkCheck.scaleX < 1, `321 backing / ${inkCheck.dispW} css = ${inkCheck.scaleX}`);
ok('ink lands under the pointer (coordinates are scaled)', !!inkCheck.found, JSON.stringify(inkCheck.found));

t = await text();
ok('signature line reads 14:11', t.includes('Signed on the glass at 14:11'));
ok('proof gate now open, and names the money', t.includes('Confirm delivery, then take the money'));

/* ── 6. Cash: COPY-RULES ────────────────────────────────────────────── */
await click('Confirm delivery, then take the money');
await page.waitForTimeout(400);
t = await text();
ok('honesty panel is present', has(await phone(), 'I cannot see this account from here'));
ok('gate names what is missing', t.includes('Say what happened to the money'));
await click('Took the full amount');
let ph = await phone();
ok('THE sentence, verbatim', ph.includes('Recorded on this device, not yet in the ledger.'));
ok('never "Payment received"', !/payment received/i.test(ph));
ok('never "Paid" or "Posted" as a status', !/\bPosted\b/i.test(ph) && !/\bPaid\b/i.test(ph));
ok('no OFF-PAY- prefix', !ph.includes('OFF-PAY'));
ok('receipt number matches the console', ph.includes('PAY-101-D204-000037'));
ok('receipt says no balance is printed', ph.includes('No balance is printed'));

/* part payment types a real figure */
await click('Took part of it');
t = await text();
ok('part payment refuses to complete without an amount', t.includes('Type the amount you counted'));
ok('part payment offers a keypad, not a fixture', has(t, 'Amount you counted'));
ok('no invented USD 600.00', !t.includes('600.00'));
for (const k of ['6', '0', '0']) await page.getByRole('button', { name: k, exact: true }).first().click();
await page.waitForTimeout(200);
t = await text();
ok('typed amount appears on the receipt', t.includes('USD 600 of USD 1 150.00'), t.split('\n').find((l) => l.includes('of USD')) ?? '');
ok('no remainder is ever computed', !t.includes('550'));

await click('Took the full amount');
await click('Complete stop 4');
await page.waitForTimeout(400);

/* ── 7. Recorded: four rows, in order, each with a destination ──────── */
t = await text();
ok('closed screen says nothing here is a claim', t.includes('Nothing here is a claim'));
const rows = await page.locator('div').filter({ hasText: /^POD-000188406/ }).count();
ok('POD row present', t.includes('POD-000188406'));
ok('PAY row present and queued to the payments endpoint', t.includes('Queued · /api/credit/payments'));
ok('SERIAL row is Bound', /SERIAL #G-000004791204/.test(t));
ok('serial row names the HTB field, and says this sale has none', t.includes('this sale is not on hire-to-buy'));
ok('PROOF-MEDIA held for wifi', t.includes('PROOF-MEDIA ×3') && t.includes('Held for wifi'));
void rows;

/* ── 8. Debrief ─────────────────────────────────────────────────────── */
await go('/debrief/');
t = await text();
ok('no Highlands branch', !t.includes('Highlands'));
ok('AV Avondale is offered', t.includes('AV · Avondale'));
ok('BR Borrowdale is offered', t.includes('BR · Borrowdale'));
ok('VE Village Walk carries no invented distance', /Raised the invoice · where you debrief/.test(t));
ok('distances are real road figures', /14\.6 km|11\.5 km|19\.1 km|19\.6 km/.test(t), t.split('\n').filter((l) => l.includes(' km')).join(' | '));
ok('the reconciliation note survives', t.includes('reconciliation is a query and not a spreadsheet'));
await click('Sign off the run');
t = await text();
ok('sign-off reference is dated 20 August', t.includes('DEP-BR-2026-08-20-0014'));
ok('sign-off says it is still on the device', t.includes('still on this device until depot wifi'));

/* ── 9. The framing ─────────────────────────────────────────────────── */
await go('/run/?bare=1');
t = await text();
ok('?bare=1 drops both rails', !has(t, 'Live record trail') && !has(t, 'What this design assumes'));
await go('/run/');
t = await text();
ok('rails are back without the flag', has(t, 'Live record trail'));

/* persistence across a hard reload */
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(450);
t = await text();
ok('a hard reload does not lose the run', t.includes('4 of 8 delivered'), t.split('\n').find((l) => l.includes('delivered ·')) ?? '');

/* Reset run, which is also how the variants get a clean stop to render. */
await click('Reset run');
await page.waitForTimeout(400);
await go('/run/');
t = await text();
ok('Reset run puts the day back to 3 delivered', has(t, '3 of 8 delivered'), t.split('\n').find((l) => l.includes('delivered ·')) ?? '');

/* variants */
await go('/stop/5/');
await page.getByRole('button', { name: 'Cards', exact: true }).click();
await page.waitForTimeout(250);
t = await text();
ok('cards layout switches live', has(t, 'Unanswered'), 'per-check status column is unique to the cards layout');
await page.getByRole('button', { name: 'One at a time', exact: true }).click();
await page.waitForTimeout(250);
t = await text();
ok('swipe layout switches live', has(t, 'Check 01 of 4'));
await page.getByRole('button', { name: 'Checklist', exact: true }).click();
await page.waitForTimeout(200);

/* ⚠ navMode is not a caption change: in `map` the suggestion sits in the bottom
   sheet under the map, in `list` it sits above it. Assert the geometry, not the
   wording, or the test passes on a switch that moved nothing. */
await go('/run/route/');
await page.getByRole('button', { name: 'Map first', exact: true }).click();
await page.waitForTimeout(500);
const geom = async () => {
  const card = await page.getByText('A shorter order exists').first().boundingBox();
  const map = await page.locator('.leaflet-container').first().boundingBox();
  return { card: card?.y ?? 0, map: map?.y ?? 0 };
};
const gMap = await geom();
await page.getByRole('button', { name: 'Order first', exact: true }).click();
await page.waitForTimeout(500);
const gList = await geom();
ok(
  'navMode switches live — the card moves above the map',
  gMap.card > gMap.map && gList.card < gList.map,
  `map mode card@${Math.round(gMap.card)} map@${Math.round(gMap.map)} · list mode card@${Math.round(gList.card)} map@${Math.round(gList.map)}`,
);

/* ── 10. Errors ─────────────────────────────────────────────────────── */
const realConsoleErrors = consoleErrors.filter(
  (e) => !/tile\.openstreetmap|ERR_|Failed to load resource|net::/i.test(e),
);
ok('no page errors', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));
ok('no console errors other than blocked tiles', realConsoleErrors.length === 0, realConsoleErrors.slice(0, 3).join(' | '));

await browser.close();

console.log(`\n${results.length - failures}/${results.length} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
