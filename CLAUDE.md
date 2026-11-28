# CLAUDE.md — Vantage Driver

**Repo:** `XPOS/vantage-driver-app/`
**What it is:** the demo build of the TVSH driver phone app, from the Claude Design handoff.
**Deadline:** presentation **Wednesday 26 August 2026**, department heads and directors.
**Last updated:** 21 August 2026 — *D1–D13 built and driven in a real browser (125 assertions).
Deployed to Vercel. D11, the projector pass, is not done.*

---

## 0. ⚠⚠ Gain re-seed (25 Nov 2026) — branch `gain/reseed`

Re-seeded to show Gain (URD 10.11 / 10.12), demo only. The shared identity map, which all three apps
follow, is **`../GAIN-RESEED.md`** — change an identity there and in all three apps, never in one.

- **Everything business-shaped is illustrative, not Gain's records:** branch names (codes kept),
  registrations (`AHF5121 · GC103` on the run), goods (wholesale cases; the only serial on trip 05 is
  stop 4's chest freezer), GC- SKUs, invoice 414414's reference and fiscal signature. A tag reading
  *"Illustrative data — not Gain's records"* sits outside the device frame on every route.
- **TVSH's real data is gone from this branch.** Do not reintroduce it.
- **Unchanged:** the day, clocks, suburbs, coordinates, routes cache, trip/load/seal ids, receipt
  `PAY-101-D204-000037`, `USD 1 150.00`, people's names, the block on `CN-MW-000121`, and the four
  survivors.
- Hire-to-buy is off trip 05 (it stays in the product; `CN-AV-000120` still carries a contract).
- The sections below are the TVSH build's history; read their identities through the map above.
- The functional test reads *"Switch it on"* on a stop with an appliance and *"Open one case and count
  it"* on a stop of cases — same gate. `verify.mjs`: **127 of 127** on Windows, 25 Nov.
- ⚠ Stop 5's cash reason is now *"Account balance promised on delivery"* (was HTB arrears) — a money
  sentence changed at a keyboard; **Wyne to confirm.**
- **Phase 2 (2.6), 25 Nov: van stock reconciliation on `/debrief`** (`lib/vanrec.ts`). Loaded /
  delivered / coming back / not worked, by line, **derived from `run.ts` and the outcomes in
  `RunState.done` — nothing typed, nothing invented.** A failed stop (a cash-0 refusal included) moves
  its units to *coming back*, which names `VE Willowvale goods-in` and seals `Z-114882 / Z-114883`.
  The balance line is a sum done on screen and says *does not balance* if it ever fails. ⚠ The stop-6
  transfer is shown in **lines**, outside the unit total — the branch counts its units on its own
  receipt scan, and adding lines to cases would mix two grades of a fact. Sign-off writes
  `VANREC-AHF5121-LD-000377` → *Queued · van reconciliation*. `verify.mjs`: **139 of 139**.

- **Cross-app walk, 25 Nov:** findings and open decisions are in `../GAIN-RESEED.md`, last section.

---

## 1. What this is, and what it is not

A **nine-screen Next.js phone app**, static export, all state client-side, no server. It is the
driver third of a three-app module. Its sibling, the desktop console, is `XPOS/vantage-transport-console/`.

⚠ **This is a temporary demo build to beat a deadline, and it should stay honest about that.** The
real `:driverApp` (Kotlin / Compose Multiplatform, `KOTLIN.md` in the handoff) is Task B and waits
until after the 26th, in `vantage-lane` — not here.

**It is not** the real app. No camera, no gateway, no Business Central, no auth, no real offline
outbox. Seeded run only. `README.md` opens with that warning.

---

## 2. Where everything is

| What | Where |
|---|---|
| **The handoff** | `TransportManagement/Driver Delivery Navigation App.zip` → `design_handoff_driver_app/` |
| The brief | `…/README.md`, `…/SCREENS.md`, `…/COPY-RULES.md` |
| The prototype | `…/design/Vantage Driver.dc.html` — structure and exact copy |
| Design system | `…/design/modernist-styles.css` → ships as `app/globals.css` |
| Tokens | `…/tokens/tokens.ts` → copied to `lib/tokens.ts` |
| The Kotlin target | `…/KOTLIN.md` — **after the demo** |
| Spec | `Transport-Material/TVSH-SDD-TRP-003` (§3.2, §5) and `TVSH-SDD-TRP-004` (§2, §3.2, §6) |
| Real branch codes | `Transport-Material/demo/transport-demo-data.json` |
| **The sibling** | `XPOS/vantage-transport-console/CLAUDE.md` — read it; this app must agree with it |

---

## 3. The nine screens

| Route | Screen | The point |
|---|---|---|
| `/` | Sign in | Terminal D204, PIN pad. The run is already downloaded and says so |
| `/run` | Today's run | Trip card, progress, 8 stop rows with tags |
| `/run/route` | Route | Map, the optimised-order suggestion, ordered stop sheet |
| `/stop/[id]` | Stop detail | Consignment lines, the four checks, the functional test |
| `/stop/[id]/proof` | Proof of delivery | Two photographs, the signature canvas, the receiver |
| `/stop/[id]/cash` | Money at the door | **COPY-RULES.md lives here** |
| `/stop/[id]/failed` | Failed stop | Six reasons, each with a fault |
| `/stop/[id]/closed` | Recorded | What this stop wrote, and where it went |
| `/debrief` | Debrief | Counts, cash, deposit branch, sign-off |

Plus the demo framing on every route: a 320px rail — title and screen jumps, nothing else — and the
phone (413×872 bezel, 393×852 screen). See §3a for what used to be there and where it went.

---

## 3a. ⚠⚠ Slimmed for the executive audience — 21 August

Internal feedback: the demo read as **too busy for the room**. Wyne's instruction, and what it cost.

**Off the rail.** The five assumptions (he says them out loud instead), the stop-detail layout
switcher, and the navigation switcher.

**Off the page.** The live record trail rail.

⚠ **Nothing was deleted — only taken off the screen.** All of it is still reachable by URL, so the
design review after the 26th does not have to rebuild it:

| | |
|---|---|
| `?trail=1` | the live record trail rail |
| `?layout=checklist \| cards \| swipe` | the stop-detail layout |
| `?nav=map \| list` | the route arrangement |
| `?bare=1` | drop the rail entirely — the projector setting |

⚠⚠ **What removing the trail rail costs, said plainly.** It was the demo's most visible argument —
that no action is a claim without a record behind it. It is **not gone from the product**: the
Recorded screen still shows what each stop wrote and where it went, and the queue chip in the app bar
still counts what is waiting. But the room now only sees it when the driver closes a stop. **If beat
13 is to land, somebody has to be pointing at the Recorded screen while it is up** — or run the
rehearsal with `?trail=1`.

⚠ **The switchers leaving forced a default the demo was deliberately not picking.** Wyne's call,
21 Aug: **checklist + map first**. The other two layouts and the list arrangement are unchanged and
still shipped; they simply have no control on screen.

### What was cut inside the app, and what was kept

The instruction was *"cut the explaining, keep the claims"* — because some of what reads as clutter
is COPY-RULES spec, and cutting it is how a demo quietly stops being true.

| Cut | Kept, and why |
|---|---|
| The hint under each of the four checks | The checks themselves. The hint survives in the **swipe** layout, where one check owns the screen |
| *"Scanned onto load LD-000377 by you. Not typed — a different grade of fact."* | **`Scanned onto LD-000377 / 4`** — the provenance word is the claim; the sentence was the explaining |
| The duplicated *"Not serialised"* footnote | One strip reading `Not serialised — no serial gate applies`. It said the same thing twice |
| The proof intro, *"Three pieces of evidence, then the signature…"* | The signature hint, which still says the line set locks when it is signed |
| The two-drains note on proof (TRP-003 §3.2) | **`held for wifi`** on every photo slot and in the trail rows. ⚠ Worth saying out loud if anyone asks why the photographs lag |
| Half the part-payment hint | *"This device does not work out what is left."* That half is COPY-RULES |
| The deposit-distance caption | The distance on each row, which already says *"from your last stop"* |

⚠⚠ **Untouched, and not negotiable:** every money sentence, both warning panels (*"I cannot see this
account from here"* and *"a 'no' becomes an exception with your name on it"*), every provenance line
(`By geofence`, `Scanned`, `Queued · …`, `Held for wifi`), and the Recorded screen's trail rows.

### The cash screen, rebuilt — 21 August

The three choice rows (*Took the full amount* / *Took part of it* / *Customer would not pay*) are
gone. **The driver types what he counted, straight away**, and the app reads the outcome off that one
figure. Fewer decisions, one screen with no scrolling, and the same claims.

| Typed | What the screen says |
|---|---|
| nothing | *"Count it in front of the receiver, then type it."* Action dimmed: `Type what you collected` |
| **`0`** | ⚠⚠ **an accent panel** — *"Nothing collected is a refusal, not a delivery."* Reason `PaymentNotMade`, fault Customer, the goods come back. Action becomes **`Record the exception`** |
| less than the run figure | *"Part of it. The balance stays owing, and this device quotes no figure for it."* Receipt reads `USD 600 of USD 1 150.00` |
| the run figure | *"The full amount, counted in front of the receiver."* |
| more than it | *"More than the figure that came down with the run. Check it before you close the stop."* Flagged, not refused |

⚠⚠ **ZERO IS AN OUTCOME, NOT A NUMBER.** Nothing collected is a refusal with a fault attached, and
the goods come back — it is never a delivered stop that happened to earn nothing. Letting `0` fall
through to `Complete stop 4` would be precisely the collapse COPY-RULES exists to prevent
(*"never collapse two different sentences into one"*), in a different noun. A refusal never wears the
same button as a delivery, and `0` mints no receipt. There are five assertions on this alone.

⚠ **Comparing the typed figure to the due figure is not quoting a balance.** The due figure is on the
screen above it and is already labelled as what came down with the run. **Nothing subtracts one from
the other** — the part-payment line still refuses to say what is left.

⚠ `cashPick` and `partAmount` are gone from `RunState`; **`collected` is the single typed string**,
and `cashOutcome()` in `lib/state.tsx` is the one place the outcome is decided.

---

## 4. ⚠⚠ The data-truth pass — done first, before any screen (D2)

The driver app and the console tell the same story about **invoice 414414**, and the handoff
disagreed with the console on five identities. **Wyne's call, 20 Aug: the driver app moves.** All of
it is in `lib/run.ts`, with the reasoning at each line.

| handoff said | now reads | why |
|---|---|---|
| `2026-08-26`, kicker `THURSDAY 26 AUGUST` | **`2026-08-20`**, `THURSDAY 20 AUGUST` | ⚠⚠ 26 Aug 2026 is a **Wednesday** |
| `TR-HRE-2026-08-26-04` | **`TR-HRE-2026-08-20-05`** | the console's TM-4 names this trip |
| `AFR 8615` | **`AGE5599 · TVS103`**, UD Kuzer 22.0 m³ | AFR 8615 is not in the Harare demo fleet |
| `Chiwayo, STAFF-1183` | **`T. Mukanya`**, crew `W. Sibindi` | the console's TM-4 names them |
| `Zone B · Harare east` | **`Zone C · Greendale / East`** | ⚠ Zone B is *Borrowdale* in TVSH's real zone table; the console's seeded trip is Zone C |
| stop 4 has 1 line | **3 lines** — TV, bracket, home theatre | TM-4 reads `Delivered 3 of 3`. Only the TV is serialised |
| `HL · Highlands` deposit branch | **`AV · Avondale`** | ⚠⚠ **There is no Highlands branch.** It is a suburb — and the handoff also said it closes at 17:00, so it would have been shut at the 18:12 debrief |
| `DEP-BR-2026-08-26-0014` | **`DEP-BR-2026-08-20-0014`** | follows the date |
| photos 14:06 / 14:07, signature 14:07 | **14:09 / 14:10, signature 14:11** | ⚠ the handoff photographed the goods a minute **before** the 14:07 geofence arrival. Re-sequenced so evidence comes first and the signature lands on the console's 14:11 beside the cash (Wyne, 20 Aug) |

**Unchanged, because the console holds them too:** receipt `PAY-101-D204-000037`, terminal `D204` /
store `101`, load `LD-000377` and its seals, `USD 1 150.00`, the 06:41 download, the 14:07 geofence
arrival, the 18:12 debrief. ⚠ **Changing any of these means changing the console as well.**

⚠ **The console needs one matching edit.** Its `EVIDENCE` array on TM-4 read `Signature 14:11 ·
ID photograph 14:12 · Goods in place 14:14` — signature first, photographs after. It now reads
`14:09 / 14:10 / 14:11` in evidence-then-signature order. That edit is applied.

⚠ Openly invented, as the handoff's own fixture was: customer names and addresses, consignment
numbers, phone numbers, odometer and fuel. **Two SKUs are new here** — the TV bracket and the home
theatre — because the console records their descriptions and no SKU for either exists anywhere in
the material. They are marked in `lib/run.ts`.

---

## 5. ⚠⚠ Routing — what OSRM actually said, and what it cost the design

`npm run routes` fetches real road routes from OSRM and writes `lib/routes-cache.ts`. **Every
kilometre and minute on any screen comes from that file or plain arithmetic over it** (`lib/derive.ts`).
Nothing rounds to a friendlier number.

Measured 20 Aug 2026, brute force over all 24 orders of the five remaining stops:

| Order | Road | Note |
|---|---|---|
| Dispatcher `Greendale > Msasa > Borrowdale > Avondale > Hatfield` | **57.05 km · 78.0 min** | rank 12 of 24 |
| **The handoff's suggestion** `…Avondale before Borrowdale` | **58.43 km · 80.2 min** | ⚠⚠ rank 14 — **1.4 km and 2.2 minutes WORSE** |
| OSRM's answer `Greendale > Borrowdale > Avondale > Hatfield > Msasa` | **41.77 km · 55.0 min** | rank 1 — saves **15.3 km, about 23 min** |

Two things the handoff's card claimed were false:

1. **"saves 11.4 km and about 24 minutes."** Its own order is slower than the plan. Shipping that
   sentence would have put a backwards claim on a boardroom screen.
2. **"Time windows still hold."** The five windows run 13:45 / 15:10 / 16:00 / 16:45 / 17:30 **in
   dispatcher order** — the dispatcher's order *is* the window order, so every reorder breaks one.
   No suggestion can ever hold them.

⚠ **Wyne's call, 20 Aug: suggest the true optimum and name what it costs.** The card now reads
*"Taking Borrowdale, Avondale and Hatfield before Msasa saves 15.3 km and about 23 minutes. Msasa
moves from its 15:10 window to last — that is the cost. Nothing changes until you say so."* The app
suggests, says the price, and the driver decides. **Accepting and rejecting are both recorded**
against the trip with his name on it (TRP-003 B11).

⚠ **The deposit distances are real too**, from the run's final stop, and they move when the driver
confirms the optimised order (the run then ends at Msasa, not Hatfield):

| | from Hatfield | from Msasa |
|---|---|---|
| BR Borrowdale | 19.6 km | 19.1 km |
| AV Avondale | **11.5 km** | **14.6 km** |

⚠⚠ **Avondale is the nearest branch, not Borrowdale** — the handoff put `NEAREST` on Borrowdale and
gave it `2.1 km`, which is not a distance between any two points on this run. The `NEAREST` tag now
goes where OSRM puts it. **Borrowdale keeps its place as the demo's deposit** because the driver was
standing inside it at 16:00 (it is stop 6) and because the console's TM-4 records the deposit there.
The teaching point survives and is stronger: the money went where the driver went — neither the
nearest branch nor the one that raised the invoice.

⚠⚠ **`VE Village Walk` carries no distance.** OpenStreetMap has no Village Walk in Harare and TVSH
holds no branch coordinates, so there is no figure anybody could stand behind. Its row says what is
true of it instead — that it raised the invoice and is where the debrief happens. **Never invent a
coordinate to fill a table cell.** (`AV`'s point is Avondale Shopping Centre from OSM Nominatim,
checked 20 Aug; `BR`'s is the run's own stop-6 marker, Shop 12 Sam Levy Village.)

---

## 5a. ⚠⚠ Fuel and mileage — added 21 August

Not in the handoff, which carried the odometer and the litres as static text on the debrief. The
driver now types them, because **a reading nobody entered is a reading nobody can be asked about**.

| Where | What |
|---|---|
| Sign in | **Odometer out**, one field, with the last reading on `AGE5599` shown as context. ⚠ Ungated — a driver who cannot read the dial in the dark must still be able to start his run |
| Debrief · vehicle card | **Odometer in**, **fuel drawn (L)**, and an optional **fuel card** amount. Distance is the two readings subtracted, labelled *by odometer, typed by you* |
| Sign-off | Writes `ODO-AGE5599-184226` → *Queued · vehicle log* and `FUEL-AGE5599-184226` → *Queued · fleet cost, per-vehicle*. ⚠ Each row is written only if there is a reading behind it |

⚠⚠ **Why it earns its place, and it is the same shape as the HTB serial line.** The console's TM-5
shows fleet fuel efficiency at **6.59 km/l against a 6.64 standard**, and its own `lib/data.ts` says
in as many words that TVSH's fuel data *"supports a fleet-wide figure but not a reliable per-vehicle
split"*. Its per-vehicle variance table is invented and says so. **Litres captured against a
registration and an odometer reading at every fill is exactly what makes that table real.**

⚠⚠ **THE HONEST LIMIT, and the screen says it out loud: one fill is not an efficiency figure.**
Litres drawn is a tank fill, not fuel burned. 62.4 L over this run's 106 km would print **1.7 km/l**
against a 6.64 standard and read as a catastrophe that did not happen. Efficiency comes from two
consecutive fills. **The app captures the pair and refuses to divide half of it** — there is an
assertion in `scripts/verify.mjs` that no km/l is printed for a single run.

⚠ **The price paid is optional and starts empty.** A pump price is the kind of figure a finance
director in the room would check. Whatever is typed is labelled as typed, and nothing is derived
from it.

⚠ **Invented, and marked in `lib/run.ts`:** the previous reading, 184 120 km. The closing 184 226 km
and the 62.4 L are the handoff's own, equally invented. 106 km is plausible against what OSRM did
measure — the routed part of this run is 66 km (8.7 already driven plus 57.0 remaining); the rest is
the two depot legs, which are not routed because nothing in the estate holds a coordinate for VE
Village Walk.

---

## 6. ⚠⚠ The four things that must survive implementation

1. **"Recorded on this device, not yet in the ledger."** Never *Payment received*, *Paid* or
   *Posted*. `app/stop/[id]/cash/CashView.tsx`.
2. **Never a balance.** The due figure came down with the run and is labelled as such. *"I cannot see
   this account from here — the branch tells them."* No screen subtracts one figure from another.
3. **Every fact names its provenance.** `By geofence` / `By your button` · `Scanned` / `Typed` ·
   `Queued · /api/credit/payments` / `Held for wifi`.
4. **A "no" is an outcome with a fault and a name on it, and the goods come back.** Never "leave at
   the door", never a skip, no supervisor code in the ordinary flow.

⚠ And running through all four: **disabled = `opacity: .45` + a label naming what is missing.** Never
a dead control. `components/ui.tsx` `Btn dim`.

---

## 7. The record trail — the argument

Every driver action appends a `TrailEntry` (`lib/state.tsx`): a ref, what was captured in plain
words, where it is going, and whether it got there (`Queued` / `Held` / `Bound`). Rendered twice —
the right rail for the run, the Recorded screen for the stop just closed. Two entries are seeded, so
the run starts with a queue that is already non-empty.

A delivered stop writes, in this order:

```
POD-000188406      Queued   outcome drain
PAY-101-D204-000037 Queued  /api/credit/payments        (only if money was taken)
SERIAL #G-000004791204  Bound   consignment line …
PROOF-MEDIA ×3     Held     for wifi
```

⚠⚠ **The SERIAL row is the strongest argument in the whole specification.**
`Vantage HTB Contract Line."Serial No."` is declared in the codebase and **has never been populated**
— `VantageContractBuilder.AddLine` has no caller — so TVSH cannot today say which physical fridge is
on which hire-to-buy contract, and repossession is impossible.

⚠ **Stop 4 is a CASH sale, so it has no HTB contract line**, and the row says so out loud:
`→ Consignment line · this sale is not on hire-to-buy`. Faking stop 4 as hire-to-buy to make the
row look better would contradict the invoice and the console. **Stops 3, 5 and 7 are the HTB ones**
— stop 7 (P. Chikafu, Avondale) is serialised *and* hire-to-buy, and is the only stop in the run
where the row reads `→ Consignment line + HTB contract line`.
⚠⚠ **If that row is meant to be seen on the day, the running order has to visit stop 7.** Beats 7–10
are stop 4 and will not show it. Raise this before the rehearsal.

---

## 8. Conventions

**Tokens, never literals.** Every colour, space and shadow from `globals.css` variables. **Radius is
0 everywhere** — the only exceptions are the phone bezel (44/34px) and the gesture pill, which are
hardware.

**Type.** Archivo, vendored in `app/fonts/` (⚠ the Modernist sheet's Google Fonts `@import` is the
one line changed in `globals.css`). Nothing below 9px; hit targets never below 44px.

**Focus** is `2px solid var(--color-accent)`, offset 2px — never the browser default.

**Selected state is a fill, not a tick** — accent for affirmative, ink for negative. A "no" being ink
rather than red is deliberate: a refusal is not an error.

**No animation** other than instant state change. Nothing slides.

⚠ **Copy is part of the design.** The teaching lines and the money sentences are written to be read
aloud in a boardroom. Do not paraphrase them.

⚠ One deliberate break from *"long text ellipses on one line rather than wrapping"*: the route
sheet's leg line (`Greendale · 13:45 · 1.7 km, 2 min`) wraps to two lines on a 393px screen, because
ellipsing it would cut the distance or the minutes — the figures the row exists for.

---

## 9. Build order

| # | Step | Status |
|---|---|---|
| D1 | Scaffold + phone frame + chrome (status bar, app bar, queue chip, gesture bar) | ✅ builds and exports |
| D2 | **`lib/run.ts`, corrected per §4** | ✅ see §4 |
| D3 | `/` sign in and `/run` today's run | ✅ 8 rows with tags and edges; a closed row does nothing |
| D4 | `/run/route` — react-leaflet, grayscale tiles, square markers, the suggestion | ✅ real OSRM; accept **and** reject both recorded |
| D5 | `/stop/[id]` — consignment, four checks in all three layouts, functional test | ✅ both gates hold; a single **no** swaps the action |
| D6 | `/stop/[id]/proof` | ✅ ink lands under the pointer, asserted by pixel test |
| D7 | `/stop/[id]/cash` | ✅ copy rules asserted; part payment is **typed**, never a fixture |
| D8 | `/stop/[id]/failed` and `/closed` | ✅ each reason carries its fault; trail rows name their destination |
| D9 | `/debrief` | ✅ real distances; BR is the deposit and the note says why |
| D10 | Left rail, right rail, `?bare=1`, `localStorage`, Reset run | ✅ a hard reload keeps the run |
| D11 | **Demo pass on the real projector, with the console** | ☐ **not done, and it is not optional** |
| D12 | **Slim for the room (§3a) + fuel and mileage (§5a)** | ✅ 21 Aug, 115 assertions |
| D13 | **Cash screen: one typed figure instead of three rows (§3a)** | ✅ 21 Aug, 125 assertions |

**Added, not in the original plan:** a numeric keypad on the cash screen for a part payment. The
handoff hardcoded `USD 600.00 of USD 1 150.00` — a figure from nowhere, printed on a receipt. §7.8 of
the kickoff says an invented sentence about money goes to Wyne, and his call on 20 Aug was to let the
driver type what he counted. Nothing derives a remainder from it.

---

## 10. Traps

- ⚠⚠ **The signature canvas.** Backing store is **321 × 150**, displayed at 100% width (331px on this
  frame). **Scale pointer coordinates by `canvas.width / rect.width`** on both axes or the ink lands
  away from the finger. `components/Signature.tsx`. `touch-action: none`, or the page scrolls instead
  of drawing. A single tap must leave a dot, not just a drag.
- ⚠⚠ **`out/` does not open from `file://`.** Next writes absolute `/_next/…` paths. Use `npm start`
  (`serve.mjs`, zero dependencies, no network) — copied from the console.
- ⚠⚠ **`output: 'export'` will not emit `/stop/[id]` without `generateStaticParams`.** All five stop
  pages declare it over the eight ids; the client view lives in a sibling `…View.tsx`.
- ⚠ **Marker stacking.** Leaflet orders markers by latitude, which put stop 3's delivered `×` on top
  of stop 4's accent square — the next stop, hidden behind one already done. `zIndexOffset` now
  stacks by importance: next, pending, delivered, driver dot. Found by looking at a screenshot, not
  by a test.
- ⚠ **OSRM's public server is rate-limited.** `npm run routes` regenerates the cache; the demo never
  calls it live.
- ⚠ **Leaflet's stylesheet** is imported in `app/layout.tsx`, and the OSM attribution is a **licence
  requirement** — 8px on an 80% plate, never removed.
- ⚠ **Archivo is vendored.** Verified: the export contains both `.woff2` files and no
  `fonts.googleapis.com` reference anywhere in `out/`.
- ⚠⚠ **No photograph of an identity document, real or stock, anywhere in this build.** The capture
  slots are `CAMERA` → `TAKEN` placeholders. The console makes the same call on TM-4.
- ⚠ **The left rail quotes sentences the app must never say** (assumption 04 quotes *"payment
  received"*). A copy-rule check that reads the whole page will find them there and be wrong —
  `scripts/verify.mjs` asserts inside `[data-phone="screen"]` only.
- ⚠⚠ **A screen reached cold must not report work it did not do.** `/stop/N/closed/` opened from a
  shared URL, a rail jump or a reload after **Reset run** used to print *"Stop 4 closed"* over an
  empty record list. It now reads *"Stop N is not closed · nothing has been written for <customer> on
  this device"* and offers no "next stop". Found on 21 Aug by looking at a screenshot of a cold load,
  not by a test — the test came after. **Every other screen reachable by URL deserves the same
  question asked of it.**

---

## 10a. ⚠⚠ Dependencies — CVE-2025-66478, patched 21 August

Vercel's first deploy flagged **`next@15.5.4`**: *"This version has a security vulnerability"*.
It is **React2Shell** — `CVE-2025-66478` / upstream `CVE-2025-55182`, **CVSS 10.0 remote code
execution** through the React Server Components protocol, actively exploited in the wild. All of
Next.js 15.x and 16.x on the App Router are affected. **Pinned to `next@15.5.23`** — the latest in
the patched 15.5 line (the fix landed in 15.5.7). Rebuilt and re-verified: **87 of 87 assertions
pass**, and the rendered screens are unchanged.

⚠ **Why 15.5.23 and not 16.3.1.** A major-version jump five days before a boardroom demo buys a
different set of unknowns than the one it removes. The 15.5 line is patched; take it.

⚠ **What the exposure actually was, stated plainly rather than dramatically.** This app is
`output: 'export'` — the deployed site is static files with no Next.js server behind them, so the
Vercel URL was never processing RSC requests and was not exploitable. **The real exposure was
`npm run dev` on a developer's laptop**, which does run a server. That is a reason to patch, not a
reason to have panicked. ⚠⚠ **The console has the same version** — see §12.

⚠ **Two advisories are knowingly left open**, and both are build-time only:
`postcss` (path traversal via `sourceMappingURL`, reads a `.map` file at build) and `sharp`/libvips
(image decoding — and `next/image` optimisation is off here, `images: { unoptimized: true }`, and
does not run in a static export at all). `npm audit fix --force` resolves both by installing
**next@16.3.1**, a breaking change. Neither is reachable from the deployed static site. Revisit after
the 26th.

⚠ `react` and `react-dom` at `19.1.0` are not flagged by the advisory database; the RSC hardening
ships inside Next's own bundled copy. Every dependency in this repo is **pinned exactly** — npm's
default caret was removed from `next` — because a demo build should not float.

---

## 11. Status — 21 August 2026

| | |
|---|---|
| Handoff read in full | ✅ |
| Data-truth pass (§4) | ✅ before any screen |
| Screens built | ✅ 9 of 9 |
| Seen in a real browser | ✅ headless Chromium, and screenshots read by eye |
| Seen on a projector | ☐ **no** |

**What was actually run**, on 20 and 21 August, in a Linux container:

- `npm install`, `npm run build` — compiles clean, exports 47 static routes, on both
  `next@15.5.4` and, after the security patch, `next@15.5.23`.
- `node scripts/build-route-cache.mjs` — 7 of 7 routes fetched from OSRM, plus a 24-order brute
  force to check the suggestion (§5).
- `node serve.mjs`, then `node scripts/verify.mjs` — **125 assertions, 125 pass, 0 fail**, covering:
  every route renders · the whole data-truth pass · the real saving and no placeholder figures ·
  accept **and** reject both writing a trail row · three consignment lines with two unserialised ·
  both stop gates and the label naming what is missing · a single "no" raising the exception panel ·
  the signature ink landing under the pointer (read back out of the canvas pixels) · every money
  sentence in COPY-RULES, asserted inside the phone only · the part-payment keypad and the absence of
  any invented figure · the four trail rows in order with their destinations · the deposit rows and
  their real distances · `?bare=1` · a hard reload · Reset run · both variant switches, `navMode`
  asserted by geometry rather than by wording · a **cold load of `/stop/N/closed/`**, which must not
  claim a stop closed that was never worked · every cut and every survivor in §3a · and the fuel and
  mileage capture, including **that no km/l is printed from a single fill** · and all five cash
  outcomes, including **that `0` is a refusal that mints no receipt and does not wear the delivery
  button**.
- Screenshots of all nine screens and all three check layouts, **looked at** — which is how both
  bugs in §10 were found: the marker stacking, and the cold Recorded screen.
- **Deployed to Vercel** from `github.com/x64devv/vantage-driver-app` — build green, 47 routes
  exported. ⚠ The demo is now on a public URL; nobody has walked it there end to end.
- Map tiles: rendered and read by eye, served from a local OSM snapshot (see below).

**What has NOT been verified:**

- ⚠⚠ **A projector, at the back of a room.** This is D11 and it is the one that will actually bite.
  10px meta and 1px rules on a 393px-wide phone frame are exactly what fails there. `?bare=1` exists
  for it. **Test it on the real projector at the real distance before the day**, and if something is
  illegible, raise it rather than quietly restyling the system.
- ⚠⚠ **Beats 1→13 end to end across both apps.** The two agree on paper and by assertion; nobody has
  walked the running order with the console open beside this.
- ⚠ **Live `tile.openstreetmap.org` from a browser.** This container's proxy blocks the browser's
  tile requests (`ERR_ABORTED`), though `curl` reaches them. The map was verified against a local
  snapshot of the real tiles, so the layer, the grayscale filter, marker contrast and the attribution
  are all confirmed — **but nobody has loaded this app against the live tile server.** ⚠ Offline
  tiles are an open question for the real product; for the demo, load the route screen once on the
  room's wifi so the tiles sit in the browser cache.
- ⚠ **A touchscreen.** The signature takes ink from a mouse, asserted. Pointer events cover touch and
  `touch-action: none` is set, but nobody has signed it with a finger.
- ⚠ **Windows.** Built and run on Linux only.
- ⚠ **The Kotlin `:driverApp`.** Not started. That is Task B, after the 26th.

*"It builds" is not "it works", and neither of them is "it was legible from the back".*

---

## 12. Still open, and Wyne's to answer

- ⚠⚠ **The console is still on `next@15.5.4`** — the same CVSS-10 version this app was just patched
  off (§10a). Its demo path is a static export served by `serve.mjs` with no Next runtime, so it is
  not exposed there either; `npm run dev` on a laptop is. **`XPOS/vantage-transport-console/package.json`
  and its lockfile now name `15.5.23`, but that machine has no npm registry access** — it needs
  `npm install && npm run build` run locally, and it has NOT been re-verified since.
- ⚠⚠ **Beats 4, 5 and 6 have no screen.** The running order's mobile beats are SD-1…3 (the **store
  dispatch tablet** — the serial scan, load-and-seal, far-end receipt scan) and DR-1…5 (this app).
  This handoff covered the driver only. **Three beats of the demo still have nothing behind them.**
- ⚠ **The HTB contract-line row does not appear on stop 4** (§7). If it is to be seen, the running
  order has to reach stop 7.
- **A second language (Shona).** The spec does not ask for it; the audience might. ⚠ Do not translate
  the money sentences without sign-off — they are `COPY-RULES.md`, not tone of voice.
- Anything that would require **inventing a sentence about money**. Bring it to Wyne instead.

---

## 13. Rules inherited from the estate

From `XPOS/CLAUDE.md` §8, and they apply here even though this is a demo:

- **Compile-green and verified are different facts.** Every defect found in the Vantage build so far
  was found by a person using the product.
- **Say what is not built, on its face.** A screen that reports work it did not do is the worst
  defect class in this codebase; it has happened three times.
- **Never quote a figure you cannot stand behind.** The whole of §5 is this rule.
- **Comment the reasoning, not the mechanics.** ⚠ marks a load-bearing decision; ⚠⚠ marks one that
  will hurt somebody.
- **Verify against the real thing, and say plainly what you have not verified.**
