# /us — Shared App Master Product Specification

**Status:** LOCKED FOR BUILD  
**Users:** Charlie + Tayla only  
**App:** Existing `CharlieTitan/passenger-princess` Vercel app  
**Route:** `/us`  
**Database:** Existing Upstash / Vercel KV instance, isolated under `us:*` keys  
**Privacy:** Private two-person app. No public profiles, no guest access, no searchable content.

---

## 1. Product intent

`/us` is a private shared app for Charlie and Tayla to keep, plan, revisit and remember things they want to do together.

It should feel like a **premium personal scrapbook crossed with a polished modern app** — warm, tactile and personal, but practical enough to use every day.

The old Passenger Princess / Pillow Princess / Princess Programme experiences remain separate. Their lore may appear only as light callbacks or seeded shared history. No intimate Pillow content is mixed into `/us`.

---

## 2. Core information architecture

### Primary categories

#### Eat
Suggested default sublists:
- Restaurants
- Coffee
- Dessert
- Cook Together
- Drinks

#### Watch
Suggested default sublists:
- Films
- Series
- Rewatch

#### Go
Suggested default sublists:
- Holidays
- Staycations
- Day Trips
- Revisit

#### Do
Suggested default sublists:
- Date Ideas
- Weekend Ideas
- Challenges
- Rematches
- Bucket List

Both users can create additional custom sublists and assign custom emoji/icons.

---

## 3. Item lifecycle

Main lifecycle:

**Idea → Planned → Done**

Additional states / affordances:
- **Archive** can be used from any stage without deleting history.
- **Try Again** is available after Done.
- Done items remain in history and can also surface in the Try Again view.
- Completion date is optional and editable, including for backfilled historical items.

### Planned item fields
Optional:
- Date
- Time
- Location
- Booking / external link
- Notes
- Recurrence
- Reminder settings
- Calendar actions

---

## 4. Shared ownership and identity

- Charlie and Tayla are equal collaborators everywhere inside `/us`.
- Either user can add, edit, move, complete, rate, comment on, favourite, archive, restore, mark Try Again, or delete any shared item.
- Every item records:
  - Added by
  - Created at
  - Last updated by
  - Last updated at
- Activity history should surface meaningful edits without becoming noisy.

---

## 5. Profiles and authentication

### Fixed users
- Charlie
- Tayla

### Login
- Username + password
- Separate passwords
- Long-lived remembered session on trusted devices
- Lightweight active-session/device view
- Sessions can be revoked

### Recovery
- Charlie has access to a hidden technical/recovery page for resets and maintenance.
- Tayla can reset her password with a recovery code.
- No email-based login dependency required for v1.

### Privacy
- All `/us` content requires authentication.
- No public or guest route exposes shared content.
- Surprise items add a second visibility layer on top of authenticated access.

---

## 6. Home screen hierarchy

Shared home, personalised per logged-in user.

Order:

1. **Time-of-day greeting**
   - Morning, Charlie / Tayla
   - Afternoon, Charlie / Tayla
   - Evening, Charlie / Tayla

2. **Now card**
   Contextual:
   - Morning: plans/reminders
   - Afternoon: upcoming items
   - Evening: Tonight mode + low-effort picks
   - Planned item soon: countdown
   - Surprise near unlock: teaser
   - Saved anniversaries / important dates when relevant
   - "What next?" recommendation when useful

3. **Primary category tiles**
   - Eat
   - Watch
   - Go
   - Do

4. **Quick shortcuts**
   - Tonight
   - Pick for us
   - Quick add
   - Try Again
   - Planned
   - Surprises
   - Recent activity

5. **Secondary home modules**
   - Recent activity
   - Monthly recap
   - Memories
   - Currently Into
   - Goals / milestones where relevant

---

## 7. Tonight mode

Each item may have an effort level:
- Low effort
- Normal
- Big plan

Tonight mode primarily surfaces unfinished:
- Low effort
- Normal

It should work with category filters:
- Eat
- Watch
- Go
- Do

Tonight also uses:
- duration
- time horizon
- location when available
- availability preferences if configured

---

## 8. Pick for us

Two modes:

### Surprise us
- Animated wheel
- Spins with momentum and deceleration
- Chooses from eligible unfinished items
- Shows a result card
- Actions:
  - Lock it in
  - Spin again

### Filtered picker
Optional filters before spinning:
- Category
- Sublist
- Effort
- Time horizon
- Location
- Duration
- Budget
- Tags
- Priority

---

## 9. Time horizon

Optional item tag:
- Tonight
- Soon
- Someday

Used by Tonight, Pick for us, search and recommendations.

---

## 10. Location

No forced preset list.

Items can have:
- No location
- Freeform custom location
- Broad area / trip label
- Precise place if desired

Examples:
- J1 Beach
- London
- Hatta
- Abu Dhabi
- Home
- UK trip
- Somewhere cold

Location-aware features are user-triggered only; no constant tracking.

Later/location-aware actions:
- Nearby from our list
- Pick for us nearby
- Saved places around here
- Filter by approximate travel area/time

---

## 11. Reminders and calendars

Planned items may have optional reminders.

Quick presets:
- Day before
- A few hours before
- Custom
- No reminder

Profiles store:
- WhatsApp number
- Email
- Default reminder preference
- Preferred reminder channels

Planned items inherit profile defaults but may override them.

### Calendar
Provide:
- Add to Google Calendar
- Add to Apple Calendar / `.ics`

No direct calendar account connection required for v1.

### Notification channels
Design for:
- In-app
- Browser push where available
- Email
- WhatsApp later / via provider integration

For surprise plans, outbound reminders must not reveal hidden details before unlock.

---

## 12. Comments and reactions

Each item has a lightweight shared comment thread.

Both users can:
- add comments
- edit/delete their own comments if needed
- react to items and comments

Suggested quick reactions:
- ❤️
- 😂
- 👀
- 👍

---

## 13. Photos and memories

Every item supports:
- one shared cover photo
- shared gallery

Both users can add/remove/edit photos.

### Cover image treatment
Cover photo should look like a **Polaroid**:
- tactile
- subtle tilt
- soft shadow
- personal rather than glossy
- title/date/location can sit beneath in Polaroid-style treatment

### Done items
Once an item is Done:
- its gallery becomes part of the memory card
- memory timeline uses the same photos
- ratings/reviews appear on the memory

---

## 14. Ratings after Done

After Done:

### Charlie
- rating /10
- short review

### Tayla
- rating /10
- short review

Also:
- Try Again toggle
- completion date
- memory photos

Ratings remain blank until each person enters their own.

---

## 15. Favourites

Each user may heart an item.

If both heart the same item:
- mark as **Mutual Favourite**

Used in:
- filters
- home cards
- memories
- recommendation logic
- stats

---

## 16. Search and filters

Search from day one.

Filters:
- Category
- Sublist
- Status
- Effort
- Time horizon
- Location
- Added by
- Favourites
- Try Again
- Priority
- Budget
- Duration
- Tags

---

## 17. Priority

Optional:
- Low
- Normal
- High

Additional flag:
- **Do this soon**

Can influence picker/recommendation weighting.

---

## 18. Budget

Optional bands:
- Free
- Cheap
- Mid
- Spenny

Optional exact estimated cost may also be stored.

No expense tracking, splitting or "who paid" functionality.

---

## 19. Duration

Optional:
- 30 mins
- 1–2 hours
- Half day
- Full day
- Overnight / Trip

Used by Tonight and Pick for us.

---

## 20. Tags

Suggested and custom tags.

Examples:
- romantic
- cheap
- outdoors
- rainy day
- late night
- dress up
- quick
- weekend

Both users can create tags.

---

## 21. Surprise plans

A surprise plan is a special planned item with hidden details.

Hidden details may include:
- Dress code
- Date/time
- Meet there vs pickup
- Pickup time
- Location
- Optional clue / teaser
- Optional practical note ("bring trainers", "don't eat beforehand", etc.)

Before reveal, the recipient sees only safe teaser information.

### Reveal timing
Creator controls unlock:
- At start time
- 10 mins before
- 30 mins before
- 1 hour before
- Custom

Creator may **Reveal early**.

At unlock:
- show **Tap to reveal**
- use a deliberate reveal animation
- update both clients in real time

Notifications must never leak hidden location/details before unlock.

---

## 22. Wishlist / gifts

Separate smaller area from the four main categories.

Supports:
- shared wishlist items
- "this made me think of you"
- gift ideas
- things either person wants

Visibility:
- shared by default
- optional **private to me** for surprise gifts

---

## 23. Memories

`/us/memories` is generated from Done items.

Memory card includes:
- date
- location
- Polaroid cover
- gallery
- Charlie rating/review
- Tayla rating/review
- Try Again status
- comments / reactions if relevant

Timeline should feel warm and personal, not like analytics.

---

## 24. Milestones

Optional and subtle.

Examples:
- First date
- First trip
- 10th date
- First staycation
- First time trying something
- Custom milestones

Only explicit saved milestones are used; no guessing.

Important dates may surface in Now and reminders.

---

## 25. Currently Into

Lightweight home module.

Examples:
- Song on repeat
- Current series
- Favourite takeaway
- Current drink
- Place we keep mentioning
- Thing we keep saying we'll do

Initial state: **blank**.

---

## 26. Polls / voting

Create lightweight shared polls such as:
- Which film tonight?
- Which restaurant?
- Which staycation?
- Pick one of these dates

Both users vote.
When both have voted:
- show winner
- show tie when applicable

---

## 27. Challenge mode

Special Do-item type for mini competitions.

Fields may include:
- Activity
- Opponent
- Stakes
- Score/result
- Winner
- Rematch toggle

Examples:
- Bowling rematch
- Mini golf
- Pool
- Who picked the better restaurant?
- Loser buys dessert
- Winner chooses the next film

---

## 28. Shared stats

Subtle, not heavily gamified.

Examples:
- Dates completed this month
- New places tried
- Films watched
- Current challenge/rematch record
- Mutual favourites
- Most-added category

---

## 29. Monthly recap

Lightweight recap card.

Examples:
- 4 dates
- 3 new restaurants
- 2 films
- highest-rated item
- most revisited place
- ideas repeatedly postponed
- Try Again favourites

---

## 30. Quick Save inbox

Fast entry for external links.

Paste:
- TikTok
- Instagram
- Google Maps
- restaurant page
- hotel
- film
- booking page
- other URL

Then file into:
- Eat
- Watch
- Go
- Do
- Wishlist

Where possible create a preview:
- title
- image
- site name

Raw URL remains editable.

---

## 31. Custom lists

Each category supports default sublists + user-created lists.

Every list can have:
- name
- emoji/icon
- optional theme accent
- sort/filter preference

Both users can edit list metadata.

---

## 32. Activity feed

Compact shared feed.

Examples:
- Tayla added Nobu
- Charlie planned Bowling rematch
- Tayla rated a film 9/10
- Both favourited 77 Valley
- Charlie marked Hatta staycation Done

Do not make it feel like social media.

---

## 33. Activity notifications

Important events can notify immediately:
- poll result
- surprise unlock
- plan changed
- reminder
- challenge update

Low-value activity is grouped/digested:
- reactions
- small edits
- routine additions

---

## 34. "What next?" recommendation card

Home recommendation based on shared history.

Examples:
- "You both liked low-effort food ideas lately — coffee + acai?"
- "You've postponed the bowling rematch twice — lock it in?"

This is the first recommendation layer before more advanced modelling.

---

## 35. Recommendation engine

Later-stage intelligence, but in scope.

Use:
- ratings
- mutual favourites
- completed categories
- Try Again
- ignored/postponed items
- tags
- effort/budget/duration preferences

Examples:
- because you liked...
- similar things to try
- deprioritise consistently low-rated themes

---

## 36. Availability preferences

Optional profile settings only.

Examples:
- usual free evenings
- weekends
- not mornings
- preferred date nights
- rough work constraints

Used as hints, not as a full calendar product.

---

## 37. Recurring plans / rituals

Planned items can recur:
- weekly
- monthly
- yearly
- every X weeks/months
- custom

Supports shared rituals like:
- film night
- monthly date night
- Sunday coffee
- new restaurant once a month

---

## 38. Goals

Small shared Goals area.

Examples:
- Try 10 new restaurants
- Weekend away
- Finish a film series
- Try 5 new activities
- Settle the bowling score

Progress can be tied to completed items when sensible.

---

## 39. Trip / staycation packing lists

Planned trip/staycation items can have shared checklists.

Both users can:
- add checklist items
- tick items off
- edit/remove items

---

## 40. Real-time behaviour

Required for shared collaboration.

Update without manual refresh for:
- new items
- status changes
- comments
- reactions
- polls
- favourites
- surprise reveal state
- planning changes

Offline mode is nice-to-have later, not a v1 blocker.

---

## 41. Visual system

Overall:
**Premium personal scrapbook × polished modern app**

Avoid:
- SaaS dashboard feel
- generic Notion clone
- over-cute couple-app aesthetic

Use:
- tactile Polaroid imagery
- subtle paper/film texture
- warm spacing
- thoughtful typography
- restrained inside jokes
- purposeful animation

### Category personality
Subtle theme variation:
- Eat → warmer
- Watch → darker / cinematic
- Go → airy / travel
- Do → brighter / playful

Theme changes must **cross-fade**, not snap.

### Light / dark mode
- automatic light/dark
- category identities preserved in both

---

## 42. Motion and loading

Transitions should be purposeful.

Examples:
- category/list switch → soft cross-fade + small vertical shift
- open item → card expands into detail
- mark Done → satisfying state animation
- favourite → small heart pop
- wheel → momentum + deceleration
- surprise reveal → locked card unfolds
- Polaroid → subtle settle/tilt
- real-time insert → slide/fade in

### Loading
Use layered skeletons:
1. app shell/header
2. primary category blocks
3. list/item cards
4. photos/activity/secondary content

Avoid generic full-screen spinners where possible.

---

## 43. Initial seed data

### Eat
- **77 Valley**
  - Done
  - Try Again
  - rating blank
  - completion date editable
- **Home cooking: steaks**
  - Done
  - no Try Again seed
  - rating blank
  - completion date editable
- **Home cooking: pasta**
  - Done
  - no Try Again seed
  - rating blank
  - completion date editable

### Do
- **Bowling — Brass Monkey**
  - Done
  - Try Again
  - rematch needed
  - rating blank
  - completion date editable
- **Pool day — W Palm**
  - Done
  - rating blank
  - completion date editable

### Watch
- **Project Hail Mary**
  - Done
  - rating blank
  - completion date editable

### Try Again initial view
- 77 Valley
- Bowling — Brass Monkey

### Currently Into
- blank

Everything else starts empty and is built by Charlie/Tayla.

---

## 44. Existing-lore callbacks

Allowed:
- "acai isn't shit"
- bowling rematch
- harmless PP-era callbacks
- small jokes about the old Princess Programme
- light references to known shared history

Do not:
- expose intimate Pillow Princess answers
- surface private old-form content as data inside /us
- make the new app feel like another application form

The Princess lore is a faint Easter egg, not the product identity.

---

## 45. Data namespace

Use existing Upstash / Vercel KV instance.

Do **not** mix with existing `pp:*` structures.

New namespace:
- `us:users:*`
- `us:sessions:*`
- `us:lists:*`
- `us:items:*`
- `us:comments:*`
- `us:activity:*`
- `us:polls:*`
- `us:surprises:*`
- `us:memories:*`
- `us:milestones:*`
- `us:wishlist:*`
- `us:goals:*`
- `us:notifications:*`
- `us:settings:*`

Exact schemas can evolve during implementation, but PP data must remain logically isolated.

---

## 46. Build priorities

### Phase 1 — foundation
- private auth
- Charlie/Tayla identities
- session persistence
- shared home
- Eat/Watch/Go/Do
- custom lists
- item CRUD
- Idea / Planned / Done / Archive
- Try Again
- seed data
- real-time sync baseline
- comments/reactions
- favourites
- search/filters
- photos / Polaroid cover
- ratings/reviews
- memories
- activity feed

### Phase 2 — planning intelligence
- Tonight
- Pick for us wheel
- Planned details
- reminders
- Google Calendar / ICS
- priority/budget/duration/tags/time horizon
- polls
- challenge mode
- recurrence
- Quick Save inbox
- link previews

### Phase 3 — richer shared life
- surprise plans + timed reveal
- wishlist / private gifts
- milestones
- Currently Into
- goals
- trip checklists
- stats
- monthly recap
- "What next?"
- location-aware filtering

### Phase 4 — advanced
- smarter recommendations
- browser push
- email reminders
- WhatsApp provider integration
- offline-friendly sync

---

## 47. Non-goals

Explicitly excluded:
- expense tracking
- split-bill functionality
- public profiles
- guest sharing
- public social feed
- relationship-label mechanics
- full calendar product
- full productivity/task-management system
- Pillow Princess data inside /us

---

## 48. Product acceptance principles

A build is not acceptable if:
- it feels like generic SaaS
- it exposes private data publicly
- it mixes PP intimate data into /us
- category switching snaps harshly
- core collaboration requires refresh
- seeded history is not editable
- Tonight / Pick for us feel bolted on
- surprise plans leak hidden details before unlock
- one user has more power than the other inside the shared app
- ratings are auto-invented
- Try Again loses Done history
- photos do not feel personal / Polaroid-like

A build is successful if:
- either user can add an idea in a few taps
- both see changes quickly
- choosing something for tonight is fast
- planning something feels easy
- surprise plans feel fun
- Done items become memories naturally
- the app gets more useful and more personal over time
- it feels unmistakably like Charlie + Tayla's private app

