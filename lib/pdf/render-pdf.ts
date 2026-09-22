import "server-only";
import { existsSync } from "node:fs";
import puppeteer from "puppeteer";

/** Render trusted application HTML to PDF on the Next.js server. */
export async function renderPdf(html: string, landscape = false): Promise<Uint8Array> {
  const systemChrome = process.platform === "win32"
    ? ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(existsSync)
    : undefined;
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || systemChrome;
  const browser = await puppeteer.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    const page = await browser.newPage();
    try {
      await page.setJavaScriptEnabled(false);
      await page.setContent(html, { waitUntil: "load" });
      return await page.pdf({ format: "A4", landscape, printBackground: true, displayHeaderFooter: true, headerTemplate: "<span></span>", footerTemplate: '<div style="width:100%;text-align:right;font:9px Arial;color:#637487;padding-right:12mm"><span class="pageNumber"></span> / <span class="totalPages"></span></div>' });
    } finally {
      await page.close();
    }
  } finally {
    await browser.close();
  }
}
