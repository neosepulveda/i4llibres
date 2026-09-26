import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
test('production HTML excludes fixtures and renders the empty state when there are no notices',()=>{
  const html=readFileSync('dist/index.html','utf8');
  if (readdirSync('src/content/notices',{recursive:true}).filter(p=>p.endsWith('.md')).length===0) assert.match(html,/Encara no hi ha cap avís/);
  assert.doesNotMatch(html,/Avís de classe de prova|Avís d’escola de prova|Hola, octubre|Propostes de disseny|Contingut d’exemple/);
  assert.match(html,/<html lang="ca"/);
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
