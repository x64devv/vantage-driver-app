/* The demo fixture for Vantage Driver — one truck, one driver, one run.
 *
 * Source: design_handoff_driver_app/data/run.json, put through a data-truth pass
 * on 20 August 2026 before a single screen was built (build step D2).
 *
 * ⚠⚠ THE RULE THIS FILE EXISTS TO KEEP: this app and the console tell the SAME
 * story about invoice 414414. Beat 13 of the demo is the console's search screen
 * showing that invoice as one continuous record; if the two disagree, the closing
 * argument of the whole demo dies in the room. Where they disagreed, the DRIVER
 * APP MOVED — Wyne's call, 20 Aug. Never the other way round: the console's
 * identities are the ones checked against TVSH's Fleet Register.
 *
 * What changed from the handoff, and why:
 *
 *  | handoff said                    | now reads                    | why                                    |
 *  |---------------------------------|------------------------------|----------------------------------------|
 *  | 2026-08-26, "THURSDAY 26 AUGUST"| 2026-08-20, THURSDAY 20 AUG  | ⚠⚠ 26 Aug 2026 is a WEDNESDAY. The     |
 *  |                                 |                              | handoff's own kicker is wrong. 20 Aug  |
 *  |                                 |                              | is the console's seeded Thursday.      |
 *  | TR-HRE-2026-08-26-04            | TR-HRE-2026-08-20-05         | the console's TM-4 names this trip     |
 *  | AFR 8615                        | AGE5599 · TVS103             | AFR 8615 is from TRP-004's worked      |
 *  |                                 | UD Kuzer, 22.0 m³            | example and is NOT in the Harare demo  |
 *  |                                 |                              | fleet. AGE5599 is in the Register.     |
 *  | Chiwayo, STAFF-1183             | T. Mukanya, crew W. Sibindi  | the console's TM-4 names them          |
 *  | Zone B · Harare east            | Zone C · Greendale / East    | ⚠ Zone B is Borrowdale in TVSH's real  |
 *  |                                 |                              | zone table. The console's seeded trip  |
 *  |                                 |                              | is Zone C, and its name is "Greendale  |
 *  |                                 |                              | / East" — which is what this run is.   |
 *  | stop 4: 1 line (the TV)         | 3 lines                      | TM-4 reads "Delivered 3 of 3": the TV, |
 *  |                                 |                              | the bracket, the home theatre. Only    |
 *  |                                 |                              | the TV is serialised — a better screen |
 *  |                                 |                              | anyway, because it shows both cases.   |
 *  | HL · Highlands (deposit branch) | AV · Avondale                | ⚠⚠ THERE IS NO HIGHLANDS BRANCH.       |
 *  |                                 |                              | Highlands is a suburb. AV Avondale is  |
 *  |                                 |                              | a real TVSH branch code. Same error    |
 *  |                                 |                              | class as the console's, and it is the  |
 *  |                                 |                              | one that turns "they built this from   |
 *  |                                 |                              | our data" into "they made this up".    |
 *  | DEP-BR-2026-08-26-0014          | DEP-BR-2026-08-20-0014       | follows the date                       |
 *  | photos 14:06 / 14:07, sig 14:07 | 14:09 / 14:10, sig 14:11     | ⚠ the handoff photographed the goods a |
 *  |                                 |                              | minute BEFORE the 14:07 geofence       |
 *  |                                 |                              | arrival. Re-sequenced (Wyne, 20 Aug):  |
 *  |                                 |                              | evidence first, signature last, and    |
 *  |                                 |                              | the signature lands on the console's   |
 *  |                                 |                              | 14:11 alongside the cash.              |
 *
 * ⚠ Kept exactly as the handoff has them, because they are the console's too:
 * receipt PAY-101-D204-000037 · terminal D204 / store 101 · load LD-000377 and
 * its seals · USD 1 150.00 · the 06:41 download · the 14:07 geofence arrival ·
 * the 18:12 debrief. Changing any of these means changing the console as well.
 *
 * ⚠ Openly invented, as the handoff's own fixture was: customer names and
 * addresses, consignment numbers, SKUs, phone numbers, the odometer and fuel
 * figures. The two SKUs on the bracket and the home theatre are new here and are
 * marked where they appear. Every ROAD figure — kilometres and minutes — is real
 * and comes from lib/routes-cache.ts.
 */

export type CapturedBy = 'Scanned' | 'Typed';

export type Line = {
  desc: string;
  sku: string;
  qty: number;
  /** null when the line carries no serial — the screen says so rather than going blank. */
  serial: string | null;
  capturedBy?: CapturedBy;
  boundAt?: string;
  boundOnLoadUnit?: string;
};

export type Cash = { amount: string; currency: 'USD' | 'ZWG'; what: string };

export type Stop = {
  id: number;
  seq: number;
  seeded: 'delivered' | 'current' | 'pending';
  customer: string;
  address: string;
  addressFull: string;
  area: string;
  phone: string;
  window: string;
  latlng: [number, number];
  consignment: string;
  invoice?: string;
  htb: boolean;
  cash: Cash | null;
  arrival?: { at: string; source: 'Geofence' | 'Button' };
  lines: Line[];
  receiptScanAtFarEnd?: boolean;
};

export const TRIP = {
  id: 'TR-HRE-2026-08-20-05',
  date: '2026-08-20',
  /** ⚠⚠ Thursday. 26 August 2026 is a Wednesday — the handoff's kicker was wrong. */
  kicker: 'THURSDAY 20 AUGUST',
  zone: 'Zone C · Greendale / East',
  vehicle: 'AGE5599 · TVS103',
  vehicleMake: 'UD Kuzer, 22.0 m³',
  load: 'LD-000377',
  seals: ['Z-114882', 'Z-114883'],
  crewSize: 2,
  depot: { code: 'VE', name: 'Village Walk Electrical', short: 'VE Village Walk' },
  /** ⚠ STAFF-1183 came from the handoff attached to a different name. The Fleet
   *  Register holds no staff numbers, so it is kept and is invented — as is the
   *  crew number. Both are marked here rather than left to look sourced. */
  driver: { name: 'T. Mukanya', staffNo: 'STAFF-1183' },
  crew: { name: 'W. Sibindi', staffNo: 'STAFF-1206' },
  terminal: { storeNo: '101', terminalNo: 'D204', class: 'T9' },
  downloadedAt: '06:41',
  build: '0.1.0 · driverApp',
  startPosition: [-17.808, 31.14] as [number, number],
  /** The plan that came down with the run. */
  dispatcherOrder: [4, 5, 6, 7, 8],
  /** ⚠⚠ OSRM's own answer over the same five stops, verified by brute force over
   *  all 24 orders on 20 Aug 2026. The handoff's [4,5,7,6,8] ("Avondale before
   *  Borrowdale") measured 58.43 km / 80.2 min — 1.4 km and 2.2 minutes WORSE
   *  than the dispatcher's order. It was a placeholder with nothing behind it. */
  optimisedOrder: [4, 6, 7, 8, 5],
};

export const CLOCKS = { signin: '06:44', run: '14:07', debrief: '18:12' };

/* ⚠ The three moments the evidence is captured. Ordered so that the signature is
 * last, which is what the screen says: "Three pieces of evidence, then the
 * signature. The line set locks the moment it is signed." The console's TM-4
 * evidence rows carry the same three times. */
export const CAPTURED = { goods: '14:09', id: '14:10', signature: '14:11', cash: '14:11' };

export const STOPS: Stop[] = [
  {
    id: 1, seq: 1, seeded: 'delivered',
    customer: 'T. Nyamayaro', address: '14 Ridgeway North, Highlands',
    addressFull: '14 Ridgeway North, Highlands, Harare', area: 'Highlands',
    phone: '0772 118 004', window: '08:30', latlng: [-17.79, 31.11],
    consignment: 'CN-VE-000402', htb: false, cash: null,
    lines: [{ desc: 'Defy 4-plate stove', sku: 'OB-MP-GB-1104402', qty: 1, serial: '#G-000004778112', capturedBy: 'Scanned' }],
  },
  {
    id: 2, seq: 2, seeded: 'delivered',
    customer: 'Chisipite Junior School', address: 'Cnr Hindhead / Chisipite Ave',
    addressFull: 'Cnr Hindhead / Chisipite Ave, Chisipite, Harare', area: 'Chisipite',
    phone: '0242 495 118', window: '09:15', latlng: [-17.775, 31.12],
    consignment: 'CN-VE-000407', htb: false, cash: null,
    lines: [{ desc: 'Hisense 43" A4H × 3', sku: 'OB-MP-GB-3010433', qty: 3, serial: '3 serials bound', capturedBy: 'Scanned' }],
  },
  {
    id: 3, seq: 3, seeded: 'delivered',
    customer: 'M. Kadzviti', address: '8 Arcturus Rd, Greendale',
    addressFull: '8 Arcturus Rd, Greendale, Harare', area: 'Greendale',
    phone: '0771 440 233', window: '10:40', latlng: [-17.806, 31.135],
    consignment: 'CN-VE-000411', htb: true, cash: null,
    lines: [{ desc: 'Restonic queen bed set', sku: 'OB-MP-GB-5500121', qty: 1, serial: null }],
  },
  {
    /* ⚠⚠ THE STOP THE WHOLE DEMO TURNS ON. Every identity below appears on the
       console's TM-4 record for invoice 414414 and must match it exactly. */
    id: 4, seq: 4, seeded: 'current',
    customer: 'Nancy Muhoni', address: 'Unit 7 Stand 312, St Malo, Greendale',
    addressFull: 'Unit 7 Stand 312 St Malo, Greendale, Harare', area: 'Greendale',
    phone: '0773 637 984', window: '13:45', latlng: [-17.8012, 31.1284],
    consignment: 'CN-VE-000418', invoice: '414414', htb: false,
    cash: { amount: 'USD 1 150.00', currency: 'USD', what: 'Balance on cash sale, invoice 414414' },
    arrival: { at: '14:07', source: 'Geofence' },
    lines: [
      { desc: 'CTV Samsung 85" QA85Q7FAAUXKE', sku: 'OB-MP-GB-301071066', qty: 1, serial: '#G-000004791204', capturedBy: 'Scanned', boundAt: '07:12', boundOnLoadUnit: 'LD-000377 / 4' },
      /* ⚠ These two lines come from the console's TM-4 goods list ("Delivered 3
         of 3"). Their SKUs are invented — the console records the descriptions
         only, and no SKU for either exists anywhere in the material. They are in
         the same made-up OB-MP-GB- series as every other SKU in this fixture. */
      { desc: 'TV Bracket Ellis 60-120"', sku: 'OB-MP-GB-3019921', qty: 1, serial: null },
      { desc: 'Sony 600W Home Theatre 5.1Ch HT-S40R', sku: 'OB-MP-GB-3060412', qty: 1, serial: null },
    ],
  },
  {
    id: 5, seq: 5, seeded: 'pending',
    customer: 'R. Mabhena', address: '31 Enterprise Rd, Msasa',
    addressFull: '31 Enterprise Rd, Msasa, Harare', area: 'Msasa',
    phone: '0778 220 761', window: '15:10', latlng: [-17.85, 31.12],
    consignment: 'CN-VE-000421', htb: true,
    cash: { amount: 'ZWG 4 200.00', currency: 'ZWG', what: 'HTB arrears promised on delivery' },
    lines: [{ desc: 'Defy chest freezer 210L', sku: 'OB-MP-GB-13070042', qty: 1, serial: null }],
  },
  {
    id: 6, seq: 6, seeded: 'pending',
    customer: 'Borrowdale branch', address: 'Shop 12, Sam Levy Village',
    addressFull: 'Shop 12, Sam Levy Village, Borrowdale, Harare', area: 'Borrowdale',
    phone: '0242 885 010', window: '16:00', latlng: [-17.75, 31.09],
    consignment: 'CN-VE-000424', htb: false, cash: null, receiptScanAtFarEnd: true,
    lines: [{ desc: 'Inter-branch transfer, 4 lines', sku: 'Multiple', qty: 4, serial: 'Receipt scan at branch' }],
  },
  {
    id: 7, seq: 7, seeded: 'pending',
    customer: 'P. Chikafu', address: '5 Fenwick Rd, Avondale',
    addressFull: '5 Fenwick Rd, Avondale, Harare', area: 'Avondale',
    phone: '0776 301 992', window: '16:45', latlng: [-17.797, 31.035],
    consignment: 'CN-VE-000427', htb: true, cash: null,
    lines: [{ desc: 'Whirlpool 7kg washer', sku: 'OB-MP-GB-2201107', qty: 1, serial: '#G-000004788051', capturedBy: 'Scanned', boundAt: '07:26', boundOnLoadUnit: 'LD-000377 / 7' }],
  },
  {
    id: 8, seq: 8, seeded: 'pending',
    customer: 'L. Sibanda', address: '112 Seke Rd, Hatfield',
    addressFull: '112 Seke Rd, Hatfield, Harare', area: 'Hatfield',
    phone: '0712 664 108', window: '17:30', latlng: [-17.88, 31.08],
    consignment: 'CN-VE-000429', htb: false, cash: null,
    lines: [{ desc: 'Sansui 55" smart TV', sku: 'OB-MP-GB-3010551', qty: 1, serial: '#G-000004790884', capturedBy: 'Scanned', boundAt: '07:31', boundOnLoadUnit: 'LD-000377 / 8' }],
  },
];

export const stopById = (id: number) => STOPS.find((s) => s.id === id) ?? STOPS[3];

export type CheckId = 'c1' | 'c2' | 'c3' | 'c4';

export const CHECKS: { id: CheckId; label: string; hint: string }[] = [
  { id: 'c1', label: 'Items and quantity match the note', hint: 'Read the consignment lines above out loud with the receiver.' },
  { id: 'c2', label: 'Packaging and casing undamaged', hint: 'Screen, glass, panels and feet — before it comes off the truck.' },
  { id: 'c3', label: 'Placed where the customer wants it', hint: 'Positioned and levelled. Not left in a passage.' },
  { id: 'c4', label: 'Receiver is the customer or authorised by them', hint: 'Name and ID number are captured on the next screen.' },
];

export const PHOTO_SLOTS = [
  { key: 'goods' as const, label: 'The goods, in place', hint: 'Against the wall, plugged in, as the customer will find it.', at: CAPTURED.goods, size: '1.6 MB' },
  { key: 'id' as const, label: "Receiver's ID", hint: 'Photograph of the document you read the number from.', at: CAPTURED.id, size: '1.2 MB' },
];

export type ReasonCode =
  | 'NobodyHome' | 'PaymentNotMade' | 'GoodsRefused'
  | 'AccessDenied' | 'WrongItemLoaded' | 'VehicleFault';

export const REASONS: { code: ReasonCode; label: string; fault: 'Customer' | 'TVSH' }[] = [
  { code: 'NobodyHome', label: 'Nobody at the address', fault: 'Customer' },
  { code: 'PaymentNotMade', label: 'Customer will not pay at the door', fault: 'Customer' },
  { code: 'GoodsRefused', label: 'Customer refused the goods', fault: 'Customer' },
  { code: 'AccessDenied', label: 'No access — gate, road, security', fault: 'Customer' },
  { code: 'WrongItemLoaded', label: 'Wrong unit came off the truck', fault: 'TVSH' },
  { code: 'VehicleFault', label: 'Vehicle or crew could not reach it', fault: 'TVSH' },
];

/* ── Deposit branches ─────────────────────────────────────────────────────
   ⚠⚠ All three are real TVSH branch codes, checked against
   Transport-Material/demo/transport-demo-data.json. The handoff offered
   "HL · Highlands", which is a suburb and not a branch — and which it also said
   closes at 17:00, so it would have been shut at the 18:12 debrief.

   ⚠ The distances are real road distances from the run's final stop, measured
   by OSRM and held in lib/routes-cache.ts. They move when the driver confirms
   the optimised order, because the run then finishes at Msasa instead of
   Hatfield. See depositRows() in lib/derive.ts.

   ⚠⚠ VE Village Walk carries NO distance. OpenStreetMap has no Village Walk in
   Harare and TVSH holds no branch coordinates, so there is no figure anybody
   could stand behind. Its row says what is true of it instead. Never invent a
   coordinate to fill a table cell. */
export const DEPOSIT_BRANCHES = [
  { code: 'BR' as const, label: 'BR · Borrowdale', note: 'On your run · stop 6, Sam Levy Village', tag: 'On your run' },
  { code: 'VE' as const, label: 'VE · Village Walk', note: 'Raised the invoice · where you debrief', tag: 'Selling' },
  { code: 'AV' as const, label: 'AV · Avondale', note: '', tag: 'Nearest' },
];

export type DepositCode = 'BR' | 'VE' | 'AV';

export const DEBRIEF = {
  odometer: '184 226 km',
  fuelDrawn: '62.4 L · card',
  sealsReturned: 'Z-114882/83',
  signedOffAt: '18:14',
  depositRef: 'DEP-BR-2026-08-20-0014',
  cashZwg: 'ZWG 4 200.00',
};

/* ── The receipt series ───────────────────────────────────────────────────
   PAY-<store>-<terminal>-<sequence6>, minted on the device with no server round
   trip. The terminal is inside the number, so one identity runs all the way
   down — offline and in the ledger. ⚠⚠ NO `OFF-PAY-` PREFIX, EVER. Gaps in the
   sequence are correct and are an audit feature. TRP-004 §6.1–6.2.
   ⚠ This exact number appears on the console's TM-4 and resolves in its search
   box. Changing it means changing the console too. */
export const RECEIPT_NO = `PAY-${TRIP.terminal.storeNo}-${TRIP.terminal.terminalNo}-000037`;

export const SEEDED_TRAIL = [
  { ref: 'POD-000188397', detail: 'Stop 3 · M. Kadzviti · signed 10:52, functional test passed', dest: 'Queued · outcome drain', state: 'Queued' as const },
  { ref: 'PROOF-MEDIA ×3', detail: 'Stop 1–3 photographs, 7.4 MB', dest: 'Waiting for wifi', state: 'Held' as const },
];
