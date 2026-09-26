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
