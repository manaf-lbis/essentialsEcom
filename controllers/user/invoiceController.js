const Order = require('../../models/orderSchema');
const PDFDocument = require('pdfkit-table');

const generateInvoice = async (req, res) => {
    try {
        const { orderId } = req.query;

        const order = await Order.findOne({ orderId }).populate('orderItems.productId');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId}.pdf`);

        doc.pipe(res);

        // Header
        doc.fillColor('#444444')
            .fontSize(20)
            .text('INVOICE', 50, 57)
            .fontSize(10)
            .text('Essentials.', 200, 50, { align: 'right' })
            .text('381/Essential Tower', 200, 65, { align: 'right' })
            .text('City Anagalapura, Main Road, 691723', 200, 80, { align: 'right' })
            .moveDown();

        // Customer Details
        doc.fontSize(20).text('Bill To:', 50, 150);
        doc.fontSize(10).text(order.address.fullName, 50, 180)
            .text(order.address.houseName, 50, 195)
            .text(`${order.address.area}, ${order.address.street}`, 50, 210)
            .text(`${order.address.city}, ${order.address.state} - ${order.address.pincode}`, 50, 225)
            .text(`Phone: ${order.address.phone}`, 50, 240)
            .moveDown();

        // Order Details
        doc.fontSize(10).text(`Invoice Number: ${order.orderId}`, 400, 180)
            .text(`Invoice Date: ${order.updatedAt.toDateString()}`, 400, 195)
            .text(`Order Date: ${order.createdAt.toDateString()}`, 400, 210)
            .moveDown();

        // Table
        const table = {
            title: "Invoice Items",
            headers: [
                { label: "Product", property: 'name', width: 200 },
                { label: "Quantity", property: 'quantity', width: 100 },
                { label: "Price", property: 'price', width: 100 },
                { label: "Total", property: 'total', width: 100 }
            ],
            datas: order.orderItems.map(item => ({
                name: item.productId ? item.productId.productName.substring(0, 30) : 'Unavailable',
                quantity: item.quantity,
                price: item.price.toFixed(2),
                total: (item.quantity * item.price).toFixed(2)
            }))
        };

        await doc.table(table, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
            prepareRow: () => doc.font("Helvetica").fontSize(10)
        });

        // Totals
        doc.moveDown();
        const totalX = 400;
        doc.text(`Discount: ${order.discount.toFixed(2)}`, totalX, doc.y);
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').fontSize(14).text(`Grand Total: ${order.finalPrice.toFixed(2)}`, totalX, doc.y);

        doc.end();

    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).send('Error generating invoice');
    }
};

module.exports = {
    generateInvoice
};
