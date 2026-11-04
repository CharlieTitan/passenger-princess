# Passenger Princess / US

Two existing Next.js applications deploy from this repository:

- Repository root: original Passenger Princess, Pillow and Programme experiences, plus the legacy `/us` entry point.
- `apps/us`: the current private US app, deployed by the `tay-princess` Vercel project at its root route. Recent shared-app development belongs here.

US is exclusively for Charlie and Tayla. Its data uses the existing `us:*` Redis namespace, separate from `pp:*`. The legacy US API delegates to the current implementation so both deployments enforce the same privacy and session rules.

## Development and checks

Use Node 24. Run `npm ci` then `npm run dev` in the desired application directory. Run `npm run build` in **both** directories before merging. In `apps/us`, `npm test` runs server/privacy/auth/sync/PWA checks and `npm run test:e2e` runs mobile browser regressions (`npx playwright install chromium` first).

Existing Redis connection variables remain required: `KV_REST_API_URL` and `KV_REST_API_TOKEN`. New account initialisation requires strong `US_CHARLIE_PASSWORD`, `US_TAYLA_PASSWORD`, `US_CHARLIE_RECOVERY` and `US_TAYLA_RECOVERY` values (minimum 12 characters). Existing accounts are preserved; no default credentials or automatic password overrides are provided. Never commit credentials or copy private database content into test fixtures.

## Product records

- [Locked master specification](docs/US_APP_MASTER_SPEC.md)
- [QC54–58 implementation and acceptance ledger](docs/US_QC_LEDGER.md)

Shared sync uses authenticated, network-only polling every three seconds while visible, plus focus and reconnection refresh. It updates items, comments, reactions, favourites, polls, lists, activity, inbox, notifications and goals. Offline editing and push/provider delivery are not implemented. Timed surprise unlocks become visible on the next authenticated refresh; their safe in-app notice is generated once.

Recurring plans create the next occurrence when the current occurrence is marked Done. They preserve the completed item, clamp month ends and leap days, and support every 1–52 weeks/months/years. Past dates advance one occurrence at a time. Surprise plans cannot recur. Goals combine explicit manual progress and one count per linked, completed, non-surprise item.

The standalone PWA caches public icons and a generic offline page only. Shared content and API responses are never stored by the service worker. Login and shared content require a network connection.
