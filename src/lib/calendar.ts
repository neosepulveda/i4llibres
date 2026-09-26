import { createHash } from 'node:crypto';

export interface CalendarEvent {
  title?: string;
  allDay?: boolean;
  start: string;
  end: string;
  location: string;
  description: string;
}
const stamp = (value: string | Date) => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const escapeText = (text: string) => text.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
// RFC 5545 lines are limited to 75 octets, without splitting UTF-8 characters.
function fold(line: string) {
  const lines: string[] = [];
  let current = '';
  for (const character of line) {
    if (Buffer.byteLength(current + character, 'utf8') > 75) { lines.push(current); current = ' '; }
    current += character;
  }
  lines.push(current);
  return lines.join('\r\n');
}
export function googleCalendarUrl(title: string, event: CalendarEvent) {
  const date = (value: string) => event.allDay ? value.replace(/-/g, '') : stamp(value);
  const query = new URLSearchParams({ action:'TEMPLATE', text:event.title || title, dates:`${date(event.start)}/${date(event.end)}`, ctz:'Europe/Madrid', location:event.location, details:event.description });
  return `https://calendar.google.com/calendar/render?${query}`;
}
export function calendarFile(id: string, title: string, event: CalendarEvent, generatedAt = new Date()) {
  const uid = createHash('sha256').update(`els-llibres:${id}`).digest('hex') + '@els-llibres';
  const date = (key: string, value: string) => event.allDay ? `${key};VALUE=DATE:${value.replace(/-/g, '')}` : `${key}:${stamp(value)}`;
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Els Llibres//Tauler I4B//CA', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${stamp(generatedAt)}`, date('DTSTART', event.start), date('DTEND', event.end),
    `SUMMARY:${escapeText(event.title || title)}`, `LOCATION:${escapeText(event.location)}`, `DESCRIPTION:${escapeText(event.description)}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].map(fold).join('\r\n') + '\r\n';
}
export function calendarPath(base: string, id: string) {
  return `${base.replace(/\/$/, '')}/calendar/${id.split('/').map(encodeURIComponent).join('/')}.ics`;
}
export function eventTimeLabel(event: CalendarEvent) {
  if (event.allDay) return 'Tot el dia';
  const format = new Intl.DateTimeFormat('ca-ES', { hour:'2-digit', minute:'2-digit', timeZone:'Europe/Madrid' });
  return `${format.format(new Date(event.start))}–${format.format(new Date(event.end))} h`;
}
