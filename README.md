# Coy · Discover

A swipe-based **Discover** tab (Tinder/Bumble style) for a mock of Coy, an anonymous crush-matching app.
Core promise: **never reveal who has liked you unless it is mutual.**

> Work in progress. See `AGENTS.md` for the full spec and implementation order.
> Status: step 1 done (scaffold, design tokens, font, test setup).

## Run it

```bash
npm install
npm run dev     # open the printed URL
npm test        # vitest
npm run build
npm run lint
```

Requires Node 20+. The Bricolage Grotesque font is fetched from Google Fonts at build/dev time, so the first
`dev`/`build` needs internet access.
