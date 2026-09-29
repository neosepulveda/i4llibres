import type { Language } from './i18n.ts';

// Menjadors Biosca sends the menus every month. These are for every family. The adapted menus
// for allergies and diets change from month to month, so each month's list names its own, and a
// family needs one of them at most.
export const menuKinds = ['basal', 'fitxa', 'sopars', 'receptes'] as const;
export type MenuKind = typeof menuKinds[number];

// The lunchtime service's contacts and prices hold for the school year, so they stay in the
// pocket while the months come and go.
export const lunchtimeInfo = '/downloads/menjador-informacions-espai-migdia-2026-2027.jpg';

export interface MenuList { month: string; menus: MenuKind[]; adapted: ({ id: string } & Record<Language, string>)[] }
export interface MenuMonth { month: string; main: MenuFile[]; adapted: AdaptedMenu[] }
export interface MenuFile { kind: MenuKind; src: string }
export interface AdaptedMenu { id: string; name: Record<Language, string>; src: string }

/** The months in the pocket, newest first. `downloads` are the file names in public/downloads. */
export function menuMonths(entries: { data: MenuList }[], downloads: string[]): MenuMonth[] {
  return entries.map(({ data }) => data).sort((a, b) => b.month.localeCompare(a.month)).map(({ month, menus, adapted }) => {
    // Files keep predictable names, so a list says only which menus arrived. Most are pictures;
    // a sheet of several pages stays a PDF.
    const src = (name: string) => {
      const file = ['jpg', 'pdf'].map(type => `menjador-${name}-${month}.${type}`).find(file => downloads.includes(file));
      if (!file) throw new Error(`The ${month} list names ${name}, but public/downloads has no menjador-${name}-${month}.jpg or .pdf`);
      return `/downloads/${file}`;
    };
    return { month, main: menus.map(kind => ({ kind, src: src(kind) })), adapted: adapted.map(({ id, ...name }) => ({ id, name, src: src(id) })) };
  });
}
