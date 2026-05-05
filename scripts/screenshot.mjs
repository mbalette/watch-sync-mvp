import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');
const BASE_URL = 'http://localhost:5173';

async function takeScreenshots() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });

  // Mobile viewport (390px width - iPhone 14 Pro)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  const mobilePage = await mobileContext.newPage();

  // Desktop viewport
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const desktopPage = await desktopContext.newPage();

  try {
    // 1. Welcome/Landing screen - Mobile
    console.log('Taking welcome screen screenshot (mobile)...');
    await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1000);
    await mobilePage.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01-welcome-mobile.png'),
      fullPage: false
    });
    console.log('  Saved: 01-welcome-mobile.png');

    // 2. Welcome screen - Desktop
    console.log('Taking welcome screen screenshot (desktop)...');
    await desktopPage.goto(BASE_URL, { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(1000);
    await desktopPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, '02-welcome-desktop.png'),
      fullPage: false
    });
    console.log('  Saved: 02-welcome-desktop.png');

    // 3. Create a room to see room screen
    console.log('Looking for create room button...');

    // Look for create room button and click it
    const createBtn = mobilePage.locator('button:has-text("Create"), button:has-text("Host"), button:has-text("Start")').first();
    if (await createBtn.isVisible().catch(() => false)) {
      console.log('  Found create button, clicking...');
      await createBtn.click();
      await mobilePage.waitForTimeout(2000);
    } else {
      console.log('  No create button found, checking page state...');
    }

    // Take room screen screenshot
    console.log('Taking room screen screenshot (mobile)...');
    await mobilePage.screenshot({
      path: path.join(SCREENSHOTS_DIR, '03-room-mobile.png'),
      fullPage: false
    });
    console.log('  Saved: 03-room-mobile.png');

    // 4. Try to expand chat
    console.log('Looking for chat toggle...');
    const chatToggle = mobilePage.locator('button[aria-label*="chat"], button:has-text("Chat"), [data-chat-toggle], .chat-toggle').first();
    if (await chatToggle.isVisible().catch(() => false)) {
      console.log('  Found chat toggle, clicking...');
      await chatToggle.click();
      await mobilePage.waitForTimeout(500);
    }
    await mobilePage.screenshot({
      path: path.join(SCREENSHOTS_DIR, '04-chat-expanded-mobile.png'),
      fullPage: false
    });
    console.log('  Saved: 04-chat-expanded-mobile.png');

    // 5. Desktop room view
    console.log('Taking desktop room screenshot...');
    await desktopPage.goto(mobilePage.url(), { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(1000);
    await desktopPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, '05-room-desktop.png'),
      fullPage: false
    });
    console.log('  Saved: 05-room-desktop.png');

    console.log('\nAll screenshots captured successfully!');

  } catch (error) {
    console.error('Error taking screenshots:', error);
    // Take error state screenshots
    await mobilePage.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'error-mobile.png'),
      fullPage: true
    });
    await desktopPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'error-desktop.png'),
      fullPage: true
    });
  } finally {
    await browser.close();
  }
}

takeScreenshots();
