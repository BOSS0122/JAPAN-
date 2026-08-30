# JapanQuest (prototype)

A working prototype of a discovery-and-itinerary service for independent
travellers to Japan (FIT). It surfaces famous landmarks *and* the regional long
tail — back-street workshops, one-counter restaurants — lets a traveller
shortlist what they like, and builds an efficient walking course from the
selection. Experiences and restaurants are booked in-app; flights and hotels
hand off to external OTAs.

Built for investor demos, user testing and as the base for staged production
work. **No real payments, no signed partner APIs.** Every external booking is a
placeholder link and every price is sample data.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| i18n | `next-intl` — English (base), 日本語, ไทย |
| Maps | Leaflet + OpenStreetMap tiles |
| Charts | Recharts |
| Places | SQLite via Prisma (swap the provider for Postgres) |
| Other runtime data | JSON file (`.data/db.json`) — trips, bookings, orders, check-ins |

## Running it

```bash
npm install
cp .env.example .env       # DATABASE_URL and an editor password
npx prisma migrate dev     # creates prisma/dev.db
npx prisma db seed         # loads the 30 starter places
npm run dev                # http://localhost:3000 → redirects to /en
```

`npm run build && npm start` for a production build.

Places live in SQLite via Prisma. Trips, bookings, orders and check-ins still go
to `.data/db.json` — delete that file to reset those; drop `prisma/dev.db` and
re-run the migration to reset the catalogue.

## Adding places

Adding a spot is a form, not a code change. Sign in at **`/admin`** with
`ADMIN_PASSWORD` and use **新規スポット**. Saving a published place makes it
visible on the traveller site immediately — no redeploy.

Entries start as **下書き (draft)** and stay invisible until published, so a
half-translated record never reaches a traveller. The list flags which languages
are still missing text.

**Fill areas deeply rather than the map broadly.** The course planner needs
places close enough to walk between; thirty spots scattered over thirty cities
produce one-stop days, while a hundred and fifty in one city produce real
itineraries. Finish a city before starting the next.

## The service name

`SERVICE_NAME` in `src/config/site.ts` is the single source of truth. Change it
there and every screen follows; taglines per language live in the same file.

## Adding a language

1. Add the code to `locales` in `src/i18n/routing.ts` and a label in `localeLabels`.
2. Copy `src/messages/en.json` to `src/messages/<code>.json` and translate it.
3. Add the same key to the `LocalizedText` fields in `src/data/places.ts`,
   `src/data/support.ts` and `site.tagline`.

Translation keys are grouped by feature, not by screen, so Simplified/Traditional
Chinese or Korean drop in without restructuring. The middleware matcher in
`src/proxy.ts` also lists the locale codes.

## Walking through the demo

The golden path, in order:

1. **`/en`** — home. Seasonal picks are reordered live by the current season and
   a stubbed weather reading; hidden gems get their own rail.
2. **`/en/explore`** — filter by interest tag (anime locations, traditional
   crafts, day trips, kid-friendly…), area, type and fame. Each card shows a
   crowd indicator. Hit **Add** on five or six Tokyo places.
3. **`/en/places/nezu-shrine`** — detail view: crowd level, seasonal star
   ratings, step-free flag, a weather note when it's raining, and nearby places.
4. **`/en/plan`** — the shortlist becomes a day-by-day course. Try:
   - switching **Pace** to *Relaxed* — walking legs shorten, the day ends earlier
     and stops spill to the next day;
   - ticking **Step-free only** — places with steps move to the "Left out" list
     with a reason;
   - **Weather turned — replan indoors** — indoor stops are pulled forward;
   - the **Map** tab — numbered pins and the route line.
5. **Share & co-edit** — creates an invite link. Open it in a private window
   (no account needed): editing stops or settings there persists for everyone,
   and the note thread at the bottom works as a group chat.
6. **Book** on any experience or restaurant — three steps to a confirmation with
   a reference number. `/en/bookings` lists what you've booked.
7. **`/en/flights`** and **`/en/hotels`** — search returns sample partner results
   that link out to placeholder OTA URLs.
8. **`/en/support`** — IC card balance and top-up, camera translation (returns a
   dummy translated menu), multilingual disaster alerts, eSIM / Wi-Fi / luggage
   hand-offs.
9. **`/en/rewards`** — stamp rally and badges. Hidden gems are worth two stamps
   to famous spots' one. The tax-free refund estimator is at the bottom.
10. **`/en/shop`** — merchandise, only from the places already in the catalogue.
    Open **Awa Indigo Stole** and note that the three Tokyo collection points are
    flagged *On your route*, because you shortlisted Tokyo places in step 2.
    **Takayama Junmai** offers no international shipping at all — alcohol is
    collection-only, and the reason is shown on the page.
11. **`/dashboard`** — the B2B console for municipalities and tourism boards:
    views, referrals and bookings by area, weekly trend, category split.

Manners appear in three places rather than in a guide of their own: on every
spot page, on the booking confirmation (the moment someone has actually
committed to going), and — for the rules that belong to no single place — at the
bottom of **On the ground**.

Switch language with the header dropdown at any point; the current page and its
parameters are preserved.

## How the pieces fit

### One model for three things

`src/data/types.ts` defines a single `Place` — name, per-locale description,
category, interest tags, coordinates, expected stay, crowd level, per-season
score, indoor/step-free flags, price and whether it's bookable in-app or handed
to a partner. Sights, experiences and restaurants differ only by `category`
(plus `mealSlot` for restaurants). 30 entries in `src/data/places.ts`, roughly
ten per category, deliberately mixing Senso-ji and Fushimi Inari with
Motonosumi, Ouchi-juku and a Tokushima indigo workshop.

Artwork is a gradient plus an emoji rather than photography, so the prototype
ships with nothing to license.

### The course planner

`src/lib/route-planner.ts` is a greedy nearest-neighbour with four corrections:

- **opening hours** — a stop that can't be finished before closing (or before
  the day budget runs out) is not offered; waiting for a door to open is costed
  at 0.8× travel time;
- **meal slots** — restaurants are pulled toward 11:00–14:30 and 17:00–21:30;
- **area cohesion** — leaving the current area carries a fixed penalty, and each
  day starts wherever the most remaining stops are within walking range;
- **stamina** — `relaxed` / `standard` / `active` set walking speed, the
  walk-vs-train threshold, the daily time budget and the buffer between stops.

`accessibleOnly` filters out anything with steps, and `preferIndoor` (the
weather re-plan) penalises outdoor stops. Anything that doesn't fit comes back
in `dropped` with a reason, which the UI shows rather than silently discarding.

### Manners attached to places, not collected into a guide

`src/data/etiquette.ts` holds rules that declare *where* they apply — nationwide,
by category, by interest tag, or by specific place id. `getEtiquetteFor(place)`
resolves the set most-specific-first, so Kinosaki leads with the yukata rule,
then the onsen-tag rules, then the nationwide ones. Eighteen rules cover thirty
places without anyone hand-writing thirty sets.

Every rule carries a `why` as well as a `body`. "Don't stand chopsticks in rice"
is a rule you forget; "that is how rice is offered to the dead" is one you don't.
The tone is deliberately non-scolding — the closing line on every block says
nobody will be angry if you get it wrong.

### Merchandise without holding stock

Two fulfilment modes, both of which avoid us ever touching inventory.
`ship-international` is the partner posting the item; `pickup-in-japan` is the
traveller collecting it at an airport, hotel or convenience store during the
trip — which sidesteps cross-border shipping, customs and freight entirely, and
lets tax-free be handled in person.

Collection points are ranked by the traveller's own shortlist
(`pickupPointsForAreas`), which is the one thing a general marketplace cannot
copy: we already know where they are going. Items that cannot legally or
practically be shipped — the sake, the sauce — simply offer no shipping option
and say why.

`FulfillmentProvider` sits in `src/lib/providers/` beside the OTA adapters, and
quoting runs server-side (`quoteFulfillmentAction`) so pricing lives in exactly
one place and a client cannot post its own freight cost.

### The OTA adapter boundary

`src/lib/providers/` is where the unsigned integrations are quarantined.
`FlightSearchProvider` and `HotelSearchProvider` are interfaces; `mock.ts`
implements both with deterministic sample data; `index.ts` is a registry keyed
off `FLIGHT_PROVIDER` / `HOTEL_PROVIDER`. Wiring up Amadeus, Booking.com or
Klook means adding an adapter and a registry entry — no page or component
changes.

### Storage and identity

Places are rows: `Place` plus one `PlaceTranslation` per language and one
`PlaceTag` per interest tag. Translations as rows means adding Korean is
inserting records, not altering a table. `src/lib/repo/places.ts` is the only
module that talks to Prisma; it hands back the same `Place` shape the rest of
the app already spoke, which is why the migration touched no rendering code.

Moving to Postgres: change `provider` in `prisma/schema.prisma`, point
`DATABASE_URL` at the server, swap the adapter in `src/lib/db.ts`, re-run the
migration.

Trips, bookings, orders and check-ins still sit in `src/lib/store.ts`, a JSON
file behind an async mutex. That one is next.

Personal state hangs off an anonymous device cookie stamped by `src/proxy.ts`.
Sign-in (`/en/signin`) accepts any email and password and stores the result in a
cookie — enough to show a name on a shared itinerary, and nothing more.

Shared itineraries are authorised by an unguessable link segment: anyone holding
the URL can read and edit, with no account.

## Before this goes to production

**Payments and money**
- [ ] Integrate a PSP (Stripe / GMO / Komoju) — the booking flow stops at
      confirmation and charges nothing. See `BookingFlow` step 3.
- [ ] Real inventory and availability per experience/restaurant; right now every
      slot is bookable and nothing is ever sold out.
- [ ] Cancellation, refund and no-show policy, plus the confirmation emails the
      prototype doesn't send.

**External integrations** (all behind `src/lib/providers/`)
- [ ] Amadeus (or equivalent) for flight search; sign the affiliate agreement
      and replace `example-partner.invalid` deep links.
- [ ] Booking.com / Agoda / Rakuten Travel for stays; same for Klook on
      experiences.
- [ ] Real weather and crowd feeds — `src/lib/season.ts` returns deterministic
      pseudo-data keyed on the area name.
- [ ] JMA / L-Alert for the disaster and weather warnings currently mocked in
      `src/data/support.ts`, plus an actual web-push subscription.
- [ ] OCR + translation for the camera feature (returns a fixed menu today).
- [ ] Transit IC card and QR payment partners — the balance is a number in
      component state.
- [ ] eSIM, pocket Wi-Fi and luggage-forwarding partner links.
- [ ] Routing: swap the haversine estimate for a real routing/transit API
      (OSRM, Google Directions, NAVITIME) so travel times reflect actual
      timetables rather than a flat 24 km/h.

**Auth and data**
- [ ] Replace the cookie-as-session placeholder with real authentication
      (`src/lib/session.ts`) — password hashing, email verification, sessions,
      OAuth.
- [ ] The editor console is behind one shared password (`ADMIN_PASSWORD`).
      It needs real accounts, per-organisation scoping, and an edit history —
      several people will be adding places at once.
- [ ] Move the rest of `src/lib/store.ts` (trips, bookings, orders, check-ins)
      into the database alongside places.
- [ ] Explore still filters client-side over every published place. That is fine
      at a few hundred and wrong at a few thousand — move search to the server,
      driven by URL parameters so results are shareable and indexable.
- [ ] Per-trip permissions: the invite link currently grants edit rights to
      anyone who has it, and there's no revocation.
- [ ] Rate limiting and abuse protection on trip creation and note posting.
- [ ] Privacy policy, GDPR/APPI handling, and a consent flow for the analytics
      the B2B dashboard implies.

**Merchandise (the shop is Phase A/B only — deliberately)**
- [ ] Partner agreements: who dispatches, in what time, who eats a lost parcel,
      and how the commission is actually paid out. `Order.commissionJpy` records
      the amount but nothing settles it.
- [ ] Real stock levels. Every item is currently always available.
- [ ] Per-destination import rules for food, alcohol and blades — the product
      pages warn that rules vary, but nothing checks the actual destination.
      Alcohol export also needs a licence; that is why sake is collection-only.
- [ ] Collection-point contracts (airport desks, hotel front desks, konbini
      networks) and the staging/notification flow behind them.
- [ ] Legal copy Japan requires for online sales: 特定商取引法 disclosures and
      景品表示法-compliant pricing, plus returns and refund policy.
- [ ] Phase C (own inventory, cross-border) should not start until Phase A and B
      have numbers proving travellers buy after they get home.

**Manners content**
- [ ] Professional review of the ja/th wording. Etiquette is the worst possible
      place for a machine-translation nuance error.
- [ ] Regional and generational variation. Rules are written as single norms
      today; bathhouse towel handling genuinely differs shop to shop.
- [ ] Source and date each rule, and put it under the same freshness stamps as
      the rest of the data — advice about a specific market's rules goes stale.

**Content and operations**
- [ ] Replace the 30 seed places with a real, sourced catalogue and licensed
      photography; today's artwork is emoji on a gradient. Places have no photo
      field yet — that is the next schema change.
- [ ] Open the editor console to tourism boards so they maintain their own
      listings, scoped to their area.
- [ ] Professional translation review — the ja/th copy is a first pass.
- [ ] Real analytics events feeding `/dashboard`; every number there is
      generated in `src/data/analytics.ts`.
- [ ] Accessibility audit and, for the B2B console, authentication plus
      per-organisation data scoping — `/dashboard` is currently wide open.
