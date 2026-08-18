const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`PAGE LOG [${msg.type()}]:`, msg.text());
  });
  
  page.on('pageerror', err => {
    console.error('PAGE ERROR:', err.toString());
  });
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    console.log('Page loaded successfully');
  } catch (error) {
    console.error('Failed to load page:', error);
  }
  
  await browser.close();
})();
