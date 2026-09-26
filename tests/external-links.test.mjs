import {test} from 'node:test';
import assert from 'node:assert/strict';
import externalLinks from '../src/lib/external-links.mjs';
test('external-link policy preserves local navigation and existing rel values',()=>{
  const links=['https://other.test/path','//other.test/path','https://board.test/path','/local','#avisos','mailto:school@example.com'].map(href=>({type:'element',tagName:'a',properties:{href,rel:['nofollow']}}));
  externalLinks({site:'https://board.test'})({children:[{children:links}]});
  for(const link of links.slice(0,2)){
    assert.equal(link.properties.target,'_blank');
    assert.deepEqual(link.properties.rel,['nofollow','noopener','noreferrer']);
  }
  for(const link of links.slice(2)) assert.equal(link.properties.target,undefined);
});
