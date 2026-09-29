// Adds a month of Menjadors Biosca's menus to the pocket, or takes one out:
//   bin/menus <folder of menus> <YYYY-MM>
//   bin/menus retire <YYYY-MM>
// Each file is recognised by its name. Pictures and one-page PDFs are resized for phones and saved
// as public/downloads/menjador-<kind or id>-<YYYY-MM>.jpg; a sheet of several pages stays a PDF.
// The month's list goes in src/content/menus/<YYYY-MM>.yaml. The month before stays, since a new
// month arrives before the old one ends, until it is retired; older months are removed.
// Nothing changes unless every file is recognised.
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { menuKinds } from '../src/lib/menus.ts';

// The menus for every family. "Receptes dels sopars" names the dinners too, so it comes first.
// The lunchtime activities come headed "Programació octubre", or as "actividades migdia".
const forEveryFamily = [
  [/\bRECEPTES\b/, 'receptes'],
  [/\bFITXA\b/, 'fitxa'],
  [/\bSOPARS?\b/, 'sopars'],
  [/\bBASAL\b/, 'basal'],
  [/\b(PROGRAMACIO|ACTIVITATS|ACTIVIDADES)\b/, 'activitats'],
];
// Any other file is an adapted menu, named by its file name without the school, the month and
// the like: "SENSE GLUTEN BASAL LA MAR BELLA SETEMBRE" is sense-gluten. Biosca's typos are fixed
// on the way, so a menu keeps its name from month to month: "SENSE ANOUS" means without nuts
// ("nous"), and the vegetarian menu has come as "VEGETERIÀ".
const typos = [[/\bANOUS\b/g, 'NOUS'], [/\bVEGETERIA\b/g, 'VEGETARIA'], [/\bP L V\b/g, 'PLV'], [/\bCACAHUETE?S?\b/g, 'CACAUET']];
const monthNames = ['GENER', 'FEBRER', 'MARC', 'ABRIL', 'MAIG', 'JUNY', 'JULIOL', 'AGOST', 'SETEMBRE', 'OCTUBRE', 'NOVEMBRE', 'DESEMBRE'];
const noise = new Set(['MENJADOR', 'MENU', 'MENUS', 'BASAL', 'ESCOLA', 'LA', 'MAR', 'BELLA', 'MARBELLA', ...monthNames]);
const beforeMonth = new Set(['D', 'DE', 'DEL', 'MES']);
const pictures = ['.jpg', '.jpeg', '.png', '.webp'];

/** What a Biosca file holds: a menu for every family, an adapted menu, or undefined when its name says nothing. */
export function menuFor(name) {
  let words = name.replace(/\.[^.]+$/, '').normalize('NFD').replace(/\p{M}/gu, '').toUpperCase()
    .replace(/\bS\s*[/:]/g, 'SENSE ').replace(/[^A-Z0-9]+/g, ' ').trim();
  for (const [typo, fix] of typos) words = words.replace(typo, fix);
  // "SENSE GLUTEN BASAL" is the gluten-free version of the main menu, not the main menu.
  const kind = /\bSENSE\b/.test(words) ? undefined : forEveryFamily.find(([pattern]) => pattern.test(words))?.[1];
  if (kind) return { kind };
  const list = words.split(' ');
  const id = list.filter((word, index) => !noise.has(word) && !/^\d+$/.test(word) && !(beforeMonth.has(word) && monthNames.includes(list[index + 1]))).join('-').toLowerCase();
  return id ? { id } : undefined;
}

// PDFKit renders the pages. It comes with macOS, where bin/menus runs.
function renderPdf(path) {
  const folder = mkdtempSync(join(tmpdir(), 'menus-pdf-'));
  try {
    const pages = Number(execFileSync('swift', [fileURLToPath(new URL('pdf-pages.swift', import.meta.url)), path, folder], { encoding:'utf8' }));
    return Array.from({ length:pages }, (_, index) => readFileSync(join(folder, `${index + 1}.png`)));
  } finally { rmSync(folder, { recursive:true, force:true }); }
}

const menuFile = /^menjador-[a-z0-9]+(?:-[a-z0-9]+)*-(\d{4}-\d{2})\.(?:jpg|pdf)$/;
const checkMonth = month => { if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month ?? '')) throw new Error(`Give the month as YYYY-MM, for example 2026-10 (got “${month ?? ''}”).`); };

// The names of the adapted menus in the lists already written, so a menu that comes back keeps its
// name. The lists are written below, one name per line.
function knownNames(lists) {
  const names = new Map();
  for (const name of readdirSync(lists).filter(name => name.endsWith('.yaml'))) {
    for (const [, id, ca, es, en] of readFileSync(join(lists, name), 'utf8').matchAll(/^ {2}- id: ([a-z0-9-]+)\n {4}ca: (".*")\n {4}es: (".*")\n {4}en: (".*")$/gm)) {
      const menu = { ca:JSON.parse(ca), es:JSON.parse(es), en:JSON.parse(en) };
      if (menu.ca && menu.es && menu.en) names.set(id, menu);
    }
  }
  return names;
}

export async function addMenus({ folder, month, root, pdfPages = renderPdf }) {
  checkMonth(month);
  const files = readdirSync(folder).filter(name => !name.startsWith('.')).sort((a, b) => a.localeCompare(b, 'ca', { numeric:true }));
  if (!files.length) throw new Error(`There is nothing in ${folder}.`);
  const unexpected = files.filter(name => ![...pictures, '.pdf'].includes(extname(name).toLowerCase()));
  if (unexpected.length) throw new Error(`Only pictures and PDFs are expected. Remove or check: ${unexpected.join(', ')}`);
  const unknown = files.filter(name => !menuFor(name));
  if (unknown.length) throw new Error(`These files are not a menu I recognise: ${unknown.join(', ')}`);
  const byName = Map.groupBy(files, name => { const { kind, id } = menuFor(name); return kind ?? id; });
  const repeated = [...byName].filter(([, names]) => names.length > 1).map(([name, names]) => `${name} (${names.join(', ')})`);
  if (repeated.length) throw new Error(`More than one file for the same menu: ${repeated.join('; ')}`);

  // Read and resize everything before touching the site, so a broken file leaves the menus as they were.
  const menus = [];
  for (const [name, [from]] of byName) {
    const kind = menuKinds.includes(name) ? name : undefined;
    let input = join(folder, from);
    if (extname(from).toLowerCase() === '.pdf') {
      const pages = await pdfPages(input);
      if (pages.length > 1 && !kind) throw new Error(`${from} has ${pages.length} pages. Only a sheet for every family stays a PDF; save each menu as its own file.`);
      if (pages.length > 1) { menus.push({ kind, name, from, to:`menjador-${name}-${month}.pdf`, bytes:readFileSync(input).length, copy:input }); continue; }
      input = pages[0];
    }
    // Biosca's PDFs come with a black frame around the menu, which families don't need.
    const data = await sharp(input).rotate().trim({ background:'#000000', threshold:40 }).resize({ width:1600, withoutEnlargement:true }).flatten({ background:'#ffffff' }).jpeg({ quality:80, mozjpeg:true }).toBuffer();
    menus.push({ kind, name, from, to:`menjador-${name}-${month}.jpg`, bytes:data.length, data });
  }
  const main = menuKinds.flatMap(kind => menus.filter(menu => menu.kind === kind));
  const adapted = menus.filter(menu => !menu.kind);

  const downloads = join(root, 'public/downloads'), lists = join(root, 'src/content/menus');
  mkdirSync(lists, { recursive:true });
  const names = knownNames(lists);
  // The month before stays; anything older goes, and so does anything this month no longer has.
  const listed = readdirSync(lists).filter(name => name.endsWith('.yaml')).map(name => name.replace(/\.yaml$/, ''));
  const oldest = listed.filter(other => other < month).sort().at(-1) ?? month;
  const written = new Set(menus.map(({ to }) => to));
  const removed = [
    ...readdirSync(downloads).filter(name => { const [, of] = name.match(menuFile) ?? []; return of && (of < oldest || (of === month && !written.has(name))); }).map(name => join('public/downloads', name)),
    ...listed.filter(other => other < oldest).map(other => join('src/content/menus', `${other}.yaml`)),
  ];
  for (const path of removed) rmSync(join(root, path));
  for (const { to, data, copy } of menus) copy ? copyFileSync(copy, join(downloads, to)) : writeFileSync(join(downloads, to), data);
  const quote = JSON.stringify;
  const unnamed = adapted.filter(({ name }) => !names.has(name)).map(({ name }) => name);
  writeFileSync(join(lists, `${month}.yaml`), [
    `# Written by bin/menus from Menjadors Biosca's menus. Name each adapted menu as its sheet does.`,
    `month: "${month}"`, 'menus:', ...main.map(({ kind }) => `  - ${kind}`),
    adapted.length ? 'adapted:' : 'adapted: []',
    ...adapted.flatMap(({ name }) => { const { ca = '', es = '', en = '' } = names.get(name) ?? {}; return [`  - id: ${name}`, `    ca: ${quote(ca)}`, `    es: ${quote(es)}`, `    en: ${quote(en)}`]; }),
  ].join('\n') + '\n');
  return { month, menus:[...main, ...adapted].map(({ data, copy, ...menu }) => menu), removed, unnamed };
}

export function retireMenus({ month, root }) {
  checkMonth(month);
  const list = join('src/content/menus', `${month}.yaml`);
  if (!existsSync(join(root, list))) throw new Error(`There are no menus for ${month} to retire.`);
  const removed = [list, ...readdirSync(join(root, 'public/downloads')).filter(name => name.match(menuFile)?.[1] === month).map(name => join('public/downloads', name))];
  for (const path of removed) rmSync(join(root, path));
  return { removed };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [first, month] = process.argv.slice(2);
  const root = fileURLToPath(new URL('..', import.meta.url));
  if (!first || !month) {
    console.error('Usage: bin/menus <folder of menus> <YYYY-MM>\n       bin/menus retire <YYYY-MM>');
    process.exit(1);
  }
  try {
    if (first === 'retire') {
      const { removed } = retireMenus({ month, root });
      console.log(`Took the ${month} menus out of the pocket:\n${removed.map(path => `  ${path}`).join('\n')}`);
    } else {
      const result = await addMenus({ folder:first, month, root });
      console.log(`Menus for ${result.month}:`);
      const width = Math.max(...result.menus.map(({ name }) => name.length));
      for (const { name, from, bytes } of result.menus) console.log(`  ${name.padEnd(width)} ${Math.round(bytes / 1000)} kB  ← ${from}`);
      if (result.removed.length) console.log(`Removed:\n${result.removed.map(path => `  ${path}`).join('\n')}`);
      if (result.unnamed.length) console.log(`\nName these menus in src/content/menus/${month}.yaml as their sheets do, in Catalan, Spanish and English:\n${result.unnamed.map(name => `  ${name}`).join('\n')}`);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
