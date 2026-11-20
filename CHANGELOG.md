# Changelog

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
