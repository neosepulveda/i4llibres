import { test, expect, type Page } from '@playwright/test';

// The dates page sits under the cover until the book opens, so open it before using the dates.
async function openBook(page: Page) {
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.getByRole('button',{name:/Obre el llibre|Abrir el libro|Open the book/}).click();
 await expect.poll(()=>page.locator('.book').evaluate(book=>(book as HTMLElement).style.getPropertyValue('--turn'))).toBe('-178.00deg');
}

for (const width of [1440,390,320]) {
  for (const colorScheme of ['light','dark'] as const) {
    test(`empty board ${width}px ${colorScheme}`, async ({ page }) => {
      await page.setViewportSize({width,height:900});
      await page.emulateMedia({colorScheme});
      await page.goto('http://127.0.0.1:4322');
      await expect(page.locator('html')).toHaveAttribute('lang','ca');
      await expect(page.getByRole('heading',{name:'Encara no hi ha cap avís'})).toBeVisible();
      await expect(page.locator('.notice')).toHaveCount(0);
      await expect(page.getByText('Ara mateix no hi ha cap data a la vista.')).toBeVisible();
      await expect(page.getByRole('link',{name:'Calendari escolar 2026–27'})).toBeVisible();
      await expect(page.getByRole('link',{name:'Calendari escolar 2026–27'})).toHaveAttribute('href','https://lamarbella.cat/calendari-escolar/');
      await expect(page.locator('.notice-count')).toHaveText('0 avisos');
      await expect(page.locator('.filters')).toHaveCount(0);
      await expect(page.locator('.menus-link')).toHaveCount(0);
      await expect(page.locator('#menus')).toHaveCount(0);
      await expect(page.locator('html')).toHaveAttribute('data-theme',colorScheme==='dark'?'fosc':'clar');
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await page.getByRole('button',{name:/Activa el mode/}).click();
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-theme',colorScheme==='dark'?'clar':'fosc');
    });
  }
}
test('Markdown content, category filtering and empty filter recovery',async({page})=>{
  await page.goto('http://127.0.0.1:4323');
  await expect(page.locator('.notice')).toHaveCount(2);
  await expect(page.locator('.notice h3')).toHaveText(['Avís d’escola de prova', 'Avís de classe de prova']);
  await expect(page.getByRole('button',{name:'Calendari',exact:true})).toHaveCount(0);
  await expect(page.locator('.filter-count')).toHaveText(['2','1','1','0','0']);
  await page.getByRole('button',{name:'I4B',exact:true}).click();
  await expect(page.locator('.notice:visible')).toHaveCount(1);
  await expect(page.locator('.notice-count')).toHaveText('1 avís d’I4B');
  await page.locator('.notice:visible details:not(.calendar-actions) summary').click();
  await expect(page.getByText('Detall del conte de prova.')).toBeVisible();
  await page.getByRole('button',{name:'Menjador',exact:true}).click();
  await expect(page.getByRole('heading',{name:'No hi ha avisos d’aquesta categoria'})).toBeVisible();
  await page.getByRole('button',{name:'Mostra tots els avisos'}).click();
  await expect(page.locator('.notice:visible')).toHaveCount(2);
  await page.getByRole('button',{name:'Escola',exact:true}).click();
  await expect(page.locator('.notice-count')).toHaveText('1 avís de l’escola');
  await page.getByRole('button',{name:'Mostra’ls tots'}).click();
  await expect(page.locator('.notice-count')).toHaveText('2 avisos');
  await expect(page.getByRole('button',{name:'Mostra’ls tots'})).toBeHidden();
});
test('empty state works without JavaScript',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false});
  const page=await context.newPage();await page.goto('http://127.0.0.1:4322');
  await expect(page.getByRole('heading',{name:'Encara no hi ha cap avís'})).toBeVisible();
  await expect(page.locator('#theme-toggle')).toBeHidden();
  expect(await page.locator('.cover .reader').evaluate(reader=>getComputedStyle(reader).opacity)).toBe('1');
  expect(await page.locator('.cover .monster.walking').evaluate(monster=>getComputedStyle(monster).opacity)).toBe('0');
  await context.close();
});

for (const width of [390,1280]) {
 test(`the closed book fills the first screen and opens as you scroll at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:844});
  await page.clock.install({time:new Date('2026-09-26T10:00:00Z')});
  await page.goto('http://127.0.0.1:4323');
  const turn=()=>page.locator('.book').evaluate(book=>parseFloat((book as HTMLElement).style.getPropertyValue('--turn')));
  // Nothing but the book, the pencil and the button above the fold.
  expect((await page.locator('#avisos').boundingBox())!.y).toBeGreaterThan(844);
  await expect(page.getByRole('button',{name:'Obre el llibre'})).toBeVisible();
  expect(await turn()).toBe(0);
  const range=await page.locator('.opening').evaluate(opening=>(opening as HTMLElement).offsetHeight-innerHeight);
  await page.evaluate(y=>window.scrollTo(0,y),Math.round(range*.3));
  await expect.poll(turn).toBeLessThan(-20);
  expect(await turn()).toBeGreaterThan(-178);
  await expect(page.getByRole('button',{name:'Obre el llibre'})).toBeHidden();
  // The book holds still while the cover turns and once it has opened.
  await page.evaluate(y=>window.scrollTo(0,y),Math.round(range*.75));
  await expect.poll(turn).toBe(-178);
  const open=(await page.locator('.book').boundingBox())!.y;
  await page.evaluate(y=>window.scrollTo(0,y),Math.round(range*.95));
  await page.waitForTimeout(100);
  expect(Math.abs((await page.locator('.book').boundingBox())!.y-open)).toBeLessThan(2);
  await openBook(page);
  await expect(page.locator('.upcoming-event').first()).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}

test('last year’s monster moves into the school as the page loads, and hurries once the page scrolls',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('http://127.0.0.1:4323');
 const scene=page.locator('.cover-scene');
 const opacity=(selector:string)=>page.locator(selector).evaluate(element=>getComputedStyle(element).opacity);
 // It starts hidden behind the school, so the cover first looks as it always has.
 expect(await opacity('.cover .reader')).toBe('0');
 expect(await scene.evaluate(svg=>svg.getAnimations({subtree:true}).length)).toBeGreaterThan(5);
 // Animating transform or opacity directly puts the school on a layer of its own, which the tilted
 // book paints at a fraction of the resolution, so the story only animates numbers.
 const animated=await scene.evaluate(svg=>svg.getAnimations({subtree:true}).flatMap(animation=>(animation.effect as KeyframeEffect).getKeyframes().flatMap(frame=>Object.keys(frame))));
 expect(animated.filter(name=>['transform','opacity','scale','rotate','translate'].includes(name))).toEqual([]);
 // Scrolling sends it straight to its seat by the window, so the cover never turns mid-story,
 // and no animation stays behind once the story ends.
 await page.evaluate(()=>window.scrollTo(0,40));
 await expect.poll(()=>scene.evaluate(svg=>svg.getAnimations({subtree:true}).length),{timeout:2500}).toBe(0);
 expect(await opacity('.cover .reader')).toBe('1');
 expect(await opacity('.cover .monster.walking')).toBe('0');
 await expect(scene).toHaveAttribute('viewBox','0 0 100 82');
});

test('their teacher leads the line with a book held high and waves it back when the monster waves',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('http://127.0.0.1:4323');
 await expect(page.locator('.cover .teacher')).toBeVisible();
 const book=page.locator('.cover .book-wave');
 const turn=()=>book.evaluate(arm=>getComputedStyle(arm).getPropertyValue('--story-turn').trim());
 const at=(time:number)=>page.locator('.cover-scene').evaluate((svg,time)=>svg.getAnimations({subtree:true}).forEach(animation=>{animation.pause();animation.currentTime=time;}),time);
 // Still while the monster peeks, rocking the book while it waves, and still again as it hops to the door.
 await at(1500);
 expect(await turn()).toBe('0');
 await at(2600);
 expect(await turn()).toBe('-14');
 await at(4000);
 expect(await turn()).toBe('0');
});

test('near the end of the story the view closes in on the window where the monster reads',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('http://127.0.0.1:4323');
 const scene=page.locator('.cover-scene');
 await scene.evaluate(svg=>svg.getAnimations({subtree:true}).forEach(animation=>{animation.pause();animation.currentTime=7000;}));
 await expect.poll(async()=>Number((await scene.getAttribute('viewBox'))!.split(' ')[2])).toBeLessThan(30);
 expect(await page.locator('.cover .reader').evaluate(reader=>getComputedStyle(reader).opacity)).toBe('1');
});

for (const width of [390,1180]) {
 test(`an arrow on the table points to the notices once the cover is halfway open at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:820});
  await page.goto('http://127.0.0.1:4323');
  const arrow=page.getByRole('link',{name:'Els avisos'});
  const turn=()=>page.locator('.book').evaluate(book=>parseFloat((book as HTMLElement).style.getPropertyValue('--turn')));
  const range=await page.locator('.opening').evaluate(opening=>(opening as HTMLElement).offsetHeight-innerHeight);
  await expect(arrow).toBeHidden();
  await page.evaluate(y=>window.scrollTo(0,y),Math.round(range*.1));
  await expect.poll(turn).toBeGreaterThan(-89);
  await expect(arrow).toBeHidden();
  await page.evaluate(y=>window.scrollTo(0,y),Math.round(range*.2));
  await expect.poll(turn).toBeLessThan(-89);
  await expect(arrow).toBeVisible();
  const box=(await arrow.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.y+box.height).toBeLessThanOrEqual(820);
  await arrow.click();
  await expect.poll(async()=>(await page.locator('#avisos').boundingBox())!.y).toBeLessThan(40);
  await expect(arrow).toBeHidden();
  // The pencil leaves the table as the notices slide over it.
  await expect.poll(()=>page.locator('.pencil').evaluate(pencil=>getComputedStyle(pencil).opacity)).toBe('0');
 });
}

test('dates that do not fit wait behind a link, and the open book grows to show them',async({page})=>{
 await page.clock.install({time:new Date('2026-09-26T10:00:00Z')});
 await page.setViewportSize({width:390,height:844});
 await page.goto('http://127.0.0.1:4323');
 // Six more dates than the fixtures have, so the page overflows the cover.
 await page.evaluate(()=>{
  const list=document.querySelector('.upcoming-list')!;
  for(let index=0;index<6;index++) list.append(list.lastElementChild!.cloneNode(true));
  document.getElementById('dates')!.dispatchEvent(new Event('dates-change'));
 });
 const more=page.locator('.more-dates');
 await expect(more).toBeVisible();
 const shown=await page.locator('.upcoming-event:visible').count();
 expect(shown).toBeLessThan(8);
 await expect(more).toHaveText(`Mostra ${8-shown} dates més`);
 const cover=(await page.locator('.cover').boundingBox())!.height;
 expect((await page.locator('#dates').boundingBox())!.height).toBeLessThanOrEqual(cover+1);
 await openBook(page);
 const before=(await page.locator('.book').boundingBox())!.y;
 await more.click();
 await expect(page.locator('.upcoming-event:visible')).toHaveCount(8);
 await expect(more).toHaveAttribute('aria-expanded','true');
 await expect(more).toHaveText('Mostra’n menys');
 await expect(page.locator('.opening')).toHaveClass(/released/);
 expect(Math.abs((await page.locator('.book').boundingBox())!.y-before)).toBeLessThan(2);
 expect((await page.locator('#dates').boundingBox())!.height).toBeGreaterThan(cover+100);
 await more.click();
 await expect(page.locator('.upcoming-event:visible')).toHaveCount(shown);
 await expect(page.locator('.opening')).not.toHaveClass(/released/);
});

test('with reduced motion the cover and every date simply sit on the page',async({page})=>{
 await page.clock.install({time:new Date('2026-09-26T10:00:00Z')});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:390,height:844});
 await page.goto('http://127.0.0.1:4323');
 await expect(page.locator('html')).not.toHaveClass(/motion/);
 await expect(page.getByRole('button',{name:'Obre el llibre'})).toBeHidden();
 // Last year's monster is already in its window, reading.
 expect(await page.locator('.cover-scene').evaluate(svg=>svg.getAnimations({subtree:true}).length)).toBe(0);
 expect(await page.locator('.cover .reader').evaluate(reader=>getComputedStyle(reader).opacity)).toBe('1');
 await expect(page.locator('.upcoming-event:visible')).toHaveCount(2);
 const cover=(await page.locator('.cover').boundingBox())!, dates=(await page.locator('#dates').boundingBox())!;
 expect(dates.y).toBeGreaterThan(cover.y+cover.height);
 await page.locator('.upcoming-event').first().click();
 await expect(page.locator('#avis-class details').first()).toHaveAttribute('open','');
});

for (const width of [320,390]) {
 for (const colorScheme of ['light','dark'] as const) {
  test(`the filters shortcut on phones at ${width}px ${colorScheme}`,async({page})=>{
   await page.setViewportSize({width,height:600});
   await page.emulateMedia({colorScheme,reducedMotion:colorScheme==='dark'?'reduce':'no-preference'});
   for(const [path,label] of [['/?lang=ca','Filtres: Tots'],['/es/','Filtros: Todos'],['/en/','Filters: All']]){
    await page.goto('http://127.0.0.1:4323'+path);
    const button=page.getByRole('button',{name:label,includeHidden:true});
    await expect(button).toBeHidden();
    await page.locator('.notice details:not(.calendar-actions)').evaluateAll(elements=>elements.forEach(element=>element.setAttribute('open','')));
    await page.locator('.notice').first().evaluate(card=>card.scrollIntoView({block:'start'}));
    await expect(button).toBeVisible();
    await button.evaluate(element=>Promise.all(element.getAnimations().map(animation=>animation.finished)));
    const box=await button.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.x+box!.width).toBeLessThanOrEqual(width-14);
    expect(box!.y+box!.height).toBeLessThanOrEqual(600-14);
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.filter[aria-pressed="true"]')).toBeFocused();
    await expect.poll(async()=>(await page.locator('.filters').boundingBox())!.y).toBeLessThan(600);
    await expect(button).toBeHidden();
   }
  });
 }
}

test('the filters shortcut appears after jumping from a date past the filters',async({page})=>{
 await page.clock.install({time:new Date('2026-09-26T10:00:00Z')});
 await page.setViewportSize({width:390,height:600});
 await page.goto('http://127.0.0.1:4323');
 await page.locator('.notice details:not(.calendar-actions)').evaluateAll(elements=>elements.forEach(element=>element.setAttribute('open','')));
 await openBook(page);
 await page.locator('.upcoming-event').nth(1).click();
 await expect(page.locator('#avis-school')).toBeInViewport();
 await expect(page.getByRole('button',{name:'Filtres: Tots'})).toBeVisible();
});

test('external links open new tabs without JavaScript; internal links stay in this tab',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false});
  const page=await context.newPage();await page.goto('http://127.0.0.1:4323');
  for(const link of [page.locator('.school-calendar'),page.getByRole('link',{name:'Enllaç extern de prova',includeHidden:true})]) {
    await expect(link).toHaveAttribute('target','_blank');
    await expect(link).toHaveAttribute('rel','noopener noreferrer');
  }
  await expect(page.getByRole('link',{name:'Enllaç intern de prova',includeHidden:true})).not.toHaveAttribute('target');
  await expect(page.locator('.brand')).not.toHaveAttribute('target');
  await context.close();
});

test('calendar controls are opt-in and provide a real downloadable event',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('http://127.0.0.1:4323');
 await expect(page.locator('.calendar-actions')).toHaveCount(2);
 await page.locator('.notice.classe .calendar-actions summary').click();
 const google=page.getByRole('link',{name:'Google Calendar'});
 await expect(google).toHaveAttribute('target','_blank');
 const downloadLink=page.getByRole('link',{name:/Apple Calendar, Outlook/});
 const googleBox=await google.boundingBox();
 const downloadBox=await downloadLink.boundingBox();
 expect(Math.abs(googleBox!.height-downloadBox!.height)).toBeLessThan(1);
 await expect(page.locator('.notice.classe .calendar-options p')).toHaveText('17:00–18:00 h, hora de Barcelona');
 const params=new URL((await google.getAttribute('href'))!).searchParams;
 expect(params.get('dates')).toBe('20261005T150000Z/20261005T160000Z');
 const download=page.waitForEvent('download');
 await downloadLink.click();
 expect((await download).suggestedFilename()).toBe('class.ics');
 const response=await page.request.get('http://127.0.0.1:4323/calendar/class.ics');
 expect(response.ok()).toBe(true);expect(await response.text()).toContain('DTEND:20261005T160000Z');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('timetable images load, open separately and download their originals',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('http://127.0.0.1:4323');
 const card=page.locator('article').filter({hasText:'Avís d’escola de prova'});
 await card.locator('details:not(.calendar-actions) summary').click();
 await expect(card.locator('.notice-images img')).toHaveCount(2);
 for(const name of ['activitats-i4b-llista.jpg','activitats-i4b-per-dies.jpg']){
   const preview=card.locator(`.image-preview[href$="${name}"]`);
   await expect(preview).toHaveAttribute('target','_blank');
   await expect(preview.locator('img')).toBeVisible();
   await expect.poll(()=>preview.locator('img').evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);
   const download=page.waitForEvent('download');
   await card.locator(`a[download][href$="${name}"]`).click();
   expect((await download).suggestedFilename()).toBe(name);
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('a notice file downloads directly from its own row',async({page})=>{
 await page.setViewportSize({width:320,height:844});
 await page.goto('http://127.0.0.1:4323');
 const row=page.locator('#avis-class .file-row');
 await expect(row).toHaveText(/Pla de prova\s*PDF · 15,2 MB/);
 await expect(row).not.toHaveAttribute('target');
 const download=page.waitForEvent('download');
 await row.click();
 expect((await download).suggestedFilename()).toBe('menjador-pla-funcionament-2026-2027.pdf');
 await page.goto('http://127.0.0.1:4323/en/');
 await expect(page.locator('#avis-class .file-row')).toHaveText(/Test plan \(in Catalan\)\s*PDF · 15.2 MB/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('the menus wait in a pocket at the back of the book, and no picture loads until one is opened',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 const pictures:string[]=[];
 page.context().on('request',request=>{ if(request.url().includes('/downloads/menjador-')) pictures.push(request.url()); });
 await page.goto('http://127.0.0.1:4323');
 const cards=page.locator('#menu-cards');
 await expect(cards).toBeHidden();
 await expect(page.locator('.peek')).toHaveText(['Menú basal','Fitxa del mes','Al·lèrgies i dietes']);
 await expect(page.locator('.pocket-print b')).toHaveText('Maig · Juny');
 await page.getByRole('button',{name:'Treu els menús'}).click();
 await expect(cards).toBeVisible();
 const pocket=page.getByRole('button',{name:'Torna’ls a la butxaca'});
 await expect(pocket).toHaveAttribute('aria-expanded','true');
 const menus=page.locator('.menu-card');
 // While May's menus stay, June's come first, and the lunchtime service's sheet follows both.
 await expect(page.locator('.month-heading')).toHaveText(['Juny','Maig']);
 await expect(page.getByRole('heading',{name:'Menús de maig i de juny'})).toBeVisible();
 await expect(menus).toHaveText([/^Menú basal\s*JPG · \d+ kB/,/^Fitxa del mes\s*PDF · \d+ kB/,/^Proposta de sopars\s*JPG · \d+ kB/,/^Sense gluten/,/^Vegetarià/,/^Menú basal\s*JPG · \d+ kB/,/^Sense ou/,/^Espai migdia: contacte i preus\s*JPG · \d+ kB/]);
 for(const menu of await menus.all()){
  await expect(menu).toHaveAttribute('target','_blank');
  expect((await menu.boundingBox())!.height).toBeGreaterThanOrEqual(44);
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(pictures).toEqual([]);
 // Only the menu that is opened downloads.
 const tab=page.waitForEvent('popup');
 await page.getByRole('link',{name:/^Sense gluten/}).click();
 await expect.poll(async()=>(await tab).url()).toMatch(/\/downloads\/menjador-sense-gluten-2026-06\.jpg$/);
 expect(pictures).toEqual(['http://127.0.0.1:4323/downloads/menjador-sense-gluten-2026-06.jpg']);
 await pocket.click();
 await expect(cards).toBeHidden();
 await expect(page.getByRole('button',{name:'Treu els menús'})).toHaveAttribute('aria-expanded','false');
 await page.goto('http://127.0.0.1:4323/en/');
 await page.getByRole('button',{name:'Take the menus out'}).click();
 await expect(page.getByRole('heading',{name:'May and June menus'})).toBeVisible();
 await expect(page.getByRole('link',{name:/^No egg/})).toHaveAttribute('href',/\/downloads\/menjador-sense-ou-2026-05\.jpg$/);
 await expect(page.locator('.menu-card').first()).toHaveText(/^Main menu/);
 await expect(page.getByText('The menus are in Catalan.')).toBeVisible();
});

test('the menus link on the dates page jumps straight to the pocket, without turning the pages',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('http://127.0.0.1:4323');
 await openBook(page);
 await page.getByRole('link',{name:'Menús de maig i de juny'}).click();
 await expect(page.locator('.riffle')).not.toHaveClass(/turning/);
 await expect(page).toHaveURL(/#menus$/);
 await expect(page.getByRole('button',{name:'Treu els menús'})).toBeInViewport();
 await expect(page.locator('#menu-cards')).toBeHidden();
});

test('without JavaScript the menus lie open at the back of the book',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});
 const page=await context.newPage();await page.goto('http://127.0.0.1:4323');
 await expect(page.getByRole('link',{name:'Menús de maig i de juny'})).toHaveAttribute('href','#menus');
 await expect(page.locator('.pocket')).toBeHidden();
 await expect(page.locator('#menu-cards')).toBeVisible();
 await expect(page.locator('.menu-card')).toHaveCount(8);
 await context.close();
});

for (const colorScheme of ['light','dark'] as const) {
 test(`the pocket and its menus stay readable ${colorScheme}`,async({page})=>{
  await page.emulateMedia({colorScheme});
  await page.goto('http://127.0.0.1:4323');
  await page.getByRole('button',{name:'Treu els menús'}).click();
  for(const [text,background] of [['.pocket-action','.pocket-front'],['.pocket-print b','.pocket-front'],['.menus-hint','.menus-label'],['.menu-card small','.menu-card'],['.month-heading','.month-heading'],['.adapted-heading','.adapted-heading']]){
   const ratio=await page.locator(text).first().evaluate((element,background)=>{
    const luminance=(rgb:string)=>{
     const channels=rgb.match(/[\d.]+/g)!.slice(0,3).map(Number).map(value=>{
      const channel=value/255;
      return channel<=0.04045 ? channel/12.92 : ((channel+0.055)/1.055)**2.4;
     });
     return channels[0]*0.2126+channels[1]*0.7152+channels[2]*0.0722;
    };
    const foreground=luminance(getComputedStyle(element).color), paper=luminance(getComputedStyle(element.closest(background)!).backgroundColor);
    return (Math.max(foreground,paper)+0.05)/(Math.min(foreground,paper)+0.05);
   },background);
   expect(ratio,text).toBeGreaterThanOrEqual(4.5);
  }
 });
}

// No published notice uses the castanyera's stall yet, so a fixture keeps it drawn.
test('the castanyera’s stall, kept for the Castanyada, stands with its sign in each language',async({page})=>{
 for (const [path,sign] of [['','Castanyes'],['es/','Castañas'],['en/','Chestnuts']]){
  await page.goto(`http://127.0.0.1:4323/${path}`);
  await expect(page.locator('#avis-school .popup .piece')).toHaveCount(6);
  await expect(page.locator('#avis-school .popup text')).toHaveText(sign);
 }
});

test('a notice opens with its pop-up scene, or the school when it has none',async({page})=>{
 await page.goto('http://127.0.0.1:4323');
 await expect(page.locator('#avis-school .popup .piece').first()).toBeAttached();
 await expect(page.locator('#avis-class .popup')).toHaveCount(0);
 await expect(page.locator('#avis-class .scene-plate use')).toHaveAttribute('href','#school-scene');
 await expect(page.locator('.notice-scene [aria-hidden="true"]')).toHaveCount(2);
});

for (const width of [320,390]) {
 test(`upcoming dates open their notices and export on phones at ${width}px`,async({page})=>{
  await page.clock.install({time:new Date('2026-09-26T10:00:00Z')});
  await page.setViewportSize({width,height:844});
  await page.goto('http://127.0.0.1:4323');
  const rows=page.locator('.upcoming-event:visible');
  await expect(rows).toHaveCount(2);
  await expect(rows.first().locator('.date-leaf b')).toHaveText('OCT');
  await expect(rows.first().locator('.date-leaf > span')).toHaveText('5');
  await expect(rows.first().locator('.upcoming-when')).toHaveText('5 d’octubre, dilluns, 17:00–18:00 h');
  await expect(rows.first().locator('.upcoming-title')).toHaveText('Avís de classe de prova');
  await page.getByRole('button',{name:'Menjador',exact:true}).click();
  await expect(rows).toHaveCount(2);
  await openBook(page);
  await rows.first().click();
  const card=page.locator('#avis-class');
  await expect(card).toBeVisible();
  await expect(page.getByRole('button',{name:'Tots',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(card.locator('details').first()).toHaveAttribute('open','');
  await expect(card.locator('.stamp')).toHaveText('dl 5 oct, 17:00 h');
  await card.locator('.calendar-actions summary').click();
  await expect(card.getByRole('link',{name:'Google Calendar'})).toBeVisible();
  const download=page.waitForEvent('download');
  await card.getByRole('link',{name:/Apple Calendar/}).click();
  expect((await download).suggestedFilename()).toBe('class.ics');
  await openBook(page);
  await rows.nth(1).click();
  const school=page.locator('#avis-school');
  await expect(school.locator('.stamp')).toHaveText('dl 12 oct, tot el dia');
  await school.locator('.calendar-actions summary').click();
  const holiday=await school.getByRole('link',{name:'Google Calendar'}).getAttribute('href');
  expect(new URL(holiday!).searchParams.get('dates')).toBe('20261012/20261013');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:/Activa el mode/}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}
test('tabbing into the dates opens the book',async({page})=>{
 await page.clock.install({time:new Date('2026-09-26T10:00:00Z')});
 await page.setViewportSize({width:390,height:844});
 await page.goto('http://127.0.0.1:4323');
 await page.locator('.upcoming-event').first().focus();
 await expect.poll(()=>page.locator('.book').evaluate(book=>(book as HTMLElement).style.getPropertyValue('--turn'))).toBe('-178.00deg');
});
test('past dates expire in Barcelona time, including all-day holidays',async({page})=>{
 await page.clock.install({time:new Date('2026-10-05T16:00:00Z')});
 await page.goto('http://127.0.0.1:4323');
 await expect(page.locator('.upcoming-event:visible')).toHaveCount(1);
 await page.clock.setSystemTime(new Date('2026-10-12T21:59:00Z'));
 await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 await expect(page.locator('.upcoming-event:visible')).toHaveCount(1);
 await page.clock.setSystemTime(new Date('2026-10-12T22:00:00Z'));
 await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 await expect(page.locator('.upcoming-event:visible')).toHaveCount(0);
 await expect(page.getByText('Ara mateix no hi ha cap data a la vista.')).toBeVisible();
 await expect(page.locator('.school-calendar')).toBeVisible();
});
test('upcoming dates reach their notice and export without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});
 const page=await context.newPage();await page.goto('http://127.0.0.1:4323');
 await expect(page.locator('.upcoming-event').first()).toHaveAttribute('href','#avis-class');
 await page.locator('.upcoming-event').first().click();
 await expect(page).toHaveURL(/#avis-class$/);
 await page.locator('#avis-class .calendar-actions summary').click();
 await expect(page.locator('#avis-class').getByRole('link',{name:/Apple Calendar/})).toBeVisible();
 await context.close();
});

test('language choice persists, while explicit language links take precedence',async({page})=>{
 await page.setViewportSize({width:320,height:844});
 await page.goto('http://127.0.0.1:4323');
 await expect(page.locator('html')).toHaveAttribute('lang','ca');
 await page.locator('.language-picker summary').click();
 await page.getByRole('link',{name:'Castellano',exact:true}).click();
 await expect(page.locator('html')).toHaveAttribute('lang','es');
 await expect(page.getByRole('heading',{name:'El tablón de I4B'})).toBeAttached();
 await expect(page.locator('.notice h3')).toHaveText(['Aviso del colegio de prueba','Aviso de clase de prueba']);
 await page.goto('http://127.0.0.1:4323');
 await expect(page).toHaveURL('http://127.0.0.1:4323/es/');
 await page.goto('http://127.0.0.1:4323/en/');
 await expect(page.locator('html')).toHaveAttribute('lang','en');
 await page.getByRole('button',{name:'I4B',exact:true}).click();
 await expect(page.locator('.notice-count')).toHaveText('1 notice from I4B');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('.language-picker summary').click();
 await page.getByRole('link',{name:'Català',exact:true}).click();
 await expect(page.locator('html')).toHaveAttribute('lang','ca');
 await page.goto('http://127.0.0.1:4323');
 await expect(page.locator('html')).toHaveAttribute('lang','ca');
});

test('translated exports and language navigation work without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});
 const page=await context.newPage();
 await page.goto('http://127.0.0.1:4323/en/');
 await expect(page.locator('.upcoming-event').first().locator('.upcoming-when')).toHaveText('5 October, Monday, 17:00–18:00');
 await expect(page.locator('.upcoming-event').first().locator('.date-leaf b')).toHaveText('OCT');
 const event=page.locator('#avis-class');
 await event.locator('.calendar-actions summary').click();
 const google=new URL((await event.getByRole('link',{name:'Google Calendar'}).getAttribute('href'))!);
 expect(google.searchParams.get('text')).toBe('Test meeting');
 await expect(event.getByRole('link',{name:/Apple Calendar/})).toHaveAttribute('href','/en/calendar/class.ics');
 const response=await page.request.get('http://127.0.0.1:4323/en/calendar/class.ics');
 expect(await response.text()).toContain('SUMMARY:Test meeting');
 await page.locator('.language-picker summary').click();
 await page.getByRole('link',{name:'Castellano',exact:true}).click();
 await expect(page.locator('html')).toHaveAttribute('lang','es');
 await context.close();
});

test('blocked browser storage does not break language switching',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked');}});});
 await page.goto('http://127.0.0.1:4322');
 await page.locator('.language-picker summary').click();
 await page.getByRole('link',{name:'English',exact:true}).click();
 await expect(page.getByRole('heading',{name:'No notices yet'})).toBeVisible();
 await page.getByRole('button',{name:'Switch to dark mode'}).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','fosc');
});

test('language label and chevron align, with the dropdown anchored inside the phone viewport',async({page})=>{
 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:900});
  await page.goto('http://127.0.0.1:4322');
  const summary=page.locator('.language-picker summary');
  const label=await summary.locator('span').boundingBox();
  const icon=await summary.locator('svg').boundingBox();
  expect(Math.abs(label!.y+label!.height/2-icon!.y-icon!.height/2)).toBeLessThan(1);
  await summary.click();
  const button=await summary.boundingBox();
  const menu=await page.locator('.language-picker nav').boundingBox();
  expect(Math.abs(menu!.x+menu!.width-button!.x-button!.width)).toBeLessThan(1);
  expect(menu!.x).toBeGreaterThanOrEqual(0);
  expect(menu!.y).toBeGreaterThan(button!.y+button!.height);
 }
});

test('notices have a distinct translated heading after the book',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:390,height:844});
 for(const [path,label] of [['/?lang=ca','Els avisos'],['/es/','Los avisos'],['/en/','Notices']]){
  await page.goto('http://127.0.0.1:4323'+path);
  const heading=page.getByRole('heading',{name:label,exact:true});
  await expect(heading).toBeVisible();
  const dates=await page.locator('#dates').boundingBox();
  const title=await heading.boundingBox();
  const filters=await page.locator('.filters').boundingBox();
  expect(title!.y-dates!.y-dates!.height).toBeGreaterThanOrEqual(24);
  expect(filters!.y).toBeGreaterThan(title!.y+title!.height);
  await expect(page.getByRole('region',{name:label,exact:true})).toBeVisible();
 }
});

for (const width of [320,390]) {
 for (const colorScheme of ['light','dark'] as const) {
  test(`compact phone controls remain visible and readable at ${width}px ${colorScheme}`,async({page})=>{
   await page.setViewportSize({width,height:844});
   await page.emulateMedia({colorScheme});
   await page.clock.install({time:new Date('2026-09-26T10:00:00Z')});
   for(const path of ['/?lang=ca','/es/','/en/']){
    await page.goto('http://127.0.0.1:4323'+path);
    await expect(page.locator('.brand')).toContainText('Els Llibres');
    const controls=page.locator('.filters button, .language-picker summary, #theme-toggle, .notice details summary, .open-book');
    for(const control of await controls.all()){
     await expect(control).toBeVisible();
     const box=await control.boundingBox();
     expect(box!.height).toBeGreaterThanOrEqual(44);
     expect(box!.width).toBeGreaterThanOrEqual(44);
    }
    await expect(page.locator('.filters button')).toHaveCount(5);
    expect((await page.locator('.filters').boundingBox())!.height).toBeLessThanOrEqual(94);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    // Text on a category colour, and coloured text on paper, stay readable in both themes.
    await page.getByRole('button',{name:'I4B',exact:true}).click();
    const colors=await page.locator('.upcoming-event .date-leaf b, .tag, .stamp, .upcoming-when, .filter[aria-pressed="true"]').evaluateAll(elements=>elements.map(element=>{
     const own=getComputedStyle(element).backgroundColor;
     const paper=getComputedStyle(element.closest('.upcoming, .notice-text')||element).backgroundColor;
     return {foreground:getComputedStyle(element).color,background:own==='rgba(0, 0, 0, 0)'?paper:own};
    }));
    expect(colors.length).toBeGreaterThan(6);
    const luminance=(rgb:string)=>{
     const channels=rgb.match(/[\d.]+/g)!.slice(0,3).map(Number).map(value=>{
      const channel=value/255;
      return channel<=0.04045 ? channel/12.92 : ((channel+0.055)/1.055)**2.4;
     });
     return channels[0]*0.2126+channels[1]*0.7152+channels[2]*0.0722;
    };
    for(const {foreground,background} of colors){
     const light=luminance(foreground), dark=luminance(background);
     expect((Math.max(light,dark)+0.05)/(Math.min(light,dark)+0.05)).toBeGreaterThanOrEqual(4.5);
    }
   }
  });
 }
}

for (const reducedMotion of ['reduce','no-preference'] as const) {
 test(`shared notice links open their details on arrival with ${reducedMotion} motion`,async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion});
  await page.goto('http://127.0.0.1:4323/en/#avis-class');
  const card=page.locator('#avis-class');
  await expect(card).toBeInViewport();
  await expect(card.locator('details').first()).toHaveAttribute('open','');
  await expect(card).toHaveClass(/highlight/);
  await page.reload();
  await expect(card).toBeInViewport();
  await expect(card.locator('details').first()).toHaveAttribute('open','');
  await page.locator('.language-picker summary').click();
  await page.getByRole('link',{name:'Castellano',exact:true}).click();
  await expect(page).toHaveURL(/\/es\/#avis-class$/);
  await expect(card).toBeInViewport();
  await expect(card.locator('details').first()).toHaveAttribute('open','');
 });
}

test('hash navigation reveals a filtered notice and browser back returns to the previous notice',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:4323/?lang=ca#avis-school');
 await page.getByRole('button',{name:'Escola',exact:true}).click();
 await expect(page.locator('#avis-class')).toBeHidden();
 await page.evaluate(()=>{location.hash='avis-class';});
 await expect(page.locator('#avis-class')).toBeInViewport();
 await expect(page.locator('#avis-class details').first()).toHaveAttribute('open','');
 await expect(page.locator('.filter[data-filter="tot"]')).toHaveAttribute('aria-pressed','true');
 await page.goBack();
 await expect(page.locator('#avis-school')).toBeInViewport();
 await page.evaluate(()=>{location.hash='%invalid';});
 await expect(page.locator('.notice')).toHaveCount(2);
});

for (const [path,label,confirmation] of [['/?lang=ca','Copia l’enllaç','Enllaç copiat'],['/es/','Copiar enlace','Enlace copiado'],['/en/','Copy link','Link copied']]) {
 for (const colorScheme of ['light','dark'] as const) {
  test(`copy a notice link in ${path} with ${colorScheme} theme`,async({page})=>{
   await page.setViewportSize({width:320,height:844});
   await page.emulateMedia({colorScheme});
   await page.addInitScript(()=>{
    Object.defineProperty(navigator,'clipboard',{value:{writeText:async(text:string)=>{(window as any).copiedNotice=text;}}});
   });
   await page.goto(`http://127.0.0.1:4323${path}`);
   const share=page.locator('#avis-class').getByRole('button',{name:label,exact:true});
   await expect(share).toHaveText(label);
   await share.focus();
   await page.keyboard.press(colorScheme==='dark'?'Space':'Enter');
   await expect(page.locator('#avis-class .copy-status')).toHaveText(confirmation);
   const copied=await page.evaluate(()=>(window as any).copiedNotice);
   expect(copied).toBe(`http://127.0.0.1:4323${path}#avis-class`);
   expect((await share.boundingBox())!.height).toBeGreaterThanOrEqual(44);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   // A reader's saved English preference must not change an explicitly shared Catalan notice.
   await page.evaluate(()=>localStorage.setItem('llibres-language','en'));
   await page.goto(copied);
   await expect(page.locator('html')).toHaveAttribute('lang',path.startsWith('/es')?'es':path.startsWith('/en')?'en':'ca');
   await expect(page.locator('#avis-class')).toBeInViewport();
  });
 }
}

for (const clipboard of ['unavailable','denied'] as const) {
 test(`one click copies to the real clipboard when the Clipboard API is ${clipboard}`,async({page,context})=>{
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.setViewportSize({width:320,height:844});
  await page.goto('http://127.0.0.1:4323/en/');
  await page.evaluate(mode=>{
   const readText=navigator.clipboard.readText.bind(navigator.clipboard);
   (window as any).readCopiedNotice=readText;
   Object.defineProperty(navigator,'clipboard',{value:mode==='unavailable'?undefined:{writeText:async()=>{throw new Error('Clipboard denied');}}});
  },clipboard);
  const button=page.locator('#avis-class').getByRole('button',{name:'Copy link',exact:true});
  await button.click();
  await expect(page.locator('#avis-class .copy-status')).toHaveText('Link copied');
  expect(await page.evaluate(()=>(window as any).readCopiedNotice())).toBe('http://127.0.0.1:4323/en/#avis-class');
  await expect(page.locator('#avis-class .copy-link-fallback')).toBeHidden();
  await expect(button).toBeFocused();
  await expect(page).toHaveURL('http://127.0.0.1:4323/en/');
  await expect(page.locator('.clipboard-buffer')).toHaveCount(0);
 });
}

test('if both copy methods are blocked a selected link is available for manual copying',async({page})=>{
 await page.setViewportSize({width:320,height:844});
 await page.addInitScript(()=>{
  Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw new Error('Clipboard denied');}}});
  document.execCommand=()=>false;
 });
 await page.goto('http://127.0.0.1:4323/en/');
 await page.locator('#avis-class .copy-notice-link').click();
 const input=page.locator('#avis-class .copy-link-fallback');
 await expect(input).toBeFocused();
 await expect(input).toHaveValue('http://127.0.0.1:4323/en/#avis-class');
 await expect(page.locator('#avis-class .copy-status')).toHaveText('Select and copy this link.');
 expect(await input.evaluate((element:HTMLInputElement)=>element.selectionEnd!-element.selectionStart!)).toBe((await input.inputValue()).length);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('direct notice links still navigate without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:844}});
 const page=await context.newPage();
 await page.goto('http://127.0.0.1:4323/en/#avis-class');
 await expect(page.locator('#avis-class')).toBeInViewport();
 await page.locator('#avis-school').getByRole('link',{name:'Link to this notice'}).click();
 await expect(page).toHaveURL(/#avis-school$/);
 await expect(page.locator('#avis-school')).toBeInViewport();
 await context.close();
});
