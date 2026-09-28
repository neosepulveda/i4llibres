import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
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
