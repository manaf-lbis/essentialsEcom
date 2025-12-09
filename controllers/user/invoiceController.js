
const { renderFile } = require("ejs");
const Order = require('../../models/orderSchema');
const path = require('path');
const puppeteer = require('puppeteer');

const generateInvoice = async (req, res) => {
    try {
        const { orderId } = req.query;

        // Fetch the order details using orderId
        const orders = await Order.findOne({ orderId }).populate('orderItems.productId');

        if (!orders) {
            return res.status(404).send('Order not found');
        }

    
        const invoicePath = path.join(__dirname, '../../views/user/invoice/invoice.ejs');
        const invoiceHtml = await renderFile(invoicePath, { orders });

        const browser = await puppeteer.launch();


        const page = await browser.newPage();
        await page.setContent(invoiceHtml);


        const pdfBuffer = await page.pdf({ format: 'A4' });

        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId}.pdf`);

        res.end(pdfBuffer);

    } catch (error) {
        console.log('Error generating invoice:', error);
        res.status(500).send('Error generating invoice');
    }
};

module.exports = {
    generateInvoice
};


