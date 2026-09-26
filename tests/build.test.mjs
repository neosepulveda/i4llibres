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

test('all published languages include translated notices and calendar exports',()=>{
 for(const [language,title,summary] of [['es','Las cosas que nos importan.','Reunión del comedor'],['en','The things that matter to us.','School meals meeting']]){
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
  assert.match(html,/data-filter="afa"[^>]*>.*?AFA<\/button>/);
  const card=html.match(/<article class="notice afa" id="avis-extraescolars-afa"[\s\S]*?<\/article>/)?.[0];
  assert.ok(card,'AFA notice has its own category');
  assert.ok(card.includes(opening));
  assert.ok(card.includes(window));
 }
});

test('AFA registration window appears in upcoming dates and translated calendar downloads',()=>{
 for(const path of ['', 'es/', 'en/']){
  const html=readFileSync(`dist/${path}index.html`,'utf8');
  assert.match(html,/<a class="upcoming-event afa" href="#avis-extraescolars-afa" data-end="2026-10-21"/);
  const ics=readFileSync(`dist/${path}calendar/extraescolars-afa.ics`,'utf8');
  assert.match(ics,/DTSTART;VALUE=DATE:20261001/);
  assert.match(ics,/DTEND;VALUE=DATE:20261021/);
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
