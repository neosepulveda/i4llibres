import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,readdirSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import sharp from 'sharp';
import {menuFor,addMenus,retireMenus} from '../scripts/menus.mjs';

test('Biosca’s file names are recognised, typos and all',()=>{
  // The names of the September 2026 attachments, as they arrived.
  for(const [name,menu] of [
    ['MENÚ BASAL LA MAR BELLA  SETEMBRE .jpg',{kind:'basal'}],
    ['FITXA DE SETEMBRE.jpg',{kind:'fitxa'}],
    ['Setembre SOPARS .jpg',{kind:'sopars'}],
    ['SENSE GLUTEN  BASAL LA MAR BELLA  SETEMBRE .jpg',{id:'sense-gluten'}],
    ['SENSE LACTOSA LA MAR BELLA  SETEMBRE .jpg',{id:'sense-lactosa'}],
    ['SENSE P.L.V LA MAR BELLA  SETEMBRE .jpg',{id:'sense-plv'}],
    ['SENSE CACAHUET  LA MAR BELLA  SETEMBRE .jpg',{id:'sense-cacauet'}],
    ['SENSE ANOUS LA MAR BELLA  SETEMBRE .jpg',{id:'sense-nous'}],
    ['SENSE SOJA  MENÚ BASAL LA MAR BELLA  SETEMBRE .jpg',{id:'sense-soja'}],
    ['SENSE PEIX  LA MAR BELLA  SETEMBRE .jpg',{id:'sense-peix'}],
    ['SENSE INTEGRAL   LA MAR BELLA  SETEMBRE .jpg',{id:'sense-integral'}],
    ['VEGETERIÀ LA MAR BELLA  SETEMBRE .jpg',{id:'vegetaria'}],
    ['ovolactovegetarià  LA MAR BELLA  SETEMBRE .jpg',{id:'ovolactovegetaria'}],
  ]) assert.deepEqual(menuFor(name),menu,name);
  // October's came differently named, some as PDFs.
  for(const [name,menu] of [
    ['ESCOLA MAR BELLA MENÚ BASAL  D\'OCTUBRE .jpg',{kind:'basal'}],
    ['ESCOLA LA MAR BELLA SOPARS   OCTUBRE.jpg',{kind:'sopars'}],
    ['FITXA OCTUBRE.pdf',{kind:'fitxa'}],
    ['RECEPTES DELS SOPARS MES OCTUBRE .pdf',{kind:'receptes'}],
    ['menjador-05-halal-2026-10.pdf',{id:'halal'}],
    ['menjador-11-sense-peix-ni-marisc-2026-10.pdf',{id:'sense-peix-ni-marisc'}],
    ['menjador-07-sense-lactosa-sense-proteina-de-vaca-2026-10.pdf',{id:'sense-lactosa-sense-proteina-de-vaca'}],
    ['MENÚ S/ BOLETS OCTUBRE.jpg',{id:'sense-bolets'}],
    // A slash typed in Finder is a colon on disk.
    ['MENÚ S: KIWI I LES NOUS.jpg',{id:'sense-kiwi-i-les-nous'}],
    ['SENSE OU (1).jpg',{id:'sense-ou'}],
  ]) assert.deepEqual(menuFor(name),menu,name);
  // A name that says nothing once the school and the month are gone is not a menu.
  assert.equal(menuFor('MENÚS OCTUBRE.pdf'),undefined);
  assert.equal(menuFor('1000122145.jpg'),undefined);
});

// A copy of the site's folders with August's and September's menus, a PDF and a timetable that must survive.
async function site(run){
  const root=mkdtempSync(join(tmpdir(),'noticeboard-menus-'));
  try{
    const picture=(width,background='#d0e8c0')=>sharp({create:{width,height:Math.round(width/1.414),channels:3,background}}).jpeg().toBuffer();
    mkdirSync(join(root,'public/downloads'),{recursive:true});mkdirSync(join(root,'src/content/menus'),{recursive:true});
    for(const name of ['menjador-basal-2026-08.jpg','menjador-basal-2026-09.jpg','menjador-sense-gluten-2026-09.jpg','activitats-i4b-llista.jpg']) writeFileSync(join(root,'public/downloads',name),await picture(200));
    writeFileSync(join(root,'public/downloads/menjador-pla-funcionament-2026-2027.pdf'),'%PDF');
    writeFileSync(join(root,'public/downloads/menjador-informacions-espai-migdia-2026-2027.jpg'),await picture(200));
    writeFileSync(join(root,'src/content/menus/2026-08.yaml'),'month: "2026-08"\nmenus:\n  - basal\nadapted: []\n');
    writeFileSync(join(root,'src/content/menus/2026-09.yaml'),'month: "2026-09"\nmenus:\n  - basal\nadapted:\n  - id: sense-gluten\n    ca: "Sense gluten"\n    es: "Sin gluten"\n    en: "No gluten"\n  - id: sense-nous\n    ca: "Sense nous"\n    es: "Sin frutos secos"\n    en: "No nuts"\n');
    const folder=join(root,'email');mkdirSync(folder);
    await run({root,folder,picture});
  }finally{rmSync(root,{recursive:true,force:true})}
}
const downloads=root=>readdirSync(join(root,'public/downloads')).sort();

test('a new month joins the one before it, resized for phones, and older months go',()=>site(async({root,folder,picture})=>{
  for(const name of ['VEGETERIÀ LA MAR BELLA OCTUBRE.jpg','MENÚ BASAL LA MAR BELLA OCTUBRE.jpg','SENSE ANOUS LA MAR BELLA OCTUBRE.jpg','Menú halal octubre.jpg']) writeFileSync(join(folder,name),await picture(2000));
  writeFileSync(join(folder,'.DS_Store'),'');
  const result=await addMenus({folder,month:'2026-10',root});
  assert.deepEqual(result.menus.map(({name,to})=>[name,to]),[
    ['basal','menjador-basal-2026-10.jpg'],['halal','menjador-halal-2026-10.jpg'],['sense-nous','menjador-sense-nous-2026-10.jpg'],['vegetaria','menjador-vegetaria-2026-10.jpg'],
  ]);
  // A menu that came before keeps its names; a new one waits to be named.
  assert.equal(readFileSync(join(root,'src/content/menus/2026-10.yaml'),'utf8'),[
    '# Written by bin/menus from Menjadors Biosca\'s menus. Name each adapted menu as its sheet does.',
    'month: "2026-10"','menus:','  - basal','adapted:',
    '  - id: halal','    ca: ""','    es: ""','    en: ""',
    '  - id: sense-nous','    ca: "Sense nous"','    es: "Sin frutos secos"','    en: "No nuts"',
    '  - id: vegetaria','    ca: ""','    es: ""','    en: ""',
  ].join('\n')+'\n');
  assert.deepEqual(result.unnamed,['halal','vegetaria']);
  assert.deepEqual(readdirSync(join(root,'src/content/menus')).sort(),['2026-09.yaml','2026-10.yaml']);
  assert.deepEqual(downloads(root),[
    'activitats-i4b-llista.jpg','menjador-basal-2026-09.jpg','menjador-basal-2026-10.jpg','menjador-halal-2026-10.jpg','menjador-informacions-espai-migdia-2026-2027.jpg',
    'menjador-pla-funcionament-2026-2027.pdf','menjador-sense-gluten-2026-09.jpg','menjador-sense-nous-2026-10.jpg','menjador-vegetaria-2026-10.jpg',
  ]);
  assert.deepEqual(result.removed.sort(),['public/downloads/menjador-basal-2026-08.jpg','src/content/menus/2026-08.yaml']);
  const {width,format}=await sharp(join(root,'public/downloads/menjador-basal-2026-10.jpg')).metadata();
  assert.equal(width,1600);assert.equal(format,'jpeg');
}));

test('a one-page PDF becomes a picture without its black frame, and a sheet of several pages stays a PDF',()=>site(async({root,folder,picture})=>{
  // Stands in for PDFKit: a menu inside a black frame, as Biosca's PDFs render, and a four-page sheet.
  const framed=await sharp({create:{width:2400,height:1700,channels:3,background:'#000000'}}).composite([{input:await sharp({create:{width:2200,height:1500,channels:3,background:'#f6eee2'}}).png().toBuffer(),left:100,top:100}]).png().toBuffer();
  const pdfPages=async path=>path.endsWith('FITXA OCTUBRE.pdf') ? [framed,framed,framed,framed] : [framed];
  for(const name of ['menjador-05-halal-2026-10.pdf','FITXA OCTUBRE.pdf']) writeFileSync(join(folder,name),`%PDF ${name}`);
  writeFileSync(join(folder,'MENÚ BASAL OCTUBRE.jpg'),await picture(2000));
  const result=await addMenus({folder,month:'2026-10',root,pdfPages});
  assert.deepEqual(result.menus.map(({to})=>to),['menjador-basal-2026-10.jpg','menjador-fitxa-2026-10.pdf','menjador-halal-2026-10.jpg']);
  assert.equal(readFileSync(join(root,'public/downloads/menjador-fitxa-2026-10.pdf'),'utf8'),'%PDF FITXA OCTUBRE.pdf');
  const {width,height}=await sharp(join(root,'public/downloads/menjador-halal-2026-10.jpg')).metadata();
  assert.deepEqual([width,height],[1600,Math.round(1500*1600/2200)]);
  // A PDF of several menus has to be saved as one file per menu first.
  rmSync(join(folder,'FITXA OCTUBRE.pdf'));
  await assert.rejects(addMenus({folder,month:'2026-10',root,pdfPages:async()=>[framed,framed]}),/menjador-05-halal-2026-10\.pdf has 2 pages\. Only a sheet for every family stays a PDF/);
}));

test('the same month can be run again without losing its pictures or names',()=>site(async({root,folder,picture})=>{
  writeFileSync(join(folder,'MENÚ BASAL SETEMBRE.jpg'),await picture(2000));
  writeFileSync(join(folder,'SENSE ANOUS SETEMBRE.jpg'),await picture(2000));
  const result=await addMenus({folder,month:'2026-09',root});
  assert.ok(existsSync(join(root,'public/downloads/menjador-basal-2026-09.jpg')));
  assert.match(readFileSync(join(root,'src/content/menus/2026-09.yaml'),'utf8'),/- id: sense-nous\n {4}ca: "Sense nous"/);
  assert.deepEqual(result.removed.sort(),['public/downloads/menjador-sense-gluten-2026-09.jpg']);
  assert.deepEqual(result.unnamed,[]);
}));

test('nothing changes when a file is not a menu we know, or two are the same menu',()=>site(async({root,folder,picture})=>{
  const before=downloads(root);
  const untouched=()=>{
    assert.deepEqual(readdirSync(join(root,'src/content/menus')).sort(),['2026-08.yaml','2026-09.yaml']);
    assert.deepEqual(downloads(root),before);
  };
  writeFileSync(join(folder,'MENÚ BASAL OCTUBRE.jpg'),await picture(400));
  writeFileSync(join(folder,'1000122145.jpg'),await picture(400));
  await assert.rejects(addMenus({folder,month:'2026-10',root}),/not a menu I recognise: 1000122145\.jpg/);
  untouched();
  rmSync(join(folder,'1000122145.jpg'));
  writeFileSync(join(folder,'Menu basal octubre (1).jpg'),await picture(400));
  await assert.rejects(addMenus({folder,month:'2026-10',root}),/More than one file for the same menu: basal/);
  untouched();
  rmSync(join(folder,'Menu basal octubre (1).jpg'));
  writeFileSync(join(folder,'menus.docx'),'');
  await assert.rejects(addMenus({folder,month:'2026-10',root}),/Only pictures and PDFs are expected\. Remove or check: menus\.docx/);
  untouched();
  for(const month of ['octubre','2026-13','2026-1']) await assert.rejects(addMenus({folder,month,root}),/Give the month as YYYY-MM/);
  untouched();
}));

test('a month is taken out of the pocket when it is retired',()=>site(async({root})=>{
  assert.deepEqual(retireMenus({month:'2026-09',root}).removed.sort(),['public/downloads/menjador-basal-2026-09.jpg','public/downloads/menjador-sense-gluten-2026-09.jpg','src/content/menus/2026-09.yaml']);
  assert.deepEqual(readdirSync(join(root,'src/content/menus')),['2026-08.yaml']);
  assert.ok(existsSync(join(root,'public/downloads/menjador-basal-2026-08.jpg')));
  assert.throws(()=>retireMenus({month:'2026-09',root}),/There are no menus for 2026-09 to retire/);
}));

// The real PDFKit, where there is one: a PDF with a landscape page and a portrait one.
const swift=process.platform==='darwin' && spawnSync('swift',['--version']).status===0;
test('PDFKit renders every page of a PDF 2400 px wide',{skip:!swift && 'needs macOS with Swift'},async()=>{
  const folder=mkdtempSync(join(tmpdir(),'noticeboard-pdf-'));
  try{
    const pages=['0 0 842 595','0 0 595 842'].map((box,index)=>`${index+3} 0 obj<</Type/Page/Parent 2 0 R/MediaBox[${box}]>>endobj`);
    writeFileSync(join(folder,'two.pdf'),`%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R 4 0 R]/Count 2>>endobj\n${pages.join('\n')}\ntrailer<</Root 1 0 R>>\n%%EOF\n`);
    const result=spawnSync('swift',['scripts/pdf-pages.swift',join(folder,'two.pdf'),folder],{encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);
    assert.equal(result.stdout.trim(),'2');
    const sizes=await Promise.all(['1.png','2.png'].map(async name=>{const {width,height}=await sharp(join(folder,name)).metadata();return [width,height];}));
    assert.deepEqual(sizes[0],[2400,1695]);
    assert.ok(sizes[1][1]>sizes[1][0],'the portrait page stays upright');
  }finally{rmSync(folder,{recursive:true,force:true})}
});
