
const { renderFile } = require("ejs");
const Order = require('../../models/orderSchema');
const path = require('path');
const puppeteer = require('puppeteer');

try {
    const { orderId } = req.query;

    const orders = await Order.findOne({ orderId }).populate('orderItems.productId');

    if (!orders) {
        return res.status(404).send('Order not found');
    }

    const invoicePath = path.join(__dirname, '../../views/user/invoice/invoice.ejs');

    let invoiceHtml;
    try {
        invoiceHtml = await renderFile(invoicePath, { orders });
    } catch (err) {
        console.error('Error rendering invoice template:', err);
        return res.status(500).send('Error rendering invoice template');
    }

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage', // critical for docker/cloud envs
                '--disable-gpu',
                '--no-first-run',
                '--no-zygote',
                '--single-process', // Critical for Render Free Tier (512MB RAM)
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined, // allow env override
        });

        const page = await browser.newPage();

        // Set content with a reasonable timeout
        await page.setContent(invoiceHtml, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true
        });

        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId}.pdf`);

        res.end(pdfBuffer);

    } catch (puppeteerError) {
        console.error('Puppeteer error:', puppeteerError);
        if (browser) await browser.close();
        throw puppeteerError; // rethrow to be caught by outer catch
    }

} catch (error) {
    console.error('CRITICAL Error generating invoice:', error);
    res.status(500).send(`Error generating invoice: ${error.message}`);
}
};

module.exports = {
    generateInvoice
};

