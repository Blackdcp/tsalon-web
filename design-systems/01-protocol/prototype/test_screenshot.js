const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:4321/tokenrank/');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/Users/black/.gemini/antigravity/brain/167bc4aa-d3b1-4513-af8b-87bc2f216be7/tokenrank_preview.png', fullPage: true });
  await browser.close();
})();
