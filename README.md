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
| `category` | `classe`, `escola`, `menjador`, or `calendari`. |
| `order` | Lower values appear first; defaults to 100. Put family actions before optional information. |
| `date` | Optional date displayed on the card. Does not create an event or expire the notice. |
| `note` | Optional label for the expandable details. |

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

Upcoming dates are separate from notice filters. With JavaScript, ended events disappear when the page opens, every minute, and when returning to the tab. All-day expiry follows Barcelona time. Without JavaScript, events remain visible and can still be expanded and downloaded. The original notice stays until manually removed.

Calendar exports are copies, not subscriptions: later website edits do not automatically update a family's calendar.

## Add timetable images

Place originals in `public/downloads/` and add:

```yaml
images:
  - src: "/downloads/timetable.jpg"
    title: "Horari"
    alt: "A meaningful description in Catalan."
```

Add corresponding translated image text to both translation files. Images appear in the expanded notice, open in a new tab, and can be downloaded. Original timetable images remain in Catalan; the translated notice body provides their contents in Spanish and English.

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

Only deliberately curated content belongs in this public repository. There is no connection to Norman, no database access, and no automatic import from WhatsApp, email, or the private generated noticeboard.

Pages contain `noindex, nofollow`, but the website and Git history are public. These directives are not access control. Keep private emails, credentials, and school documents with unrestricted edit links out of the repository. When an announcement depends on a private email, direct families to that email instead.
