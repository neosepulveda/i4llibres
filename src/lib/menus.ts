// Menjadors Biosca sends a picture of each menu every month. The first three are for every
// family; the rest are adapted menus, and a family needs one of them at most.
export const menuKinds = [
  'basal', 'fitxa', 'sopars',
  'sense-gluten', 'sense-lactosa', 'sense-plv', 'sense-cacauet', 'sense-nous', 'sense-soja',
  'sense-peix', 'sense-carn', 'sense-porc', 'sense-integral', 'vegetaria', 'ovolactovegetaria',
] as const;
export type MenuKind = typeof menuKinds[number];
const forEveryFamily: readonly MenuKind[] = ['basal', 'fitxa', 'sopars'];

export interface MenuMonth { month: string; main: MenuPicture[]; adapted: MenuPicture[] }
export interface MenuPicture { kind: MenuKind; src: string }

/** The newest month of menus, split into the ones for everyone and the adapted ones. */
export function latestMenus(entries: { data: { month: string; menus: MenuKind[] } }[]): MenuMonth | undefined {
  const [latest] = [...entries].sort((a, b) => b.data.month.localeCompare(a.data.month));
  if (!latest) return undefined;
  const { month, menus } = latest.data;
  // The pictures keep predictable names, so each month lists only which menus arrived.
  const pictures = menus.map(kind => ({ kind, src: `/downloads/menjador-${kind}-${month}.jpg` }));
  return { month, main: pictures.filter(({ kind }) => forEveryFamily.includes(kind)), adapted: pictures.filter(({ kind }) => !forEveryFamily.includes(kind)) };
}
