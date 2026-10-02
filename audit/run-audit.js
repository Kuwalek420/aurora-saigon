async (page) => {
  const results = [];
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000');
  await page.waitForSelector('#catalog article');
  const card = page.locator('#catalog article', { hasText: 'Anna - 6 Claw Round Solitaire' }).first();
  await card.scrollIntoViewIfNeeded();
  await card.getByRole('button', { name: /^View Anna/ }).click();
  const dialog = page.getByRole('dialog', { name: /Anna - 6 Claw/ });
  await dialog.waitFor();
  await page.waitForTimeout(3000);
  // keep the pointer parked well away from the stage so the magnifier cannot engage
  await page.mouse.move(1300, 850);

  const metals = ['Yellow Gold', 'Rose Gold', 'White Gold', 'Platinum'];
  for (const metal of metals) {
    await dialog.getByRole('radiogroup', { name: 'Metal' }).getByRole('radio', { name: metal }).click();
    await page.mouse.move(1300, 850);
    await page.waitForTimeout(2200);
    const tabs = dialog.getByRole('tablist').getByRole('tab');
    const n = await tabs.count();
    for (let i = 0; i < n; i++) {
      await tabs.nth(i).click();
      await page.mouse.move(1300, 850);
      await page.waitForTimeout(2600);
      const label = await tabs.nth(i).getAttribute('aria-label');
      const file = `audit/${metal.split(' ')[0].toLowerCase()}-${i}-${label.toLowerCase().replace(/\s+/g, '-')}.png`;
      await page.screenshot({ path: file });
      const info = await page.evaluate(() => {
        const d = [...document.querySelectorAll('[role=dialog]')].find((x) => x.getAttribute('aria-label') !== 'Shopping bag');
        const stage = d.querySelector('.aspect-square.overflow-hidden');
        const r = stage.getBoundingClientRect();
        const imgs = [...stage.querySelectorAll('img')];
        const img = imgs[imgs.length - 1];
        const cs = (el, p) => getComputedStyle(el)[p];
        return {
          rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
          src: img.getAttribute('src'),
          layers: imgs.length,
          modalBg: cs(d, 'backgroundColor'),
          stageBg: cs(stage, 'backgroundColor'),
          stageBorder: cs(stage, 'borderTopWidth'),
          transform: cs(stage.querySelector('[role=img]'), 'transform'),
          gain: [...stage.querySelectorAll('feFuncR,feFuncG,feFuncB')].map((f) => +(+f.getAttribute('slope')).toFixed(3)),
          topFade: (cs(stage.querySelector('[role=img]'), 'maskImage').match(/rgb\(0, 0, 0\) (\d+)%/g) || []).join(' '),
        };
      });
      results.push({ metal, tab: label, file, ...info });
    }
  }
  return JSON.stringify(results);
}
