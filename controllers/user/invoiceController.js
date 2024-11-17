// const { renderFile } = require("ejs");
// const Order = require('../../models/orderSchema')
// const path = require('path')
// const ejs = require('ejs');
// const puppeteer = require('puppeteer')

// const generateInvoice = async (req, res) => {

//     try {

//         // const { orderId } = req.query;

//         // const orders = await Order.findOne({ orderId }).populate('orderItems.productId')


//         // const invoicePath = path.join(__dirname, '../../views/user/invoice/invoice.ejs');
//         // const invoiceHtml = await ejs.renderFile(invoicePath, {orders});

//         // const browser = await puppeteer.launch();
//         // const page = await browser.newPage();
//         // await page.setContent(invoiceHtml);
//         // await page.pdf({ path: "invoice.pdf", format: "A4" });
//         // await browser.close();

//         //  // Respond with the PDF for download
//         //  res.download(pdfPath, `invoice-${orderId}.pdf`, (err) => {
//         //     if (err) {
//         //         console.log('Error sending file:', err);
//         //         res.status(500).send('Error generating invoice');
//         //     }
//         // });


//         const { orderId } = req.query;

//         // Fetch order details based on the orderId
//         const orders = await Order.findOne({ orderId }).populate('orderItems.productId');

//         // Path to the EJS template
//         const invoicePath = path.join(__dirname, '../../views/user/invoice/invoice.ejs');

//         // Render HTML from the EJS template with order data
//         const invoiceHtml = await ejs.renderFile(invoicePath, { orders });

//         // Launch Puppeteer to generate the PDF
//         const browser = await puppeteer.launch();
//         const page = await browser.newPage();
//         await page.setContent(invoiceHtml);
        
//         // Generate PDF in memory and send it to the client directly
//         const pdfBuffer = await page.pdf({ format: 'A4' });
//         await browser.close();

//         // Set headers for PDF download and send the PDF as a response
//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId}.pdf`);
//         res.send(pdfBuffer);


//     } catch (error) {

//         console.log(error);

//     }

// };


// module.exports = {
//     generateInvoice
// }



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
