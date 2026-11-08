import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leaf, fullDate, dayAndTime, stampLabel, shortDate, ticketLabel, menusLabel, monthName } from '../src/lib/date-labels.ts';
const meeting={start:'2026-10-05T17:00:00+02:00',end:'2026-10-05T18:00:00+02:00',location:'Menjador',description:'Reunió'};
const holiday={allDay:true,start:'2026-10-12',end:'2026-10-13',location:'Escola',description:'Festiu'};

test('calendar leaves show only the month and the day, in every language',()=>{
 assert.deepEqual(leaf(meeting,'ca'),{month:'OCT',day:'5'});
 assert.deepEqual(leaf({...holiday,start:'2026-09-15'},'es'),{month:'SEPT',day:'15'});
 assert.deepEqual(leaf({...holiday,start:'2026-05-04'},'ca'),{month:'MAIG',day:'4'});
 assert.deepEqual(leaf({...holiday,start:'2026-12-07'},'en'),{month:'DEC',day:'7'});
});

test('the line under a date gives the weekday and time without repeating the date',()=>{
 assert.equal(dayAndTime(meeting,'ca'),'dilluns, 17:00–18:00 h');
 assert.equal(dayAndTime(holiday,'es'),'lunes, todo el día');
 assert.equal(dayAndTime(holiday,'en'),'Monday, all day');
 assert.equal(fullDate(meeting.start,'ca'),'5 d’octubre');
 assert.equal(fullDate(holiday.start,'en'),'12 October');
});

test('card stamps and calendar notes read naturally in each language',()=>{
 assert.equal(stampLabel(meeting,'ca'),'dl 5 oct, 17:00 h');
 assert.equal(stampLabel(holiday,'ca'),'dl 12 oct, tot el dia');
 assert.equal(stampLabel(meeting,'en'),'Mon 5 Oct, 17:00');
 assert.equal(shortDate('2026-10-02','es'),'2 oct');
 assert.equal(ticketLabel(meeting,'ca'),'17:00–18:00 h, hora de Barcelona');
 assert.equal(ticketLabel({...holiday,start:'2026-10-20',end:'2026-10-21'},'ca'),'Tot el dia, dimarts 20 d’octubre');
 assert.equal(ticketLabel(holiday,'en'),'All day, Monday 12 October');
});

// The end of an all-day event is the day after its last, so 7 and 8 December end on the 9th.
test('an all-day event over several days names its first and last day',()=>{
 const closure={allDay:true,start:'2026-12-07',end:'2026-12-09',location:'Escola',description:'Sense escola'};
 assert.equal(dayAndTime(closure,'ca'),'dilluns i dimarts, tot el dia');
 assert.equal(dayAndTime(closure,'es'),'lunes y martes, todo el día');
 assert.equal(dayAndTime(closure,'en'),'Monday and Tuesday, all day');
 assert.equal(stampLabel(closure,'ca'),'dl 7 – dt 8 des, tot el dia');
 assert.equal(stampLabel(closure,'es'),'lun 7 – mar 8 dic, todo el día');
 assert.equal(stampLabel(closure,'en'),'Mon 7 – Tue 8 Dec, all day');
 assert.equal(ticketLabel(closure,'ca'),'Tot el dia, dilluns 7 – dimarts 8 de desembre');
 assert.equal(ticketLabel(closure,'es'),'Todo el día, lunes 7 – martes 8 de diciembre');
 assert.equal(ticketLabel(closure,'en'),'All day, Monday 7 – Tuesday 8 December');
 // A longer run is a span, and across the end of a month each day keeps its month.
 const bridge={...closure,start:'2026-10-30',end:'2026-11-03'};
 assert.equal(dayAndTime(bridge,'ca'),'divendres – dilluns, tot el dia');
 assert.equal(stampLabel(bridge,'en'),'Fri 30 Oct – Mon 2 Nov, all day');
 assert.equal(ticketLabel(bridge,'es'),'Todo el día, viernes 30 de octubre – lunes 2 de noviembre');
});

test('the menus link names its months with the right preposition, and the pocket prints the month',()=>{
 assert.equal(menusLabel(['2026-09'],'ca'),'Menús de setembre');
 assert.equal(menusLabel(['2026-10'],'ca'),'Menús d’octubre');
 assert.equal(menusLabel(['2027-04'],'es'),'Menús de abril');
 assert.equal(menusLabel(['2026-10'],'en'),'October menus');
 // While two months show, the older one comes first, however they are passed.
 assert.equal(menusLabel(['2026-10','2026-09'],'ca'),'Menús de setembre i d’octubre');
 assert.equal(menusLabel(['2026-10','2026-09'],'es'),'Menús de septiembre y de octubre');
 assert.equal(menusLabel(['2026-10','2026-09'],'en'),'September and October menus');
 assert.equal(monthName('2026-09','ca'),'Setembre');
 assert.equal(monthName('2026-09','es'),'Septiembre');
 assert.equal(monthName('2027-01','en'),'January');
});

test('Barcelona dates hold across the daylight-saving change',()=>{
 assert.deepEqual(leaf({...meeting,start:'2026-10-25T00:30:00+02:00',end:'2026-10-25T01:30:00+02:00'},'ca'),{month:'OCT',day:'25'});
 assert.equal(dayAndTime({...meeting,start:'2026-11-02T17:00:00+01:00',end:'2026-11-02T18:00:00+01:00'},'ca'),'dilluns, 17:00–18:00 h');
});
