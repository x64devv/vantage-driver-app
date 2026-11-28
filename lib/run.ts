/* The demo fixture for Vantage Driver — one truck, one driver, one run.
 *
 * ⚠⚠ GAIN RE-SEED, 25 Nov 2026 (branch gain/reseed). Every identity in this file
 * is ILLUSTRATIVE — not Gain's records — and follows ../GAIN-RESEED.md, the map
 * shared with the console and the dispatch tablet. TVSH's real registrations,
 * SKUs and branch names were removed. The structure, clocks, coordinates and
 * every OSRM road figure are carried over unchanged from the TVSH build.
 *
 * ⚠⚠ THE RULE THIS FILE EXISTS TO KEEP: this app and the console tell the SAME
 * story about invoice 414414, and vantage-dispatch-demo's `npm run derive`
 * regenerates this run from its dispatch day and fails if the two disagree.
 * Changing a stop, a line, a SKU or a serial here means changing
 * vantage-dispatch-demo/lib/dispatch-day.json too.
 *
 * ⚠ Kept, because the console holds them too: receipt PAY-101-D204-000037 ·
 * terminal D204 / store 101 · load LD-000377 and its seals · USD 1 150.00 · the
 * 06:41 download · the 14:07 geofence arrival · the 18:12 debrief.
 *
 * The run is wholesale: cases and bags to trade customers, with ONE serialised
 * appliance — stop 4's chest freezer. Hire-to-buy is not on this run.
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
  vehicle: 'AHF5121 · GC103',
  vehicleMake: 'UD Kuzer, 22.0 m³',
  load: 'LD-000377',
  seals: ['Z-114882', 'Z-114883'],
  crewSize: 2,
  depot: { code: 'VE', name: 'Gain Cash & Carry Willowvale', short: 'VE Willowvale' },
  /** ⚠ Invented, as every identity here is. */
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
    lines: [{ desc: 'Sugar 2kg × 10, bale', sku: 'GC-220210', qty: 12, serial: null }],
  },
  {
    id: 2, seq: 2, seeded: 'delivered',
    customer: 'Chisipite Junior School', address: 'Cnr Hindhead / Chisipite Ave',
    addressFull: 'Cnr Hindhead / Chisipite Ave, Chisipite, Harare', area: 'Chisipite',
    phone: '0242 495 118', window: '09:15', latlng: [-17.775, 31.12],
    consignment: 'CN-VE-000407', htb: false, cash: null,
    lines: [{ desc: 'Rice 10kg, bag', sku: 'GC-230010', qty: 15, serial: null }],
  },
  {
    id: 3, seq: 3, seeded: 'delivered',
    customer: 'M. Kadzviti', address: '8 Arcturus Rd, Greendale',
    addressFull: '8 Arcturus Rd, Greendale, Harare', area: 'Greendale',
    phone: '0771 440 233', window: '10:40', latlng: [-17.806, 31.135],
    consignment: 'CN-VE-000411', htb: false, cash: null,
    lines: [{ desc: 'Soft drinks 300ml × 24, crate', sku: 'GC-240324', qty: 20, serial: null }],
  },
  {
    /* ⚠⚠ THE STOP THE WHOLE DEMO TURNS ON. Every identity below appears on the
       console's TM-4 record for invoice 414414 and must match it exactly. One
       serialised appliance and two lines of wholesale cases. */
    id: 4, seq: 4, seeded: 'current',
    customer: 'Nancy Muhoni', address: 'Unit 7 Stand 312, St Malo, Greendale',
    addressFull: 'Unit 7 Stand 312 St Malo, Greendale, Harare', area: 'Greendale',
    phone: '0773 637 984', window: '13:45', latlng: [-17.8012, 31.1284],
    consignment: 'CN-VE-000418', invoice: '414414', htb: false,
    cash: { amount: 'USD 1 150.00', currency: 'USD', what: 'Balance on cash sale, invoice 414414' },
    arrival: { at: '14:07', source: 'Geofence' },
    lines: [
      { desc: 'Chest freezer Defy 300L CF300', sku: 'GC-130730', qty: 1, serial: '#G-000004791204', capturedBy: 'Scanned', boundAt: '07:12', boundOnLoadUnit: 'LD-000377 / 4' },
      { desc: 'Cooking oil 2L × 6, case', sku: 'GC-200206', qty: 10, serial: null },
      { desc: 'Maize meal 10kg, bag', sku: 'GC-210010', qty: 20, serial: null },
    ],
  },
  {
    id: 5, seq: 5, seeded: 'pending',
    customer: 'R. Mabhena', address: '31 Enterprise Rd, Msasa',
    addressFull: '31 Enterprise Rd, Msasa, Harare', area: 'Msasa',
    phone: '0778 220 761', window: '15:10', latlng: [-17.85, 31.12],
    consignment: 'CN-VE-000421', htb: false,
    cash: { amount: 'ZWG 4 200.00', currency: 'ZWG', what: 'Account balance promised on delivery' },
    lines: [{ desc: 'Washing powder 2kg × 9, case', sku: 'GC-250209', qty: 8, serial: null }],
  },
  {
    id: 6, seq: 6, seeded: 'pending',
    customer: 'Metro Borrowdale', address: 'Metro Borrowdale, Borrowdale Rd',
    addressFull: 'Metro Borrowdale, Borrowdale Rd, Borrowdale, Harare', area: 'Borrowdale',
    phone: '0242 885 010', window: '16:00', latlng: [-17.75, 31.09],
    consignment: 'CN-VE-000424', htb: false, cash: null, receiptScanAtFarEnd: true,
    lines: [{ desc: 'Inter-branch transfer, 4 lines', sku: 'Multiple', qty: 4, serial: 'Receipt scan at branch' }],
  },
  {
    id: 7, seq: 7, seeded: 'pending',
    customer: 'P. Chikafu', address: '5 Fenwick Rd, Avondale',
    addressFull: '5 Fenwick Rd, Avondale, Harare', area: 'Avondale',
    phone: '0776 301 992', window: '16:45', latlng: [-17.797, 31.035],
    consignment: 'CN-VE-000427', htb: false, cash: null,
    lines: [{ desc: 'Bread flour 10kg, bag', sku: 'GC-260010', qty: 25, serial: null }],
  },
  {
    id: 8, seq: 8, seeded: 'pending',
    customer: 'L. Sibanda', address: '112 Seke Rd, Hatfield',
    addressFull: '112 Seke Rd, Hatfield, Harare', area: 'Hatfield',
    phone: '0712 664 108', window: '17:30', latlng: [-17.88, 31.08],
    consignment: 'CN-VE-000429', htb: false, cash: null,
    lines: [{ desc: 'Candles 6s × 30, case', sku: 'GC-270630', qty: 10, serial: null }],
  },
];

export const stopById = (id: number) => STOPS.find((s) => s.id === id) ?? STOPS[3];

export type CheckId = 'c1' | 'c2' | 'c3' | 'c4';

export const CHECKS: { id: CheckId; label: string; hint: string }[] = [
  { id: 'c1', label: 'Items and quantity match the note', hint: 'Read the consignment lines above out loud with the receiver.' },
  { id: 'c2', label: 'Packaging and casing undamaged', hint: 'Cases sealed, bags unbroken, panels and feet — before it comes off the truck.' },
  { id: 'c3', label: 'Placed where the customer wants it', hint: 'In the storeroom or where the customer points. Not left in a passage.' },
  { id: 'c4', label: 'Receiver is the customer or authorised by them', hint: 'Name and ID number are captured on the next screen.' },
];

export const PHOTO_SLOTS = [
  { key: 'goods' as const, label: 'The goods, in place', hint: 'In place, as the customer will find it.', at: CAPTURED.goods, size: '1.6 MB' },
  { key: 'id' as const, label: "Receiver's ID", hint: 'Photograph of the document you read the number from.', at: CAPTURED.id, size: '1.2 MB' },
];

export type ReasonCode =
  | 'NobodyHome' | 'PaymentNotMade' | 'GoodsRefused'
  | 'AccessDenied' | 'WrongItemLoaded' | 'VehicleFault';

export const REASONS: { code: ReasonCode; label: string; fault: 'Customer' | 'Gain' }[] = [
  { code: 'NobodyHome', label: 'Nobody at the address', fault: 'Customer' },
  { code: 'PaymentNotMade', label: 'Customer will not pay at the door', fault: 'Customer' },
  { code: 'GoodsRefused', label: 'Customer refused the goods', fault: 'Customer' },
  { code: 'AccessDenied', label: 'No access — gate, road, security', fault: 'Customer' },
  { code: 'WrongItemLoaded', label: 'Wrong unit came off the truck', fault: 'Gain' },
  { code: 'VehicleFault', label: 'Vehicle or crew could not reach it', fault: 'Gain' },
];

/* ── Deposit branches ─────────────────────────────────────────────────────
   ⚠ Illustrative Gain branch names on the codes the TVSH build used (see
   ../GAIN-RESEED.md). The distances are real road distances from the run's final
   stop, measured by OSRM and held in lib/routes-cache.ts; they move when the
   driver confirms the optimised order. See depositRows() in lib/derive.ts.

   ⚠⚠ VE Willowvale carries NO distance: no coordinate for that store is held
   anywhere in this build, so there is no figure anybody could stand behind. Its
   row says what is true of it instead. Never invent a coordinate to fill a
   table cell. */
export const DEPOSIT_BRANCHES = [
  { code: 'BR' as const, label: 'BR · Borrowdale', note: 'On your run · stop 6, Metro Borrowdale', tag: 'On your run' },
  { code: 'VE' as const, label: 'VE · Willowvale', note: 'Raised the invoice · where you debrief', tag: 'Selling' },
  { code: 'AV' as const, label: 'AV · Avondale', note: '', tag: 'Nearest' },
];

export type DepositCode = 'BR' | 'VE' | 'AV';

export const DEBRIEF = {
  sealsReturned: 'Z-114882/83',
  signedOffAt: '18:14',
  depositRef: 'DEP-BR-2026-08-20-0014',
  cashZwg: 'ZWG 4 200.00',
};

/* ── Fuel and mileage ─────────────────────────────────────────────────────
   The driver types the odometer and the litres, because a reading nobody
   entered is a reading nobody can be asked about. Litres captured against a
   registration and an odometer reading at every fill is what turns the
   console's fleet-wide fuel figure into a per-vehicle one.

   ⚠⚠ THE HONEST LIMIT, and the app says it on screen: ONE FILL IS NOT AN
   EFFICIENCY FIGURE. Litres drawn is a tank fill, not fuel burned; efficiency
   comes from two consecutive fills. The app captures the pair and refuses to
   compute the ratio from half of it.

   ⚠ Invented, as everything here is: the previous reading (184 120 km), the
   expected closing reading and litres, and the 6.30 km/l standard (the console's
   illustrative TM-5 figure). The price paid is optional, starts empty, and
   nothing is derived from it. */
export const VEHICLE = {
  reg: 'AHF5121',
  /** The last reading the vehicle log holds, down with the run at 06:41. */
  lastOdometer: 184120,
  /** ⚠ Where the demo is expected to land, not a default: the driver types it. */
  expectedClosing: 184226,
  expectedLitres: '62.4',
  /** The console's TM-5 standard. Shown for context; never divided into one fill. */
  standardKmPerL: '6.30',
};

export const fmtKm = (n: number) => n.toLocaleString('en-GB').replace(/,/g, ' ');

/* ── The receipt series ───────────────────────────────────────────────────
   PAY-<store>-<terminal>-<sequence6>, minted on the device with no server round
   trip. The terminal is inside the number, so one identity runs all the way
   down — offline and in the ledger. ⚠⚠ NO `OFF-PAY-` PREFIX, EVER. Gaps in the
   sequence are correct and are an audit feature. TRP-004 §6.1–6.2.
   ⚠ This exact number appears on the console's TM-4 and resolves in its search
   box. Changing it means changing the console too. */
export const RECEIPT_NO = `PAY-${TRIP.terminal.storeNo}-${TRIP.terminal.terminalNo}-000037`;

export const SEEDED_TRAIL = [
  { ref: 'POD-000188397', detail: 'Stop 3 · M. Kadzviti · signed 10:52, 20 crates counted', dest: 'Queued · outcome drain', state: 'Queued' as const },
  { ref: 'PROOF-MEDIA ×3', detail: 'Stop 1–3 photographs, 7.4 MB', dest: 'Waiting for wifi', state: 'Held' as const },
];
