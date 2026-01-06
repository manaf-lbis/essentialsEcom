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

        // --- Colors & Fonts ---
        const primaryColor = '#2E7D32'; // Green theme from your site
        const secondaryColor = '#555555';
        const lineColor = '#E0E0E0';

        // --- Header Section ---
        doc.fillColor(primaryColor)
            .fontSize(28)
            .text('Essentials.', 50, 50, { align: 'left' })

        doc.fillColor(secondaryColor)
            .fontSize(10)
            .text('381/Essential Tower', 50, 85)
            .text('City Anagalapura, Main Road, 691723', 50, 100)
            .text('Email: support@essentials.com', 50, 115)
            .text('Phone: +123 456 7890', 50, 130);

        doc.fillColor('#000000')
            .fontSize(24)
            .text('INVOICE', 400, 50, { align: 'right' });

        doc.fontSize(10)
            .text(`Invoice #: ${order.orderId}`, 400, 85, { align: 'right' })
            .text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 400, 100, { align: 'right' });

        // Divider
        doc.strokeColor(lineColor).lineWidth(1).moveTo(50, 150).lineTo(550, 150).stroke();

        // --- Bill To Section ---
        const customerTop = 170;
        doc.fontSize(12).fillColor('#000000').font('Helvetica-Bold').text('Bill To:', 50, customerTop);
        doc.font('Helvetica').fontSize(10).fillColor(secondaryColor)
            .text(order.address.fullName, 50, customerTop + 20)
            .text(order.address.houseName, 50, customerTop + 35)
            .text(`${order.address.area}, ${order.address.street}`, 50, customerTop + 50)
            .text(`${order.address.city}, ${order.address.state} - ${order.address.pincode}`, 50, customerTop + 65)
            .text(`Phone: ${order.address.phone}`, 50, customerTop + 80);

        // --- Order Items Table ---
        doc.moveDown();
        const tableTop = 280;

        const table = {
            headers: [
                { label: "Product Description", property: 'name', width: 250, renderer: null },
                { label: "Qty", property: 'quantity', width: 50, align: 'center' },
                { label: "Unit Price", property: 'price', width: 100, align: 'right' },
                { label: "Total", property: 'total', width: 100, align: 'right' }
            ],
            datas: order.orderItems.map(item => ({
                name: item.productId ? item.productId.productName : 'Product Unavailable',
                quantity: item.quantity,
                price: `Rs. ${item.price.toFixed(2)}`,
                total: `Rs. ${(item.quantity * item.price).toFixed(2)}`
            }))
        };

        await doc.table(table, {
            x: 50,
            y: tableTop,
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10).fillColor('#FFFFFF'),
            prepareRow: (row, indexColumn, indexRow, rectRow) => {
                doc.font("Helvetica").fontSize(10).fillColor(secondaryColor);
                indexColumn === 0 && doc.addBackground(rectRow, (indexRow % 2 ? '#FAFAFA' : '#FFFFFF'), 0.15);
            },
        });

        // --- Totals Section ---
        // Calculate Y position after table (doc.y is updated by table)
        let finalY = doc.y + 20;

        // Draw a line above totals
        doc.strokeColor(lineColor).lineWidth(1).moveTo(350, finalY).lineTo(550, finalY).stroke();

        finalY += 10;

        // Subtotals
        doc.fontSize(10).fillColor(secondaryColor);

        doc.text('Subtotal:', 350, finalY, { width: 100, align: 'left' });
        doc.text(`Rs. ${(order.totalPrice || order.finalPrice + order.discount).toFixed(2)}`, 450, finalY, { width: 100, align: 'right' });

        finalY += 15;

        if (order.discount > 0) {
            doc.text('Discount:', 350, finalY, { width: 100, align: 'left' });
            doc.text(`- Rs. ${order.discount.toFixed(2)}`, 450, finalY, { width: 100, align: 'right' });
            finalY += 15;
        }

        // Grand Total
        finalY += 5;
        doc.fontSize(12).fillColor(primaryColor).font('Helvetica-Bold');
        doc.text('Grand Total:', 350, finalY, { width: 100, align: 'left' });
        doc.text(`Rs. ${order.finalPrice.toFixed(2)}`, 450, finalY, { width: 100, align: 'right' });

        // --- Footer ---
        const pageHeight = doc.page.height;
        doc.fontSize(10).fillColor(secondaryColor).font('Helvetica')
            .text('Thank you for shopping with Essentials.', 50, pageHeight - 50, { align: 'center', width: 500 });

        doc.end();

    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).send('Error generating invoice');
    }
};

module.exports = {
    generateInvoice
};
