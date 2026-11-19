# AGENTS.md — Coy "Discover" tab (standalone build)

> Context file for an AI coding agent. It contains everything needed to build this project from an empty folder. Read it fully before writing code. If any screenshots of the real Coy app are available to you, they win over the visual values below wherever they differ; otherwise treat the values here as the source of truth.

---

## 1. Goal

Build a **standalone** Next.js app that adds a swipe-based **"Discover"** tab (Tinder/Bumble style) to a mock of Coy, an anonymous crush-matching app. The real Coy codebase is not available, so the app is only:

- a header (Coy logo and settings button),
- a bottom **tab bar** with two tabs: **Home** (intentionally blank) and **Discover** (all the functionality),
- Discover = a swipe deck + a Matches view + an "It's a match!" screen.

It will be published as a **public GitHub repo** and reviewed on UI fidelity to Coy, swipe feel, and correctness of the matching rules.

### The core promise (most important rule in the project)

> **Never reveal who has liked the user unless it is mutual.**

This is Coy's whole product premise. It constrains the API, the UI, the data flow and even the ordering of the feed. See section 7. Every other decision is secondary to this one.

### Non-goals

No real auth, no sign-up, no chat, no profile editing, no photo upload, no external services. Single hard-coded logged-in user. Keep Home blank.

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | Latest stable **Next.js**, App Router, TypeScript (`strict: true`) |
| Frontend | React, **mobile-first**, Tailwind CSS (CSS variables for tokens) |
| Animation / gestures | `framer-motion` (drag, springs, `AnimatePresence`) |
| Icons | `lucide-react` (rounded stroke icons match Coy's icon style) |
| Backend | Next.js **Route Handlers** (`app/api/**/route.ts`) |
| Data | A **JSON file** on disk (no native dependencies, works on Windows) |
| Tests | `vitest` for the matching logic and API privacy checks |
| Runtime | Node 20+. Developer machine is **Windows**: no bash-only scripts, use `node` scripts and `path.join` |

Keep dependencies minimal. No UI kits, no ORM, no validation library (manual validation is fine).

---

## 3. Design system (must match Coy)

Coy's look is **soft neo-brutalist**: white page, very dark ink outlines (2px), **hard offset shadows with no blur**, pastel fills, a hot-pink primary, chunky heavy headings, fully rounded pill buttons, and friendly emoji. Be faithful to this. Do not introduce gradients, glassmorphism, blur shadows, or other palettes.

### 3.1 Color tokens (put in `app/globals.css`)

Values are estimated from Coy's screenshots; use them as given.

```css
:root {
  --ink:        #15111e; /* text, 2px borders, hard shadows (near-black with a purple tint) */
  --paper:      #ffffff; /* page background */
  --pink:       #ff3d81; /* primary buttons, brand dot, "like" */
  --pink-deep:  #d6175a; /* pink text: links like "More slots", referral code, LIKE stamp */
  --pink-soft:  #ffe3ee; /* selected option fill, soft pink icon buttons */
  --lavender:   #e6dfff; /* hero card fill */
  --surface:    #f4f1fa; /* list rows, icon buttons, chips, segmented track */
  --mint:       #c9f3de; /* highlight card fill */
  --yellow:     #ffe066; /* avatar fill, "Best value" style badge */
  --peach:      #ffdfcf; /* avatar fill */
  --sky:        #d9ecff; /* icon tile fill */
  --muted:      #6b6878; /* secondary text */
  --dash:       #c9c4da; /* dashed outlines */
  --scrim:      rgba(21, 17, 30, 0.5); /* modal backdrop */
}
```

Text on `--pink` buttons is **ink**, not white. Page background is always white.

### 3.2 Typography

One sans-serif family, geometric grotesque, heavy headings. Closest free match: **Bricolage Grotesque** via `next/font/google` (weights 400–800); fall back to `system-ui`. Do not spend long matching it exactly.

- Logo: lowercase `coy`, 800 weight, tight tracking (`-0.04em`), about 32px, followed by a solid **pink dot** (about 10px circle) sitting on the baseline.
- Hero heading: 32–36px, weight 800, `letter-spacing: -0.02em`, `line-height: 1.05`.
- Section title ("Your matches"): 20px, 800.
- Card/list title: 17–18px, 700.
- Body: 16px, `--muted`.
- Helper text: 13–14px, `--muted`.
- Eyebrow labels: 12px, uppercase, `letter-spacing: 0.08em`, `--muted`.

### 3.3 Shape, borders, shadows

- Border: **2px solid `--ink`** on interactive and "hero" elements. Soft rows (list rows, chips, segmented track) have **no border**, just a `--surface` fill.
- Hard shadow (no blur), always bottom-right: `--shadow-lg: 6px 6px 0 var(--ink)` (big cards), `--shadow-md: 4px 4px 0 var(--ink)` (buttons), `--shadow-sm: 3px 3px 0 var(--ink)` (small pills).
- Radii: big cards and modals **28px**, list rows **20px**, buttons and chips **999px** (pill), circular icon buttons **50%**.
- Pressed state for bordered buttons: translate `3px, 3px` and remove the shadow (looks like pressing the button flat). Transition 80–120ms.
- Dashed empty slot style: `2px dashed var(--dash)`, radius 24px, transparent fill.

### 3.4 Component recipes (reuse these exact patterns)

- **Primary button**: full-width or auto, height 52px, `--pink` fill, 2px ink border, `--shadow-md`, ink text, 700, pill.
- **Secondary button**: same as primary with `--paper` fill (like the "Invite friends" / "Copy link" buttons).
- **Icon button**: 44px circle, `--surface` fill, no border (the settings gear and the modal close "X"), lucide icon 22px, stroke 2.25.
- **Text link**: `--pink-deep`, 700, underlined (like "More slots"), or `--muted` underlined (like "Go back").
- **Hero card** (e.g. "No one has added you yet"): `--lavender` fill, 2px ink border, `--shadow-lg`, radius 28, padding 24, a large emoji at the top, heading, muted subtext, then a secondary pill button.
- **List row** (e.g. a crush): `--surface` fill, radius 20, padding 16, a 56px circular avatar on the left (colored fill, bold initial), name 700 and muted subline.
- **Count chip** (like "2/3"): `--surface` fill, pill, padding 4px 12px, 14px weight 700.
- **Modal** (like "Add a crush"): centered white sheet, radius 28, padding 24, `--scrim` backdrop, close "X" icon button top-right, 800 heading, muted body, full-width primary button, underlined text link below it.
- **Tag/badge**: small pill, `--yellow` or `--pink` fill, 2px ink border, 12px uppercase 800, slightly rotated (`-3deg`) for playful feel.

### 3.5 Layout

- Mobile-first. Content column: `max-width: 480px`, centered, horizontal gutter 20px. On desktop it's the same centered column on a white page. Do not stretch.
- Use `100dvh` and `env(safe-area-inset-*)` so the deck, action buttons and tab bar fit on phones without page scroll on the Discover swipe view.
- Header height 64px: logo left, gear icon button right.
- **Tab bar**: fixed to the bottom of the column, white fill, `border-top: 2px solid ink`, height 68px plus safe-area. Two equal tabs, each with a lucide icon and a label (`Home`: `House`, `Discover`: `Flame` or `Compass`). Active tab = pink pill (`--pink` fill, 2px ink border, `--shadow-sm`, ink text); inactive = `--muted` icon and label, no pill.

---

## 4. Information architecture

```
/                → redirects to /discover (demo-friendly)
/home            → blank tab (header + tab bar only, empty content area, no text)
/discover        → segmented control: [Swipe] [Matches (n)]
```

- Header and tab bar live in a shared layout (`app/(app)/layout.tsx`). Tabs are real routes using `next/link`, so reload keeps the user on their tab.
- Inside Discover, the **Swipe / Matches** segmented control switches views client-side (also reflect it as `?view=matches` so reload keeps it).
- The **settings gear** opens a small modal with one action: "Reset demo data" (calls `POST /api/reset`, then refreshes). Keep the modal in the Coy modal style.

---

## 5. Data model

Single logged-in user, hard-coded: `ME_ID = "me"`. No user table needed.

```ts
// Public shape. This is the ONLY shape ever sent to the client.
export type Profile = {
  id: string;            // "p01" … "p36"
  name: string;
  age: number;           // 18–25 only (adults)
  photo: string;         // "/photos/p01.svg"
  bio: string;           // ≤ 120 chars, light and a bit playful
  location: string;      // college or city, e.g. "IIIT Delhi" or "Gurugram"
  interests: string[];   // 3–5 short items
};

// Server-only seed shape. NEVER import this type in client code.
export type SeedProfile = Profile & {
  likedMe: boolean;      // does this profile already like the logged-in user?
};

export type SwipeDirection = "like" | "pass";

export type SwipeRecord = {
  profileId: string;
  direction: SwipeDirection;
  createdAt: string;     // ISO
};

export type MatchRecord = {
  profileId: string;
  matchedAt: string;     // ISO
};

export type DbState = {
  swipes: Record<string, SwipeRecord>; // keyed by profileId, so one swipe per profile
  matches: MatchRecord[];
};
```

### Files on disk

- `data/profiles.json`: committed. The seed (array of `SeedProfile`). Read-only at runtime.
- `data/state.json`: **git-ignored**, created lazily on first write. Holds `DbState`. Delete it (or call reset) to restart the demo.
- Allow overriding the directory with env var `DATA_DIR` (default `./data`). On read-only hosts (e.g. Vercel) fall back to `os.tmpdir()` and note in the README that state is ephemeral there. Local run is the primary demo path.

### Seed requirements (`data/profiles.json`)

- **36 profiles** (ids `p01`–`p36`), varied Indian names with a mix of genders, ages 18–25, locations drawn from a mix such as: IIIT Delhi, Delhi University, IIT Delhi, NSUT, JNU, Amity Noida, Ashoka University, Gurugram, Noida, Ghaziabad.
- Bios short and warm ("Chai over coffee. Will judge your playlist."). No real people, no real social handles, no sexual content.
- Interests drawn from a shared pool (Music, Cricket, Coding, Anime, Photography, Gym, Dance, Chai, Travel, Books, Gaming, Cooking, Football, Stand-up, Art, Movies, Running, Podcasts).
- **Exactly 12 profiles have `likedMe: true`** (about a third), spread across the list so demos produce matches within the first few likes.
- Example entry:

```json
{
  "id": "p03",
  "name": "Ananya",
  "age": 21,
  "photo": "/photos/p03.svg",
  "bio": "Chai over coffee. Will judge your playlist.",
  "location": "Delhi University",
  "interests": ["Music", "Chai", "Photography", "Books"],
  "likedMe": true
}
```

### Placeholder photos

Generate offline, no network. Write `scripts/generate-photos.mjs` that outputs `public/photos/p01.svg … p36.svg` (portrait 600×800). Each SVG: a flat background cycling through `--lavender`, `--mint`, `--peach`, `--yellow`, `--sky`, `--pink-soft`; two or three large overlapping soft shapes in other palette colors; and the person's initial, huge and bold, in ink. No faces and no copyrighted art. Commit the generated SVGs, and add `npm run photos` to regenerate.

---

## 6. Backend

All logic lives in a small server-only module, `lib/server/` (`db.ts`, `feed.ts`, `swipe.ts`). Route handlers stay thin: parse, call, respond.

- Add `export const dynamic = "force-dynamic"` to every route handler.
- Reads/writes go through one `db.ts`: load `state.json` (or an empty state), mutate in memory, and **write atomically** (write to a temp file in the same directory, then `rename`). Serialize writes with a simple promise-chain mutex so rapid swipes can't corrupt the file.
- Spec routes are implemented under `/api/*`. Also add `rewrites` in `next.config` so the literal paths `/feed`, `/swipe`, `/matches` work as aliases.

### 6.1 `GET /api/feed?limit=10`

Returns profiles the user has **not yet swiped on**, in a stable shuffled order (see 7.3).

```json
{ "profiles": [ { "id": "p07", "name": "...", "age": 20, "photo": "/photos/p07.svg", "bio": "...", "location": "...", "interests": ["..."] } ], "remaining": 31 }
```

- `limit`: default 10, min 1, max 20. Invalid → default.
- `remaining`: total number of unswiped profiles (including those returned).
- Empty deck → `{ "profiles": [], "remaining": 0 }` (200, not an error).
- The response **must be built by mapping `SeedProfile → Profile` with an explicit allow-list of fields.** Never spread or return the seed object.

### 6.2 `POST /api/swipe`

Body: `{ "profileId": "p07", "direction": "like" | "pass" }`

```json
{ "matched": false }
{ "matched": true, "match": { /* Profile */ }, "matchedAt": "2026-11-18T07:30:00.000Z" }
```

Rules:
- Unknown JSON / missing fields / `direction` not `like|pass` → **400** `{ "error": "invalid_body" }`.
- `profileId` not in seed → **404** `{ "error": "profile_not_found" }`.
- Record the swipe, then: if `direction === "like"` **and** the seed says that profile `likedMe`, create a `MatchRecord` and return `matched: true`. A pass never matches. A like on a profile that did not like the user returns `matched: false` and looks exactly the same as any other non-match.
- **Idempotent**: swiping an already-swiped profile changes nothing and returns the originally recorded outcome (`matched` as stored) with `"alreadySwiped": true`, status 200. Never create duplicate swipes or matches.
- Matches are created only here. Do not create matches anywhere else.

### 6.3 `GET /api/matches`

```json
{ "matches": [ { "profile": { /* Profile */ }, "matchedAt": "2026-11-18T07:30:00.000Z" } ] }
```

Newest first. Only profiles with a `MatchRecord`.

### 6.4 `POST /api/reset` (demo helper)

Deletes `state.json`. Enabled when `NODE_ENV !== "production"` or `ALLOW_RESET=true`; otherwise 403. Returns `{ "ok": true }`.

---

## 7. Privacy rules (enforced by tests)

1. `likedMe` (and anything derived from it) must **never** appear in any API response, HTML, client bundle, console log or error message. Keep `SeedProfile` and `profiles.json` imports in server-only code (`import "server-only"`).
2. No UI element may hint at who liked the user: no "likes you" badges, no "X people liked you" counts, no special highlight on the card, no different animation before the swipe.
3. **Feed order must not correlate with `likedMe`.** Shuffle the profile ids with a seeded PRNG (e.g. mulberry32) that uses only the ids, never `likedMe`. Choose the PRNG seed so the first 8 feed items contain 2–4 `likedMe` profiles (verify with a script, then hard-code the seed), so a demo reaches a match quickly without sorting by the secret.
4. A like that does not match returns the same response shape and an equivalent status as a pass. The user learns nothing about a profile they liked that didn't like them back.
5. Passing on a profile that liked the user reveals nothing, and that profile never appears again.
6. `GET /api/matches` returns only mutual matches.

### Required tests (`vitest`)

- `swipe()` logic: like on `likedMe` → match; like on non-`likedMe` → no match; pass on `likedMe` → no match; repeated swipe is idempotent; unknown id → not found.
- Feed excludes swiped profiles and never returns a profile twice across calls.
- **Leak test**: `JSON.stringify` of `/api/feed`, `/api/swipe` (both outcomes) and `/api/matches` responses contain no `likedMe` key and no field outside the `Profile` allow-list.
- Feed order: first 8 items contain 2–4 `likedMe` profiles and the full order is not sorted by `likedMe`.

---

## 8. Frontend behavior

### 8.1 State (`hooks/useDiscover.ts`)

- On mount: `GET /api/feed?limit=10`, store as a queue. Prefetch the next batch when the queue drops to 3 or fewer.
- Keep a `seenIds` set on the client. When merging a new batch, **drop any id already seen or in the queue** (guards against races with in-flight swipes).
- Swiping is **optimistic**: remove the card from the queue immediately, then `POST /api/swipe`. If the request fails, restore the card at the top and show an error toast ("Couldn't save that swipe. Try again."). While a card is animating out, ignore further input on that card (a per-card lock).
- If the response has `matched: true`, push the profile onto a `matchQueue`; show matches one at a time.
- Matches view: `GET /api/matches` on open and after every new match.

### 8.2 The card

- Shows the top card interactive and the next **two** cards behind it (scale 0.95 and 0.9, offset down 10px and 20px, not interactive, never showing drag feedback).
- Card anatomy (neo-brutalist): white card, 2px ink border, radius 28, `--shadow-lg`.
  - Photo on top (about 60% of card height, `object-fit: cover`, radius 22 inside the border).
  - Below: **name, age** (800, 26px), location with a `MapPin` icon in `--muted`, bio (16px), and interest **chips** (`--surface`, `--lavender`, `--mint`, `--peach` cycling, pill, 13px, 600, no border).
- The card must fit between header and action buttons without internal scrolling on a 375×667 viewport. If space is short, shrink the photo, never overflow.

### 8.3 Gestures and feedback

- `framer-motion` `drag="x"`, `dragElastic ≈ 0.7`, `dragSnapToOrigin`. Card CSS: `touch-action: pan-y` so vertical page scroll isn't blocked.
- Rotation follows x: `rotate = useTransform(x, [-220, 0, 220], [-14, 0, 14])`.
- **Commit** when `|offset.x| > 110px` or `|velocity.x| > 500`: animate off-screen (`x: ±(viewportWidth + 100)`, rotate ±20°, opacity to 0) in about 280ms, then commit. Otherwise spring back (`type: "spring", stiffness: 400, damping: 30`).
- **Stamps** on the card, opacity mapped from drag x:
  - Right (like): **LIKE** at top-left, rotated −12°, `--pink-deep` text and 4px `--pink-deep` border, radius 12, 32px 800, opacity from 0 at x=20 to 1 at x=120.
  - Left (pass): **PASS** at top-right, rotated +12°, ink text and 4px ink border, same sizing.
- Card tint overlay: `--pink-soft` at up to 35% opacity while dragging right; `--surface` at up to 60% while dragging left.
- When the next card is promoted, it springs from scale 0.95 → 1.
- `navigator.vibrate?.(10)` on commit (ignore if unsupported).
- Respect `prefers-reduced-motion`: replace fly-out and rotation with a quick fade, keep stamps.

### 8.4 Buttons (desktop and a11y; also shown on mobile)

Below the deck, centered, 24px apart:
- **Pass**: 64px circle, `--paper` fill, 2px ink border, `--shadow-md`, lucide `X` (ink, stroke 2.5). `aria-label="Pass"`.
- **Like**: 72px circle, `--pink` fill, 2px ink border, `--shadow-md`, lucide `Heart` (ink, stroke 2.5). `aria-label="Like"`.
- Clicking triggers the same fly-out animation as a swipe (programmatic animate on the top card, then commit).
- Keyboard: `ArrowRight` = like, `ArrowLeft` = pass (only while the Swipe view is active and no modal is open).
- Under the buttons, helper text in the style of Coy's small gray notes: *"They only find out if it's mutual."*

### 8.5 "It's a match!" screen

Modal in Coy's modal style (scrim, centered, radius 28):
- `--lavender` fill with 2px ink border and `--shadow-lg`.
- A 🎉 emoji, heading **"It's a match!"** (800, 34px), subtext: *"You and {name} both liked each other."* (`--muted`).
- Two overlapping 88px circular avatars with 2px ink border: yours (a `--yellow` circle with a "Y" initial) and the match's photo.
- Primary pink button **"View matches"** (switches to the Matches view and closes), underlined text link **"Keep swiping"** below it.
- Entrance: scale 0.9 → 1 spring with fade; a few CSS-only confetti dots in palette colors (optional, keep it subtle). Respect reduced motion. Escape closes it.

### 8.6 Matches view

- Title **"Your matches"** with a count chip (e.g. `3`) on the right, like the "Your crushes 2/3" header.
- List of **rows** (list-row recipe): 56px circular photo avatar with 2px ink border, `Name, age` in 700, location in `--muted`. Newest first.
- Empty state: dashed card (dashed-slot recipe) with *"No matches yet"* (700) and muted *"Keep swiping. Matches show up here when you both like each other."*
- Under the list, a muted helper note: *"Only mutual likes show up here."*

### 8.7 Empty state (no profiles left)

Replace the deck with a **hero card** (lavender): emoji 🌙, heading **"You're all caught up"**, subtext *"No more profiles right now. Check back soon."*, a secondary pill button **"View matches"**. Hide the Like/Pass buttons.

### 8.8 Loading and errors

- Loading: a skeleton card (`--surface` fill, same radius and size, subtle pulse) instead of a spinner.
- Fetch failure for the feed: hero-card style error with a **"Try again"** secondary button.
- Toasts: small ink-bordered pill at the top, 3s, ink text on `--yellow`.

---

## 9. File structure

```
.
├─ AGENTS.md
├─ README.md
├─ package.json
├─ next.config.ts              # rewrites: /feed /swipe /matches → /api/*
├─ .gitignore                  # includes data/state.json
├─ .gitattributes              # * text=auto (Windows line endings)
├─ data/
│  └─ profiles.json            # 36 seed profiles (server-only)
├─ public/photos/              # p01.svg … p36.svg (generated, committed)
├─ scripts/
│  └─ generate-photos.mjs
├─ app/
│  ├─ globals.css              # tokens + .neo-* recipes
│  ├─ layout.tsx               # fonts, metadata, viewport (viewport-fit=cover)
│  ├─ page.tsx                 # redirect → /discover
│  ├─ (app)/
│  │  ├─ layout.tsx            # header + tab bar
│  │  ├─ home/page.tsx         # blank
│  │  └─ discover/page.tsx
│  └─ api/
│     ├─ feed/route.ts
│     ├─ swipe/route.ts
│     ├─ matches/route.ts
│     └─ reset/route.ts
├─ components/
│  ├─ Header.tsx  TabBar.tsx  Logo.tsx  Modal.tsx  Toast.tsx
│  └─ discover/
│     ├─ DiscoverView.tsx  SegmentedControl.tsx
│     ├─ SwipeDeck.tsx  ProfileCard.tsx  ActionButtons.tsx
│     ├─ MatchModal.tsx  MatchesList.tsx  EmptyDeck.tsx  CardSkeleton.tsx
├─ hooks/useDiscover.ts
├─ lib/
│  ├─ types.ts                 # Profile (shared); SeedProfile is server-only
│  ├─ api-client.ts            # typed fetch helpers
│  └─ server/                  # import "server-only"
│     ├─ db.ts  seed.ts  feed.ts  swipe.ts  shuffle.ts
└─ tests/                      # vitest
```

---

## 10. Implementation order

1. **Scaffold**: `create-next-app` (TypeScript, Tailwind, App Router), install `framer-motion`, `lucide-react`, `vitest`, `server-only`. Add tokens and `.neo-*` recipes to `globals.css`. Set up the font.
2. **Shell**: logo, header, tab bar, `/home` (blank), `/discover`, redirect from `/`. Check it against section 3 before moving on.
3. **Data**: write `profiles.json` (36 entries, 12 with `likedMe`), the photo generator and the 36 SVGs.
4. **Backend**: `db.ts` (atomic writes + mutex), `shuffle.ts`, `feed.ts`, `swipe.ts`, the four route handlers, rewrites. Write the section 7 tests and make them pass.
5. **Deck UI**: `ProfileCard`, `SwipeDeck` with drag, stamps, fly-out, stack, action buttons and keyboard.
6. **State**: `useDiscover` with optimistic swipes, dedupe, prefetch, rollback, toasts.
7. **Match flow**: `MatchModal`, `MatchesList`, segmented control, `?view=` sync, empty and loading states.
8. **Settings**: gear modal with "Reset demo data".
9. **Polish and QA**: reduced motion, safe areas, small phones (360×640), desktop. Run the checklist below.
10. **README + publish**: public GitHub repo, conventional commits, a few meaningful commits (not one giant one).

---

## 11. Acceptance checklist (all must pass)

**Data and API**
- [ ] ≥ 30 profiles seeded (36), each with name, age, photo, bio, location, interests.
- [ ] Some seeded profiles already like the user (12), and liking them produces "It's a match!".
- [ ] `GET /feed`, `POST /swipe`, `GET /matches` work (as `/api/*` and via the alias paths).
- [ ] Swipes and matches survive a full page reload and a dev-server restart.
- [ ] A swiped profile never reappears, including after reload and fast double swipes.

**Core promise**
- [ ] No API response, rendered HTML or client bundle contains `likedMe` or any "who liked me" information.
- [ ] No UI element hints at who liked the user. Feed order is not sorted by `likedMe`.
- [ ] A match happens only when the user likes a profile that also liked them. Passing never creates a match.
- [ ] Matches view lists only mutual matches.

**UX**
- [ ] One card at a time, with the next cards visibly stacked behind it.
- [ ] Drag works with touch and mouse. LIKE/PASS stamps and tint respond to drag distance. Springs back below the threshold.
- [ ] Buttons and arrow keys work on desktop and trigger the same animation.
- [ ] Empty state shows when profiles run out. Loading skeleton and error states exist.
- [ ] "It's a match!" screen appears at the moment of a match, with "View matches" and "Keep swiping".
- [ ] No horizontal page scroll, no layout shift, no console errors or hydration warnings.

**Visual fidelity to Coy**
- [ ] White page, ink 2px borders, hard offset shadows (no blur), pink primary buttons with ink text, lavender/mint pastel cards, pill buttons.
- [ ] The Home tab is blank (header and tab bar only).
- [ ] Looks right at 360px, 390px and 480px+ widths.

---

## 12. README requirements

Include: what it is, a screenshot or GIF of swiping and a match, how to run (`npm install`, `npm run dev`, open the printed URL), `npm test`, how to reset the demo, the API contract table (copy of section 6), a short "How the core promise is protected" section (section 7 in your own words), design decisions (JSON file for zero-dependency persistence, optimistic swipes, seeded shuffle), a note on Vercel (state is ephemeral on read-only filesystems; `DATA_DIR` falls back to a temp dir), and what you'd build next (real auth, DB, chat on match, report/block).

State in the README that seeded `likedMe` values exist only as server-side mock data; in production this would be rows in a swipes table that is never exposed.

---

## 13. Rules for the agent

- Do not invent features beyond this spec. Do not add auth, chat or uploads.
- Never weaken the privacy rules to make the demo easier. Use the seed and shuffle design in 7.3 instead.
- Keep Windows compatibility: no `rm -rf`, no shell-only scripts, use `node` and `path.join`.
- Prefer small, readable components. Server code stays in `lib/server/` with `import "server-only"`.
- Run `npm test`, `npm run build` and `npm run lint` before declaring done. Fix warnings.
- When something here is ambiguous, choose the simplest option that keeps the UI faithful to Coy and the core promise intact, and note the choice in the README.

---

## 14. Build notes (added during implementation)

- **Step 1:** the generator enabled `cacheComponents` and `partialPrefetching` in `next.config.ts`; both are turned off because `export const dynamic = "force-dynamic"` (section 6) is not allowed with Cache Components. `@types/node` is `^22` because `vitest` 5 requires it. Buttons combine `neo-btn neo-press` (and `neo-circle neo-press` for the action buttons) so the pressed-flat behaviour lives in one place.
- **Step 2:** the shell is one `100dvh` column (`app/(app)/layout.tsx`) with header, scrolling `<main>` and the tab bar as flex children, instead of a `position: fixed` bar. The result is the same (bar pinned to the bottom of the 480px column, safe-area padding included) and the page itself never scrolls. Tabs are equal-width links; the active one shows a content-sized pink pill.
- **Step 3:** `likedMe` is true for p03, p05, p09, p12, p14, p18, p21, p25, p27, p30, p33 and p36 (irregular on purpose, at least one in each quarter of the file). That is only the seed order; the feed order is a separate seeded shuffle of ids (step 4). `tests/seed.test.ts` checks the seed shape and that every photo exists. `npm run photos` regenerates the SVGs deterministically.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
