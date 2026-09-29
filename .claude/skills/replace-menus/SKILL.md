---
name: replace-menus
description: Add a new month's lunch menus from Menjadors Biosca to the noticeboard's back-cover pocket, starting from the subject of the AFA email that carries them (for example "Fwd: menús d'octubre") or a folder of the menus. Finds the email in Gmail, downloads its attachments through Chrome, sorts and resizes them with bin/menus, names any new adapted menu in three languages, checks the site and offers to publish. Also retires an older month when the user says it can go. Use this whenever new school lunch menus arrive, or the user mentions the month's menus, the menjador or Biosca menus, or gives an email subject about menús, even without saying "replace".
argument-hint: <email subject>
---

# Add the monthly menus

Every month the AFA forwards Menjadors Biosca's menus to families by email: the main menu, a monthly tips sheet, dinner ideas and their recipes, and adapted menus for allergies and diets. September 2026 came as fifteen JPGs; October as a few JPGs and PDFs, one of them holding all sixteen adapted menus. The site shows the menus in the pocket inside the back cover. A new month usually arrives before the current one ends, so this skill adds it next to the current one; the older month stays until the user says it can go (step 6). It changes content only; the pocket, its labels and its looks stay as they are.

The argument is the email's subject as the user remembers it, or a folder where they saved the menus (then start at step 3). They often dictate by voice, so expect it to differ a little from the real subject ("menus de octubre" for "Fwd: menús d'octubre").

## 1. Find the email

Use the Gmail connector (`search_threads`, `get_message`; load them with ToolSearch if they are deferred).

- Search with the subject's distinctive words, not the exact subject, because accents and "Fwd:" prefixes vary: `subject:(menús octubre) has:attachment`, or `menus octubre has:attachment newer_than:60d`.
- With several matches, take the newest one that carries the menus. If it is still unclear, show the user the candidates (subject, sender, date, number of attachments) and ask.
- `get_message` with `PLAIN_TEXT` gives the date, the body and the attachments' names and types. From it, work out:
  - **The month the menus are for**, from the subject, the body or the month name in the file names ("OCTUBRE"). School menus run from September to June: September to December belong to the school year's first calendar year, January to June to its second. Write it as `YYYY-MM`.
  - **How many attachments there are**, to check the download against.
  - **Whether they are files at all.** If the menus came as a Drive link, stop and tell the user: `bin/menus` needs the files.

## 2. Download the attachments

The Gmail connector reads attachment names but cannot download their contents, so download them through the user's Chrome with Claude in Chrome. Invoking this skill with an email is the request to download that email's attachments, and nothing else.

1. Load the Chrome tools in one ToolSearch call (`tabs_context_mcp`, `tabs_create_mcp`, `navigate`, `find`, `computer`, `tabs_close_mcp`) and call `tabs_context_mcp` first. If several browsers are connected, it asks you to let the user choose. Do that; the right one is the browser on this Mac, because the download lands in its Downloads folder.
2. Open a new tab at the message's `viewUrl`. Find the "Download all attachments" button (the `find` tool finds it by that name, next to "N attachments · Scanned by Gmail") and click it. Nothing else in Gmail needs a click.
3. Gmail saves one zip in `~/Downloads`, named after the subject without spaces or accents (`fwdmensdesetembre.zip` for "Fwd: menús de setembre"). Find the newest with `/bin/ls -t ~/Downloads | head`. Plain `ls` may be aliased to eza on this machine.
4. Extract it with `ditto -x -k <zip> <folder>` into a new folder, such as `~/Downloads/menus-<YYYY-MM>`. Don't use `unzip`: Gmail stores accented names like MENÚ and VEGETERIÀ in an encoding `unzip` rejects, and it leaves a half-extracted folder behind.
5. Check that the folder holds as many files as the email had attachments, then close the tab you opened.

Without Chrome, for example when working from a phone through Norman, ask the user to save the attachments into a folder and give you its path. Then carry on from step 3.

## 3. Add the menus

First sort the folder:

- **Leave out what isn't a monthly menu**, such as the lunchtime service's plan or its sheet of contacts and prices. Those belong on a notice or in `src/lib/menus.ts` (`lunchtimeInfo`), not in a month; mention them to the user.
- **Split a PDF that holds several menus**, one per page, like October's "MENÚS OCTUBRE.pdf". Render its pages with `swift scripts/pdf-pages.swift <pdf> <folder>`, read each page's chalkboard in the top right corner, and save each page in the menus folder under the name the chalkboard gives (`MENÚ HALAL.png`, `SENSE LACTOSA I SENSE LLEGUMS.png`), writing “S/” out as “SENSE”. Then remove the combined PDF from the folder. The tips sheet and the recipes stay whole: they are for every family and stay PDFs.

Then, from the repository root:

```sh
bin/menus <folder> <YYYY-MM>
```

It recognises the menus for every family (basal, fitxa, sopars, receptes) and the month's programme of lunchtime activities ("PROGRAMACIÓ OCTUBRE", kind `activitats`) by Biosca's file names. The programme may come separately from the menus. October 2026's also got a notice of its own (`activitats-migdia-octubre`); ask the user whether a new month's should too. Any other file is an adapted menu, named by its file name without the school or the month, typos fixed (`SENSE ANOUS` is `sense-nous`, `VEGETERIÀ` is `vegetaria`, `S/ BOLETS` is `sense-bolets`). Pictures and one-page PDFs become JPEGs in `public/downloads/menjador-<kind or menu>-<YYYY-MM>.jpg`, without the black frame Biosca's PDFs have; a sheet of several pages stays a PDF. It writes `src/content/menus/<YYYY-MM>.yaml`, keeps the month before and removes anything older. It prints which file became which menu, so compare that list with the attachments: a stray file with a name, such as a signature image, would be listed as a menu. Remove it from the folder and run again.

When something doesn't fit, it changes nothing and says why:

- **A file whose name says nothing** once the school and the month are gone (`IMG_2041.jpg`, `1000122145.jpg`). Look at it (read the image). If the chalkboard in the top right corner names a menu, save it under that name (`MENÚ SENSE GLUTEN.jpg`), remove the original and run again. If it isn't a menu, leave it out.
- **Two files for the same menu.** Look at both; Biosca sometimes resends a corrected version. Keep the right one, and ask if unsure.
- **A PDF of several pages that isn't for every family.** It holds adapted menus: split it as above.
- **A file that is neither a picture nor a PDF.** Check what it is, and leave it out.

### Name the new adapted menus

A menu that came in an earlier month keeps its names. A new one is listed with empty names, and `bin/menus` prints which: the build refuses the list until they are filled in. For each, read its chalkboard and write:

- `ca`: the chalkboard's words, as a family would say them: "S/" is "Sense", "P." is "proteïna", and a list of things to avoid with no "sense" ("FESTUCS I ANACARDS") is "Sense festucs ni anacards". Keep "Al·lèrgia a …" when the sheet says it.
- `es` and `en`: the same menu, translated. When the chalkboard abbreviates, check what the menu actually changes against the main menu before translating: October's "S/P. DE VACA" swaps beef for chicken and drops dairy, so it is "No lactose, cow’s milk or beef".

Mention to the user any name you had to interpret.

## 4. Check it

- Look at the new main menu, `public/downloads/menjador-basal-<YYYY-MM>.jpg`. Its header should name the month you gave, and the dishes should be readable. A different month there means the `YYYY-MM` was wrong.
- Look at one adapted menu that came as a PDF: no black frame, and readable.
- Run `bin/ci`. If Playwright's own Chromium isn't installed on this machine, use Chrome: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' bin/ci`. The tests read whichever months the site has, so a new month needs no test changes.
- `git status` should show only the new files and list, and any month older than the one before removed.

## 5. Report and publish

Tell the user the month and how many menus arrived. Mention anything unusual: a file you renamed or left out, a menu that came last month but not this one, a new menu and the names you gave it. While two months show, the dates page link reads, for example, "Menús de setembre i d’octubre"; offer the local preview if they want to look.

Publishing puts the menus on the public site. Only the menus belong there: the email's text stays out, because the repository and its history are public. Commit and deploy when the user asked for it with the invocation ("… and publish it") or agrees now. Follow "Publishing and verification" in CONTEXT.md:

1. Make one commit, such as `feat: put October's lunch menus in the pocket`.
2. Push, and watch the Actions run for that exact commit.
3. Check the live link text and that one picture URL loads.

## 6. Retire the older month

When the user says the older month can go ("treu els de setembre"):

```sh
bin/menus retire <YYYY-MM>
```

It removes that month's files and list. Run `bin/ci`, then publish as in step 5 when asked, with a commit such as `feat: take September's lunch menus out of the pocket`.
