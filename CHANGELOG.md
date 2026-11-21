# Changelog

## [Unreleased]
### Features
- 🌳 Skill Tree zoom: − / + buttons, pinch on a phone, Ctrl + scroll (or trackpad pinch) on a laptop, drag to move, and ⤢ Fit, which scales and centres the whole tree. The tree auto-fits when the page opens and when the screen size changes; very wide levels wrap onto extra rows so the fitted view stays readable. Same zoom on the public showcase and a new "See the whole tree" panel on the Skill Tree slide.
- ✨ Cleaner Skill Tree page: two-line skill cards, solid cards over lines, a colour legend, compact stat cards, scrollable tabs on phones; tidier two-row top bar on phones; Mind Web zoom controls match the new style.
- ▭ Simple slide style: a second layout, switched per person with the ▭ Slides / ▦ Full button in the top bar or in Themes & Settings → 🧭 Layout style (your partner keeps their own). The side menu goes away and each part gets one focused screen: Start → 📅 Schedule (one day at a time) → 🚀 Projects (each with its next task) → ✓ My Tasks (quick add box) → 🌳 Skill Tree. Swipe left/right on a phone, tap ‹ › or the dots, or use the ← → keys on a laptop.
- Start slide: greeting, the next agenda item with ▶ Start it, Start/Continue the flow, a card per part with a live summary, and buttons for everything outside the flow (Mind Web, Clips, Post, Notes, Suggestions, Checklist, Activity, Profile, Settings). Those open as normal pages with a ← Back to slides button.
- Skill Tree slide shows one skill at a time: the skill in progress (or the next ready one) with ▶ Start / Continue walkthrough, Mark done, and Show another skill. Also: level and XP, the other ready skills as chips, how many are still locked, and the next money milestone with + Record income.
- Every slide has “Open the full … page” when you need all the options.
- 🔍 Find anything: one search box for pages, tasks, skills, projects, Mind Web ideas, notes and clipping campaigns. Open it with the Find button, / or Ctrl+K (⌘K on Mac). Arrow keys and Enter work.
- Skill Tree: new 🔎 Ideas & scanner tab. 24 viable topics (UGC for beauty brands and TikTok Shop sellers, stream and podcast clipping, local business video, templates and more) and product types (beauty minis, kitchen gadgets, pet, car, home and others), each scored out of 100 on demand, low competition, low start cost, speed to first $ and fit for you. Filter by Topics or Products.
- ✨ Recommended for you: the best-scoring idea that isn't already in your tree. "Fit" comes from your own Duo data (Mind Web statuses, recorded income, clipping campaigns, skills worked on, weekly topics), so the pick changes as you work. Ideas you marked "not pursuing" are skipped.
- Scanner: type any topic or product to get a score. It starts from the closest known idea, flags things with extra platform rules (supplements, CBD, crypto and similar), lets you adjust every rating, and has an optional 🌐 live interest check that reads public Wikipedia page views (free, no key) to see if interest is rising or falling.
- New skill / goal form: a Recommended goal at the top ("Use this" fills the name, Mind Web branch and a first step), a 🔎 Scan button next to the name to score what you typed, and "More ideas →" to open the full list.
- Every idea can be added as a goal or to the Mind Web in one tap.
- Skill Tree: ▶ Start now opens a step-by-step walkthrough instead of only marking the skill in progress. Each step is one screen with a progress bar: choose an option (for a research topic or product skill, pick from the scanner's scored list, with the Recommended one first, or scan your own), tick a short checklist where every item has a "How?" tip, jump to the right page (Clipping Campaigns, Income, Tasks, Mind Web, Schedule), and write down what you decided. The last step marks it done.
- Walkthroughs exist for research topics, products, UGC clients, clipping, videos/content, income, shared tasks, projects, the weekly rhythm and setup. Any other skill gets a general walkthrough where you write what "done" looks like and add your own steps.
- Progress is saved on the skill for both partners. "▶ Continue walkthrough" picks up where you left off.
- After a skill is done, "What comes next?" offers unlocked skills to start, plus suggested next steps (based on your pick and the kind of skill). "▶ Add & start walkthrough" chains straight into the next guide.
### Fixes
- Skill Tree: better proportions. Wider skill boxes so titles fit (full title on hover), no empty band under the tree, a slimmer detail panel that stays in view while you scroll, a normal-case detail title instead of wrapped spaced capitals, and tighter stat cards. On phones the tree scrolls inside its card instead of widening the page.
- Phone top bar: page name on the first row, all buttons together on the second (before, Undo and Redo split across the two rows).
- Mind Web: bubble labels show up to 38 characters before trimming (was 29), so names like "Research & Business Intelligence" fit.
- Schedule: day cards are a bit wider (3 per row on a laptop instead of 4), so tasks inside don't wrap into tall columns.
- Task chips: a long project name is trimmed with "…" on one line (full name on hover) instead of wrapping inside the pill.
- Profile on phones: paired fields (gender/pronouns, zodiac/birthday) stack full-width instead of squeezing side by side.
- Shadow Monarch theme on phones: page titles are a little smaller with less letter spacing so they don't wrap.

## [3.3.0] - 2026-11-21
### Features
- Command Center: 🗓 Today's agenda at the top. One ordered list of what still needs doing today: overdue items first, then anything with a time (earliest first), then today's deadlines, then the rest of today's workday tasks. Finished items drop off, and a bar shows how many are done.
- ▶ Start opens the first item where the work happens: the task's details, the clip on its campaign board, or Post & Submit when the clip is approved and waiting to go up. Tapping any line does the same; tasks can be ticked off right in the list.
- Shows your own and shared items by default (the same as the morning phone summary); "Everyone" includes your partner's too.
### Fixes
- "Today" for clip and campaign deadlines now uses the workspace timezone. Before, it used UTC, so on a US evening deadlines were counted from tomorrow.

## [3.2.0] - 2026-11-20
### Features
- Clipping campaigns: ⚡ Autofill on the campaign form. Pick a campaign you've run before to copy its platform, links, rules, platforms, view requirement, rate, cap and permission (deadline is left for the new round), or paste the text of a campaign page and Duo fills the name, platform, campaign/submit/source links, rate per 1k views, payout cap and budget, minimum views, eligible platforms, deadline and rules.
- Filled fields flash green and a note lists what changed, so you can check before saving.
### Notes & Caveats
- Nothing is fetched from the internet: campaign sites need sign-in and block other sites from reading them, so autofill works from what you paste.
- The reader understands common wording ("$1.50 per 1,000 views", "$2 CPM", "1000 views = $0.80", "Max payout $500 per creator", "Minimum 10k views", "Ends Dec 31"). Anything it misses stays as you typed it.

## [3.1.0] - 2026-11-20
### Features
- Phone reminders (Web Push): turn on per device in Themes & Settings → 📱 Phone reminders. Morning summary (today's tasks, due today, due tomorrow, overdue, clip and campaign deadlines) at a chosen hour, plus a reminder 5–60 minutes before a task with a time. Send-a-test button.
- Tasks get an optional due date.
- Service worker shows notifications and opens the right page when one is tapped.
### Design Rationale
- Reminders are sent by the `duo-reminders` Supabase Edge Function every 5 minutes (pg_cron). The function generates its own VAPID key pair on first run and keeps it, plus a random cron secret, in Supabase Vault; the app only fetches the public key.
- Push encryption (RFC 8291) and VAPID (RFC 8292) are written on WebCrypto, so the function has no third-party dependencies.
- Subscriptions live in `duo_push_subs` (RLS on, no policies); the app writes only through `duo_push_save` / `duo_push_delete`, which check workspace membership. A send log makes each reminder go out once.
### Notes & Caveats
- iPhone/iPad: needs iOS 16.4+ and Duo opened from the Home Screen. Android: Chrome, installed or in the browser.
- Times use the workspace timezone. Free-text task times like "3pm", "15:00" or "9am–11am" are understood; other text is ignored for timed reminders.
- Signing out turns reminders off on that device.

## [3.0.0] - 2026-11-19
### Features
- Accounts: email + password sign-in per partner (Supabase Auth), sign-up, password reset, change password, sign out. Works on any device/browser.
- Workspace membership (`duo_members`): every read/write checks the signed-in user is one of the two partners; single-slot invite codes that can be rotated; workspace switcher (up to 10 per person).
- Code-only access removed entirely; only the read-only public showcase is anonymous.
- Master Opportunity Map: 9 categories (A–I) with subcategories and paths; existing branches merged in place (no duplicates); 11 example relationships with dependency notes; deeper Mind Web levels in map and list view.
- Research card per node with source labels (verified / user-entered / estimate / open question, "Not verified"), research templates (product, competitor, market, business, ad, platform, local service, business status, trading), sources with dates, decision, priority, blockers, next action, last reviewed.
- Two-partner workflow: split work A / B / Both, note, suggestion, schedule review, record decision.
- Clipping Campaigns page: 8-step workflow, permissions, rules, moments, submissions with estimated / confirmed / paid amounts; only paid can become income.
- Results per project: revenue, commission, client fees, invoiced, product cost, platform fee, ad spend, software, fulfillment, refunds; profit shown only when costs exist; trading kept separate.
- Money ladder: majors at $1k/$5k/$10k/$25k/$50k/$100k/$1M, profit mode, per-business ladders, monthly ladder (held 2 months), money milestones feed the skill tree, labelled pace estimate.
- 9 workflow statuses (Idea → Not pursuing).
### Design Rationale
- Migration ids are derived from labels so two synced devices produce identical nodes.
- Auth via REST (no SDK) keeps the app build-free.
### Notes & Caveats
- Confirmation/reset emails link back to the page they were requested from; once hosted, set the Site URL in Supabase Auth settings.
- Recommended: enable Leaked Password Protection in the Supabase dashboard (Auth → Passwords).

## [2.1.0] - 2026-11-19
### Features
- Ported all 12 UGC Studio themes (Holo Blue, Classic, Coquette, Shadow Monarch, Land of Ooo, Grimoire, Nen Aura, Hidden Leaf, Saiyan Ki, Jade Immortal, Crimson Lotus, Celestial Sword) alongside the 5 Duo themes; grouped picker.
- Ported the UGC Studio "holodeck" FX: aurora, perspective grid floor, particle network that reacts to the cursor, cursor glow, card spotlight + HUD corners, gradient card edges, header scanline, brand shimmer/spinner, nav sweep, button sheen, tile tilt, page entrance, boot ring.
- Motion levels now match UGC Studio: Full / Calm / Off (old values mapped automatically).
- Skill Tree & Milestones page: evolving skill tree (✔ done, ◐ in progress, ✦ ready, 🔒 locked), XP + levels, "what's next" prompt after each completion, auto-added achievements when Mind Web ideas/projects are completed.
- Income log (user-recorded only) with total milestones ($1 → $1M), consistency streaks (3/6/12/24 months) and steady-pace milestones ($/month for 3 months straight); trading kept separate unless live trading is opted in.
- Journey timeline + monthly pace chart pairing skill XP with income.
- Public showcase: read-only `public.html?s=<slug>` served via `duo_publish` / `duo_public`; amounts hidden by default; never includes notes, tasks, private fields or photos.
### Design Rationale
- Themes ported as palettes/textures only (same rule as UGC Studio: no characters, logos or show art).
- Public data is a separate sanitized snapshot column, so the public RPC can never return the workspace.
### Notes & Caveats
- Public links only work for other people once the app is hosted online.
- Starter skills are goals (status "ready"), not accomplishments.

## [2.0.0] - 2026-11-19
### Features
- Futuristic redesign with a theme-token system: Emerald Nexus, Cosmic Violet, Solar Gold, Arctic Hologram, Minimal Light; accent override, reduced/standard/expressive motion, simple mode.
- Personal themes are saved per partner profile and only applied for the partner using the device.
- Sidebar + mobile bottom navigation, breadcrumbs, Quick add (task, note, idea, suggestion, schedule item, checklist), My / Partner's / Shared filters, search on tasks, notes, Mind Web.
- New pages: Projects, My Tasks, Shared Checklist, Notes, Suggestions (incl. schedule proposals), Activity, Profile, Themes & Settings.
- First-run profile wizard (name, username, avatar, gender w/ custom + prefer-not-to-say, pronouns, zodiac, optional birthday, theme, accent, bio) with preview; everything optional except name.
- Original SVG avatar system: 7 character styles + initials, abstract, photo; skin, hair, outfit and aura colours; idle animation respects motion settings.
- Pair Command Center dashboard built only from saved data.
- Mind Web: partners at the centre, animated connection lines, status shown as icon+text, list view, zoom/fit, keyboard access, detail panel with back/close.
- Live sync via Supabase (project `cwtloacfsvyjemywmotl`, table `duo_rooms`) using a shared workspace code; per-item merge so simultaneous edits don't overwrite each other.
### Design Rationale
- Kept plain HTML/CSS/JS (no build step) so it still opens by double-click; split into small files.
- Room-code access instead of user accounts: no sign-up needed for two people. Trade-off: anyone holding the code has full access.
- Private birthday is stored only on the device (never uploaded), so the privacy label matches reality.
- Joining a workspace replaces the joining device's copy (each device seeds different IDs; merging would duplicate the starter categories). A backup file is downloaded first.
### Notes & Caveats
- v1 data in the same browser origin is migrated automatically (`duo-planner-v1` key).
- Polling every 4 s (no websockets). Presence/online status is intentionally not shown.
- External calendar sync is not implemented.
