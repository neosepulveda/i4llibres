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

/** The top and body of a calendar leaf: "OCT" and "5". */
export function leaf(event: CalendarEvent, language: Language) {
  return { month: trimDot(format(event.start, language, { month:'short' })).toLocaleUpperCase(language), day: format(event.start, language, { day:'numeric' }) };
}
/** "5 d’octubre": the full date for screen readers, since the leaf is decorative. */
export const fullDate = (value: string, language: Language) => format(value, language, { day:'numeric', month:'long' });
/** "dilluns, 17:00–18:00 h": the line under a date's title, which never repeats the date. */
export function dayAndTime(event: CalendarEvent, language: Language) {
  const time = event.allDay ? messages[language].allDay.toLowerCase() : eventTimeLabel(event, language);
  return `${format(event.start, language, { weekday:'long' })}, ${time}`;
}
/** "dl 5 oct, 17:00 h": the stamp on a notice card. */
export function stampLabel(event: CalendarEvent, language: Language) {
  const time = event.allDay ? messages[language].allDay.toLowerCase() : clock(event, language);
  return `${trimDot(format(event.start, language, { weekday:'short' }))} ${format(event.start, language, { day:'numeric' })} ${trimDot(format(event.start, language, { month:'short' }))}, ${time}`;
}
/** "2 d’oct": the stamp for a notice with a date but no event. */
export const shortDate = (value: string, language: Language) => trimDot(format(value, language, { day:'numeric', month:'short' }));
/** "Menús de setembre", "Menús d’octubre", "September menus": the link to a month's menus. */
export function menusLabel(month: string, language: Language) {
  const middle = `${month}-15`;
  // A full date lends Catalan and Spanish their preposition: "15 d’octubre" gives "d’octubre".
  const name = language === 'en' ? format(middle, language, { month:'long' }) : format(middle, language, { day:'numeric', month:'long' }).replace(/^15\s/, '');
  return messages[language].menus.replace('{month}', name);
}
/** "Setembre", "Septiembre", "September": the month printed on the menus pocket. */
export function monthName(month: string, language: Language) {
  const name = format(`${month}-15`, language, { month:'long' });
  return name[0].toLocaleUpperCase(language) + name.slice(1);
}
/** "Tot el dia, dimarts 20 d’octubre" or "17:00–18:00 h, hora de Barcelona": below the calendar buttons. */
export function ticketLabel(event: CalendarEvent, language: Language) {
  const t = messages[language];
  return event.allDay ? `${t.allDay}, ${format(event.start, language, { weekday:'long' })} ${fullDate(event.start, language)}` : `${eventTimeLabel(event, language)}, ${t.barcelona}`;
}
