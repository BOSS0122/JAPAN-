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
| Data | SQLite via Prisma (swap the provider for Postgres) — places, trips, bookings, orders, check-ins |

## Running it

Needs PostgreSQL. Development uses the same database engine as production on
purpose: a migration that only ever ran against SQLite is a migration nobody
has tested, and launch day is a bad time to find out.

```bash
npm install
cp .env.example .env       # DATABASE_URL, LINK_SECRET, SITE_URL
npx prisma migrate deploy  # creates the schema
npx prisma db seed         # loads the 30 starter places
npm run editor:create -- you@example.com "Your Name" admin
npm run dev                # http://localhost:3000 → redirects to /en
```

`npm run build && npm start` for a production build.

Everything persists in Postgres via Prisma — the catalogue and the traveller's
own records alike. Itineraries take concurrent writes: two people on the same
invite link write to the same rows, and the stop list is replaced inside a
transaction.

For zero-setup local work you can run SQLite instead: change `provider` in
`prisma/schema.prisma` to `"sqlite"`, point `DATABASE_URL` at a file, and use
`npx prisma db push` rather than `migrate`. The driver adapter is chosen from
the URL, so no application code changes — but don't commit that schema edit,
and don't take a migration authored that way to production.

## Publishing

The traveller site is **closed to the public until `LAUNCHED="true"`**. Closed
is the default and opening is a positive opt-in, so a misconfigured deploy
shows a holding page rather than a half-finished shop.

While it is closed:

- The public gets a holding page on every route, in their own language.
- `robots.txt` is `Disallow: /`, every page carries `noindex, nofollow`, and
  the sitemap is empty — a crawler that indexes a holding page costs the real
  launch its first impression.
- Public writes refuse. Hiding the interface is not closing the door: server
  actions have stable ids and are callable directly, so bookings, orders, trip
  edits and partner hand-offs all check the gate themselves.
- **Signed-in editors see the real site**, which is the entire point of a
  pre-launch period: fill the catalogue where nobody can see it, then open.

### The launch check

```bash
npm run preflight
```

Nine checks against the environment and the database, not against a note in a
README. It exits non-zero while anything is blocking, so it can be the gate in
a deploy pipeline. **`/admin/launch`** shows the same list to an admin.

Severity is the whole design. **Blocking** means opening would harm someone —
charging nothing while saying "confirmed", publishing a legal page with blanks
in it, a language that renders empty. **Review** means the service works but is
worse than it should be — no photos, mock partner hosts. Only blockers stop a
launch, so the list stays worth reading rather than being ignored wholesale.

To go live: make it green, then set `LAUNCHED="true"` and redeploy. That is the
whole ceremony.

### Payments

`PaymentProvider` (`src/lib/providers/types.ts`) is the seam. The default,
`none`, reports `live: false` and throws if called, which drives two different
behaviours on purpose:

- **Before launch** a paid transaction is allowed through and stored with
  `paymentStatus: "uncollected"`. It is a demo, the screens say so, and the
  revenue console reports those separately under 未回収 rather than counting
  them as earnings — money nobody collected is not revenue.
- **After launch** a paid transaction with no live provider is refused, and the
  booking and shop screens say so before the form is filled in. A traveller
  being told they bought something they did not is not a demo detail.

Wiring Stripe is registering an adapter and setting keys; `payment.ts` carries
the exact shape, including the two things that catch people out — JPY is
zero-decimal so the amount is never multiplied by 100, and an order is only
`paid` once the webhook confirms it, because a returned traveller is not proof
of payment.

### Confirmation email

A traveller who books and receives nothing has no record of it — no reference,
no date, nothing to show at the door. Bookings and orders now send a
confirmation in the traveller's own language.

Plain text, deliberately. A confirmation is read on a phone, often on hotel
wifi, sometimes from a mail app's offline cache, and occasionally printed and
handed to someone who does not share the traveller's language. Text survives
all of that. Every line is a fact they may need; nothing is marketing, which is
also what keeps a sending domain out of spam filters.

The default provider writes the composed message to the server log instead of
delivering, so it is visible what would have gone out and to whom. Register a
real adapter in `src/lib/mail/providers.ts` and set `MAIL_PROVIDER` — and set
up SPF and DKIM on the sending domain first, or none of it reaches an inbox.

**`/admin/mail`** renders both templates in all three languages from the real
code. Confirmation mail is the one part of a service nobody on the team sees in
normal use, which is how it ends up broken in a language nobody checked.

Sending is best-effort: a booking is never lost because the mail server was
down. Failures are logged with the reference, which is what a retry needs.

## Deploying

```bash
npx prisma migrate deploy    # never `migrate dev` against production
npm run build
npm start                    # or your platform's start command
```

**`GET /api/health`** returns 503 when the database is unreachable and 200
otherwise. It runs a real query rather than only proving the process is alive,
because a check that cannot fail tells you nothing. Its body also reports
whether `LINK_SECRET`, `SITE_URL` and the operator details are configured —
reported, never failed, since an unfinished legal page is a launch problem and
not an outage.

Point your platform's health check at it, and read it once after the first
deploy: three `false`s there are the three things most likely to be forgotten.

### What only you can supply

| | Where | Why it blocks launch |
|---|---|---|
| Company details | `src/config/operator.ts` | 特商法 requires them wherever goods are sold; the legal pages show 未設定 until filled |
| `LINK_SECRET` | `.env` | The app refuses to start without it in production |
| `SITE_URL` | `.env` | No canonical URLs, hreflang or sitemap without it |
| Postgres | `DATABASE_URL` | — |
| Payment provider | `PAYMENT_PROVIDER` + adapter | Paid transactions are **refused** once launched until one is live |
| Partner contracts | `src/config/revenue.ts`, `src/lib/partner-link.ts` | Rates are placeholders and the host allowlist holds only the mock host |
| Photo licences | upload via `/admin` | Nothing is seeded; we hold no licence to ship any |
| Object storage | `IMAGE_STORAGE` | `local` loses uploads across deploys on more than one instance |

## Adding places

Adding a spot is a form, not a code change. Sign in at **`/admin`** and use
**新規スポット**. Saving a published place makes it visible on the traveller
site immediately — no redeploy.

Create the first account from the shell — there is no self-signup:

```bash
npm run editor:create -- you@example.com "Your Name" admin
```

It prints a generated password; change it at `/admin/account`. After that,
admins add colleagues from **編集者**. Two roles: **管理者 (admin)** manages
accounts and can delete places, **編集者 (editor)** adds, edits and publishes
them. Every save, publish and delete is logged with who did it — see **編集履歴**,
or the history section on any place's edit page. Disabling an account ends its
sessions immediately, and running `editor:create` again for an existing address
resets that password, which is the way back in if the last admin is locked out.

Entries start as **下書き (draft)** and stay invisible until published, so a
half-translated record never reaches a traveller. The list flags which languages
are still missing text.

### Photos

Each place takes up to eight photographs, uploaded from its edit page. The
first is the hero on cards and at the top of the detail page; the rest become a
gallery. Alt text is required — travel content is mostly photographs, and one
without a description is unusable to a screen reader. Credit and a source link
are optional, because most usable travel photography is licensed rather than
owned.

A place with no photographs falls back to its emoji and gradient, so a
half-finished entry still looks deliberate. Nothing is seeded: we hold no
licence to ship any image.

Uploads go through `ImageStorage` (`src/lib/storage/`), the same adapter shape
as the OTA providers. `local` writes into `public/uploads/places` and is right
for development and one self-hosted box; on several instances or an ephemeral
filesystem it loses images between deploys, which is what an S3/R2 adapter and
`IMAGE_STORAGE` are for. Filenames are generated server-side and never taken
from the upload, and only JPEG, PNG, WebP and AVIF up to 8MB are accepted.

### Adding many places

Adding the fifth izakaya in one alley should not mean retyping the fourth.
**複製** — on the list and on any edit page — opens a new entry carrying the
area, coordinates, hours, tags, price band and commission rate across, with the
slug and all names and descriptions blank and the status forced to draft. What
is safe to share is copied; what would be wrong to publish is not.

A place is live in all three languages the moment it is saved as published:
searchable, filterable, bookable if marked so, and picked up by the course
planner. No redeploy, no cache flush.

**Fill areas deeply rather than the map broadly.** The course planner needs
places close enough to walk between; thirty spots scattered over thirty cities
produce one-stop days, while a hundred and fifty in one city produce real
itineraries. Finish a city before starting the next.

## How this earns

Three lines, all measured rather than assumed:

| Line | Mechanism | Recorded as |
|---|---|---|
| Bookings | our take on experiences and restaurants booked here | `Booking.commissionJpy`, frozen at the rate in force |
| Merchandise | commission on items a partner ships or stages | `Order.commissionJpy` |
| Referrals | affiliate hand-offs for flights, hotels and local services | `PartnerClick` |

Rates live on the record they apply to — `Place.commissionPct` per venue,
`Product.commissionPct` per item — and are copied onto each transaction when it
is made, so renegotiating a rate never rewrites what was already earned.
Affiliate rate assumptions sit together in `src/config/revenue.ts`, named as the
placeholders they are.

Every outbound partner link goes through **`/api/go`**, which records the click
and then redirects. That is what makes affiliate revenue collectable: without
it, you are trusting the partner's own count. The destination is HMAC-signed
with `LINK_SECRET` and checked against a host allowlist, because a redirect
that forwards to any URL in a query string is an open redirect — a phishing
primitive on your own domain. Unsigned, forged and off-allowlist links all get
a 400, never a redirect.

**`/admin/revenue`** (admins only) shows earnings, gross, hand-offs and a
per-place funnel that flags places with views and no conversions — where the
money is leaking. Confirmed earnings and referral pipeline are never added
together: a click is not a sale, and summing them always overstates.

**`/dashboard`**, the partner-facing console, reads the same measured data. It
used to be entirely sample figures; a console you can sell to a tourism board
is one whose numbers you can stand behind, so the sample set is gone and an
empty period says so plainly.

## Before you go live

Two files hold everything only the operator can supply, and the site tells you
when they are blank rather than letting you publish an unfinished page:

- **`src/config/operator.ts`** — company name, responsible officer, address,
  phone, email, hours, registration number. Japan's 特定商取引法 requires these
  to be published wherever goods are sold, and the privacy policy needs a
  contact who answers data requests. Every legal page shows a red banner
  naming each field still empty, and prints 未設定 in place of the value.
- **`.env`** — `DATABASE_URL`, `LINK_SECRET`, `SITE_URL`, `ADMIN` accounts via
  `npm run editor:create`.

The legal copy in `src/data/legal.ts` describes what this software actually
does — which cookies it sets, what each is for, what leaves the site and to
whom. That accuracy is the part worth having. It is not legal advice, and it
should be reviewed by a lawyer against your own circumstances before launch.

**Consent.** The banner draws a real line rather than decorating one. Declining
still counts a partner hand-off — a referral you cannot evidence is one you
cannot invoice — but stores it with no device id, so it is a tally rather than
a record about a person. The device cookie that holds your shortlist, bookings
and stamps is set either way, because the service does not work without it, and
the banner says so instead of bundling it into "accept". Accept and decline are
the same size and weight.

## Mood search

A traveller who knows they want *something* but not *where* can describe it —
「パワースポットを回りたい」, "somewhere quiet with a view", 「夜にダンスクラブ」 —
and get real places back, each with a sentence on why it fits.

**The model never names a place.** It is handed catalogue rows and may only
return ids from that list; every id it returns is checked back against those
rows before anything renders, and one that was not supplied is dropped, counted
and logged. A travel service that invents a shrine sends someone across a
country they do not know to stand in an empty field, so this is the feature, not
a safeguard bolted onto it. `npm test` exercises that boundary with providers
that misbehave on purpose.

Filters still apply — they decide what the search may choose from, so
`?mood=静かなところ&area=kyoto` narrows before it ranks. The mood lives in the
URL like every other filter, so a result is shareable.

`MOOD_PROVIDER=local` (the default) is keyword and synonym matching: no API
call, no cost, and honest about itself — the page says when it answered.
`MOOD_PROVIDER=claude` with `ANTHROPIC_API_KEY` reads the descriptions instead.
Answers are cached for a day, keyed on the query, the locale, the provider, the
eligible place ids **and a ranking version** — without that last part, deploying
a better answer keeps serving the worse one until the cache expires.

**The ceiling here is the catalogue, not the model.** Asked for a dance club,
neither provider can return one, because there isn't one — `nightlife` is a
single tag covering izakaya, an onsen stroll and a crossing. Both are built to
say "nothing fits" rather than pad the list, which is the right answer and also
a standing reminder of where the real work is.

## Being found

Organic search is how a stranger planning a trip to Japan finds a service like
this, so discovery is treated as a feature rather than a deployment afterthought.

- **`SITE_URL`** drives canonical URLs, hreflang and the sitemap. Unset, those
  are omitted rather than guessed — a wrong origin in a canonical tag is worse
  than none.
- **hreflang** is declared per page, not on the layout. Metadata is inherited in
  the App Router, so a canonical set once at the top would tell a search engine
  that every page is a duplicate of the homepage.
- **`/sitemap.xml`** is generated from the live catalogue with language
  alternates on every entry, so a place published through the console is in the
  sitemap on the next crawl with no extra step.
- **JSON-LD** on each place, typed to what the place actually is — a restaurant
  is a `Restaurant`, not a `TouristAttraction` — and carrying only facts already
  visible on the page.
- **Personal pages** (`/you`, trips, bookings, orders, the booking form) are
  noindex, and `robots.txt` also keeps crawlers out of `/api/go`: a crawler
  following hand-offs would fill the click table with referrals nobody made.

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
   Every filter is a URL parameter and every query runs in SQL, so
   `/en/explore?cat=experience&fame=hidden&tags=craft&sort=price` is a working
   link that a cold browser reproduces exactly — controls and all. Results are
   paginated at 24; the Next button is a real link. Searching matches names in
   *any* language, so "Kyoto" works while reading Thai.
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

Photographs are uploaded per place through the console — see **Photos** above.
Nothing is seeded, so the repository ships with nothing to license; a place
without photos falls back to an emoji on a gradient.

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

**Revenue**
- [ ] Affiliate rates in `src/config/revenue.ts` are placeholders. Replace each
      with the signed contract's terms.
- [ ] Referral revenue is reconciled from our click count against the partner's
      postback. Neither the postback endpoints nor an invoicing flow exist.
- [ ] Payments are still a dummy confirmation screen. Nothing is charged, so
      "confirmed revenue" is what *would* be earned once a PSP is wired in.
- [ ] No attribution window or de-duplication on clicks: the same traveller
      clicking twice counts twice in the pipeline figure.
- [ ] Untried levers: featured placement, a per-partner subscription for the
      console, and a cut of the tax-free refund flow.

**Auth and data**
- [ ] Photos are stored and served at their uploaded size. Production wants
      resizing, an image CDN, and modern formats generated on upload.
- [ ] `npm audit` reports a high-severity advisory in `deepmerge-ts`, reached
      only through the Prisma CLI (a devDependency, never in the served app).
      The offered fix downgrades to Prisma 6, which the schema cannot use;
      revisit when the Prisma CLI updates its own dependency.
- [ ] Replace the traveller-side cookie-as-session placeholder
      (`src/lib/session.ts`) with real authentication — the editor console has
      accounts, roles and hashed passwords; the traveller side does not.
- [ ] Editor accounts have no rate limiting on sign-in, no password reset by
      email, no 2FA, and no per-organisation scoping. Roles are global.
- [ ] Explore ranks by relevance in application code over a slim projection of
      every match. That is cheap into the tens of thousands and wants a stored
      rank column, refreshed on a schedule, beyond that. Free-text search is
      `LIKE`; real search means Postgres full-text or a search service.
- [ ] Home, `/rewards` and `/hotels` still read the whole published catalogue
      per request. They render on the server so nothing extra reaches the
      browser, but they need their own paging before the catalogue is large.
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
      photography. The upload path exists; the licences do not.
- [ ] Open the editor console to tourism boards so they maintain their own
      listings, scoped to their area.
- [ ] Professional translation review — the ja/th copy is a first pass.
- [ ] Real analytics events feeding `/dashboard`; every number there is
      generated in `src/data/analytics.ts`.
- [ ] Accessibility audit and, for the B2B console, authentication plus
      per-organisation data scoping — `/dashboard` is currently wide open.
