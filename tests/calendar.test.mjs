import { test } from 'node:test';
import assert from 'node:assert/strict';
import { googleCalendarUrl, calendarFile, calendarPath, eventTimeLabel } from '../src/lib/calendar.ts';
const event={start:'2026-10-05T17:00:00+02:00',end:'2026-10-05T18:00:00+02:00',location:'Escola, menjador; Barcelona',description:'Reunió amb famílies\nhttps://forms.gle/test'};
test('Google Calendar preserves the authorised hour and event information',()=>{
 const url=new URL(googleCalendarUrl('Reunió & famílies',event));
 assert.equal(url.searchParams.get('dates'),'20261005T150000Z/20261005T160000Z');
 assert.equal(url.searchParams.get('ctz'),'Europe/Madrid');assert.equal(url.searchParams.get('text'),'Reunió & famílies');
 assert.equal(url.searchParams.get('details'),event.description);
});
test('ICS uses UTC, escapes text, folds UTF-8 safely and has a stable UID',()=>{
 const file=calendarFile('reunio','Reunió '.repeat(25),event,new Date('2026-09-26T00:00:00Z'));
 assert.match(file,/DTSTART:20261005T150000Z\r\nDTEND:20261005T160000Z/);
 assert.match(file,/LOCATION:Escola\\, menjador\\; Barcelona/);
 assert.ok(file.includes('famílies\\nhttps://forms.gle/test'));
 for(const line of file.split('\r\n'))assert.ok(Buffer.byteLength(line)<=75);
 assert.ok(file.replace(/\r\n /g,'').includes('SUMMARY:'+'Reunió '.repeat(25)));
 assert.equal(file.match(/UID:(.*)/)[1],calendarFile('reunio','Updated',event).match(/UID:(.*)/)[1]);
 const winter=new URL(googleCalendarUrl('Hivern',{...event,start:'2026-12-05T17:00:00+01:00',end:'2026-12-05T18:00:00+01:00'}));
 assert.equal(winter.searchParams.get('dates'),'20261205T160000Z/20261205T170000Z');
 assert.equal(calendarPath('/school-noticeboard/','reunio'),'/school-noticeboard/calendar/reunio.ics');
});

test('all-day exports use date values and an exclusive end, without timezone shifts',()=>{
 const holiday={allDay:true,title:'No hi ha escola',start:'2026-10-12',end:'2026-10-13',location:'Escola',description:'Festiu'};
 const file=calendarFile('festiu','Notice headline',holiday);
 assert.match(file,/DTSTART;VALUE=DATE:20261012\r\nDTEND;VALUE=DATE:20261013/);
 assert.match(file,/SUMMARY:No hi ha escola/);
 const url=new URL(googleCalendarUrl('Notice headline',holiday));
 assert.equal(url.searchParams.get('dates'),'20261012/20261013');
 assert.equal(url.searchParams.get('text'),'No hi ha escola');
});

test('translated time labels use Barcelona time without mixing AM/PM and hour suffixes',()=>{
 assert.equal(eventTimeLabel(event,'en'),'17:00–18:00');
 assert.equal(eventTimeLabel({...event,allDay:true},'es'),'Todo el día');
});
