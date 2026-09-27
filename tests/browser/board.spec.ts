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
  await expect(page.locator('#theme-toggle')).toBeHidden();await context.close();
});

for (const width of [390,1280]) {
 test(`the closed book fills the first screen and opens as you scroll at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:844});
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
