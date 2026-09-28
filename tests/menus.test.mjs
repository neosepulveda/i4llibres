import {test} from 'node:test';
import assert from 'node:assert/strict';
import {latestMenus} from '../src/lib/menus.ts';

test('the newest month of menus wins, split into menus for every family and adapted ones',()=>{
  const menus=latestMenus([
    {data:{month:'2026-09',menus:['basal']}},
    {data:{month:'2026-10',menus:['sense-gluten','basal','sopars']}},
  ]);
  assert.equal(menus.month,'2026-10');
  assert.deepEqual(menus.main,[
    {kind:'basal',src:'/downloads/menjador-basal-2026-10.jpg'},
    {kind:'sopars',src:'/downloads/menjador-sopars-2026-10.jpg'},
  ]);
  assert.deepEqual(menus.adapted,[{kind:'sense-gluten',src:'/downloads/menjador-sense-gluten-2026-10.jpg'}]);
});

test('without any menus there is nothing to show',()=>{
  assert.equal(latestMenus([]),undefined);
});
