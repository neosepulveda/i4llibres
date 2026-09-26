import { createHash } from 'node:crypto';

export interface CalendarEvent {
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
  const query = new URLSearchParams({ action:'TEMPLATE', text:title, dates:`${stamp(event.start)}/${stamp(event.end)}`, ctz:'Europe/Madrid', location:event.location, details:event.description });
  return `https://calendar.google.com/calendar/render?${query}`;
}
export function calendarFile(id: string, title: string, event: CalendarEvent, generatedAt = new Date()) {
  const uid = createHash('sha256').update(`els-llibres:${id}`).digest('hex') + '@els-llibres';
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Els Llibres//Tauler I4B//CA', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${stamp(generatedAt)}`, `DTSTART:${stamp(event.start)}`, `DTEND:${stamp(event.end)}`,
    `SUMMARY:${escapeText(title)}`, `LOCATION:${escapeText(event.location)}`, `DESCRIPTION:${escapeText(event.description)}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].map(fold).join('\r\n') + '\r\n';
}
export function calendarPath(base: string, id: string) {
  return `${base.replace(/\/$/, '')}/calendar/${id.split('/').map(encodeURIComponent).join('/')}.ics`;
}
