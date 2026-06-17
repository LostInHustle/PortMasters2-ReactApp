import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

// Hit the SINGLE-PORT production server (no Vite)
await page.goto('http://localhost:8080/');
await page.waitForSelector('#login-overlay', { timeout: 5000 });
await page.screenshot({ path: '/tmp/pm2_styled_01_login_en.png' });

// Verify the login overlay is actually styled (fixed, centered, has a glass box)
const overlayStyles = await page.locator('#login-overlay').evaluate((el) => {
  const cs = getComputedStyle(el);
  return { position: cs.position, display: cs.display, justifyContent: cs.justifyContent };
});
console.log('login-overlay computed:', JSON.stringify(overlayStyles));

const boxBg = await page.locator('.login-box').evaluate((el) => getComputedStyle(el).backgroundColor);
console.log('login-box has background:', boxBg);

// Language toggle present on login page?
const langBtnCount = await page.locator('#login-overlay button:has-text("中文")').count();
console.log('lang toggle on login page:', langBtnCount > 0);

// Toggle to Chinese and screenshot
await page.click('#login-overlay button:has-text("中文")');
await page.waitForTimeout(200);
await page.screenshot({ path: '/tmp/pm2_styled_02_login_zh.png' });
const langBtnAfter = await page.locator('#login-overlay button:has-text("English")').count();
console.log('toggled to Chinese, English-switch button now shows:', langBtnAfter > 0);
// toggle back to English
await page.click('#login-overlay button:has-text("English")');
await page.waitForTimeout(150);

console.log('CONSOLE ERRORS:', JSON.stringify(errors));
await browser.close();
