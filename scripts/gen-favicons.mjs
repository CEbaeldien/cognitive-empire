import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const svgRaw = readFileSync(join(root, "public/brand/ce-favicon.svg"), "utf8");
const svgB64 = Buffer.from(svgRaw).toString("base64");

const SIZES = [
  { out: "public/apple-touch-icon.png", size: 180 },
  { out: "public/icon-192.png",         size: 192 },
  { out: "public/icon-512.png",         size: 512 },
  { out: "public/favicon-32.png",       size: 32  },
  { out: "public/favicon-16.png",       size: 16  },
];

(async () => {
  const browser = await chromium.launch();
  for (const { out, size } of SIZES) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;background:#050505;overflow:hidden">
      <img src="data:image/svg+xml;base64,${svgB64}" width="${size}" height="${size}" style="display:block"/>
    </body></html>`);
    await page.waitForLoadState("networkidle");
    const buf = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: size, height: size } });
    writeFileSync(join(root, out), buf);
    console.log(`✓ ${out} (${size}×${size})`);
    await page.close();
  }
  await browser.close();
})();
