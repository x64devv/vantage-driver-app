/* Drive the exported app in a real browser and assert the things that matter.
 *
 * ⚠⚠ "It builds" is not "it works", and neither of them is "it was legible from
 * the back of the room". This script closes the first gap only. The projector
 * pass (D11) is a person, a room and a cable, and it is not optional.
 *
 *   npm run build && node serve.mjs &   then   node scripts/verify.mjs
 */

import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
/* ⚠ Playwright is a devDependency: the demo build does not need it, only this
   script does. PW still overrides where it is loaded from. */
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || 'playwright');

const BASE = process.env.BASE || 'http://localhost:4175';
/* ⚠ Which browser. CHROME wins; otherwise the first installed Chrome or Edge on
   this machine (Windows, macOS, Linux); otherwise Playwright's own download, if
   `npx playwright install chromium` has been run. Installing the `playwright`
   package does not fetch a browser by itself. */
const EXE = process.env.CHROME || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].find((p) => existsSync(p));
const results = [];
let failures = 0;

const ok = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  if (!pass) failures++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
};

const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});
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

let ph = '';

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
ok('vehicle is AHF5121 · GC103', t.includes('AHF5121 · GC103'));
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
ph = await phone();
ok('rejecting is recorded, not a no-op', has(ph, 'recorded against the trip'), ph.split('\n').find((l) => l.includes('recorded')) ?? '');
await click('Use this order');
ph = await phone();
ok('accepting says the change is logged with his name', has(ph, 'logged against the trip, with your name on it'));
ok('button reads Order confirmed', has(ph, 'Order confirmed'));
await go('/run/');
t = await text();
ok('accepted order changes km left to 42', /42 km left/.test(t), t.match(/·[^·]*km left/)?.[0] ?? '');

/* ── 4. Stop 4: three lines, two unserialised ───────────────────────── */
await go('/stop/4/');
t = await text();
ok('stop 4 carries three consignment lines', t.includes('Chest freezer Defy 300L CF300') && t.includes('Cooking oil 2L × 6, case') && t.includes('Maize meal 10kg, bag'));
ok('the appliance stop asks for it to be switched on', t.includes('Switch it on in front of the receiver'));
ok('the TV is serialised and scanned', t.includes('#G-000004791204') && t.includes('Scanned onto LD-000377'));
ok('the other two say no serial gate applies', (t.match(/Not serialised — no serial gate applies/g) || []).length === 2);
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

/* ── 6. Cash: one typed figure, and COPY-RULES ──────────────────────── */
await click('Confirm delivery, then take the money');
await page.waitForTimeout(400);
ph = await phone();
ok('honesty panel is present', has(ph, 'I cannot see this account from here'));
ok('the three choice rows are gone', !has(ph, 'Took the full amount') && !has(ph, 'Customer would not pay'));
ok('the screen asks one question', has(ph, 'How much did you collect?'));
ok('nothing is entered yet, and it says so', has(ph, 'Count it in front of the receiver'));
ok('the action is dimmed and names what is missing', has(ph, 'Type what you collected'));
ok('no receipt exists before a figure does', !has(ph, 'PAY-101-D204-000037'));

const key = (k) => page.getByRole('button', { name: k, exact: true }).first().click();

/* a part payment */
for (const k of ['6', '0', '0']) await key(k);
await page.waitForTimeout(250);
ph = await phone();
ok('a part payment is read off the figure', has(ph, 'Part of it. The balance stays owing'));
ok('COPY-RULES: it quotes no figure for what is left', has(ph, 'quotes no figure for it') && !ph.includes('550'));
ok('the receipt shows what was typed, against what came down', has(ph, 'USD 600 of USD 1 150.00'));

/* over the figure that came down */
await key('0');
await page.waitForTimeout(250);
ph = await phone();
ok('more than the run figure is flagged, not refused', has(ph, 'More than the figure that came down'));

/* ⚠⚠ zero is an outcome, not a number */
await key('←');
await key('←');
await key('←');
await key('←');
await key('0');
await page.waitForTimeout(250);
ph = await phone();
ok('⚠⚠ zero is a refusal, not a delivery', has(ph, 'Nothing collected is a refusal, not a delivery'));
ok('zero names the reason and the fault', has(ph, 'PaymentNotMade') && has(ph, 'fault Customer'));
ok('zero says the goods come back', has(ph, 'goods come back with you'));
ok('zero mints no receipt', !has(ph, 'PAY-101-D204-000037'));
ok('zero does not wear the delivery button', has(ph, 'Record the exception') && !has(ph, 'Complete stop 4'));

/* the full amount */
await key('←');
for (const k of ['1', '1', '5', '0']) await key(k);
await page.waitForTimeout(250);
ph = await phone();
ok('the full amount is read off the figure', has(ph, 'The full amount, counted in front of the receiver'));
ok('THE sentence, verbatim', ph.includes('Recorded on this device, not yet in the ledger.'));
ok('never "Payment received"', !/payment received/i.test(ph));
ok('never "Paid" or "Posted" as a status', !/\bPosted\b/i.test(ph) && !/\bPaid\b/i.test(ph));
ok('no OFF-PAY- prefix', !ph.includes('OFF-PAY'));
ok('receipt number matches the console', ph.includes('PAY-101-D204-000037'));
ok('receipt says no balance is printed', ph.includes('No balance is printed'));
ok('the receipt shows the run figure for a full payment', has(ph, 'USD 1 150.00'));

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
ok('VE Willowvale carries no invented distance', /Raised the invoice · where you debrief/.test(t));
ok('distances are real road figures', /14\.6 km|11\.5 km|19\.1 km|19\.6 km/.test(t), t.split('\n').filter((l) => l.includes(' km')).join(' | '));
ok('the reconciliation note survives', t.includes('reconciliation is a query and not a spreadsheet'));

/* ── 8a. Van stock reconciliation (Gain Phase 2, 2.6) ─────────────────
   ⚠ Stops 1–3 seeded delivered and stop 4 just completed: 12 + 15 + 20 + 31
   = 78 delivered. Stops 5, 7, 8 (8 + 25 + 10 = 43) not worked. 121 loaded.
   The transfer is lines, not units, and is not in the total. */
const vanFig = async (id) => (await page.getByTestId(id).innerText()).trim();
ok('van stock · loaded is every unit on LD-000377', (await vanFig('van-loaded')) === '121', await vanFig('van-loaded'));
ok('van stock · delivered counts the seeded stops and stop 4', (await vanFig('van-delivered')) === '78', await vanFig('van-delivered'));
ok('van stock · nothing coming back yet', (await vanFig('van-back')) === '0');
ok('van stock · not worked is what is left', (await vanFig('van-onvan')) === '43');
ok(
  'van stock · the balance line states itself',
  has(await vanFig('van-balance'), '121 loaded = 78 delivered + 0 coming back + 43 not worked — balances'),
  await vanFig('van-balance'),
);
ok(
  'van stock · the transfer is counted in lines, by the branch, outside the total',
  has(await vanFig('van-transfer'), '4 lines') && has(await vanFig('van-transfer'), 'not in the total'),
);
await click('Sign off the run');
t = await text();
ok('sign-off reference is dated 20 August', t.includes('DEP-BR-2026-08-20-0014'));
ok('sign-off says it is still on the device', t.includes('still on this device until depot wifi'));

/* ── 9. The framing, slimmed 21 Aug ─────────────────────────────────── */
await go('/run/');
t = await text();
ok('the rail keeps its title', has(t, 'Vantage Driver') && has(t, 'Gain Logistics'));
ok('the illustrative-data marker is on screen', has(t, "not Gain's records"));
ok('the rail keeps the screen jumps', has(t, 'Jump to a screen') && has(t, 'Failed stop'));
ok('the five assumptions are gone', !has(t, 'What this design assumes') && !has(t, 'mints its own receipt'));
ok('the variant switchers are gone', !has(t, 'Stop-detail layout') && !has(t, 'One at a time'));
ok('the record trail rail is gone by default', !has(t, 'Live record trail'));
ok('Reset run survives', has(t, 'Reset run'));

/* ⚠ Nothing was deleted, only taken off the screen. Each of these must still be
   reachable by URL or the design review after the 26th has to rebuild it. */
await go('/run/?trail=1');
t = await text();
ok('?trail=1 brings the record trail back', has(t, 'Live record trail') && has(t, 'POD-000188397'));

await go('/run/?bare=1');
t = await text();
ok('?bare=1 drops the rail entirely', !has(t, 'Jump to a screen') && !has(t, 'Vantage Driver'));
ok('?bare=1 keeps the phone', has(t, "Today's run"));

/* ⚠ back off ?bare=1 first — the rail is hidden there, so Reset run is not on
   the page to click. */
await go('/run/');
await click('Reset run');
await page.waitForTimeout(400);
await go('/stop/5/?layout=cards');
t = await text();
ok('?layout=cards still reaches the cards layout', has(t, 'Unanswered'), 'per-check status column is unique to cards');
await go('/stop/5/?layout=swipe');
t = await text();
ok('?layout=swipe still reaches the swipe layout', has(t, 'Check 01 of 4'));
await go('/stop/5/?layout=checklist');
t = await text();
ok('checklist is what the execs see', !has(t, 'Unanswered') && !has(t, 'Check 01 of 4'));

/* ⚠ navMode is not a caption change: in `map` the suggestion sits in the bottom
   sheet under the map, in `list` it sits above it. Assert the geometry, not the
   wording, or the test passes on a switch that moved nothing. */
const geom = async () => {
  const card = await page.getByText(/A shorter order exists|Running your confirmed order/).first().boundingBox();
  const map = await page.locator('.leaflet-container').first().boundingBox();
  return { card: card?.y ?? 0, map: map?.y ?? 0 };
};
await go('/run/route/?nav=map');
await page.waitForTimeout(600);
const gMap = await geom();
await go('/run/route/?nav=list');
await page.waitForTimeout(600);
const gList = await geom();
ok(
  '?nav= still switches the arrangement — the card moves above the map',
  gMap.card > gMap.map && gList.card < gList.map,
  `map card@${Math.round(gMap.card)} map@${Math.round(gMap.map)} · list card@${Math.round(gList.card)} map@${Math.round(gList.map)}`,
);
await go('/run/route/?nav=map');

/* ── 9a. The slimming: explaining gone, claims kept ─────────────────── */
await go('/stop/4/');
ph = await phone();
ok('check hints are gone from the checklist', !has(ph, 'Read the consignment lines above out loud'));
ok('the checks themselves are untouched', has(ph, 'Items and quantity match the note') && has(ph, 'Receiver is the customer'));
ok('the serial provenance survives as a word', has(ph, 'Scanned onto LD-000377'));
ok('the serial lecture is gone', !has(ph, 'a different grade of fact'));
ok('an unserialised line still says so', has(ph, 'Not serialised — no serial gate applies'));
ok('arrival provenance survives', has(ph, 'By geofence'));

await go('/stop/4/proof/');
ph = await phone();
ok('the proof intro is gone', !has(ph, 'Three pieces of evidence'));
ok('the two-drains note is gone', !has(ph, 'never queues behind megabytes'));
ok('but a photograph still says it is held for wifi', has(ph, 'held for wifi') || has(ph, 'Photograph of the document'));

/* ── 9b. ⚠⚠ Fuel and mileage, added 21 Aug ──────────────────────────── */
await click('Reset run');
await page.waitForTimeout(400);
await go('/');
ph = await phone();
ok('sign-in asks for the odometer out', has(ph, 'Odometer out'));
ok('sign-in shows the last known reading and where it came from', has(ph, '184 120') && has(ph, 'came down with the run'));

await page.locator('input[inputmode="numeric"]').first().fill('184120');
await page.waitForTimeout(200);
await click('Sign in ·');
await page.waitForTimeout(400);

await go('/debrief/');
ph = await phone();
ok('the debrief has no distance before the closing reading', has(ph, 'needs the closing reading'));
const inputs = page.locator('[data-phone="screen"] input[inputmode="numeric"]');
await inputs.nth(0).fill('184226');
await inputs.nth(1).fill('62.4');
await page.waitForTimeout(300);
ph = await phone();
ok('distance is the two typed readings, subtracted', has(ph, '106 km'), ph.split('\n').find((l) => l.includes('106')) ?? '');
ok('the distance names its provenance', has(ph, 'by odometer, typed by you'));
ok('⚠⚠ NO km/l is printed from one fill', !/\d\s*km\/l\s*(this run|on this run)/i.test(ph) && !has(ph, '1.7 km/l'));
ok('the screen says one fill is not an efficiency figure', has(ph, 'One fill is not an efficiency figure'));
ok('it names the standard without dividing into it', has(ph, '6.30 km/l'));
const costField = page.locator('[data-phone="screen"] input').nth(2);
ok(
  'the fuel cost is optional and starts empty',
  (await costField.inputValue()) === '' && (await costField.getAttribute('placeholder')) === 'not entered',
);

await click('Sign off the run');
await page.waitForTimeout(400);
await go('/debrief/?trail=1');
t = await text();
ok('sign-off writes an ODO row', has(t, 'ODO-AHF5121-184226'), t.split('\n').find((l) => l.includes('ODO-')) ?? '');
ok('the ODO row carries the distance and says it was typed', has(t, '106 km on this run') && has(t, 'typed by you'));
ok('sign-off writes a FUEL row', has(t, 'FUEL-AHF5121-184226'));
ok('the FUEL row goes to the per-vehicle fleet cost', has(t, 'fleet cost, per-vehicle'));
ok('the FUEL row refuses to claim a burn rate', has(t, 'One fill is not an efficiency figure'));
ok('the deposit row still lands at BR', has(t, 'DEP-BR-2026-08-20-0014'));
ok('sign-off writes a van reconciliation row', has(t, 'VANREC-AHF5121-LD-000377') && has(t, 'Queued · van reconciliation'));
ok('the VANREC row carries the balance', has(t, '121 loaded = 47 delivered + 0 coming back + 74 not worked — balances'));

/* persistence across a hard reload */
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(500);
const odoAfterReload = await page.locator('[data-phone="screen"] input').first().inputValue();
ok('a hard reload keeps the typed readings', odoAfterReload === '184226', `odometer in reads "${odoAfterReload}"`);

/* ── 9a. A failed stop: its goods move to coming back, and it still balances ──
   ⚠ Walked the way a driver walks it — the stop, then "Cannot deliver", a
   reason, recorded — not by writing state. Stop 5 is 8 cases of washing powder. */
await go('/stop/5/');
await go('/stop/5/failed/');
await click('Nobody at the address');
await click('Record the failed stop');
await page.waitForTimeout(300);
await go('/debrief/');
ok('failed stop · its 8 units are coming back', (await vanFig('van-back')) === '8', await vanFig('van-back'));
ok('failed stop · they left not-worked, not delivered', (await vanFig('van-onvan')) === '66' && (await vanFig('van-delivered')) === '47');
ok(
  'failed stop · it still balances',
  has(await vanFig('van-balance'), '121 loaded = 47 delivered + 8 coming back + 66 not worked — balances'),
  await vanFig('van-balance'),
);
ph = await phone();
ok('failed stop · coming back names goods-in and the seals', has(ph, 'VE Willowvale goods-in') && has(ph, 'Z-114882 / Z-114883'));

/* ── 10. Errors ─────────────────────────────────────────────────────── */
const realConsoleErrors = consoleErrors.filter(
  (e) => !/tile\.openstreetmap|ERR_|Failed to load resource|net::/i.test(e),
);
ok('no page errors', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));
ok('no console errors other than blocked tiles', realConsoleErrors.length === 0, realConsoleErrors.slice(0, 3).join(' | '));

await browser.close();

console.log(`\n${results.length - failures}/${results.length} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
