import { Injectable, OnModuleDestroy } from '@nestjs/common';
import puppeteer, { Browser } from 'puppeteer';

// Renders report HTML to a single PDF server-side, so the client never has to
// lay out thousands of pages in the browser. One headless browser is reused
// across requests; each request gets its own page and closes it afterwards.
@Injectable()
export class PdfService implements OnModuleDestroy {
    private browser: Browser | null = null;
    private launching: Promise<Browser> | null = null;

    private async getBrowser(): Promise<Browser> {
        if (this.browser && this.browser.connected) return this.browser;
        if (!this.launching) {
            this.launching = puppeteer
                .launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
                .then((b) => {
                    this.browser = b;
                    this.launching = null;
                    return b;
                });
        }
        return this.launching;
    }

    async htmlToPdf(html: string): Promise<Buffer> {
        const browser = await this.getBrowser();
        const page = await browser.newPage();
        try {
            // Data-URI images resolve instantly; `load` is enough and avoids a
            // networkidle timeout when there are no external requests.
            await page.setContent(html, { waitUntil: 'load', timeout: 120000 });
            const pdf = await page.pdf({
                printBackground: true,
                preferCSSPageSize: true, // honour the report's own @page size/margins
            });
            return Buffer.from(pdf);
        } finally {
            await page.close().catch(() => undefined);
        }
    }

    async onModuleDestroy() {
        if (this.browser) await this.browser.close().catch(() => undefined);
    }
}
