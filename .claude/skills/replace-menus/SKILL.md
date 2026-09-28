---
name: replace-menus
description: Replace the lunch menus in the noticeboard's back-cover pocket with a new month's menus from Menjadors Biosca, starting from the subject of the AFA email that carries them (for example "Fwd: menús d'octubre"). Finds the email in Gmail, downloads its picture attachments through Chrome, sorts and resizes them with bin/menus, checks the site and offers to publish. Use this whenever new school lunch menus arrive, or the user mentions the month's menus, the menjador or Biosca menus, or gives an email subject about menús, even without saying "replace".
argument-hint: <email subject>
---

# Replace the monthly menus

Every month the AFA forwards Menjadors Biosca's menus to families by email: about fifteen JPG pictures (the main menu, a monthly tips sheet, dinner ideas, and adapted menus for allergies and diets). The site shows only the newest month, in the pocket inside the back cover. This skill swaps one month for the next. It changes content only; the pocket, its labels and its looks stay as they are.

The argument is the email's subject as the user remembers it. They often dictate by voice, so expect it to differ a little from the real subject ("menus de octubre" for "Fwd: menús d'octubre").

## 1. Find the email

Use the Gmail connector (`search_threads`, `get_message`; load them with ToolSearch if they are deferred).

- Search with the subject's distinctive words, not the exact subject, because accents and "Fwd:" prefixes vary: `subject:(menús octubre) has:attachment`, or `menus octubre has:attachment newer_than:60d`.
- With several matches, take the newest one that carries pictures. If it is still unclear, show the user the candidates (subject, sender, date, number of attachments) and ask.
- `get_message` with `PLAIN_TEXT` gives the date, the body and the attachments' names and types. From it, work out:
  - **The month the menus are for**, from the subject, the body or the month name in the file names ("OCTUBRE"). School menus run from September to June: September to December belong to the school year's first calendar year, January to June to its second. Write it as `YYYY-MM`.
  - **How many pictures there are**, to check the download against.
  - **Whether they are pictures at all.** If the menus came as a PDF or a Drive link, stop and tell the user: `bin/menus` handles pictures only.

## 2. Download the attachments

The Gmail connector reads attachment names but cannot download their contents, so download them through the user's Chrome with Claude in Chrome. Invoking this skill with an email is the request to download that email's attachments, and nothing else.

1. Load the Chrome tools in one ToolSearch call (`tabs_context_mcp`, `tabs_create_mcp`, `navigate`, `find`, `computer`, `tabs_close_mcp`) and call `tabs_context_mcp` first. If several browsers are connected, it asks you to let the user choose. Do that; the right one is the browser on this Mac, because the download lands in its Downloads folder.
2. Open a new tab at the message's `viewUrl`. Find the "Download all attachments" button (the `find` tool finds it by that name, next to "N attachments · Scanned by Gmail") and click it. Nothing else in Gmail needs a click.
3. Gmail saves one zip in `~/Downloads`, named after the subject without spaces or accents (`fwdmensdesetembre.zip` for "Fwd: menús de setembre"). Find the newest with `/bin/ls -t ~/Downloads | head`. Plain `ls` may be aliased to eza on this machine.
4. Extract it with `ditto -x -k <zip> <folder>` into a new folder, such as `~/Downloads/menus-<YYYY-MM>`. Don't use `unzip`: Gmail stores accented names like MENÚ and VEGETERIÀ in an encoding `unzip` rejects, and it leaves a half-extracted folder behind.
5. Check that the folder holds as many pictures as the email had attachments, then close the tab you opened.

Without Chrome, for example when working from a phone through Norman, ask the user to save the attachments into a folder and give you its path. Then carry on from step 3.

## 3. Replace the menus

From the repository root:

```sh
bin/menus <folder> <YYYY-MM>
```

It recognises each picture by Biosca's file name, typos included (`SENSE ANOUS` is the nut-free menu, `VEGETERIÀ` the vegetarian one). It resizes them into `public/downloads/menjador-<kind>-<YYYY-MM>.jpg` and writes `src/content/menus/<YYYY-MM>.yaml`. It also removes the previous month's pictures and list. It prints which file became which menu, so compare that list with the email's attachments.

When something doesn't fit, it changes nothing and says why:

- **A picture it doesn't recognise.** Look at it (read the image): the chalkboard in the top right corner names the menu, for example "Menú sense gluten".
  - If it is one of the known menus under an unusual name, copy it in the folder under a clear name (`SENSE GLUTEN.jpg`), remove the original and run again.
  - If it is a menu the site has no card for yet (say "sense ou"), stop and ask the user. A new kind needs its name in `src/lib/menus.ts`, a rule in `scripts/menus.mjs` and labels in Catalan, Spanish and English in `src/lib/i18n.ts`. That is a change for them to approve, not a guess.
- **Two pictures for the same menu.** Look at both; Biosca sometimes resends a corrected version. Keep the right one, and ask if unsure.
- **A file that isn't a picture.** Check what it is. A stray PDF or signature image can be left out of the folder.

## 4. Check it

- Look at the new main menu, `public/downloads/menjador-basal-<YYYY-MM>.jpg`. Its header should name the month you gave, and the dishes should be readable. A different month there means the `YYYY-MM` was wrong.
- Run `bin/ci`. If Playwright's own Chromium isn't installed on this machine, use Chrome: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' bin/ci`. The tests read whichever month the site has, so a new month needs no test changes.
- `git status` should show only the new pictures and list, and the previous month's pictures and list removed.

## 5. Report and publish

Tell the user the month and how many menus arrived. Mention anything unusual: a file you renamed, a menu that came last month but not this one, or a new kind you stopped on. The dates page link now reads, for example, "Menús d’octubre"; offer the local preview if they want to look.

Publishing puts the pictures on the public site. Only the pictures belong there: the email's text stays out, because the repository and its history are public. Commit and deploy when the user asked for it with the invocation ("… and publish it") or agrees now. Follow "Publishing and verification" in CONTEXT.md:

1. Make one commit, such as `feat: put October's lunch menus in the pocket`.
2. Push, and watch the Actions run for that exact commit.
3. Check the live link text and that one picture URL loads.
