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
| Data | In-repo mock dataset; runtime writes to a JSON file (`.data/db.json`) |

## Running it

```bash
npm install
npm run dev      # http://localhost:3000  → redirects to /en
```

`npm run build && npm start` for a production build. Nothing else to configure —
there are no required environment variables.

The app writes trips, bookings and check-ins to `.data/db.json`. Delete that file
to reset the demo.

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
10. **`/dashboard`** — the B2B console for municipalities and tourism boards:
    views, referrals and bookings by area, weekly trend, category split.

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

### The OTA adapter boundary

`src/lib/providers/` is where the unsigned integrations are quarantined.
`FlightSearchProvider` and `HotelSearchProvider` are interfaces; `mock.ts`
implements both with deterministic sample data; `index.ts` is a registry keyed
off `FLIGHT_PROVIDER` / `HOTEL_PROVIDER`. Wiring up Amadeus, Booking.com or
Klook means adding an adapter and a registry entry — no page or component
changes.

### Storage and identity

`src/lib/store.ts` persists trips, bookings and check-ins to a JSON file behind
an async mutex. Everything the app needs is in its exported functions, so
swapping to Prisma/SQLite is a single-module rewrite.

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
- [ ] Move `src/lib/store.ts` to a real database with migrations and backups.
- [ ] Per-trip permissions: the invite link currently grants edit rights to
      anyone who has it, and there's no revocation.
- [ ] Rate limiting and abuse protection on trip creation and note posting.
- [ ] Privacy policy, GDPR/APPI handling, and a consent flow for the analytics
      the B2B dashboard implies.

**Content and operations**
- [ ] Replace the 30 seed places with a real, sourced catalogue and licensed
      photography; today's artwork is emoji on a gradient.
- [ ] A CMS or partner portal so tourism boards can maintain their own listings.
- [ ] Professional translation review — the ja/th copy is a first pass.
- [ ] Real analytics events feeding `/dashboard`; every number there is
      generated in `src/data/analytics.ts`.
- [ ] Accessibility audit and, for the B2B console, authentication plus
      per-organisation data scoping — `/dashboard` is currently wide open.
