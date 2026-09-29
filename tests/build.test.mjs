import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {menusLabel,monthName} from '../src/lib/date-labels.ts';
import {messages} from '../src/lib/i18n.ts';
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
 for(const [language,title,summary] of [['es','El tablón de I4B','Reunión del comedor'],['en','The I4B noticeboard','School meals meeting']]){
  const html=readFileSync(`dist/${language}/index.html`,'utf8');
  assert.ok(html.includes(`<html lang="${language}"`));
  assert.ok(html.includes(title));
  assert.ok(html.includes(summary));
  assert.doesNotMatch(html,/La presentació de la reunió|Materials per als espais|Què fem cada dia/);
  assert.match(html,/<meta name="robots" content="noindex, nofollow"/);
  const ics=readFileSync(`dist/${language}/calendar/reunio-menjador.ics`,'utf8');
  assert.ok(ics.includes('SUMMARY:'+summary));
  assert.ok(ics.includes('DTSTART:20261005T150000Z'));
 }
});

test('AFA notice and filter explain the monthly enrolment and cancellation window in every language',()=>{
 for(const [path,opening,window] of [
  ['','altes i baixes a partir del dia 1','de l’1 al 20 de cada mes'],
  ['es/','altas y bajas a partir del día 1','del 1 al 20 de cada mes'],
  ['en/','enrolment and cancellation open on the 1st','from the 1st to the 20th of every month'],
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
  ['', 'Últim dia per donar de baixa extraescolars de novembre'],
  ['es/', 'Último día para dar de baja extraescolares de noviembre'],
  ['en/', 'Last day to cancel November extracurricular activities'],
 ]){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  assert.match(html,/<a class="upcoming-event afa" href="#avis-extraescolars-afa" data-end="2026-10-21"/);
  const ics=readFileSync(`dist/${path}calendar/extraescolars-afa.ics`,'utf8');
  assert.match(ics,/DTSTART;VALUE=DATE:20261020/);
  assert.match(ics,/DTEND;VALUE=DATE:20261021/);
  assert.ok(ics.replace(/\r\n /g,'').includes('SUMMARY:'+title));
  const card=html.match(/<article class="notice afa"[\s\S]*?<\/article>/)?.[0];
  const google=card.match(/href="(https:\/\/calendar\.google\.com[^\"]+)"/)[1];
  const params=new URL(google.replaceAll('&amp;','&')).searchParams;
  assert.equal(params.get('dates'),'20261020/20261021');
  assert.equal(params.get('text'),title);
  assert.ok(params.get('details').includes('23:55'));
 }
});

test('AFA instructions include the exact deadline, payment requirement and application link',()=>{
 for(const [path,payment] of [['','cal estar al corrent de pagament dels rebuts'],['es/','hay que estar al corriente del pago de los recibos'],['en/','all payments must be up to date']]){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  const card=html.match(/<article class="notice afa"[\s\S]*?<\/article>/)?.[0];
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
 const order=['reunio-menjador','reunio-families-inscripcions','proxim-dia-sense-escola','extraescolars-afa','activitats-migdia-octubre','horari-llibres','materials-infantil'];
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

test('the school meals meeting offers the lunchtime plan as a PDF between its details and calendar rows',()=>{
 for(const [path,title,meta] of [
  ['','Pla de funcionament del temps de migdia 2026–27','PDF · 15,2 MB'],
  ['es/','Plan de funcionamiento del mediodía 2026–27 (en catalán)','PDF · 15,2 MB'],
  ['en/','Lunchtime service plan 2026–27 (in Catalan)','PDF · 15.2 MB'],
 ]){
  const card=readFileSync(`dist/${path}index.html`,'utf8').match(/<article class="notice menjador" id="avis-reunio-menjador"[\s\S]*?<\/article>/)?.[0];
  assert.ok(card);
  const row=card.match(/<a class="tab file-row" href="\/downloads\/menjador-pla-funcionament-2026-2027\.pdf" download>[\s\S]*?<\/a>/)?.[0];
  assert.ok(row,path);
  assert.ok(row.includes(title),path);
  assert.ok(row.includes(meta),path);
  assert.ok(card.indexOf('<details class="tab">')<card.indexOf(row));
  assert.ok(card.indexOf(row)<card.indexOf('calendar-actions'));
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

test('the lunchtime activities read week by week behind the tab, then Biosca’s four play boxes, then the programme itself, the same picture the pocket holds',()=>{
 for(const [path,weeks,boxes] of [
  ['',['1 i 2 d’octubre','Del 5 al 9 d’octubre','Del 12 al 16 d’octubre','Del 19 al 23 d’octubre','Del 26 al 30 d’octubre'],['Emocions','Esports i moviment','Creativitat','Consciència ecològica']],
  ['es/',['1 y 2 de octubre','Del 5 al 9 de octubre','Del 12 al 16 de octubre','Del 19 al 23 de octubre','Del 26 al 30 de octubre'],['Emociones','Deporte y movimiento','Creatividad','Conciencia ecológica']],
  ['en/',['1 and 2 October','5 to 9 October','12 to 16 October','19 to 23 October','26 to 30 October'],['Emotions','Sport and movement','Creativity','Ecology']],
 ]){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  const card=html.match(/<article class="notice menjador" id="avis-activitats-migdia-octubre"[\s\S]*?<\/article>/)?.[0];
  assert.ok(card,path);
  const body=card.match(/<details class="tab">[\s\S]*?<\/details>/)?.[0];
  assert.ok(body,path);
  assert.deepEqual(Array.from(body.matchAll(/<p><strong>([^:<]+):/g),([,week])=>week),weeks,path);
  // A list of days for each week, then the boxes the programme marks activities with.
  const lists=body.match(/<ul>[\s\S]*?<\/ul>/g);
  assert.deepEqual(lists.map(list=>list.match(/<li>/g).length),[2,5,5,5,5,4],path);
  assert.deepEqual(Array.from(lists.at(-1).matchAll(/<li>([^:<]+):/g),([,box])=>box),boxes,path);
  assert.ok(body.lastIndexOf('</ul>')<body.indexOf('class="notice-images"'),path);
  assert.match(body,/href="\/downloads\/menjador-activitats-2026-10\.jpg" download/);
  assert.match(html.match(/<section class="back-endpaper" id="menus"[\s\S]*?<\/section>/)[0],/<a class="menu-card" href="\/downloads\/menjador-activitats-2026-10\.jpg"/,path);
 }
});

test('the lunchtime activities open on the dining hall, with a card pegged up for each week’s theme in the programme’s order',()=>{
 for(const path of ['','es/','en/']){
  const card=readFileSync(`dist/${path}index.html`,'utf8').match(/<article class="notice menjador" id="avis-activitats-migdia-octubre"[\s\S]*?<\/article>/)?.[0];
  const weeks=card?.match(/<div class="piece weeks"[\s\S]*?<\/svg><\/div>/)?.[0];
  assert.ok(weeks,path);
  assert.deepEqual(Array.from(weeks.matchAll(/<g class="week ([a-z]+)"/g),([,theme])=>theme),['smile','garland','bread','cook','chestnuts'],path);
  assert.deepEqual(Array.from(weeks.matchAll(/<text[^>]*>([^<]+)<\/text>/g),([,dates])=>dates),['1–2','5–9','12–16','19–23','26–30'],path);
 }
});

test('the timetable’s train carries each day’s activities in open wagons, as the timetable lists them',()=>{
 for(const [path,days] of [['',['dl','dt','dc','dj','dv']],['es/',['L','M','X','J','V']],['en/',['Mo','Tu','We','Th','Fr']]]){
  const train=readFileSync(`dist/${path}index.html`,'utf8').match(/<div class="piece train"[\s\S]*?<\/svg><\/div>/)?.[0];
  assert.ok(train,path);
  const loads=train.split('<g class="cargo">').slice(1).map(load=>Array.from(load.matchAll(/<g class="(library|english|workshop|families|movement|music)"/g),([,activity])=>activity));
  assert.deepEqual(loads,[['library'],['workshop','english'],['english','families'],['movement','music'],['workshop']],path);
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
