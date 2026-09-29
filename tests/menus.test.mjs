import {test} from 'node:test';
import assert from 'node:assert/strict';
import {menuMonths} from '../src/lib/menus.ts';

const glutenFree={id:'sense-gluten',ca:'Sense gluten',es:'Sin gluten',en:'No gluten'};

test('the months come newest first, each split into menus for every family and adapted ones',()=>{
  const months=menuMonths([
    {data:{month:'2026-09',menus:['basal'],adapted:[]}},
    {data:{month:'2026-10',menus:['basal','sopars'],adapted:[glutenFree]}},
  ],['menjador-basal-2026-09.jpg','menjador-basal-2026-10.jpg','menjador-sopars-2026-10.jpg','menjador-sense-gluten-2026-10.jpg']);
  assert.deepEqual(months.map(({month})=>month),['2026-10','2026-09']);
  assert.deepEqual(months[0].main,[
    {kind:'basal',src:'/downloads/menjador-basal-2026-10.jpg'},
    {kind:'sopars',src:'/downloads/menjador-sopars-2026-10.jpg'},
  ]);
  assert.deepEqual(months[0].adapted,[{id:'sense-gluten',name:{ca:'Sense gluten',es:'Sin gluten',en:'No gluten'},src:'/downloads/menjador-sense-gluten-2026-10.jpg'}]);
  assert.deepEqual(months[1].adapted,[]);
});

test('a sheet of several pages stays a PDF, and a menu without its file stops the build',()=>{
  const [month]=menuMonths([{data:{month:'2026-10',menus:['basal','fitxa'],adapted:[]}}],['menjador-basal-2026-10.jpg','menjador-fitxa-2026-10.pdf']);
  assert.deepEqual(month.main.map(({src})=>src),['/downloads/menjador-basal-2026-10.jpg','/downloads/menjador-fitxa-2026-10.pdf']);
  assert.throws(()=>menuMonths([{data:{month:'2026-10',menus:['basal'],adapted:[glutenFree]}}],['menjador-basal-2026-10.jpg']),/list names sense-gluten, but public\/downloads has no menjador-sense-gluten-2026-10\.jpg or \.pdf/);
});

test('without any menus there is nothing to show',()=>{
  assert.deepEqual(menuMonths([],[]),[]);
});
