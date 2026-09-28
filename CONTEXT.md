# Project context for contributors and agents

Read this file before changing the project. [README.md](README.md) contains commands and content examples; this file explains the intended behaviour and where to make changes. Keep both documents in English and update them when workflows or product decisions change.

## Purpose and scope

Els Llibres is a public noticeboard for I4B families at Escola La Mar Bella in Barcelona. The children named their class **Llibres**. Class information is the priority, alongside relevant whole-school announcements, school meals, holidays, and closures.

The goal is a small, useful board of current information that families can read on their phones. Notices should be edited or removed as circumstances change, rather than accumulating indefinitely. Items requiring action from families come before optional contributions or background information.

The owner manually decides what gets published. A separate private project, `school-ingest`, runs on the Mac Mini known as Norman and processes school communications. This repository is the public presentation layer and has **no automated connection** to that service. Do not add ingestion, source credentials, database queries, or automatic publication as part of routine website work.

Daily/weekly recaps, a CMS approval queue, authentication, and automatic translation are outside the current implementation. They require a separate product decision. A backend is not needed for the current scope.

## Product decisions to preserve

- Phone-first layout, usable at 320px and 390px, with light and dark themes.
- The page is a pop-up storybook. The first screen shows only the closed book on the table: a navy cloth cover with the title and an arched window onto the school, a pencil, and an “Open the book” button. The book keeps the same proportions closed and open. Scrolling turns the cover while the book holds still, then the notices follow; the button scrolls there for you. Once the cover stands upright, halfway open, a pencil arrow on the table labelled with the notices heading points down to them until they come into view, and the pencil leaves the table as the notices slide over it. With reduced motion or without JavaScript, the cover and the dates page simply sit one after the other.
- Last year the class were the Monstres (I3B). One of their monsters, a lilac one, reads in an upstairs window of the school on the cover. With motion, a short story of about eight seconds plays once as the page loads: the monster peeks out from behind the school, waves, hops in through the front door, the window lights up, and the view closes in on it reading and back out. Scrolling hurries the story to its end, so the cover never turns mid-story. With reduced motion or without JavaScript the monster is simply in its window. The story has no words; the name is only a hint for families who remember.
- The children’s teacher leads their line on the cover, a small thank-you from the families: an adult with dark hair in a bob, light, warm Spanish skin and the navy of the book’s cloth, holding an open book up high like a guide’s flag, with her other hand in the first child’s. She has no face and no name, like the children. While the monster waves she waves the book back; at rest, or with reduced motion, she simply holds it up. She is only on the cover, so the children move over there to make room; the school scene on notices keeps the children on their own.
- The children hold hands along their line. Each child has two arms: neighbours each reach halfway and their hands meet in the middle, and the children at either end keep a free arm at their side, unless someone holds that hand.
- Night mode is a desk lamp: the table goes dark, the pages stay warm. The lamp button in the header switches it.
- Catalan is the default; Spanish and English cover interface text, notices, and calendar exports.
- Upcoming dates are the first page of the book, not a month grid and not a month-specific heading, since dates can span months. Each date is a calendar leaf showing only the month and day; the line under the title gives the weekday and time without repeating the date. Dates that do not fit the page wait behind “Show N more dates”, which lets the open book grow; with no dates, the page says so and keeps the school calendar link. Each row links to its notice card, which holds the details and calendar exports; with JavaScript the pages riffle to the card, which opens and is highlighted on arrival. Keep the notices as a distinct section with its own heading and spacing.
- The month’s school menus live in a library pocket glued inside the back cover, after the last notice, facing the bookplate inside the front cover on the same endpaper. A link under the school calendar on the dates page (“Menús de setembre”) jumps straight there, a plain anchor link: the page riffle the dates use was distracting over the whole book, so it stays off this link. Closed, the pocket shows the tops of three cards; tapped, the menus come out: the main menu, the monthly sheet and the dinner ideas as cards with type and size, then the adapted menus for allergies and diets as small cards, since a family needs one of them at most. Each menu is only a link to its picture, opening in a new tab, so no menu picture downloads with the page. Without JavaScript the menus lie open. Menus are standing reference rather than notices: no category, filter or card. Only the newest month shows; replace it when the next one arrives.
- Notice filters affect cards only, not the upcoming-dates list.
- Keep all category filters visible, with the same compact category labels used on notice cards; do not replace them with action sorting. The filters are buttons with a category dot and a count, with no label in front of them; the chosen one fills with its colour and shows a tick. A status line names the result (“1 avís del menjador”) with a way back to all notices, and once the filters scroll away a floating “Filters: …” button returns to them. It replaces the earlier back-to-top button. Use the current board before deciding whether action or freshness badges are needed.
- Each notice is a chapter: a pop-up scene chosen with `scene`, then a page of text with a category ribbon, a date stamp for events, and full-width rows for details, files and calendar exports, between dashed lines. Details and calendar rows have a plus that turns into a minus; a file row has a down arrow, shows the file type and size, and downloads directly. A notice without a scene shows the school from the cover. Text on category colours and coloured text on paper must keep at least 4.5:1 contrast in both themes.
- Notice categories are class, whole school, school meals, and AFA (the family association). Calendar dates use the relevant audience category; event metadata controls the upcoming-dates list and calendar exports.
- Public holidays are named “Dia festiu”, “Día festivo”, and “Public holiday”. School closure days are not necessarily public holidays; use the wording appropriate to the source.
- Calendar export is opt-in through event metadata. Do not infer event durations or add exports to every dated announcement.
- The AFA cancellation reminder marks the final day to cancel activities for the following month, not the whole application window. Use a one-day all-day event and state the exact cutoff in its description.
- External web links open in a new tab with `noopener noreferrer`. Downloads stay direct downloads.
- Download names are lowercase ASCII words joined by hyphens, topic first, with the school year when the document is yearly (`menjador-pla-funcionament-2026-2027.pdf`). The schema rejects anything else. Menu pictures are named by kind and month (`menjador-sense-gluten-2026-09.jpg`) and resized to 1600 px wide, which keeps them readable when zoomed at under 300 kB each.
- Preserve downloadable original timetable images. Their contents are also available as translated text. The class timetable is `expanded`: its week reads on the page, followed by the “Horari per dies” picture only.
- The site and repository history are public. `noindex, nofollow` discourages indexing but does not restrict access.
- Do not publish school Google Docs links that grant unrestricted editing. The existing announcement refers families to the teacher's email instead.

## Architecture

The app is a static Astro site with TypeScript and Markdown content collections. Node 24.15.0 is pinned by mise; dependency versions are in `package.json` and `package-lock.json`. There is no runtime server, database, API key, or runtime LLM call.

```text
Catalan notices + Spanish/English translations
                    |
         Astro collection validation
                    |
         Merge shared data and translated text
                    |
       Static pages + per-language .ics files
                    |
            GitHub Actions / Pages
                    |
  Browser: filters, theme, language preference, date expiry
```

Build output is deterministic given source files, configuration, and build time. ICS files contain a build-time `DTSTAMP`. Browser date expiry depends on the current clock; language/theme depend on local preferences. Translation drafting and editorial selection happen before publication, outside the site's runtime.

## Code map

| Location | Responsibility |
| --- | --- |
| `src/content.config.ts` | Original and translation schemas; timed/all-day event validation. |
| `src/content/notices/` | Canonical Catalan notices, shared metadata, attachment paths. |
| `src/content/translations/{es,en}/` | Translated text, matching original notice IDs. |
| `src/content/menus/` | One YAML file per month listing which menu pictures arrived; the newest month is shown. |
| `src/lib/menus.ts` | Menu kinds, which of them are for every family, and the newest month’s picture paths. |
| `bin/menus`, `scripts/menus.mjs` | Replace the month’s menus from a folder of Biosca’s pictures: recognise, resize, list, and remove the previous month. |
| `.claude/skills/replace-menus/` | The monthly routine from the AFA’s email to publication. |
| `src/lib/localized-notices.ts` | Merge translations with shared original metadata; reject incomplete translations; sort notices. |
| `src/lib/i18n.ts` | Interface strings, category labels, supported languages, base-aware language paths. |
| `src/pages/index.astro` | Catalan entry point. |
| `src/pages/[lang]/index.astro` | Static Spanish and English entry points. |
| `src/components/Board.astro` | Shared page layout, the book, notice section, filters and the filters shortcut. |
| `src/components/OpeningBook.astro` | The cover and its scroll-driven opening; fits the dates page to the cover and releases the book when more dates show. |
| `src/layouts/Layout.astro` | HTML language/metadata, header, language picker, lamp theme switch, preference handling, back cover. |
| `src/components/Illustrations.astro` | Shared SVG symbols: the children and their teacher, trees, clouds, stars, last year's monster, and the school scene in four layers (back, building, front, children) plus the whole scene. Also the endpaper pattern inside both covers. |
| `src/components/CoverScene.astro` | The school through the cover window with the teacher at the head of the line, and the monster's story on load. Its timeline is CSS keyframes in `site.css`; the script zooms by moving the viewBox and hurries the story when the page scrolls. The keyframes animate registered numbers, never `transform` or `opacity` directly, and don't fill forwards: otherwise Chrome paints the school at low resolution inside the tilted book. |
| `src/components/Notice.astro` | Chapter cards, translated Markdown, optional calendar controls. `NoticeImages.astro` renders pictures with open and download links; `NoticeFiles.astro` renders file rows. `src/lib/file-meta.ts` reads each file’s size from `public/` at build time, for these rows and the menus. |
| `src/components/MenuPocket.astro` | The inside of the back cover: the menus pocket, its cards, and taking them out. |
| `src/components/Scene.astro`, `src/components/scenes/` | Pop-up scenes and their spring animation; `src/lib/scenes.ts` lists the names a notice can use. |
| `src/components/UpcomingDates.astro` | The dates page: calendar leaves linking to notice cards, empty state, client-side expiry, the school calendar and menus links, travel to a card. |
| `src/lib/date-labels.ts` | Leaf, stamp and calendar-ticket labels in Barcelona time for each language. |
| `src/components/CalendarLinks.astro` | Shared Google Calendar and download actions. |
| `src/lib/calendar.ts` | Calendar URL/file generation, time labels, stable event UIDs, escaping and UTF-8 line folding. |
| `src/pages/calendar/[...id].ics.ts` | Catalan event downloads. |
| `src/pages/[lang]/calendar/[...id].ics.ts` | Translated event downloads. |
| `src/lib/external-links.mjs` | Build-time Markdown external-link policy. |
| `src/styles/site.css` | Responsive layout, theme tokens and category colours. Young Serif (headings) and Literata (text) load from Google Fonts with Georgia fallbacks. |
| `public/downloads/` | Public original attachments copied into the build. |
| `.github/workflows/pages.yml` | Checks and deployment. |

## Content rules and common changes

For a new notice, add the Catalan file and both translated Markdown files with the same ID. Follow the examples in the README. All translations must be reviewed before publication. Keep original source titles, such as email subjects, unchanged when families need them to locate a message.

Original data owns category, order, dates, event timing, and image and file paths. Translations own title, summary, details label, body, event text, image captions/alt text, and file titles. The translation merger rejects missing translations, mismatched event presence, and mismatched image or file counts. Adding an event, image or file therefore requires updating both translations too.

Notice order is `order`, then optional `date`, then ID. A notice date is descriptive only. Event metadata drives the upcoming list and exports. The event list currently sorts by its ISO start string; preserve chronological order when introducing events with different offsets.

For timed events, retain explicit offsets and display Barcelona time. All-day events use date-only start/end with an exclusive end. Keep the same event UID across languages. Exports are individual calendar entries, not a live subscription. Do not promise imported entries will automatically update or deduplicate in every calendar app.

The menus change every month. Follow [`.claude/skills/replace-menus/SKILL.md`](.claude/skills/replace-menus/SKILL.md) from the AFA’s email; `bin/menus` does the file work and changes nothing when a picture isn’t a menu it knows. A new kind of menu is a product change: its name in `src/lib/menus.ts`, a file-name rule in `scripts/menus.mjs` and labels in all three languages.

To retire content, remove the original and both translations. Ended events disappear from the upcoming list with JavaScript, but cards do not expire automatically. Without JavaScript, static event rows remain visible until source removal and deployment, and each row is a plain anchor link to its card. Category filtering and automatic expiry are progressive enhancements; reading details and following language/download links must work without scripts.

For UI changes, edit shared components rather than copying separate language layouts. Add all interface translations together. Reuse the existing theme variables. Check long Spanish/English labels on phones as well as Catalan.

## Local workflow and tests

The usual checkout is `~/personal/school-noticeboard`; commands run from the repository root. Norman is the always-on development host for phone-driven work, with its checkout at `/Users/norman/personal/school-noticeboard`. SSH access uses `normans-mac-mini`. The phone must connect directly to Norman's desktop app through ChatGPT Remote so this Mac does not need to stay online. A checkout on another Mac can still be used for development; exchange committed changes through Git and preserve uncommitted work on both hosts.

On Norman, use a login shell or include `/opt/homebrew/bin` in `PATH` for SSH commands. Run the same setup and checks there as on any other development machine. This checkout uses repository-local SSH commit signing with `~/.ssh/id_ed25519_school_noticeboard_signing`, a dedicated key without a passphrase for unattended work. Keep the private key on Norman and register only its public key as a signing key on GitHub. Preserve global GPG settings for other repositories. Fresh clones need this local signing configuration applied again; never disable signing to publish. The public site remains hosted by GitHub Pages, so it does not need a persistent development server on Norman. Its checkout is independent of the private `school-ingest` service.

1. Inspect `git status` and preserve existing changes.
2. Run `bin/setup` on a fresh checkout. On Norman, always keep the development preview reachable through Tailscale with `bin/dev --tailscale`, at http://100.113.216.23:4321/. Reuse the `cat.i4llibres.dev` LaunchAgent described in the README; do not start duplicate servers. On other machines, `bin/dev` serves http://127.0.0.1:4321/.
3. Make the scoped change and add meaningful regression coverage for changed behaviour.
4. Run `bin/ci`. Use the Chrome override in the README if the downloaded browser is unavailable.
5. Inspect the relevant UI at phone widths in both themes and all affected languages.
6. Verify Norman's preview URL responds before handing off changes for phone review, leave the preview running, and include its URL in the response. Report what changed and whether it is local, committed, pushed, or deployed.

`bin/ci` runs shell syntax checks, `astro check`, the production build, Node tests, and Playwright tests. `npm test` expects a production build to exist. Unit tests cover calendar serialization, date labels, the newest month of menus, recognising and replacing menu pictures, external links, script execution with injected command fakes, and generated production output. Browser tests cover fixtures, the opening book and its dates page, the menus pocket, themes, filters and their shortcut, downloads, expiry, language preferences, reduced motion, contrast and layout.

`tests/server.mjs` builds isolated temporary projects on ports 4322 and 4323. Never run fixture builds inside the working checkout: shared Astro content stores previously caused fixture contamination. Keep fixture translations alongside fixture originals. Some production-output tests refer to the current published notices; update these assertions deliberately if those notices are retired.

Preferences use `llibres-language` and `llibres-theme` in localStorage. Test blocked storage and no-JavaScript navigation. Root visits follow a saved language; `/es/`, `/en/`, and `/?lang=ca` are explicit language destinations and take precedence.

## Publishing and verification

The remote is `https://github.com/neosepulveda/i4llibres`, branch `main`. Production is https://i4llibres.cat/. A push to `main` deploys automatically after checks pass. The workflow also supports manual dispatch; pull requests only run checks.

Use the current user's instructions to determine whether to commit and deploy. Do not assume every local edit is a publication request. When authorised:

1. Review the diff, run the required checks, and make a focused commit. Keep configured signing enabled; resolve signing issues rather than silently bypassing it.
2. Push and identify the Actions run for that exact commit, not merely the latest unrelated run.
3. Wait for both build and deployment success.
4. Verify the live HTTPS site, affected languages, and changed downloads or behaviour. Report failure or pending deployment accurately.

The Pages configuration supplies `SITE_URL` and `BASE_PATH`. Root-relative links must respect Astro's base path. Switching from the repository URL to the custom domain previously left old `/i4llibres/` asset paths until a rebuild. If images fail after a domain change, inspect the built URLs and workflow configuration before changing source paths.

For rollback, prefer a reviewed revert commit followed by the normal deployment workflow; preserve public history. Do not reset or force-push without an explicit request.

## Agent conventions

- Keep README, context, code comments, and contributor instructions in English. This does not change the site's Catalan default.
- Use existing Astro/TypeScript conventions. Do not introduce Rails, a database, or a server for a static feature.
- This is a personal project outside `~/work/`. Do not invoke Oyster/GOAT skills, scripts, telemetry, or company conventions.
- Do not write Python unless explicitly requested. Use existing Node tooling for this project.
- Never put private ingestion data, secrets, or unapproved school attachments into this public repository.
- Keep this file about enduring behaviour and decisions. Use Git and Actions for current commit/deployment status instead of recording a status snapshot here.
