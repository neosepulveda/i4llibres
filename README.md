# Els Llibres

A public, manually curated noticeboard for the families of **I4B, Els Llibres**, at Escola La Mar Bella in Barcelona. It brings class announcements, school information, and upcoming dates together in a phone-friendly website.

- Website: [i4llibres.cat](https://i4llibres.cat/)
- Repository: [neosepulveda/i4llibres](https://github.com/neosepulveda/i4llibres)
- Languages: Catalan by default, Spanish, and English.
- Stack: Astro, TypeScript, Markdown, and GitHub Pages. No application server or database.

Read [CONTEXT.md](CONTEXT.md) for architecture, product decisions, and instructions for agents working on the project. Repository documentation is in English; published content is translated into all three languages.

## Run locally

```sh
bin/setup
bin/dev
```

Open http://127.0.0.1:4321/. `bin/dev` accepts Astro arguments, such as `bin/dev --port 4325`.

`bin/setup` installs mise through Homebrew if necessary, trusts `.mise.toml`, installs the pinned Node version, runs `npm ci`, and installs Chromium for browser tests. Without Homebrew, install [mise](https://mise.jdx.dev/) first. Node is pinned to **24.15.0**.

## Work from a phone through Norman

The always-on checkout is `/Users/norman/personal/school-noticeboard` on `normans-mac-mini`. Pair the ChatGPT mobile app directly with Norman's desktop app, then select this project in Remote. Norman runs edits, tests, and Git commands; GitHub Actions publishes the website. Keep Norman awake, online, and running the desktop app.

For terminal access:

```sh
ssh normans-mac-mini
cd ~/personal/school-noticeboard
bin/ci
```

Non-interactive SSH commands need a login shell or `/opt/homebrew/bin` in `PATH` to find Homebrew tools. Norman's checkout uses a dedicated SSH signing key without a passphrase, configured only for this repository. Its private key stays at `~/.ssh/id_ed25519_school_noticeboard_signing`; only the public key belongs in GitHub's signing-key settings. Fresh clones need the local signing configuration applied again. Before the first phone-driven deployment, verify both signed commits and GitHub push access. Never disable signing to get a deployment through.

### Preview on your phone

Connect the phone to Tailscale and open **http://100.113.216.23:4321/**. Spanish and English previews are at `/es/` and `/en/`. This serves Norman's current working files, including uncommitted edits, with Astro's live reload. GitHub Pages remains the published site.

`bin/dev --tailscale` detects the host's Tailscale IPv4 address and binds only to that address on port 4321. It fails if Tailscale cannot provide an address or the port is occupied. Do not use `--host 0.0.0.0`, Funnel, or public port forwarding for the development preview. Access follows the tailnet's existing device permissions.

On Norman, the user LaunchAgent `cat.i4llibres.dev` keeps this command running after SSH disconnects and restarts it after failure. It starts when Norman's user logs in; a reboot still requires that login and Tailscale to be available. Its configuration lives at `~/Library/LaunchAgents/cat.i4llibres.dev.plist`, with logs in `~/Library/Logs/i4llibres-dev/`.

```sh
# Inspect or restart the existing preview; do not launch a duplicate.
launchctl print gui/$(id -u)/cat.i4llibres.dev
launchctl kickstart -k gui/$(id -u)/cat.i4llibres.dev
curl --fail http://100.113.216.23:4321/ > /dev/null
```

Always leave this preview available when handing off development changes for phone review, and include its URL in the response. Check access from another Tailscale device when changing the server configuration.

## Check changes

```sh
bin/ci
```

This checks shell syntax and Astro/TypeScript, builds the website, and runs Node and Playwright tests. On macOS, an existing Chrome installation can be used for tests:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' bin/ci
```

Browser tests build isolated temporary copies with empty or fictional content. They do not replace the notices in the working checkout.

## Add or edit a notice

Create `src/content/notices/<id>.md` with Catalan content:

```markdown
---
title: "Títol de l’avís"
description: "Resum breu de l’avís."
category: classe
order: 10
date: "2026-10-02"
note: "Més informació"
---
The notice body goes here, written in Catalan using Markdown.
```

The example date is illustrative, not a current announcement.

| Field | Purpose |
| --- | --- |
| `title`, `description` | Required card heading and summary. |
| `category` | `classe`, `escola`, `menjador`, or `afa` (the family association). School-wide calendar notices use `escola`; the optional `event` block controls the upcoming-dates list and calendar exports. |
| `order` | Lower values appear first; defaults to 100. Put family actions before optional information. |
| `date` | Optional date displayed on the card. Does not create an event or expire the notice. |
| `note` | Optional label for the row that opens the details. |
| `scene` | Optional pop-up illustration: `letter`, `activities`, `dining`, `holiday`, `timetable` or `playground`. Without one, the card shows the school from the cover. |
| `expanded` | Optional. `true` shows the body and images on the page instead of behind a details row. In an expanded notice, a list whose items start with bold text reads as a timetable. |

Each scene was drawn for a particular notice, and some carry words (the email subject, “every month”, the weekday initials), so pick one only when its picture fits. A new kind of notice needs a new component in `src/components/scenes/` and its name in `src/lib/scenes.ts`.

Ties in `order` are resolved by date and then notice ID. Edit an existing file to update a notice. To remove it, delete the original and its translations, then publish. Public Git history retains previous versions.

### Translate the notice

Add matching files:

```text
src/content/translations/es/<id>.md
src/content/translations/en/<id>.md
```

Each translation has `title`, `description`, `note`, and a Markdown body. For example, the English file starts with:

```markdown
---
title: "Notice title"
description: "A short summary."
note: "More information"
---
The translated notice body.
```

If the original includes an event, translate `event.title`, `event.location`, and `event.description`. If it includes images, provide an `images` list containing translated `title` and `alt` values in the same order. Do not duplicate dates, times, categories, ordering, or attachment paths in translations: these come from the Catalan original.

The build fails if a notice is missing a Spanish or English translation, event text, or matching image text. Review all versions before publishing; translations are not generated at runtime.

## Add a calendar event

An optional `event` block makes the notice appear in **Upcoming dates** and adds Google Calendar and `.ics` download actions. A `date` field alone does not enable these features.

```yaml
event:
  title: "Reunió del menjador"
  start: "2026-10-05T17:00:00+02:00"
  end: "2026-10-05T18:00:00+02:00"
  location: "Menjador de l’Escola La Mar Bella"
  description: "Reunió informativa del menjador."
```

Use the correct Barcelona UTC offset for the event date. Timed exports use UTC. For an all-day public holiday, use date-only values and an **exclusive end date**:

```yaml
event:
  title: "Dia festiu"
  allDay: true
  start: "2026-10-12"
  end: "2026-10-13"
  location: "Escola La Mar Bella"
  description: "Dia festiu. No hi ha classe."
```

Upcoming dates are the first page of the book, under the cover, and separate from notice filters. Dates that do not fit on the page wait behind “Show N more dates”; with none left, the page says there are no dates coming up. With JavaScript, ended events disappear when the page opens, every minute, and when returning to the tab. All-day expiry follows Barcelona time. Each date links to its notice card, where the details and calendar downloads live; with JavaScript the card opens automatically. Without JavaScript, the link still jumps to the card. The original notice stays until manually removed.

Calendar exports are copies, not subscriptions: later website edits do not automatically update a family's calendar.

For the AFA cancellation deadline, export only the final day for cancelling the following month's activities. Use a one-day all-day event with the next day as its exclusive end, and include the exact cutoff time in the description. The notice can still explain the full application window. Category filters remain visible with compact labels; the board currently uses editorial ordering without action or freshness badges.

## Add timetable images

Place originals in `public/downloads/` and add:

```yaml
images:
  - src: "/downloads/timetable.jpg"
    title: "Horari"
    alt: "A meaningful description in Catalan."
```

Add corresponding translated image text to both translation files. Images appear after the notice text, like snapshots pinned to the page, behind the details row or directly on the page for an `expanded` notice. Tapping one opens it in a new tab, and each has a download link. Original timetable images remain in Catalan; the translated notice body provides their contents in Spanish and English.

## Language and appearance preferences

- `/` defaults to Catalan; `/es/` is Spanish; `/en/` is English.
- The language selector saves `llibres-language` in localStorage. Returning to `/` follows this preference.
- Explicit `/es/`, `/en/`, and `/?lang=ca` links take precedence over the saved preference.
- The theme follows the system until the visitor chooses a mode, saved as `llibres-theme`.
- No cookies or account are required. Preferences are local to the browser and can be cleared by the visitor.
- Navigation still works without JavaScript or browser storage; preference persistence requires both.

## Deploy

A push to `main` runs `.github/workflows/pages.yml`, executes `bin/ci`, builds for the configured Pages domain, and deploys `dist/`. Pull requests run checks without deploying. GitHub Pages must use **GitHub Actions** as its source.

After reviewing and committing the changes:

```sh
git push origin main
gh run list --repo neosepulveda/i4llibres --limit 3
# Replace RUN_ID with the run for your pushed commit.
gh run watch RUN_ID --repo neosepulveda/i4llibres --exit-status
```

Confirm the live page after the workflow succeeds, including changed content, languages, downloads, and mobile layout. Do not treat a successful push as a completed deployment.

The workflow obtains `SITE_URL` and `BASE_PATH` from GitHub Pages. Do not hard-code `/i4llibres` into links: the custom domain serves the site from `/`. To check a repository subpath locally:

```sh
mise exec -- env BASE_PATH=/i4llibres npm run build
```

Run `bin/ci` afterwards to restore a normal build before running its production-output assertions.

## Publication boundaries

Only deliberately curated content belongs in this public repository. The development checkout on Norman has no connection to the private ingestion service, no database access, and no automatic import from WhatsApp, email, or the private generated noticeboard.

Pages contain `noindex, nofollow`, but the website and Git history are public. These directives are not access control. Keep private emails, credentials, and school documents with unrestricted edit links out of the repository. When an announcement depends on a private email, direct families to that email instead.
