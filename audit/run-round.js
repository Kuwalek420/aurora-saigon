async (page) => {
  const notes = {};
  for (const [name, vp] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    await page.setViewportSize(vp);
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#catalog article');
    // catalog section heading + first row
    await page.locator('#catalog').scrollIntoViewIfNeeded();
    await page.evaluate(() => document.getElementById('catalog').scrollIntoView());
    await page.waitForTimeout(2500);
    await page.mouse.move(vp.width - 10, vp.height - 10);
    await page.screenshot({ path: `audit/round-${name}-catalog.png` });
    // modal
    const card = page.locator('#catalog article', { hasText: 'Anna - 6 Claw Round Solitaire' }).first();
    await card.scrollIntoViewIfNeeded();
    await card.getByRole('button', { name: /^View Anna/ }).click();
    const dialog = page.getByRole('dialog', { name: /Anna - 6 Claw/ });
    await dialog.waitFor();
    await page.waitForTimeout(2800);
    await page.mouse.move(vp.width - 10, vp.height - 10);
    await page.screenshot({ path: `audit/round-${name}-modal.png` });
    await dialog.evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `audit/round-${name}-modal-bottom.png` });
    // measure overflow + smallest tap targets
    notes[name] = await page.evaluate(() => {
      const d = [...document.querySelectorAll('[role=dialog]')].find((x) => x.getAttribute('aria-label') !== 'Shopping bag');
      const small = [...d.querySelectorAll('button')].map((b) => { const r = b.getBoundingClientRect(); return { t: (b.getAttribute('aria-label') || b.textContent.trim()).slice(0, 24), w: Math.round(r.width), h: Math.round(r.height) }; }).filter((b) => b.w > 0 && (b.w < 32 || b.h < 32));
      return { hScroll: document.documentElement.scrollWidth > innerWidth, smallTargets: small.slice(0, 8) };
    });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(700);
  }
  return JSON.stringify(notes);
}
