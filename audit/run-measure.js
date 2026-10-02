async (page) => {
  const out = {};
  // mobile header geometry
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:3000');
  await page.waitForSelector('#catalog article');
  await page.waitForTimeout(1500);
  out.mobileHeader = await page.evaluate(() => {
    const h = document.querySelector('header');
    const brand = h.querySelector('button[aria-label="Aurora Saigon home"]').getBoundingClientRect();
    const cur = h.querySelector('[role=group][aria-label=Currency]').getBoundingClientRect();
    const bag = h.querySelector('button[aria-label^="Open cart"]').getBoundingClientRect();
    return { brandRight: Math.round(brand.right), currencyLeft: Math.round(cur.left), gap: Math.round(cur.left - brand.right), bagRight: Math.round(bag.right), viewport: innerWidth };
  });
  // desktop thumbnail labels
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000');
  await page.waitForSelector('#catalog article');
  const card = page.locator('#catalog article', { hasText: 'Anna - 6 Claw Round Solitaire' }).first();
  await card.scrollIntoViewIfNeeded();
  await card.getByRole('button', { name: /^View Anna/ }).click();
  const dialog = page.getByRole('dialog', { name: /Anna - 6 Claw/ });
  await dialog.waitFor();
  await page.waitForTimeout(2000);
  out.thumbLabels = await dialog.getByRole('tablist').getByRole('tab').evaluateAll((tabs) =>
    tabs.map((t) => { const l = t.querySelector('span:last-child'); const r = l.getBoundingClientRect(); const range = document.createRange(); range.selectNodeContents(l); return { text: l.textContent, lines: Math.round(range.getBoundingClientRect().height / parseFloat(getComputedStyle(l).lineHeight || '12')) || 1, w: Math.round(range.getBoundingClientRect().width), box: Math.round(r.width) }; }));
  return JSON.stringify(out);
}
