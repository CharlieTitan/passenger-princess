# US QC ledger

Updated 4 November 2026. Baseline: `de6efbc13fcf4f204724a00968b26b1e98b8991a` on main.

## Provenance and scope

The repository contained the locked master specification, a one-line README, no AGENTS.md and no QC ledger. The referenced ChatGPT conversation returned user messages and inaccessible assistant content-reference markers, so earlier acceptance results cannot be reconstructed. QC54–58 labels below follow Woody's explicit continuation request; they do not certify any earlier QC item.

Current implementation is `apps/us` (tay-princess deployment). The repository root deploys the legacy experiences separately. The old US API and calendar endpoint now share the current security rules; the old root UI entry points redirect to the canonical current app at https://tay-princess.vercel.app.

| Record | Implementation | Automated evidence | User/device acceptance |
| --- | --- | --- | --- |
| QC54 shared trip/staycation checklists | Add/edit/tick/remove for both users; atomic concurrent edits; planned and completed Go holidays/staycations | Server CRUD, concurrent update and surprise-denial tests; browser checks recorded below | Pending Charlie + Tayla device check |
| QC55 goals | Shared create/edit/delete; manual progress and linked Done items; surprise links excluded | CRUD/progress/privacy server tests; browser checks recorded below | Pending device check |
| QC56 recurring plans | Weekly/monthly/yearly every 1–52 units; legacy fortnightly values; next plan generated exactly once on Done; memory retained | Month ends, leap days, duplicate completion and history tests; browser checks recorded below | Pending real ritual acceptance |
| QC57 shared sync | Three-second visible polling of all shared datasets; focus/online recovery; session expiry clearing and stale-response protection | Sync state and actual fetch body/logout race tests; browser checks recorded below | Pending two physical devices, background/resume and poor-network checks |
| QC58 PWA | Manifest/icons, standalone install, public-only service worker cache, generic offline page | Icon dimensions and service worker cache-policy tests | Pending iOS Add to Home Screen, Android install and icon/update check |
| Notification navigation | Existing referenced-item lookup retained; opens item and clears filters; missing target handled | Browser regression pending below | Earlier user said items now open; latest production acceptance not inferred |
| Surprise reveal/privacy | Server allowlist, hidden checklist/media/metadata, safe activity/notice/poll projections, protected calendar, timed safe notice, deliberate tap to reveal | Creator/recipient, timed reveal, forged mutations, deleted references, calendar and session tests | Pending timed reveal on both devices |

## Security and regression changes

Authentication occurs before seeding. Only Charlie/Tayla sessions are valid. Logout removes the session; password recovery revokes older sessions and uses atomic account updates. Default credentials and embedded password repair paths were removed. Historical predictable recovery codes are explicitly disabled if still stored; those accounts require secure recovery setup before self-service recovery works. Existing login remains available. Existing hashes remain compatible; newly set passwords use salted scrypt. Login/recovery attempts are rate limited. Private responses use no-store. Both deployments reuse the current US API/calendar rules.

CI now checks PRs as well as main, builds both application roots, runs available tests and rejects high-severity dependency advisories. Lockfiles make installation reproducible. PostCSS is overridden to a verified patched version while keeping Next.js 15.

## Verification record

Local verification: 25 automated Node checks pass; root and standalone production builds pass; both dependency audits report zero vulnerabilities. Browser, CI and production evidence will be recorded after execution. QC58 is prepared for a separate PWA PR. Implementation is not user acceptance.

## Device-side follow-up

1. On Charlie and Tayla devices, open one planned Go holiday/staycation. Add separate checklist rows, tick/edit/remove each other's rows, and confirm changes arrive without refresh.
2. Create a goal, link a shared item, mark it Done and confirm both devices show progress. Edit/delete from the other account.
3. Plan a recurring item, mark Done, verify its memory and exactly one next plan. Check the next date and preferred cadence.
4. Add/comment/react/favourite/vote from each device; background and resume the other device. Confirm sync and notification target opening, including a filtered/archived target.
5. Create a surprise with a near-future reveal time. Before unlock inspect only safe teaser information as recipient; after unlock confirm safe notice, Tap to reveal and details. Confirm creator can reveal early. Do not put private information in the safe teaser.
6. Install from Safari Add to Home Screen and Android's install prompt. Verify standalone launch/icons, login persistence, update after deployment and generic offline screen. Confirm logout and expired sessions do not restore prior private content.

Browser tests use isolated synthetic fixtures and the actual server handlers. They do not validate production credentials, live Redis permissions, real-device browser quirks or user satisfaction. No production content is created for testing.
