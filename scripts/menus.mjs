// Replaces the month's menus with a new set of Menjadors Biosca's pictures:
//   bin/menus <folder of pictures> <YYYY-MM>
// Each picture is recognised by its file name, resized for phones, and saved as
// public/downloads/menjador-<kind>-<YYYY-MM>.jpg. The month's list goes in
// src/content/menus/<YYYY-MM>.yaml and the previous month's pictures and list are removed.
// Nothing changes unless every picture is recognised.
import { readdirSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { menuKinds } from '../src/lib/menus.ts';

// Biosca's file names, typos included: "SENSE ANOUS" means without nuts ("nous"), and the
// vegetarian menu has come as "VEGETERIÀ". An adapted menu names what it leaves out after
// "SENSE", and most of them also say "BASAL", so those rules come first.
const adapted = [
  [/\bSENSE GLUTEN\b/, 'sense-gluten'],
  [/\bSENSE LACTOSA\b/, 'sense-lactosa'],
  [/\bSENSE (P L V|PLV|PROTEINA)\b/, 'sense-plv'],
  [/\bSENSE CACAH?UETE?S?\b/, 'sense-cacauet'],
  [/\bSENSE (A?NOUS|FRUITS SECS)\b/, 'sense-nous'],
  [/\bSENSE SOJA\b/, 'sense-soja'],
  [/\bSENSE PEIX\b/, 'sense-peix'],
  [/\bSENSE CARN\b/, 'sense-carn'],
  [/\bSENSE PORC\b/, 'sense-porc'],
  [/\bSENSE INTEGRAL\b/, 'sense-integral'],
];
const others = [
  [/\bOVO ?LACTO/, 'ovolactovegetaria'],
  [/\bVEGET/, 'vegetaria'],
  [/\bFITXA\b/, 'fitxa'],
  [/\bSOPARS?\b/, 'sopars'],
  [/\bBASAL\b/, 'basal'],
];
const pictures = ['.jpg', '.jpeg', '.png', '.webp'];

/** The kind of menu a Biosca file name holds, or undefined when it isn't one we know. */
export function kindFor(name) {
  const words = name.replace(/\.[^.]+$/, '').normalize('NFD').replace(/\p{M}/gu, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ');
  // "SENSE OU" is a menu we have no card for: it must not fall back to the main menu.
  const rules = /\bSENSE\b/.test(words) ? adapted : others;
  return rules.find(([pattern]) => pattern.test(words))?.[1];
}

export async function replaceMenus({ folder, month, root }) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month ?? '')) throw new Error(`Give the month as YYYY-MM, for example 2026-10 (got “${month ?? ''}”).`);
  const files = readdirSync(folder).filter(name => !name.startsWith('.'));
  const unexpected = files.filter(name => !pictures.includes(extname(name).toLowerCase()));
  if (unexpected.length) throw new Error(`Only pictures are expected. Remove or check: ${unexpected.join(', ')}`);
  const unknown = files.filter(name => !kindFor(name));
  if (unknown.length) throw new Error(`These pictures are not a menu I recognise: ${unknown.join(', ')}`);
  const byKind = Map.groupBy(files, kindFor);
  const repeated = [...byKind].filter(([, names]) => names.length > 1).map(([kind, names]) => `${kind} (${names.join(', ')})`);
  if (repeated.length) throw new Error(`More than one picture for the same menu: ${repeated.join('; ')}`);
  if (!files.length) throw new Error(`There are no pictures in ${folder}.`);

  // Resize everything before touching the site, so a broken picture leaves the old month in place.
  const kinds = menuKinds.filter(kind => byKind.has(kind));
  const resized = await Promise.all(kinds.map(async kind => {
    const from = byKind.get(kind)[0];
    const data = await sharp(join(folder, from)).rotate().resize({ width:1600, withoutEnlargement:true }).flatten({ background:'#ffffff' }).jpeg({ quality:80, mozjpeg:true }).toBuffer();
    return { kind, from, to:`menjador-${kind}-${month}.jpg`, bytes:data.length, data };
  }));

  const downloads = join(root, 'public/downloads'), lists = join(root, 'src/content/menus');
  mkdirSync(lists, { recursive:true });
  const menuPicture = new RegExp(`^menjador-(${menuKinds.join('|')})-\\d{4}-\\d{2}\\.jpg$`);
  const removed = [
    ...readdirSync(downloads).filter(name => menuPicture.test(name)).map(name => join('public/downloads', name)),
    ...readdirSync(lists).filter(name => name.endsWith('.yaml')).map(name => join('src/content/menus', name)),
  ];
  for (const path of removed) rmSync(join(root, path));
  for (const { to, data } of resized) writeFileSync(join(downloads, to), data);
  writeFileSync(join(lists, `${month}.yaml`), `# Written by bin/menus from Menjadors Biosca's pictures.\nmonth: "${month}"\nmenus:\n${kinds.map(kind => `  - ${kind}\n`).join('')}`);
  const written = new Set([...resized.map(({ to }) => join('public/downloads', to)), join('src/content/menus', `${month}.yaml`)]);
  return { month, pictures:resized.map(({ data, ...picture }) => picture), removed:removed.filter(path => !written.has(path)) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [folder, month] = process.argv.slice(2);
  if (!folder || !month) {
    console.error('Usage: bin/menus <folder of pictures> <YYYY-MM>');
    process.exit(1);
  }
  try {
    const result = await replaceMenus({ folder, month, root:fileURLToPath(new URL('..', import.meta.url)) });
    console.log(`Menus for ${result.month}:`);
    for (const { kind, from, bytes } of result.pictures) console.log(`  ${kind.padEnd(18)} ${Math.round(bytes / 1000)} kB  ← ${from}`);
    if (result.removed.length) console.log(`Removed the previous menus:\n${result.removed.map(path => `  ${path}`).join('\n')}`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
