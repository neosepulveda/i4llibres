import { test, expect } from '@playwright/test';
for (const width of [1440,390,320]) {
  for (const colorScheme of ['light','dark'] as const) {
    test(`empty board ${width}px ${colorScheme}`, async ({ page }) => {
      await page.setViewportSize({width,height:900});
      await page.emulateMedia({colorScheme});
      await page.goto('http://127.0.0.1:4322');
      await expect(page.locator('html')).toHaveAttribute('lang','ca');
      await expect(page.getByRole('heading',{name:'Encara no hi ha cap avís'})).toBeVisible();
      await expect(page.locator('.notice')).toHaveCount(0);
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
  await expect(page.locator('.notice h2')).toHaveText(['Avís d’escola de prova', 'Avís de classe de prova']);
  await expect(page.getByRole('button',{name:'Calendari',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'I4B · Llibres',exact:true}).click();
  await expect(page.locator('.notice:visible')).toHaveCount(1);
  await expect(page.locator('.notice-count')).toHaveText('1 avís');
  await page.locator('.notice:visible details:not(.calendar-actions) summary').click();
  await expect(page.getByText('Detall del conte de prova.')).toBeVisible();
  await page.getByRole('button',{name:'Menjador',exact:true}).click();
  await expect(page.getByRole('heading',{name:'No hi ha avisos d’aquesta categoria'})).toBeVisible();
  await page.getByRole('button',{name:'Mostra tots els avisos'}).click();
  await expect(page.locator('.notice:visible')).toHaveCount(2);
});
test('empty state works without JavaScript',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false});
  const page=await context.newPage();await page.goto('http://127.0.0.1:4322');
  await expect(page.getByRole('heading',{name:'Encara no hi ha cap avís'})).toBeVisible();
  await expect(page.locator('#theme-toggle')).toBeHidden();await context.close();
});

for (const width of [320,390]) {
 for (const colorScheme of ['light','dark'] as const) {
  test(`back to top on phones at ${width}px ${colorScheme}`,async({page})=>{
   await page.setViewportSize({width,height:600});
   await page.emulateMedia({colorScheme,reducedMotion:colorScheme==='dark'?'reduce':'no-preference'});
   for(const [path,label] of [['/?lang=ca','Torna a dalt'],['/es/','Volver arriba'],['/en/','Back to top']]){
    await page.goto('http://127.0.0.1:4323'+path);
    const button=page.getByRole('button',{name:label,includeHidden:true});
    await expect(button).toBeHidden();
    await page.locator('.notice details:not(.calendar-actions)').evaluateAll(elements=>elements.forEach(element=>element.setAttribute('open','')));
    await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
    await expect(button).toBeVisible();
    const box=await button.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.x+box!.width).toBeLessThanOrEqual(width-16);
    expect(box!.y+box!.height).toBeLessThanOrEqual(600-16);
    await button.focus();
    await page.keyboard.press('Enter');
    await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(0);
    await expect(button).toBeHidden();
    await expect(page.locator('.brand')).toBeFocused();
   }
  });
 }
}

test('external links open new tabs without JavaScript; internal links stay in this tab',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false});
  const page=await context.newPage();await page.goto('http://127.0.0.1:4323');
  for(const link of [page.locator('.useful-links a'),page.getByRole('link',{name:'Enllaç extern de prova',includeHidden:true})]) {
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

for (const width of [320,390]) {
 test(`upcoming dates open their notices and export on phones at ${width}px`,async({page})=>{
  await page.clock.install({time:new Date('2026-09-26T10:00:00Z')});
  await page.setViewportSize({width,height:844});
  await page.goto('http://127.0.0.1:4323');
  const rows=page.locator('.upcoming-event:visible');
  await expect(rows).toHaveCount(2);
  await expect(rows.first().locator('.upcoming-day strong')).toHaveText('5');
  await expect(rows.first().locator('.upcoming-when')).toContainText('17:00–18:00 h');
  await expect(rows.first().locator('.upcoming-when small')).toHaveText('dilluns');
  await expect(rows.first().locator('.upcoming-title')).toHaveText('Avís de classe de prova');
  await page.getByRole('button',{name:'Menjador',exact:true}).click();
  await expect(rows).toHaveCount(2);
  await rows.first().click();
  const card=page.locator('#avis-class');
  await expect(card).toBeVisible();
  await expect(page.getByRole('button',{name:'Tots els avisos'})).toHaveAttribute('aria-pressed','true');
  await expect(card.locator('details').first()).toHaveAttribute('open','');
  await expect(card.locator('.chip')).toHaveText('dl 5 oct · 17:00 h');
  await card.locator('.calendar-actions summary').click();
  await expect(card.getByRole('link',{name:'Google Calendar'})).toBeVisible();
  const download=page.waitForEvent('download');
  await card.getByRole('link',{name:/Apple Calendar/}).click();
  expect((await download).suggestedFilename()).toBe('class.ics');
  await rows.nth(1).click();
  const school=page.locator('#avis-school');
  await expect(school.locator('.chip')).toHaveText('dl 12 oct · tot el dia');
  await school.locator('.calendar-actions summary').click();
  const holiday=await school.getByRole('link',{name:'Google Calendar'}).getAttribute('href');
  expect(new URL(holiday!).searchParams.get('dates')).toBe('20261012/20261013');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:/Activa el mode/}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}
test('past dates expire in Barcelona time, including all-day holidays',async({page})=>{
 await page.clock.install({time:new Date('2026-10-05T16:00:00Z')});
 await page.goto('http://127.0.0.1:4323');
 await expect(page.locator('.upcoming-event:visible')).toHaveCount(1);
 await page.clock.setSystemTime(new Date('2026-10-12T21:59:00Z'));
 await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 await expect(page.locator('.upcoming-event:visible')).toHaveCount(1);
 await page.clock.setSystemTime(new Date('2026-10-12T22:00:00Z'));
 await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 await expect(page.locator('.upcoming')).toBeHidden();
 await expect(page.locator('.useful-links')).toBeVisible();
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
 await expect(page.getByRole('heading',{name:'Las cosas que nos importan.'})).toBeVisible();
 await expect(page.locator('.notice h2')).toHaveText(['Aviso del colegio de prueba','Aviso de clase de prueba']);
 await page.goto('http://127.0.0.1:4323');
 await expect(page).toHaveURL('http://127.0.0.1:4323/es/');
 await page.goto('http://127.0.0.1:4323/en/');
 await expect(page.locator('html')).toHaveAttribute('lang','en');
 await page.getByRole('button',{name:'I4B · Llibres',exact:true}).click();
 await expect(page.locator('.notice-count')).toHaveText('1 notice');
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
 await expect(page.locator('.upcoming-event').first().locator('.upcoming-when')).toContainText('17:00–18:00');
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

test('notices have a distinct translated heading after the calendar links',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 for(const [path,label] of [['/?lang=ca','Els avisos'],['/es/','Los avisos'],['/en/','Notices']]){
  await page.goto('http://127.0.0.1:4323'+path);
  const heading=page.getByRole('heading',{name:label,exact:true});
  await expect(heading).toBeVisible();
  const calendar=await page.locator('.useful-links').boundingBox();
  const title=await heading.boundingBox();
  const filters=await page.locator('.board-toolbar').boundingBox();
  expect(title!.y-calendar!.y-calendar!.height).toBeGreaterThanOrEqual(28);
  expect(filters!.y).toBeGreaterThan(title!.y+title!.height);
  await expect(page.getByRole('region',{name:label,exact:true})).toBeVisible();
 }
});
