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
 const order=['proxim-dia-sense-escola','cros-sant-marti','punt-verd-mobil','extraescolars-afa','acollida-desembre','reunio-families-inscripcions','psicomotricitat-comenca','horari-llibres','reunio-menjador','club-catala-voluntaris','materials-infantil'];
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
  // October's lunchtime programme still goes with October's menus, in the pocket.
  assert.match(html.match(/<section class="back-endpaper" id="menus"[\s\S]*?<\/section>/)[0],/<a class="menu-card" href="\/downloads\/menjador-activitats-2026-10\.jpg"/,path);
 }
 for(const image of ['castanyada-cartell-2026','castanyada-preus-bar-2026']) assert.equal(existsSync(`dist/downloads/${image}.jpg`),false,image);
});

test('the Cros de Sant Martí asks for sign-up by 3 November and gives the Llibres’ family race on Sunday 8 November',()=>{
 for(const [path,title,deadline,times,finish] of [
  ['','Cros de Sant Martí, diumenge 8 de novembre: inscripcions fins dimarts 3','dimarts 3 de novembre a les 23.59 h',['10.55 h','11.10 h'],'Arribada'],
  ['es/','Cros de Sant Martí, domingo 8 de noviembre: inscripciones hasta el martes 3','martes 3 de noviembre a las 23:59 h',['10:55 h','11:10 h'],'Llegada'],
  ['en/','Sant Martí cross-country race, Sunday 8 November: sign up by Tuesday 3','23:59 on Tuesday 3 November',['10:55','11:10'],'Finish'],
 ]){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  const card=html.match(/<article class="notice escola" id="avis-cros-sant-marti"[\s\S]*?<\/article>/)?.[0];
  assert.ok(card?.includes(title),path);
  assert.ok(card.includes(deadline),path);
  for(const time of times) assert.ok(card.includes(time),`${path}${time}`);
  assert.match(card,/<p class="stamp"><time datetime="2026-11-08T10:55:00\+01:00">/);
  assert.match(card,/<a href="https:\/\/forms\.cloud\.microsoft\/e\/5qQavBawbi" target="_blank" rel="noopener noreferrer">/);
  // The other years' times stay on the sheet in the school's email.
  assert.ok(card.includes('ACTIVITAT EDUCACIÓ FÍSICA DIUMENGE 8 DE NOVEMBRE. ESCOLA LA MAR BELLA'),path);
  assert.doesNotMatch(card,/\/downloads\//);
  assert.match(html,/<a class="upcoming-event escola" href="#avis-cros-sant-marti" data-end="2026-11-08T11:55:00\+01:00"/);
  const ics=readFileSync(`dist/${path}calendar/cros-sant-marti.ics`,'utf8').replace(/\r\n /g,'');
  assert.match(ics,/DTSTART:20261108T095500Z/);
  assert.match(ics,/DTEND:20261108T105500Z/);
  assert.ok(ics.includes('forms.cloud.microsoft/e/5qQavBawbi'),path);
  // Its pop-up is the race by the sea: the finish arch, the CEEB's tent, the family race, the green
  // circuit's flags and its sign.
  assert.ok(card.includes(`>${finish}</text>`),path);
  assert.ok(card.includes('>400 m</text>'),path);
  assert.equal((card.match(/<div class="piece"/g)||[]).length,5,path);
 }
});

test('the Punt Verd Mòbil comes on Monday 9 November, with what children can bring, as an all-day event',()=>{
 for(const [path,title,items] of [
  ['','Dilluns 9 de novembre, el Punt Verd Mòbil ve a l’escola',['roba i calçat','llibres','piles i bateries','bombetes','aparells elèctrics i cables','cartutxos','olis, pintures, aerosols i cosmètics','pneumàtics']],
  ['es/','El lunes 9 de noviembre, el Punt Verd Mòbil viene al colegio',['ropa y calzado','libros','pilas y baterías','bombillas','aparatos eléctricos y cables','cartuchos','aceites, pinturas, aerosoles y cosméticos','neumáticos']],
  ['en/','Monday 9 November: the mobile recycling point comes to school',['clothes and shoes','books','batteries','light bulbs','electrical appliances and cables','cartridges','oils, paint, aerosols and cosmetics','tyres']],
 ]){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  const card=html.match(/<article class="notice escola" id="avis-punt-verd-mobil"[\s\S]*?<\/article>/)?.[0];
  assert.ok(card?.includes(title),path);
  assert.deepEqual(Array.from(card.match(/<ul>[\s\S]*?<\/ul>/)[0].matchAll(/<li>([^<]+)<\/li>/g),([,item])=>item),items,path);
  assert.ok(card.includes('Punt Verd Mòbil Escola la Mar Bella'),path);
  assert.match(html,/<a class="upcoming-event escola" href="#avis-punt-verd-mobil" data-end="2026-11-10"/);
  const ics=readFileSync(`dist/${path}calendar/punt-verd-mobil.ics`,'utf8').replace(/\r\n /g,'');
  assert.match(ics,/DTSTART;VALUE=DATE:20261109/);
  assert.match(ics,/DTEND;VALUE=DATE:20261110/);
  // Its pop-up is the lorry in the playground, its side open on the bays.
  assert.ok(card.includes('>Punt Verd</text>'),path);
  assert.equal((card.match(/<div class="piece"/g)||[]).length,5,path);
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

test('psychomotricity keeps its shared link and Thursday instructions without the expired first-day event',()=>{
 for(const [path,where,socks] of [
  ['','al pavelló','posar-los els mitjons'],
  ['es/','en el pabellón','ponerles los calcetines'],
  ['en/','at the sports hall','put their socks on'],
 ]){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  const card=html.match(/<article class="notice classe" id="avis-psicomotricitat-comenca"[\s\S]*?<\/article>/)?.[0];
  assert.ok(card,path);
  assert.doesNotMatch(html,/<a class="upcoming-event[^>]*href="#avis-psicomotricitat-comenca"/);
  assert.doesNotMatch(card,/class="stamp"|class="calendar-actions"|8 d’octubre|8 de octubre|8 October/);
  assert.ok(card.includes(where),path);
  assert.ok(card.includes(socks),path);
  assert.ok(card.includes('href="#avis-horari-llibres"'),path);
  // Its pop-up is the sports hall: wall bars, a beam, and the socks waiting on the bench.
  assert.equal((card.match(/<div class="piece"/g)||[]).length,5,path);
  assert.match(card,/<rect x="6" y="29" width="17.6" height="1.1"/,path);
  assert.equal(existsSync(`dist/${path}calendar/psicomotricitat-comenca.ics`),false,path);
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

test('the next day without school is 2 November, a school closure rather than a public holiday',()=>{
 for(const [path,title,closure] of [
  ['','Dia sense escola: lliure disposició','dia de lliure disposició'],
  ['es/','Día sin colegio: libre disposición','día de libre disposición'],
  ['en/','School closure day','school closure day'],
 ]){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  const card=html.match(/<article class="notice escola" id="avis-proxim-dia-sense-escola"[\s\S]*?<\/article>/)?.[0];
  assert.ok(card?.includes(closure),path);
  assert.doesNotMatch(card,/12 d’octubre|12 de octubre|12 October|festiu estatal|festivo nacional|national public holiday/);
  assert.match(html,/<a class="upcoming-event escola" href="#avis-proxim-dia-sense-escola" data-end="2026-11-03"/);
  const ics=readFileSync(`dist/${path}calendar/proxim-dia-sense-escola.ics`,'utf8').replace(/\r\n /g,'');
  assert.match(ics,/DTSTART;VALUE=DATE:20261102/);
  assert.match(ics,/DTEND;VALUE=DATE:20261103/);
  assert.ok(ics.includes('SUMMARY:'+title),path);
 }
});

test('the updated timetable postpones workshops, changes Friday, and labels the preserved original image',()=>{
 for(const [path,friday,november,caption,warning] of [
  ['','consciència fonològica','tallers començaran al novembre','Horari original per dies','anterior al recordatori del 6 d’octubre'],
  ['es/','conciencia fonológica','talleres empezarán en noviembre','Horario original por días','anterior al recordatorio del 6 de octubre'],
  ['en/','phonological awareness','Workshops will start in November','Original timetable by day','from before the 6 October reminder'],
 ]){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  const card=html.match(/<article class="notice classe" id="avis-horari-llibres"[\s\S]*?<\/article>/)?.[0];
  assert.ok(card,path);
  const days=card.match(/<ul>[\s\S]*?<\/ul>/)?.[0];
  assert.ok(days?.includes(friday),path);
  assert.doesNotMatch(days,/tallers|talleres|workshops/);
  assert.ok(card.includes(november),path);
  assert.ok(card.includes(caption),path);
  assert.ok(card.includes(warning),path);
  assert.ok(card.includes('RECORDATORI HORARIS I4B'),path);
  assert.ok(existsSync('dist/downloads/activitats-i4b-per-dies.jpg'));
 }
});

test('September menus are retired while October and the yearly service sheet stay available',()=>{
 assert.equal(existsSync('src/content/menus/2026-09.yaml'),false);
 assert.equal(readdirSync('dist/downloads').some(name=>/menjador-.*-2026-09\./.test(name)),false);
 for(const [path,label] of [['','Menús d’octubre'],['es/','Menús de octubre'],['en/','October menus']]){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  assert.ok(html.includes(label),path);
  assert.doesNotMatch(html,/\/downloads\/menjador-[^"<>]*-2026-09\./);
  assert.ok(html.includes('/downloads/menjador-basal-2026-10.jpg'),path);
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
