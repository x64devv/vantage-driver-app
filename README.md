# Vantage Driver — demo build

> ⚠ **This is not the driver app.** It is a nine-screen Next.js demo built in one day to beat the
> 26 August 2026 presentation. There is no camera, no gateway, no Business Central, no auth and no
> real offline outbox. The run is seeded and every customer on it is invented.
>
> The real `:driverApp` is Kotlin / Compose Multiplatform and lives in `vantage-lane`. It has not
> been started. See `design_handoff_driver_app/KOTLIN.md`.
>
> ⚠ A demo that quietly becomes the spec is how a product ends up designed at a keyboard. The risk
> is real here, because the handoff is high-fidelity and this looks finished.

One truck, one driver, one run. The app hands a driver his assigned stops, routes them as a single
multi-stop trip, and captures proof at the door — photographs, a finger signature, the functional
test, cash if there is any — then closes the stop and moves on. **It works with no signal for the
whole day and never claims something has happened when it has not.**

## Running it

```bash
npm install
npm run build      # static export into out/
npm start          # serve.mjs, zero dependencies → http://localhost:4173/
```

⚠ **`out/index.html` will not open from `file://`.** Next writes absolute `/_next/…` paths, so the
stylesheet and the JavaScript never load. Use `npm start`.

`?bare=1` on any route drops the two rails so the phone goes full-screen on a projector.

```bash
npm run routes                 # refetch the OSRM road cache (needs a connection)
node scripts/verify.mjs        # drive the exported app in a browser and assert (needs playwright)
```

## The screens

| Route | Screen |
|---|---|
| `/` | Sign in — terminal D204, PIN pad |
| `/run` | Today's run — trip card, progress, eight stops |
| `/run/route` | Route — map, the shorter-order suggestion, the ordered stop sheet |
| `/stop/[id]` | Stop detail — consignment lines, the four checks, the functional test |
| `/stop/[id]/proof` | Proof of delivery — photographs, signature, receiver |
| `/stop/[id]/cash` | Money at the door |
| `/stop/[id]/failed` | Failed stop — reason and fault |
| `/stop/[id]/closed` | Recorded — what the stop wrote and where it went |
| `/debrief` | Debrief — counts, cash, deposit branch, sign-off |

Two variants ship as live switches in the left rail and persist to `localStorage`: the stop-detail
layout (`checklist` · `cards` · `swipe`) and the navigation mode (`map` · `list`).

## What is true, and what is invented

**Real:** every road kilometre and minute on every screen, from OSRM (`lib/routes-cache.ts`); the
branch codes, from TVSH's own list; invoice 414414 and its serial; the trip, vehicle, driver and
crew, which match the console's record for that invoice.

**Invented, openly:** customer names and addresses, consignment numbers, SKUs, phone numbers, the
odometer and fuel figures, and the staff numbers. `lib/run.ts` marks each of them.

**Deliberately absent:** any photograph of an identity document. The capture slots are `CAMERA` →
`TAKEN` placeholders, and they stay that way until a real camera is wired in the Kotlin build.

## Read next

`CLAUDE.md` — the working tracker: the data-truth pass, what OSRM said and what it cost the design,
the traps, and an honest list of what has and has not been verified.
