# Project context for contributors and agents

Read this file before changing the project. [README.md](README.md) contains commands and content examples; this file explains the intended behaviour and where to make changes. Keep both documents in English and update them when workflows or product decisions change.

## Purpose and scope

Els Llibres is a public noticeboard for I4B families at Escola La Mar Bella in Barcelona. The children named their class **Llibres**. Class information is the priority, alongside relevant whole-school announcements, school meals, holidays, and closures.

The goal is a small, useful board of current information that families can read on their phones. Notices should be edited or removed as circumstances change, rather than accumulating indefinitely. Items requiring action from families come before optional contributions or background information.

The owner manually decides what gets published. A separate private project, `school-ingest`, runs on the Mac Mini known as Norman and processes school communications. This repository is the public presentation layer and has **no automated connection** to that service. Do not add ingestion, source credentials, database queries, or automatic publication as part of routine website work.

Daily/weekly recaps, a CMS approval queue, authentication, and automatic translation are outside the current implementation. They require a separate product decision. A backend is not needed for the current scope.

## Product decisions to preserve

- Phone-first layout, usable at 320px and 390px, with light and dark themes.
- Catalan is the default; Spanish and English cover interface text, notices, and calendar exports.
- Upcoming dates are a compact list at the top of the page, not a month grid. Each row links to its notice card, which holds the details and calendar exports; with JavaScript the card opens and is highlighted on arrival. Keep the notices as a distinct section with its own heading and spacing.
- Notice filters affect cards only, not the upcoming-dates list.
- Keep all category filters visible, with the same compact category labels used on notice cards; do not replace them with action sorting. Use the current board before deciding whether action or freshness badges are needed.
- Notice categories are class, whole school, school meals, and AFA (the family association). Calendar dates use the relevant audience category; event metadata controls the upcoming-dates list and calendar exports.
- Public holidays are named “Dia festiu”, “Día festivo”, and “Public holiday”. School closure days are not necessarily public holidays; use the wording appropriate to the source.
- Calendar export is opt-in through event metadata. Do not infer event durations or add exports to every dated announcement.
- The AFA cancellation reminder marks the final day to cancel activities for the following month, not the whole application window. Use a one-day all-day event and state the exact cutoff in its description.
- External web links open in a new tab with `noopener noreferrer`. Downloads stay direct downloads.
- Preserve downloadable original timetable images. Their contents are also available as translated text.
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
| `src/lib/localized-notices.ts` | Merge translations with shared original metadata; reject incomplete translations; sort notices. |
| `src/lib/i18n.ts` | Interface strings, category labels, supported languages, base-aware language paths. |
| `src/pages/index.astro` | Catalan entry point. |
| `src/pages/[lang]/index.astro` | Static Spanish and English entry points. |
| `src/components/Board.astro` | Shared page layout, calendar placement, notice section, filtering. |
| `src/layouts/Layout.astro` | HTML language/metadata, header, language picker, theme, preference handling, footer. |
| `src/components/Notice.astro` | Cards, translated Markdown, images, optional calendar controls. |
| `src/components/UpcomingDates.astro` | Chronological event list linking to notice cards, client-side expiry. |
| `src/components/CalendarLinks.astro` | Shared Google Calendar and download actions. |
| `src/lib/calendar.ts` | Calendar URL/file generation, time labels, stable event UIDs, escaping and UTF-8 line folding. |
| `src/pages/calendar/[...id].ics.ts` | Catalan event downloads. |
| `src/pages/[lang]/calendar/[...id].ics.ts` | Translated event downloads. |
| `src/lib/external-links.mjs` | Build-time Markdown external-link policy. |
| `src/styles/site.css` | Responsive layout, theme tokens and category colours. Baloo 2 and Figtree load from Google Fonts with system fallbacks. |
| `public/downloads/` | Public original attachments copied into the build. |
| `.github/workflows/pages.yml` | Checks and deployment. |

## Content rules and common changes

For a new notice, add the Catalan file and both translated Markdown files with the same ID. Follow the examples in the README. All translations must be reviewed before publication. Keep original source titles, such as email subjects, unchanged when families need them to locate a message.

Original data owns category, order, dates, event timing, and image paths. Translations own title, summary, details label, body, event text, and image captions/alt text. The translation merger rejects missing translations, mismatched event presence, and mismatched image counts. Adding an event or image therefore requires updating both translations too.

Notice order is `order`, then optional `date`, then ID. A notice date is descriptive only. Event metadata drives the upcoming list and exports. The event list currently sorts by its ISO start string; preserve chronological order when introducing events with different offsets.

For timed events, retain explicit offsets and display Barcelona time. All-day events use date-only start/end with an exclusive end. Keep the same event UID across languages. Exports are individual calendar entries, not a live subscription. Do not promise imported entries will automatically update or deduplicate in every calendar app.

To retire content, remove the original and both translations. Ended events disappear from the upcoming list with JavaScript, but cards do not expire automatically. Without JavaScript, static event rows remain visible until source removal and deployment, and each row is a plain anchor link to its card. Category filtering and automatic expiry are progressive enhancements; reading details and following language/download links must work without scripts.

For UI changes, edit shared components rather than copying separate language layouts. Add all interface translations together. Reuse the existing theme variables. Check long Spanish/English labels on phones as well as Catalan.

## Local workflow and tests

The usual checkout is `~/personal/school-noticeboard`; commands run from the repository root. Develop locally, not over SSH on Norman.

1. Inspect `git status` and preserve existing changes.
2. Run `bin/setup` on a fresh checkout, then `bin/dev` for http://127.0.0.1:4321/.
3. Make the scoped change and add meaningful regression coverage for changed behaviour.
4. Run `bin/ci`. Use the Chrome override in the README if the downloaded browser is unavailable.
5. Inspect the relevant UI at phone widths in both themes and all affected languages.
6. Report what changed and whether it is local, committed, pushed, or deployed.

`bin/ci` runs shell syntax checks, `astro check`, the production build, Node tests, and Playwright tests. `npm test` expects a production build to exist. Unit tests cover calendar serialization, external links, script execution with injected command fakes, and generated production output. Browser tests cover fixtures, themes, filters, downloads, expiry, language preferences, and layout.

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
