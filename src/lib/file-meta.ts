import { statSync } from 'node:fs';
import type { Language } from './i18n';

// Families on mobile data see the type and size before they tap. Decimal units, as phones show them.
export function fileMeta(src: string, language: Language) {
  const bytes = statSync(`public${src}`).size;
  const [unit, value, digits] = bytes < 1e6 ? ['kilobyte', bytes / 1e3, 0] : ['megabyte', bytes / 1e6, 1];
  return `${src.split('.').pop()!.toUpperCase()} · ${new Intl.NumberFormat(language, { style:'unit', unit, maximumFractionDigits:digits }).format(value)}`;
}
