import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {menusLabel,monthName} from '../src/lib/date-labels.ts';
import {messages} from '../src/lib/i18n.ts';
import {season} from '../src/lib/season.ts';
test('production HTML excludes fixtures and renders the empty state when there are no notices',()=>{
  const html=readFileSync('dist/index.html','utf8');
  if (readdirSync('src/content/notices',{recursive:true}).filter(p=>p.endsWith('.md')).length===0) assert.match(html,/Encara no hi ha cap avís/);
  assert.doesNotMatch(html,/Avís de classe de prova|Avís d’escola de prova|Hola, octubre|Propostes de disseny|Contingut d’exemple/);
  assert.match(html,/<html lang="ca"/);
  assert.doesNotMatch(html,/data-filter="calendari"|class="notice calendari"/);
  assert.match(html,/class="notice escola" id="avis-proxim-dia-sense-escola"/);
});

test('published HTML tells search engines not to index or follow links',()=>{
  assert.match(readFileSync('dist/index.html','utf8'), /<meta name="robots" content="noindex, nofollow"/);
});

test('category filters and notice cards use identical labels in every language',()=>{
 for(const path of ['', 'es/', 'en/']){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  const filters=new Map(Array.from(html.matchAll(/<button data-filter="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g),
   ([,category,content])=>[category,content.replace(/<[^>]+>/g,'').trim()]));
  const cards=Array.from(html.matchAll(/<article[^>]+data-category="([^"]+)"[\s\S]*?<span class="tag">([^<]+)<\/span>/g));
  assert.ok(cards.length>0);
  for(const [,category,label] of cards) assert.equal(label,filters.get(category),`${path}${category}`);
 }
});

test('all published languages include translated notices and calendar exports',()=>{
 for(const [language,title,summary] of [['es','El tablón de I4B','Comedor: plan de funcionamiento, contacto y precios'],['en','The I4B noticeboard','School meals: service plan, contacts and prices']]){
  const html=readFileSync(`dist/${language}/index.html`,'utf8');
  assert.ok(html.includes(`<html lang="${language}"`));
  assert.ok(html.includes(title));
  assert.ok(html.includes(summary));
  assert.doesNotMatch(html,/La presentació de la reunió|Materials per als espais|Què fem cada dia/);
  assert.match(html,/<meta name="robots" content="noindex, nofollow"/);
  assert.ok(existsSync(`dist/${language}/calendar/extraescolars-afa.ics`));
 }
});

test('AFA notice highlights the next cancellation deadline and retains the monthly application window in every language',()=>{
 for(const [path,opening,window] of [
  ['','baixes de desembre fins al 20 de novembre','de l’1 al 20 de cada mes'],
  ['es/','bajas de diciembre hasta el 20 de noviembre','del 1 al 20 de cada mes'],
  ['en/','cancel for December by 20 November','from the 1st to the 20th of every month'],
 ]){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  assert.match(html,/data-filter="afa"[^>]*>.*?AFA<span class="filter-count"/);
  const card=html.match(/<article class="notice afa" id="avis-extraescolars-afa"[\s\S]*?<\/article>/)?.[0];
  assert.ok(card,'AFA notice has its own category');
  assert.ok(card.includes(opening));
  assert.ok(card.includes(window));
 }
});

test('AFA calendar exports mark only the final day to cancel activities for the following month',()=>{
 for(const [path,title] of [
  ['', 'Últim dia per donar de baixa extraescolars de desembre'],
  ['es/', 'Último día para dar de baja extraescolares de diciembre'],
  ['en/', 'Last day to cancel December extracurricular activities'],
 ]){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  assert.match(html,/<a class="upcoming-event afa" href="#avis-extraescolars-afa" data-end="2026-11-21"/);
  const ics=readFileSync(`dist/${path}calendar/extraescolars-afa.ics`,'utf8');
  assert.match(ics,/DTSTART;VALUE=DATE:20261120/);
  assert.match(ics,/DTEND;VALUE=DATE:20261121/);
  assert.ok(ics.replace(/\r\n /g,'').includes('SUMMARY:'+title));
  const card=html.match(/<article class="notice afa" id="avis-extraescolars-afa"[\s\S]*?<\/article>/)?.[0];
  const google=card.match(/href="(https:\/\/calendar\.google\.com[^\"]+)"/)[1];
  const params=new URL(google.replaceAll('&amp;','&')).searchParams;
  assert.equal(params.get('dates'),'20261120/20261121');
  assert.equal(params.get('text'),title);
  assert.ok(params.get('details').includes('23:55'));
 }
});

test('AFA instructions include the exact deadline, payment requirement and application link',()=>{
 for(const [path,payment] of [['','cal estar al corrent de pagament dels rebuts'],['es/','hay que estar al corriente del pago de los recibos'],['en/','all payments must be up to date']]){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  const card=html.match(/<article class="notice afa" id="avis-extraescolars-afa"[\s\S]*?<\/article>/)?.[0];
  assert.ok(card?.includes('23:55'));
  assert.ok(card.includes(payment));
  assert.match(card,/<a href="https:\/\/ampalamarbella\.ampasoft\.net\/" target="_blank" rel="noopener noreferrer">/);
  assert.match(card,/<a href="https:\/\/afalamarbella\.cat\/extraescolars\/" target="_blank" rel="noopener noreferrer">/);
  assert.ok(card.includes('Realitzar preinscripció'));
  assert.ok(card.includes('Demanar baixa'));
  const ics=readFileSync(`dist/${path}calendar/extraescolars-afa.ics`,'utf8').replace(/\r\n /g,'');
  assert.ok(ics.includes('23:55'));
  assert.ok(ics.includes('https://ampalamarbella.ampasoft.net/'));
 }
});

test('the first page of the book lists the dates, under a cloth cover with the school',()=>{
 for(const [path,title,cover]of[['','Properes dates','I4B, curs 2026–27'],['es/','Próximas fechas','I4B, curso 2026–27'],['en/','Upcoming dates','I4B, school year 2026–27']]){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  const book=html.match(/<section class="opening"[\s\S]*?<\/section>/)?.[0];
  assert.ok(book,'the book opens the page');
  assert.ok(book.includes(`<h2 id="upcoming-title">${title}</h2>`));
  assert.match(book,/<div class="cover" aria-hidden="true">/);
  assert.ok(book.includes(cover));
  // The school comes in layers, so last year's monster can slip behind it and read in a window.
  for(const layer of ['school-back','school-building','school-front','school-children']) assert.match(book,new RegExp(`<use href="#${layer}"`));
  assert.match(book,/<g class="reader"/);
  // Their teacher leads the line on the cover only; notices keep the children on their own.
  assert.match(book,/<g class="teacher"[\s\S]*?<use href="#teacher"/);
  assert.match(book,/<g class="book-wave">/);
  // She holds the first child's hand, so the arm that child keeps free elsewhere reaches for hers.
  assert.match(book,/<use href="#school-children" x="5" width="100" height="90" style="--first-arm-free:none"/);
  assert.match(book,/<path class="reaching"[^>]*stroke:var\(--skin-1\)/);
  assert.match(book,/<a class="school-calendar" href="https:\/\/lamarbella\.cat\/calendari-escolar\/" target="_blank" rel="noopener noreferrer">/);
  assert.ok(html.indexOf('class="opening"')<html.indexOf('id="avisos"'));
 }
});

test('every child in the line has two arms, reaching halfway to join hands',()=>{
 const html=readFileSync('dist/index.html','utf8');
 const children=html.match(/<symbol id="school-children"[\s\S]*?<\/symbol>/)?.[0];
 assert.ok(children,'the children are a layer of their own');
 const arms=Array.from(children.matchAll(/<path d="M([\d.]+) ([\d.]+)Q[\d.]+ [\d.]+ ([\d.]+) ([\d.]+)" style="stroke:var\(--skin-(\d)\)[^"]*"/g),([,fromX,,toX,toY,skin])=>({fromX:+fromX,toX:+toX,toY:+toY,skin:+skin}));
 for(const skin of [1,2,3,4,5]) assert.equal(arms.filter(arm=>arm.skin===skin).length,2,`child ${skin} has two arms`);
 // Between neighbours, each child's arm ends where the other's does, in the middle of the gap.
 for(const skin of [1,2,3,4]){
  const right=arms.find(arm=>arm.skin===skin&&arm.toX>arm.fromX&&arm.toY<11.5), left=arms.find(arm=>arm.skin===skin+1&&arm.toX<arm.fromX&&arm.toY<11.5);
  assert.ok(right&&left,`children ${skin} and ${skin+1} hold hands`);
  assert.ok(Math.abs(right.toX-left.toX)<.5&&Math.abs(right.toY-left.toY)<.5,`children ${skin} and ${skin+1} meet in the middle`);
 }
});

// The board runs from what families have to do, nearest first, to reference and voluntary notices.
// This follows the notices on the board today: re-sort it, and this list, when one arrives or goes.
test('the notices run from what to do next to what is voluntary',()=>{
 const order=['psicomotricitat-comenca','extraescolars-afa','vaga-educacio','proxim-dia-sense-escola','voluntaris-nadal-afa','acollida-desembre','festes-afa-sant-jordi','reunio-families-inscripcions','horari-llibres','reunio-menjador','club-catala-voluntaris','materials-infantil'];
 for(const path of ['','es/','en/']){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  assert.deepEqual(Array.from(html.matchAll(/<article class="notice [a-z]+" id="avis-([a-z0-9-]+)"/g),([,id])=>id),order,path);
 }
});

test('every published notice opens with its own pop-up scene',()=>{
 const html=readFileSync('dist/index.html','utf8');
 const cards=Array.from(html.matchAll(/<article class="notice[\s\S]*?<\/article>/g),([card])=>card);
 assert.ok(cards.length>0);
 for(const card of cards) assert.match(card,/<div class="notice-scene paper"><div class="popup" aria-hidden="true">/);
});

test('the notices that ended in October leave the board with their dates, calendar files and pictures',()=>{
 for(const path of ['','es/','en/']){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  for(const id of ['assemblea-afa','festa-castanyada','creacions-tardor','activitats-migdia-octubre','roba-recanvi']){
   assert.doesNotMatch(html,new RegExp(`id="avis-${id}"|href="#avis-${id}"`),`${path}${id}`);
   assert.equal(existsSync(`dist/${path}calendar/${id}.ics`),false,`${path}${id}`);
  }
  // The month's lunchtime programme is a card in the pocket only, with the month's menus.
  assert.match(html.match(/<section class="back-endpaper" id="menus"[\s\S]*?<\/section>/)[0],/<a class="menu-card" href="\/downloads\/menjador-activitats-2026-11\.jpg"/,path);
 }
 for(const image of ['castanyada-cartell-2026','castanyada-preus-bar-2026']) assert.equal(existsSync(`dist/downloads/${image}.jpg`),false,image);
});

test('the Cros de Sant Martí, the Punt Verd Mòbil and the general strike leave the board after their days, taking their dates and calendar files with them',()=>{
 for(const path of ['','es/','en/']){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  for(const id of ['cros-sant-marti','punt-verd-mobil','vaga-general']){
   assert.doesNotMatch(html,new RegExp(`id="avis-${id}"|href="#avis-${id}"`),`${path}${id}`);
   assert.equal(existsSync(`dist/${path}calendar/${id}.ics`),false,`${path}${id}`);
  }
 }
});

test('December childcare names Biosca and the announced hours without inventing prices, booking links or calendar exports',()=>{
 for(const [path,title,hours,unknown] of [
  ['','Acollida del 21 de desembre: la gestionarà Biosca','15.30 a 16.30 h','no indica preus ni com reservar plaça'],
  ['es/','Acogida del 21 de diciembre: la gestionará Biosca','15:30 a 16:30 h','no indica precios ni cómo reservar plaza'],
  ['en/','Childcare on 21 December: Biosca will manage the service','15:30 to 16:30','does not give prices or booking instructions'],
 ]){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  const card=html.match(/<article class="notice afa" id="avis-acollida-desembre"[\s\S]*?<\/article>/)?.[0];
  assert.ok(card?.includes(title),path);
  assert.match(card,/<time datetime="2026-12-21">/);
  assert.ok(card.includes(hours),path);
  assert.ok(card.includes(unknown),path);
  assert.ok(card.includes('JORNADA INTENSIVA 21/12/26'),path);
  assert.match(card,/<div class="popup" aria-hidden="true">/);
  assert.doesNotMatch(card,/calendar-actions|forms\.gle|mailto:|mail\.google/);
  assert.doesNotMatch(html,/<a class="upcoming-event[^>]*href="#avis-acollida-desembre"/);
  assert.equal(existsSync(`dist/${path}calendar/acollida-desembre.ics`),false,path);
 }
});

test('the expired school meals meeting becomes a service reference, preserving its shared link and both downloads without obsolete calendar or childcare actions',()=>{
 for(const [path,title,meta,summary] of [
  ['','Pla de funcionament del temps de migdia 2026–27','PDF · 15,2 MB','Menjador: pla de funcionament, contacte i preus'],
  ['es/','Plan de funcionamiento del mediodía 2026–27 (en catalán)','PDF · 15,2 MB','Comedor: plan de funcionamiento, contacto y precios'],
  ['en/','Lunchtime service plan 2026–27 (in Catalan)','PDF · 15.2 MB','School meals: service plan, contacts and prices'],
 ]){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  const card=html.match(/<article class="notice menjador" id="avis-reunio-menjador"[\s\S]*?<\/article>/)?.[0];
  assert.ok(card);
  assert.ok(card.includes(summary),path);
  assert.doesNotMatch(html,/<a class="upcoming-event[^>]*href="#avis-reunio-menjador"/);
  assert.doesNotMatch(card,/class="stamp"|calendar-actions|forms\.gle|2026-10-14/);
  assert.equal(existsSync(`dist/${path}calendar/reunio-menjador.ics`),false,path);
  assert.ok(card.includes('/downloads/menjador-informacions-espai-migdia-2026-2027.jpg'),path);
  const row=card.match(/<a class="tab file-row" href="\/downloads\/menjador-pla-funcionament-2026-2027\.pdf" download>[\s\S]*?<\/a>/)?.[0];
  assert.ok(row,path);
  assert.ok(row.includes(title),path);
  assert.ok(row.includes(meta),path);
  assert.ok(card.indexOf('<details class="tab">')<card.indexOf(row));
 }
});

// Sandra's emails of 12 and 16 November: the strike on the 26th moved the open session to 3 December,
// and on 19 November the Llibres meet in the classroom while the other I4 group has the sports hall.
test('psychomotricity leads with the open session on Thursday 3 December, the classroom on the 19th, and keeps the Thursday instructions',()=>{
 for(const [path,title,confirmed,classroom,noTime,where,socks,leaf,when] of [
  ['','Portes obertes de psicomotricitat: dijous 3 de desembre','seran el <strong>dijous 3 de desembre</strong>','Aquest dijous 19 de novembre, ens trobem a l’aula a les 9 h','El correu no indica l’hora','al pavelló','posar-los els mitjons','Portes obertes de psicomotricitat d’I4B','dijous, 09:00–10:30 h'],
  ['es/','Puertas abiertas de psicomotricidad: jueves 3 de diciembre','serán el <strong>jueves 3 de diciembre</strong>','Este jueves 19 de noviembre, nos encontramos en el aula a las 9 h','El correo no indica la hora','en el pabellón','ponerles los calcetines','Puertas abiertas de psicomotricidad de I4B','jueves, 09:00–10:30'],
  ['en/','Psychomotricity open session: Thursday 3 December','on <strong>Thursday 3 December</strong>','This Thursday, 19 November, we meet in the classroom at 9:00','The email gives no time','at the sports hall','put their socks on','I4B psychomotricity open session','Thursday, 09:00–10:30'],
 ]){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  const card=html.match(/<article class="notice classe" id="avis-psicomotricitat-comenca"[\s\S]*?<\/article>/)?.[0];
  assert.ok(card?.includes(title),path);
  assert.ok(card.includes(confirmed),path);
  assert.ok(card.includes(classroom),path);
  assert.ok(card.includes(noTime),path);
  assert.doesNotMatch(card,/Possiblement|Posiblemente|probably/,path);
  // Sandra's subjects stay as sent, so families can find her emails.
  assert.ok(card.includes('PORTES OBERTES DE PSICOMOTRICITAT'),path);
  assert.ok(card.includes('Cancel·lació de les portes obertes de psicomotricitat'),path);
  assert.ok(card.includes(where),path);
  assert.ok(card.includes(socks),path);
  assert.ok(card.includes('href="#avis-vaga-educacio"'),path);
  assert.ok(card.includes('href="#avis-horari-llibres"'),path);
  // The open session is the date: the usual Thursday session, 9:00 to 10:30 in Barcelona.
  assert.match(card,/<p class="stamp"><time datetime="2026-12-03T09:00:00\+01:00">/);
  const row=html.match(/<a class="upcoming-event classe" href="#avis-psicomotricitat-comenca" data-end="2026-12-03T10:30:00\+01:00"[\s\S]*?<\/a>/)?.[0];
  assert.ok(row?.includes(leaf),path);
  assert.ok(row.includes(when),path);
  const ics=readFileSync(`dist/${path}calendar/psicomotricitat-comenca.ics`,'utf8').replace(/\r\n /g,'');
  assert.match(ics,/DTSTART:20261203T080000Z/);
  assert.match(ics,/DTEND:20261203T093000Z/);
  assert.ok(ics.includes('SUMMARY:'+leaf),path);
  // Its pop-up is the sports hall: wall bars, a beam, and the socks waiting on the bench.
  assert.equal((card.match(/<div class="piece"/g)||[]).length,5,path);
  assert.match(card,/<rect x="6" y="29" width="17.6" height="1.1"/,path);
 }
});

// The strike comes from Sandra's 12 November email; the school itself hasn't written about it yet.
test('the education strike on Thursday 26 November is its own notice, says the school has not written yet, and points to the open session',()=>{
 for(const [path,title,silent,sign,leaf] of [
  ['','Dijous 26 de novembre, vaga al sector de l’educació','L’escola encara no ha enviat cap comunicat','Vaga a l’educació','Vaga del sector de l’educació'],
  ['es/','Jueves 26 de noviembre, huelga en el sector de la educación','La escuela aún no ha enviado ningún comunicado','Huelga educativa','Huelga del sector de la educación'],
  ['en/','Education sector strike on Thursday 26 November','The school has not yet sent any notice','Education strike','Education sector strike'],
 ]){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  const card=html.match(/<article class="notice escola" id="avis-vaga-educacio"[\s\S]*?<\/article>/)?.[0];
  assert.ok(card?.includes(title),path);
  assert.ok(card.includes(silent),path);
  assert.ok(card.includes('Cancel·lació de les portes obertes de psicomotricitat'),path);
  assert.ok(card.includes('href="#avis-psicomotricitat-comenca"'),path);
  assert.match(card,/<p class="stamp"><time datetime="2026-11-26">/);
  assert.ok(html.match(/<a class="upcoming-event escola" href="#avis-vaga-educacio" data-end="2026-11-27"[\s\S]*?<\/a>/)?.[0].includes(leaf),path);
  const ics=readFileSync(`dist/${path}calendar/vaga-educacio.ics`,'utf8').replace(/\r\n /g,'');
  assert.match(ics,/DTSTART;VALUE=DATE:20261126/);
  assert.match(ics,/DTEND;VALUE=DATE:20261127/);
  // The general strike's gate, with the education strike on the school's notice, and the buses running.
  assert.ok(card.includes(`>${sign}</text>`),path);
  assert.ok(card.includes('>4 min</text>'),path);
  assert.doesNotMatch(card,/Vaga general|Huelga general|General strike|-- min/,path);
 }
});

// The AFA's two emails of 16 November: the posters give the dates, but neither says how to sign up.
test('the AFA Christmas volunteers notice gives the charity hot chocolate a one-hour calendar slot and lists the Oncle Buscall dates',()=>{
 for(const [path,title,slot,leaf,when,where,sign] of [
  ['','L’AFA busca voluntaris per Nadal: xocolatada solidària i Oncle Buscall','el cartell no indica l’hora d’acabada','Xocolatada solidària per La Marató','divendres, 16:30–17:30 h','porxo del pavelló','Xocolata'],
  ['es/','La AFA busca voluntarios para Navidad: chocolatada solidaria y Oncle Buscall','el cartel no indica la hora de acabar','Chocolatada solidaria para La Marató','viernes, 16:30–17:30','porche del pabellón','Chocolate'],
  ['en/','The AFA is looking for Christmas volunteers: a charity hot chocolate and Oncle Buscall','the poster does not give an end time','Charity hot chocolate for La Marató','Friday, 16:30–17:30','sports hall porch','Hot chocolate'],
 ]){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  const card=html.match(/<article class="notice afa" id="avis-voluntaris-nadal-afa"[\s\S]*?<\/article>/)?.[0];
  assert.ok(card?.includes(title),path);
  assert.ok(card.includes(where),path);
  for(const school of ['Escola Pere IV','Escola Les Acàcies','Escola Sant Martí']) assert.ok(card.includes(school),`${path}${school}`);
  // The AFA's subjects stay as sent, so families can find the emails and reply.
  assert.ok(card.includes('XOCOLATADA SOLIDÀRIA 18 DE DESEMBRE'),path);
  assert.ok(card.includes('BUSQUEM VOLUNTARIES O VOLUNTARIS PER FER D’ONCLE BUSCALL'),path);
  assert.match(card,/<a href="https:\/\/onclebuscall\.wordpress\.com\/" target="_blank" rel="noopener noreferrer">/);
  assert.doesNotMatch(card,/mailto:|youtube\.com|<img /,path);
  assert.match(card,/<p class="stamp"><time datetime="2026-12-18T16:30:00\+01:00">/);
  const row=html.match(/<a class="upcoming-event afa" href="#avis-voluntaris-nadal-afa" data-end="2026-12-18T17:30:00\+01:00"[\s\S]*?<\/a>/)?.[0];
  assert.ok(row?.includes(leaf),path);
  assert.ok(row.includes(when),path);
  const ics=readFileSync(`dist/${path}calendar/voluntaris-nadal-afa.ics`,'utf8').replace(/\r\n /g,'');
  assert.match(ics,/DTSTART:20261218T153000Z/);
  assert.match(ics,/DTEND:20261218T163000Z/);
  assert.ok(ics.includes(slot),path);
  // Its pop-up is the stall under the sports hall porch, with Oncle Buscall and the Tió arriving.
  assert.equal((card.match(/<div class="piece"/g)||[]).length,5,path);
  assert.match(card,/<ellipse cx="24" cy="13\.6" rx="4\.8" ry="\.7"/,path);
  assert.ok(card.includes(`>${sign}</text>`),path);
 }
});

// The AFA's festivals infographic of 16 November: this year I4 organises Sant Jordi with I3.
test('the AFA festivals notice gives I4 Sant Jordi with I3, asks for a Carnival class representative, and adds no date to the calendar',()=>{
 for(const [path,title,santJordi,carnival] of [
  ['','Festes de l’AFA: a I4 ens toca Sant Jordi, amb I3','Sant Jordi, el 16 d’abril: I3 i I4.','almenys un representant'],
  ['es/','Fiestas de la AFA: a I4 nos toca Sant Jordi, con I3','Sant Jordi, el 16 de abril: I3 e I4.','al menos un representante'],
  ['en/','AFA festivals: I4 organises Sant Jordi, with I3','Sant Jordi, on 16 April: I3 and I4.','at least one representative'],
 ]){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  const card=html.match(/<article class="notice afa" id="avis-festes-afa-sant-jordi"[\s\S]*?<\/article>/)?.[0];
  assert.ok(card?.includes(title),path);
  assert.ok(card.includes(santJordi),path);
  assert.ok(card.includes(carnival),path);
  assert.ok(card.includes('INFORMACIÓ FESTES AFA ESCOLA LA MAR BELLA'),path);
  assert.ok(card.includes('<a href="mailto:festes.lamarbellaampa@gmail.com">'),path);
  // The infographic has photos of children, so it stays off this public page.
  assert.doesNotMatch(card,/FESTES LA MAR BELLA|\.pdf"|class="stamp"|calendar-actions/,path);
  // Its pop-up is a puppet theatre with the saint's name over the stage, books and roses beside it.
  assert.equal((card.match(/<div class="piece"/g)||[]).length,5,path);
  assert.match(card,/<rect x="10\.6" y="5\.2" width="24\.8" height="5\.2"/,path);
  assert.ok(card.includes('>Sant Jordi</text>'),path);
  assert.doesNotMatch(html,/<a class="upcoming-event[^>]*href="#avis-festes-afa-sant-jordi"/);
  assert.equal(existsSync(`dist/${path}calendar/festes-afa-sant-jordi.ics`),false,path);
 }
});

// The volunteers' WhatsApp invite and its QR code stay off this public page: anyone could join.
test('the Club de Català notice sends families to the class group for the invite and publishes no WhatsApp link',()=>{
 for(const [path,hint] of [
  ['','Club de Català» o «chat.whatsapp'],
  ['es/','Club de Català» o «chat.whatsapp'],
  ['en/','Club de Català” or “chat.whatsapp'],
 ]){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  const card=html.match(/<article class="notice afa" id="avis-club-catala-voluntaris"[\s\S]*?<\/article>/)?.[0];
  assert.ok(card,path);
  assert.ok(card.includes(hint),path);
  // Its pop-up is the café, with the club's name on the chalkboard.
  assert.ok(card.includes('>Un cafè i català</text>'),path);
  assert.equal((card.match(/<div class="piece"/g)||[]).length,5,path);
  assert.doesNotMatch(card,/<a [^>]*href="[^"]*whatsapp/i,path);
  assert.doesNotMatch(html,/chat\.whatsapp\.com|KW2dxqKTmYf5CqpuadBdzE|<img[^>]*whatsapp/i,path);
  assert.doesNotMatch(html,/<a class="upcoming-event[^>]*href="#avis-club-catala-voluntaris"/);
 }
});

test('the timetable shows its week on the page, then the picture by day to open or download',()=>{
 for(const path of ['','es/','en/']){
  const card=readFileSync(`dist/${path}index.html`,'utf8').match(/<article class="notice classe" id="avis-horari-llibres"[\s\S]*?<\/article>/)?.[0];
  assert.ok(card);
  assert.doesNotMatch(card,/<details class="tab">/);
  assert.match(card,/<div class="notice-body open">/);
  assert.equal(card.match(/<img /g).length,1);
  assert.match(card,/href="\/downloads\/activitats-i4b-per-dies\.jpg" download/);
  assert.ok(card.indexOf('<ul>')<card.indexOf('class="notice-images"'));
 }
});

test('the timetable’s train carries each day’s activities in open wagons, as the timetable lists them',()=>{
 for(const [path,days] of [['',['dl','dt','dc','dj','dv']],['es/',['L','M','X','J','V']],['en/',['Mo','Tu','We','Th','Fr']]]){
  const train=readFileSync(`dist/${path}index.html`,'utf8').match(/<div class="piece train"[\s\S]*?<\/svg><\/div>/)?.[0];
  assert.ok(train,path);
  const loads=train.split('<g class="cargo">').slice(1).map(load=>Array.from(load.matchAll(/<g class="(library|english|workshop|families|movement|music|phonology)"/g),([,activity])=>activity));
  assert.deepEqual(loads,[['library'],['english'],['english','families'],['movement','music'],['phonology']],path);
  assert.deepEqual(Array.from(train.matchAll(/<text[^>]*>([^<]+)<\/text>/g),([,day])=>day),days,path);
 }
});

// The menus change every month (bin/menus), so this reads whichever months the site has.
test('the dates page links to the menus, kept in a pocket inside the back cover',()=>{
 const lists=readdirSync('src/content/menus').filter(name=>name.endsWith('.yaml')).sort().reverse();
 assert.ok(lists.length<=2,'bin/menus keeps a month and the one before it');
 for(const [path,language] of [['','ca'],['es/','es'],['en/','en']]){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  if(!lists.length){
   assert.doesNotMatch(html,/class="menus-link"|id="menus"/);
   continue;
  }
  const months=lists.map(name=>{
   const list=readFileSync(`src/content/menus/${name}`,'utf8');
   return {
    month:list.match(/^month: "(\d{4}-\d{2})"$/m)[1],
    main:Array.from(list.matchAll(/^ {2}- ([a-z]+)$/gm),([,kind])=>kind),
    adapted:Array.from(list.matchAll(/^ {2}- id: ([a-z0-9-]+)\n {4}ca: (".*")\n {4}es: (".*")\n {4}en: (".*")$/gm),([,id,ca,es,en])=>({id,name:JSON.parse({ca,es,en}[language])})),
   };
  });
  const label=menusLabel(months.map(({month})=>month),language);
  assert.ok(html.includes(`<a class="menus-link" href="#menus">${label}<svg`),path);
  // Inside the back cover: after the notices, before the back cover itself.
  assert.ok(html.indexOf('id="avisos"')<html.indexOf('id="menus"'));
  assert.ok(html.indexOf('id="menus"')<html.indexOf('class="back-cover"'));
  const pocket=html.match(/<section class="back-endpaper" id="menus"[\s\S]*?<\/section>/)?.[0];
  assert.ok(pocket,path);
  assert.ok(pocket.includes(`<h2 id="menus-heading">${label}</h2>`));
  // The newest month first, each under its own name while there are two, then the lunchtime service.
  // Long allergy lists take a whole row, after the adapted menus that share one.
  const byWidth=menus=>[...menus.filter(({name})=>name.length<=48),...menus.filter(({name})=>name.length>48)];
  const headings=Array.from(pocket.matchAll(/<h3 class="month-heading"[^>]*>([^<]+)<\/h3>/g),([,name])=>name);
  assert.deepEqual(headings,months.length>1 ? months.map(({month})=>monthName(month,language)) : [],path);
  const cards=Array.from(pocket.matchAll(/<a class="menu-card[^"]*" href="([^"]+)" target="_blank" rel="noopener noreferrer"/g),([,href])=>href);
  const expected=[...months.flatMap(({month,main,adapted})=>[...main,...byWidth(adapted).map(({id})=>id)].map(name=>`/downloads/menjador-${name}-${month}`)),'/downloads/menjador-informacions-espai-migdia-2026-2027'];
  assert.deepEqual(cards.map(href=>href.replace(/\.(jpg|pdf)$/,'')),expected,path);
  for(const href of cards) assert.ok(existsSync(`public${href}`),href);
  for(const {main,adapted} of months){
   for(const kind of main) assert.ok(pocket.includes(messages[language].menuKinds[kind]),`${path}${kind}`);
   for(const {id,name} of adapted) assert.match(pocket,new RegExp(`<a class="menu-card small${name.length>48 ? ' wide' : ''}" href="/downloads/menjador-${id}-`),`${path}${id}`);
   for(const {id,name} of adapted) assert.ok(pocket.includes(name),`${path}${id}`);
  }
  // The pictures are only links: none downloads with the page.
  assert.doesNotMatch(pocket,/<img/);
  // Without JavaScript the menus lie open and the pocket button stays out of the way.
  assert.match(pocket,/<button class="pocket" type="button" aria-expanded="true" aria-controls="menu-cards"[^>]* hidden>/);
 }
});

test('the next days without school are 7 and 8 December, a school closure and then a public holiday',()=>{
 for(const [path,title,closure,holiday,when,stamp,ticket] of [
  ['','Dies sense escola: lliure disposició i dia festiu','dia de lliure disposició','festiu estatal','dilluns i dimarts, tot el dia','dl 7 – dt 8 des, tot el dia','Tot el dia, dilluns 7 – dimarts 8 de desembre'],
  ['es/','Días sin colegio: libre disposición y día festivo','día de libre disposición','festivo nacional','lunes y martes, todo el día','lun 7 – mar 8 dic, todo el día','Todo el día, lunes 7 – martes 8 de diciembre'],
  ['en/','School closure day and public holiday','school closure day','national public holiday','Monday and Tuesday, all day','Mon 7 – Tue 8 Dec, all day','All day, Monday 7 – Tuesday 8 December'],
 ]){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  const card=html.match(/<article class="notice escola" id="avis-proxim-dia-sense-escola"[\s\S]*?<\/article>/)?.[0];
  assert.ok(card?.includes(closure),path);
  assert.ok(card.includes(holiday),path);
  assert.doesNotMatch(card,/2 de novembre|2 de noviembre|2 November/);
  assert.ok(card.includes(`<time datetime="2026-12-07">${stamp}</time>`),path);
  assert.ok(card.includes(ticket),path);
  const row=html.match(/<a class="upcoming-event escola" href="#avis-proxim-dia-sense-escola" data-end="2026-12-09"[\s\S]*?<\/a>/)?.[0];
  assert.ok(row?.includes(when),path);
  const ics=readFileSync(`dist/${path}calendar/proxim-dia-sense-escola.ics`,'utf8').replace(/\r\n /g,'');
  assert.match(ics,/DTSTART;VALUE=DATE:20261207/);
  assert.match(ics,/DTEND;VALUE=DATE:20261209/);
  assert.ok(ics.includes('SUMMARY:'+title),path);
  // The calendar leaves hung on the closed gate show the two days.
  assert.deepEqual(Array.from(card.matchAll(/font-size:6px;fill:var\(--black\)">(\d+)<\/text>/g),([,day])=>day),['7','8'],path);
 }
});

// The workshops' times come from the families' meeting presentation, linked from Sandra's 25 September email.
test('the updated timetable postpones workshops with their times, changes Friday, and labels the preserved original image',()=>{
 for(const [path,friday,november,times,caption,warning] of [
  ['','consciència fonològica','tallers començaran al novembre',['dimarts de 15 a 16.10 h','divendres de 9 a 10.30 h'],'Horari original per dies','anterior al recordatori del 6 d’octubre'],
  ['es/','conciencia fonológica','talleres empezarán en noviembre',['martes de 15:00 a 16:10','viernes de 9:00 a 10:30'],'Horario original por días','anterior al recordatorio del 6 de octubre'],
  ['en/','phonological awareness','Workshops will start in November',['Tuesdays from 15:00 to 16:10','Fridays from 9:00 to 10:30'],'Original timetable by day','from before the 6 October reminder'],
 ]){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  const card=html.match(/<article class="notice classe" id="avis-horari-llibres"[\s\S]*?<\/article>/)?.[0];
  assert.ok(card,path);
  const days=card.match(/<ul>[\s\S]*?<\/ul>/)?.[0];
  assert.ok(days?.includes(friday),path);
  assert.doesNotMatch(days,/tallers|talleres|workshops/);
  assert.ok(card.includes(november),path);
  for(const time of times) assert.ok(card.includes(time),`${path}${time}`);
  assert.ok(card.includes('Informacions reunions famílies'),path);
  assert.ok(card.includes(caption),path);
  assert.ok(card.includes(warning),path);
  assert.ok(card.includes('RECORDATORI HORARIS I4B'),path);
  assert.ok(existsSync('dist/downloads/activitats-i4b-per-dies.jpg'));
 }
});

test('September and October menus are retired while November and the yearly service sheet stay available',()=>{
 for(const month of ['2026-09','2026-10']){
  assert.equal(existsSync(`src/content/menus/${month}.yaml`),false,month);
  assert.equal(readdirSync('dist/downloads').some(name=>name.startsWith('menjador-')&&name.includes(`-${month}.`)),false,month);
 }
 for(const [path,label] of [['','Menús de novembre'],['es/','Menús de noviembre'],['en/','November menus']]){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  assert.ok(html.includes(label),path);
  assert.doesNotMatch(html,/\/downloads\/menjador-[^"<>]*-2026-(09|10)\./);
  assert.ok(html.includes('/downloads/menjador-basal-2026-11.jpg'),path);
  assert.ok(html.includes('/downloads/menjador-informacions-espai-migdia-2026-2027.jpg'),path);
 }
});

test('the board wears the season set in src/lib/season.ts, and nothing of autumn outside it',()=>{
 const autumn=season==='autumn';
 for(const path of ['','es/','en/']){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  const count=pattern=>(html.match(pattern)||[]).length;
  assert.equal(/<html lang="[a-z]+" data-season="autumn">/.test(html),autumn,path);
  // two plane trees through the cover window, leaves that fall there, pressed leaves on the table,
  // and endpapers of leaves and chestnuts inside the front cover and around the menus pocket
  assert.equal(count(/<use href="#plane-tree"/g),autumn?2:0,path);
  assert.equal(count(/class="falling-leaf"/g),autumn?6:0,path);
  assert.equal(count(/class="table-leaf /g),autumn?4:0,path);
  assert.equal(count(/fill="url\(#endpaper-autumn\)"/g),autumn?1:0,path);
  assert.equal(count(/fill="url\(#endpaper-autumn-back\)"/g),autumn?1:0,path);
 }
});
