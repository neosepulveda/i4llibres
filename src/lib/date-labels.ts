import { eventTimeLabel, type CalendarEvent } from './calendar.ts';
import { messages, type Language } from './i18n.ts';

// Date-only values are read at midday so the day never shifts. British English puts the day
// before the month, as Catalan and Spanish do.
function format(value: string, language: Language, options: Intl.DateTimeFormatOptions) {
  const when = new Date(value.length === 10 ? value + 'T12:00:00Z' : value);
  return new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : language, { ...options, timeZone:'Europe/Madrid' }).format(when);
}
const trimDot = (text: string) => text.replace(/\.$/, '');
const clock = (event: CalendarEvent, language: Language) => `${format(event.start, language, { hour:'2-digit', minute:'2-digit', hourCycle:'h23' })}${language === 'en' ? '' : ' h'}`;
const weekday = (value: string, language: Language) => format(value, language, { weekday:'long' });
// An all-day event ends the day after its last: one over 7 and 8 December ends on the 9th.
// Returns its last day when it runs over more than one, so its labels can name both.
export function lastDay(event: CalendarEvent) {
  if (!event.allDay) return undefined;
  const last = new Date(Date.parse(event.end) - 864e5).toISOString().slice(0, 10);
  return last > event.start ? last : undefined;
}
const sameMonth = (a: string, b: string) => a.slice(0, 7) === b.slice(0, 7);

/** The top and body of a calendar leaf: "OCT" and "5". */
export function leaf(event: CalendarEvent, language: Language) {
  return { month: trimDot(format(event.start, language, { month:'short' })).toLocaleUpperCase(language), day: format(event.start, language, { day:'numeric' }) };
}
/** "5 d’octubre": the full date for screen readers, since the leaf is decorative. */
export const fullDate = (value: string, language: Language) => format(value, language, { day:'numeric', month:'long' });
/** "dilluns, 17:00–18:00 h": the line under a date's title, which never repeats the date. Two days
 * read as a pair, "dilluns i dimarts", and a longer run as a span, "divendres – dilluns". */
export function dayAndTime(event: CalendarEvent, language: Language) {
  const time = event.allDay ? messages[language].allDay.toLowerCase() : eventTimeLabel(event, language);
  const last = lastDay(event);
  const days = !last ? weekday(event.start, language)
    : Date.parse(last) - Date.parse(event.start) === 864e5 ? new Intl.ListFormat(language, { type:'conjunction' }).format([weekday(event.start, language), weekday(last, language)])
    : `${weekday(event.start, language)} – ${weekday(last, language)}`;
  return `${days}, ${time}`;
}
/** "dl 5 oct, 17:00 h": the stamp on a notice card; "dl 7 – dt 8 des" over two days. */
export function stampLabel(event: CalendarEvent, language: Language) {
  const time = event.allDay ? messages[language].allDay.toLowerCase() : clock(event, language);
  const day = (value: string, month: boolean) => `${trimDot(format(value, language, { weekday:'short' }))} ${format(value, language, { day:'numeric' })}${month ? ' ' + trimDot(format(value, language, { month:'short' })) : ''}`;
  const last = lastDay(event);
  return `${last ? `${day(event.start, !sameMonth(event.start, last))} – ${day(last, true)}` : day(event.start, true)}, ${time}`;
}
/** "2 d’oct": the stamp for a notice with a date but no event. */
export const shortDate = (value: string, language: Language) => trimDot(format(value, language, { day:'numeric', month:'short' }));
/** "Menús d’octubre", "Menús de setembre i d’octubre", "September and October menus": the link to the menus. */
export function menusLabel(months: string[], language: Language) {
  // A full date lends Catalan and Spanish their preposition: "15 d’octubre" gives "d’octubre".
  const names = [...months].sort().map(month => language === 'en' ? format(`${month}-15`, language, { month:'long' }) : format(`${month}-15`, language, { day:'numeric', month:'long' }).replace(/^15\s/, ''));
  return messages[language].menus.replace('{month}', new Intl.ListFormat(language, { type:'conjunction' }).format(names));
}
/** "Setembre", "Septiembre", "September": the month printed on the menus pocket. */
export function monthName(month: string, language: Language) {
  const name = format(`${month}-15`, language, { month:'long' });
  return name[0].toLocaleUpperCase(language) + name.slice(1);
}
/** "Tot el dia, dimarts 20 d’octubre" or "17:00–18:00 h, hora de Barcelona": below the calendar buttons. */
export function ticketLabel(event: CalendarEvent, language: Language) {
  const t = messages[language];
  if (!event.allDay) return `${eventTimeLabel(event, language)}, ${t.barcelona}`;
  const last = lastDay(event);
  if (!last) return `${t.allDay}, ${weekday(event.start, language)} ${fullDate(event.start, language)}`;
  const first = sameMonth(event.start, last) ? format(event.start, language, { day:'numeric' }) : fullDate(event.start, language);
  return `${t.allDay}, ${weekday(event.start, language)} ${first} – ${weekday(last, language)} ${fullDate(last, language)}`;
}
