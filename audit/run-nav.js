async (page) => {
  const out = {};
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000');
  await page.waitForSelector('#catalog article');
  await page.waitForTimeout(1500);

  // ---- mega menus, opened over the dark hero --------------------------------------------------
  const nav = page.getByRole('navigation', { name: 'Primary' });
  await nav.getByRole('button', { name: 'Engagement Rings' }).hover();
  await page.waitForTimeout(1100);
  await page.mouse.move(700, 600);
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'audit/nav-engagement.png' });
  const read = (id) => page.evaluate((i) => {
    const m = document.getElementById(i);
    if (!m) return null;
    const r = m.getBoundingClientRect();
    return { columns: [...m.querySelectorAll('h3')].map((h) => h.textContent), links: [...m.querySelectorAll('col-span-8 button, .col-span-8 button')].map((b) => b.textContent.trim()), card: m.querySelector('figcaption p')?.textContent, cta: [...m.querySelectorAll('figcaption button')].map((b) => b.textContent.trim()), top: Math.round(r.top), height: Math.round(r.height), bg: getComputedStyle(m).backgroundColor, header: getComputedStyle(document.querySelector('header')).backgroundColor };
  }, id);
  out.engagement = await read('menu-engagement');

  await nav.getByRole('button', { name: 'Wedding Rings' }).hover();
  await page.waitForTimeout(1100);
  await page.mouse.move(700, 600);
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'audit/nav-wedding.png' });
  out.wedding = await read('menu-wedding');

  // ---- a menu link applies real filters --------------------------------------------------------
  await nav.getByRole('button', { name: 'Engagement Rings' }).hover();
  await page.waitForTimeout(900);
  await page.locator('#menu-engagement').getByRole('button', { name: 'Oval', exact: true }).click();
  await page.waitForTimeout(2600);
  out.afterMenuOval = await page.evaluate(() => ({
    category: document.querySelector('[role=tab][aria-selected=true]')?.textContent.trim(),
    bar: [...document.querySelectorAll('#catalog .sticky button[aria-expanded]')].map((b) => b.textContent.trim()),
    cards: document.querySelectorAll('#catalog article').length,
    subtitles: [...document.querySelectorAll('#catalog article p.uppercase')].slice(0, 3).map((p) => p.textContent),
    menuClosed: !document.getElementById('menu-engagement'),
    scrollY: Math.round(scrollY),
  }));

  // ---- filter bar: sticky + popovers -----------------------------------------------------------
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(1200);
  out.stickyTop = await page.evaluate(() => Math.round(document.querySelector('#catalog .sticky').getBoundingClientRect().top));
  const bar = page.locator('#catalog .sticky');
  await bar.getByRole('button', { name: /^Shape/ }).click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'audit/filter-shape.png' });
  out.shapeOptions = await bar.getByRole('group', { name: 'Shape' }).getByRole('button').allTextContents();
  await bar.getByRole('group', { name: 'Shape' }).getByRole('button', { name: 'Pear' }).click();
  await page.waitForTimeout(900);
  await bar.getByRole('button', { name: /^Setting style/ }).click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'audit/filter-setting.png' });
  out.settingOptions = await bar.getByRole('group', { name: 'Setting style' }).getByRole('button').allTextContents();
  await bar.getByRole('group', { name: 'Setting style' }).getByRole('button', { name: 'Halo' }).click();
  await page.waitForTimeout(1200);
  out.afterPearHalo = await page.evaluate(() => ({
    count: document.querySelector('#catalog .sticky [aria-live] span')?.textContent,
    cards: document.querySelectorAll('#catalog article').length,
    active: [...document.querySelectorAll('#catalog .sticky button[aria-expanded]')].map((b) => ({ t: b.textContent.trim(), border: getComputedStyle(b).borderTopColor })),
    resetLabel: document.querySelector('#catalog .sticky button[aria-label^="Reset"]')?.getAttribute('aria-label'),
    resetText: document.querySelector('#catalog .sticky button[aria-label^="Reset"]')?.textContent.trim(),
    clearLinks: [...document.querySelectorAll('#catalog button')].filter((b) => /^clear$/i.test(b.textContent.trim())).length,
  }));
  await page.screenshot({ path: 'audit/filter-active.png' });
  await bar.getByRole('button', { name: /^Reset/ }).click();
  await page.waitForTimeout(900);
  out.afterReset = await page.evaluate(() => ({ count: document.querySelector('#catalog .sticky [aria-live] span')?.textContent, category: document.querySelector('[role=tab][aria-selected=true]')?.textContent.trim(), resetShown: !!document.querySelector('#catalog .sticky button[aria-label^="Reset"]') }));

  // metal filter matches offered finishes, not just the photographed one
  await bar.getByRole('button', { name: /^Metal type/ }).click();
  await page.waitForTimeout(500);
  await bar.getByRole('group', { name: 'Metal type' }).getByRole('button', { name: 'Rose Gold' }).click();
  await page.waitForTimeout(900);
  out.roseGoldCount = await page.evaluate(() => document.querySelector('#catalog .sticky [aria-live] span')?.textContent);
  await bar.getByRole('button', { name: /^Reset/ }).click();

  // ---- SEO accordion ---------------------------------------------------------------------------
  await page.evaluate(() => document.getElementById('the-aurora-standard').scrollIntoView());
  await page.waitForTimeout(2200);
  const seo = () => page.evaluate(() => {
    const more = document.getElementById('seo-more');
    const cs = getComputedStyle(more), r = more.getBoundingClientRect();
    return { expanded: document.getElementById('seo-trigger').getAttribute('aria-expanded'), regionHeight: Math.round(r.height), display: cs.display, visibility: cs.visibility, textChars: more.textContent.length, h3: [...more.querySelectorAll('h3')].map((h) => h.textContent), inDom: document.body.innerText.length > 0 && more.textContent.includes('However you choose to begin'), footerAfter: document.getElementById('the-aurora-standard').nextElementSibling?.tagName };
  });
  out.seoClosed = await seo();
  await page.screenshot({ path: 'audit/seo-closed.png' });
  await page.locator('#seo-trigger').click();
  await page.waitForTimeout(1400);
  out.seoOpen = await seo();
  await page.screenshot({ path: 'audit/seo-open.png' });
  await page.locator('#seo-trigger').click();

  // ---- phone ------------------------------------------------------------------------------------
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:3000');
  await page.waitForSelector('#catalog article');
  await page.evaluate(() => document.getElementById('catalog').scrollIntoView());
  await page.waitForTimeout(2200);
  await page.evaluate(() => window.scrollBy(0, 330));
  await page.waitForTimeout(800);
  const mbar = page.locator('#catalog .sticky');
  await mbar.getByRole('button', { name: /^Shape/ }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'audit/filter-mobile.png' });
  out.mobile = await page.evaluate(() => {
    const panel = [...document.querySelectorAll('#catalog .sticky [data-lenis-prevent]')][0];
    const r = panel?.getBoundingClientRect();
    return { hScroll: document.documentElement.scrollWidth > innerWidth, panelFixedBottom: panel ? getComputedStyle(panel).position === 'fixed' && Math.round(innerHeight - r.bottom) === 0 : null, panelW: r && Math.round(r.width), barBtns: [...document.querySelectorAll('#catalog .sticky button[aria-expanded]')].map((b) => { const q = b.getBoundingClientRect(); return Math.round(q.height); }) };
  });
  return JSON.stringify(out);
}
