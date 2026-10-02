async (page) => {
  const titles = ['Sophia Engagement Ring', 'Chloe Wedding Band With Diamond', 'Lucky Clover Leaf Peridot Pendant', 'Apollo Moon Shaped Moonstone Earrings', 'Pear Cathedral Engagement Ring in 18K Gold'];
  const results = [];
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const title of titles) {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#catalog article');
    let card = page.locator('#catalog article', { hasText: title }).first();
    for (let t = 0; t < 20 && (await card.count()) === 0; t++) {
      await page.locator('#catalog button', { hasText: /Show more/ }).first().click();
      await page.waitForTimeout(400);
      card = page.locator('#catalog article', { hasText: title }).first();
    }
    await card.scrollIntoViewIfNeeded();
    await card.getByRole('button', { name: /^View / }).click();
    const dialog = page.getByRole('dialog', { name: title });
    await dialog.waitFor();
    await page.mouse.move(1300, 850);
    await page.waitForTimeout(2500);
    const tabs = dialog.getByRole('tablist').getByRole('tab');
    const n = await tabs.count();
    for (let i = 0; i < n; i++) {
      await tabs.nth(i).click();
      await page.mouse.move(1300, 850);
      await page.waitForTimeout(2500);
      const label = await tabs.nth(i).getAttribute('aria-label');
      const slug = title.split(' ')[0].toLowerCase();
      const file = `audit/multi-${slug}-${i}-${label.toLowerCase().replace(/\s+/g, '-')}.png`;
      await page.screenshot({ path: file });
      const info = await page.evaluate(() => {
        const d = [...document.querySelectorAll('[role=dialog]')].find((x) => x.getAttribute('aria-label') !== 'Shopping bag');
        const stage = d.querySelector('.aspect-square.overflow-hidden');
        const r = stage.getBoundingClientRect();
        const imgs = [...stage.querySelectorAll('img')];
        return {
          rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
          src: imgs[imgs.length - 1].getAttribute('src'),
          layers: imgs.length,
          transform: getComputedStyle(stage.querySelector('[role=img]')).transform,
          gain: [...stage.querySelectorAll('feFuncR,feFuncG,feFuncB')].map((f) => +(+f.getAttribute('slope')).toFixed(3)),
          topFade: (getComputedStyle(stage.querySelector('[role=img]')).maskImage.match(/rgb\(0, 0, 0\) (\d+)%/g) || []).join(' '),
          stageBg: getComputedStyle(stage).backgroundColor,
          stageBorder: getComputedStyle(stage).borderTopWidth,
        };
      });
      results.push({ metal: title.split(' ').slice(0, 2).join(' '), tab: label, file, ...info });
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
  }
  return JSON.stringify(results);
}
