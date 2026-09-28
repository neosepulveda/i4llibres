import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,readdirSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import sharp from 'sharp';
import {kindFor,replaceMenus} from '../scripts/menus.mjs';

test('Biosca’s file names are recognised, typos and all',()=>{
  // The names of the September 2026 attachments, as they arrived.
  for(const [name,kind] of [
    ['MENÚ BASAL LA MAR BELLA  SETEMBRE .jpg','basal'],
    ['FITXA DE SETEMBRE.jpg','fitxa'],
    ['Setembre SOPARS .jpg','sopars'],
    ['SENSE GLUTEN  BASAL LA MAR BELLA  SETEMBRE .jpg','sense-gluten'],
    ['SENSE LACTOSA LA MAR BELLA  SETEMBRE .jpg','sense-lactosa'],
    ['SENSE P.L.V LA MAR BELLA  SETEMBRE .jpg','sense-plv'],
    ['SENSE CACAHUET  LA MAR BELLA  SETEMBRE .jpg','sense-cacauet'],
    ['SENSE ANOUS LA MAR BELLA  SETEMBRE .jpg','sense-nous'],
    ['SENSE SOJA  MENÚ BASAL LA MAR BELLA  SETEMBRE .jpg','sense-soja'],
    ['SENSE PEIX  LA MAR BELLA  SETEMBRE .jpg','sense-peix'],
    ['SENSE CARN LA MAR BELLA  SETEMBRE .jpg','sense-carn'],
    ['SENSE PORC BASAL LA MAR BELLA  SETEMBRE .jpg','sense-porc'],
    ['SENSE INTEGRAL   LA MAR BELLA  SETEMBRE .jpg','sense-integral'],
    ['VEGETERIÀ LA MAR BELLA  SETEMBRE .jpg','vegetaria'],
    ['ovolactovegetarià  LA MAR BELLA  SETEMBRE .jpg','ovolactovegetaria'],
  ]) assert.equal(kindFor(name),kind,name);
  // Spelled properly next time, they are still the same menus.
  assert.equal(kindFor('SENSE NOUS OCTUBRE.jpg'),'sense-nous');
  assert.equal(kindFor('Menú vegetarià octubre.png'),'vegetaria');
  // A menu we have no card for never passes as the main menu.
  assert.equal(kindFor('SENSE OU BASAL LA MAR BELLA OCTUBRE.jpg'),undefined);
  assert.equal(kindFor('IMG_2041.jpg'),undefined);
});

// A copy of the site's folders with September's menus, a PDF and a timetable that must survive.
async function site(run){
  const root=mkdtempSync(join(tmpdir(),'noticeboard-menus-'));
  try{
    const picture=(width)=>sharp({create:{width,height:Math.round(width/1.414),channels:3,background:'#d0e8c0'}}).jpeg().toBuffer();
    mkdirSync(join(root,'public/downloads'),{recursive:true});mkdirSync(join(root,'src/content/menus'),{recursive:true});
    for(const name of ['menjador-basal-2026-09.jpg','menjador-sense-gluten-2026-09.jpg','activitats-i4b-llista.jpg']) writeFileSync(join(root,'public/downloads',name),await picture(200));
    writeFileSync(join(root,'public/downloads/menjador-pla-funcionament-2026-2027.pdf'),'%PDF');
    writeFileSync(join(root,'src/content/menus/2026-09.yaml'),'month: "2026-09"\nmenus:\n  - basal\n  - sense-gluten\n');
    const folder=join(root,'email');mkdirSync(folder);
    await run({root,folder,picture});
  }finally{rmSync(root,{recursive:true,force:true})}
}

test('a new month replaces the old one, resized for phones and listed in the order families see them',()=>site(async({root,folder,picture})=>{
  for(const name of ['VEGETERIÀ LA MAR BELLA OCTUBRE.jpg','MENÚ BASAL LA MAR BELLA OCTUBRE.jpg','SENSE ANOUS LA MAR BELLA OCTUBRE.jpg']) writeFileSync(join(folder,name),await picture(2000));
  writeFileSync(join(folder,'.DS_Store'),'');
  const result=await replaceMenus({folder,month:'2026-10',root});
  assert.deepEqual(result.pictures.map(({kind,to})=>[kind,to]),[
    ['basal','menjador-basal-2026-10.jpg'],['sense-nous','menjador-sense-nous-2026-10.jpg'],['vegetaria','menjador-vegetaria-2026-10.jpg'],
  ]);
  assert.equal(readFileSync(join(root,'src/content/menus/2026-10.yaml'),'utf8'),'# Written by bin/menus from Menjadors Biosca\'s pictures.\nmonth: "2026-10"\nmenus:\n  - basal\n  - sense-nous\n  - vegetaria\n');
  assert.deepEqual(readdirSync(join(root,'src/content/menus')),['2026-10.yaml']);
  assert.deepEqual(readdirSync(join(root,'public/downloads')).sort(),[
    'activitats-i4b-llista.jpg','menjador-basal-2026-10.jpg','menjador-pla-funcionament-2026-2027.pdf','menjador-sense-nous-2026-10.jpg','menjador-vegetaria-2026-10.jpg',
  ]);
  assert.deepEqual(result.removed.sort(),['public/downloads/menjador-basal-2026-09.jpg','public/downloads/menjador-sense-gluten-2026-09.jpg','src/content/menus/2026-09.yaml']);
  const {width,format}=await sharp(join(root,'public/downloads/menjador-basal-2026-10.jpg')).metadata();
  assert.equal(width,1600);assert.equal(format,'jpeg');
}));

test('the same month can be run again without losing its pictures',()=>site(async({root,folder,picture})=>{
  writeFileSync(join(folder,'MENÚ BASAL SETEMBRE.jpg'),await picture(2000));
  const result=await replaceMenus({folder,month:'2026-09',root});
  assert.ok(existsSync(join(root,'public/downloads/menjador-basal-2026-09.jpg')));
  assert.ok(existsSync(join(root,'src/content/menus/2026-09.yaml')));
  assert.deepEqual(result.removed,['public/downloads/menjador-sense-gluten-2026-09.jpg']);
}));

test('nothing changes when a picture is not a menu we know, or two are the same menu',()=>site(async({root,folder,picture})=>{
  const untouched=()=>{
    assert.deepEqual(readdirSync(join(root,'src/content/menus')),['2026-09.yaml']);
    assert.ok(existsSync(join(root,'public/downloads/menjador-basal-2026-09.jpg')));
  };
  writeFileSync(join(folder,'MENÚ BASAL OCTUBRE.jpg'),await picture(400));
  writeFileSync(join(folder,'SENSE OU OCTUBRE.jpg'),await picture(400));
  await assert.rejects(replaceMenus({folder,month:'2026-10',root}),/not a menu I recognise: SENSE OU OCTUBRE\.jpg/);
  untouched();
  rmSync(join(folder,'SENSE OU OCTUBRE.jpg'));
  writeFileSync(join(folder,'Menu basal octubre (1).jpg'),await picture(400));
  await assert.rejects(replaceMenus({folder,month:'2026-10',root}),/More than one picture for the same menu: basal/);
  untouched();
  rmSync(join(folder,'Menu basal octubre (1).jpg'));
  writeFileSync(join(folder,'menus.pdf'),'%PDF');
  await assert.rejects(replaceMenus({folder,month:'2026-10',root}),/Only pictures are expected\. Remove or check: menus\.pdf/);
  untouched();
  for(const month of ['octubre','2026-13','2026-1']) await assert.rejects(replaceMenus({folder,month,root}),/Give the month as YYYY-MM/);
  untouched();
}));
