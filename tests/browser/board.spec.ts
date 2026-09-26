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
 await expect(page.locator('.calendar-actions')).toHaveCount(1);
 await page.locator('.calendar-actions summary').click();
 const google=page.getByRole('link',{name:'Google Calendar'});
 await expect(google).toHaveAttribute('target','_blank');
 const params=new URL((await google.getAttribute('href'))!).searchParams;
 expect(params.get('dates')).toBe('20261005T150000Z/20261005T160000Z');
 const download=page.waitForEvent('download');
 await page.getByRole('link',{name:/Apple Calendar, Outlook/}).click();
 expect((await download).suggestedFilename()).toBe('class.ics');
 const response=await page.request.get('http://127.0.0.1:4323/calendar/class.ics');
 expect(response.ok()).toBe(true);expect(await response.text()).toContain('DTEND:20261005T160000Z');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('timetable images load, open separately and download their originals',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('http://127.0.0.1:4323');
 const card=page.locator('article').filter({hasText:'Avís d’escola de prova'});
 await card.locator('summary').click();
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
