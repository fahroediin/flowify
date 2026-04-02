const sharp = require('sharp');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

exports.exportSvg = async (svgContent, format, scale = 2) => {
    if (format === 'svg') {
        return Buffer.from(svgContent, 'utf-8');
    }

    if (format === 'png') {
        // We use sharp to convert svg to png. But first need to wrap it correctly if needed or let sharp handle it.
        try {
            const density = 72 * scale;
            const buffer = await sharp(Buffer.from(svgContent, 'utf-8'), { density })
                .png()
                .toBuffer();
            return buffer;
        } catch (error) {
            console.error('Sharp SVG to PNG error:', error);
            throw error;
        }
    }

    if (format === 'pdf') {
        // Use puppeteer for PDF to ensure exact rendering
        const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
        const page = await browser.newPage();
        
        // Wrap SVG in HTML to center it and remove margins
        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <style>
                        body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #ffffff; }
                        svg { max-width: 100%; height: auto; }
                    </style>
                </head>
                <body>
                    ${svgContent}
                </body>
            </html>
        `;

        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ 
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });

        await browser.close();
        return pdfBuffer;
    }

    throw new Error('Unsupported format');
};
