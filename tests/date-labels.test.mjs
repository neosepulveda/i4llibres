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
