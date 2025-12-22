const Order = require('../../models/orderSchema');
const Products = require('../../models/productSchema')
const Category = require('../../models/categorySchema')
const User = require('../../models/userSchema')

const stringToDate = (duration, startDate, endDate) => {
    if (startDate && endDate) {
        return {
            start: new Date(startDate),
            end: new Date(new Date(endDate).setHours(23, 59, 59, 999))
        };
    }

    const now = new Date();
    let start;
    if (duration === '1day') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (duration === '1week') {
        start = new Date(now.getTime() - (1000 * 60 * 60 * 24 * 7));
    } else if (duration === '1month') {
        start = new Date(now.getTime() - (1000 * 60 * 60 * 24 * 31));
    } else {
        start = new Date(0);
    }
    return { start, end: now };
};

const generateReport = async (duration, startDate, endDate) => {
    try {
        const { start, end } = stringToDate(duration, startDate, endDate);

        const allOrders = await Order.find({
            orderDate: { $gte: start, $lte: end }
        }).populate('orderItems.productId').sort({ orderDate: -1 });

        const successfulOrders = allOrders.filter(o => !['Cancelled', 'Returned'].includes(o.status));

        const returnedOrders = allOrders.filter(o => o.status === 'Returned');
        const cancelledOrders = allOrders.filter(o => o.status === 'Cancelled');
        const deliveredOrders = allOrders.filter(o => o.status === 'Delivered');

        const globalActiveOrdersCount = await Order.countDocuments({
            status: { $in: ['Pending', 'Processing', 'Shipped', 'ReturnRequested'] }
        });

        const totalAmount = successfulOrders.reduce((acc, ele) => acc + ele.finalPrice, 0);
        const salesCount = successfulOrders.length;
        const couponDeduction = successfulOrders.reduce((acc, ele) => acc + ele.discount, 0);
        const averageOrderValue = salesCount > 0 ? (totalAmount / salesCount) : 0;

        const completedMapCount = deliveredOrders.length + returnedOrders.length + cancelledOrders.length;
        const successRate = completedMapCount > 0 ? ((deliveredOrders.length / completedMapCount) * 100) : 0;

        let totalDiscount = 0;
        successfulOrders.forEach(order => {
            const orderDiscount = order.orderItems.reduce((sum, item) => {
                if (item.productId) {
                    const discount = (item.productId.regularPrice || 0) - (item.productId.sellingPrice || 0);
                    return sum + (discount * item.quantity);
                }
                return sum;
            }, 0);
            totalDiscount += orderDiscount;
        });

        const salesTrendMap = {};
        allOrders.forEach(o => {
            const dateStr = new Date(o.orderDate).toLocaleDateString('en-GB');
            if (!salesTrendMap[dateStr]) salesTrendMap[dateStr] = 0;
            if (!['Cancelled', 'Returned'].includes(o.status)) {
                salesTrendMap[dateStr] += o.finalPrice;
            }
        });

        const salesTrend = Object.keys(salesTrendMap).sort((a, b) => {
            const [da, ma, ya] = a.split('/');
            const [db, mb, yb] = b.split('/');
            return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
        }).map(date => ({
            date,
            revenue: salesTrendMap[date]
        }));

        const mappedOrders = allOrders.slice(0, 10).map(o => {
            return {
                ...o.toObject(),
                userName: o.address?.fullName || o.userName || 'Guest User',
                status: o.status,
                paymentId: o.paymentId,
                orderItems: o.orderItems,
                finalPrice: o.finalPrice,
                orderDate: o.orderDate,
                orderId: o.orderId,
                _id: o._id
            };
        });

        return {
            totalDiscount,
            totalAmount,
            salesCount,
            couponDeduction,
            averageOrderValue,
            returnedCount: returnedOrders.length,
            cancelledCount: cancelledOrders.length,
            activeOrdersCount: globalActiveOrdersCount,
            successRate,
            orders: mappedOrders,
            salesTrend,
            range: { start, end }
        };
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const getReport = async (req, res) => {
    try {
        const { duration, startDate, endDate } = req.query;
        const report = await generateReport(duration, startDate, endDate);

        const { start, end } = stringToDate(duration, startDate, endDate);
        const ordersInRange = await Order.find({
            orderDate: { $gte: start, $lte: end }
        }).distinct('userId');
        const totalCustomers = ordersInRange.length;

        return res.status(200).json({ ...report, totalCustomers });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error generating report' });
    }
};

const downloadSalesReportPDF = async (req, res) => {
    try {
        const { duration, startDate, endDate } = req.query;
        const report = await generateReport(duration, startDate, endDate);

        const puppeteer = require('puppeteer');
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();

        const content = `
            <html>
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 0; margin: 0; background: #fff; }
                    .container { padding: 40px; }
                    .header { background: #0f172a; color: white; padding: 40px; text-align: left; position: relative; }
                    .header h1 { margin: 0; font-size: 28px; letter-spacing: -1px; }
                    .header p { margin: 5px 0 0; opacity: 0.7; font-size: 14px; }
                    .company-address { margin-top: 15px; font-size: 12px; opacity: 0.8; line-height: 1.4; }
                    .date-badge { position: absolute; top: 40px; right: 40px; background: rgba(255,255,255,0.1); padding: 10px 20px; border-radius: 8px; font-size: 12px; }

                    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
                    .kpi-card { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
                    .kpi-card h4 { margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
                    .kpi-card h2 { margin: 10px 0 0; font-size: 20px; color: #0f172a; }

                    .section-title { font-size: 18px; font-weight: 700; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 10px; }

                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
                    th { text-align: left; background: #f1f5f9; color: #475569; padding: 10px 12px; text-transform: uppercase; font-weight: 700; }
                    td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }

                    .status-pill { padding: 4px 10px; border-radius: 99px; font-size: 10px; font-weight: 600; display: inline-block; }
                    .status-delivered { background: #dcfce7; color: #166534; }
                    .status-cancelled { background: #fee2e2; color: #991b1b; }
                    .status-pending { background: #fef9c3; color: #854d0e; }
                    .status-returned { background: #fef2f2; color: #b91c1c; }
                    .status-shipped { background: #e0f2fe; color: #0369a1; }

                    .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Essentials Business Intelligence</h1>
                    <p>Official Sales and Performance Analytics Report</p>
                    <div class="company-address">
                        <strong>Essentials Electronics Pvt Ltd.</strong><br>
                        123 Tech Park, Cyber City<br>
                        Bangalore, Karnataka - 560001<br>
                        GSTIN: 29AAAAA0000A1Z5
                    </div>
                    <div class="date-badge">
                        ${report.range.start.toLocaleDateString()} - ${report.range.end.toLocaleDateString()}
                    </div>
                </div>

                <div class="container">
                    <div class="section-title">Performance Summary</div>
                    <div class="kpi-grid">
                        <div class="kpi-card"><h4>Net Revenue</h4><h2>₹${report.totalAmount.toLocaleString()}</h2></div>
                        <div class="kpi-card"><h4>Orders (Active/Net)</h4><h2>${report.activeOrdersCount} / ${report.salesCount}</h2></div>
                        <div class="kpi-card"><h4>Avg. Ticket</h4><h2>₹${Math.round(report.averageOrderValue).toLocaleString()}</h2></div>
                        <div class="kpi-card"><h4>Returns / Cancelled</h4><h2>${report.returnedCount} / ${report.cancelledCount}</h2></div>
                    </div>

                    <div class="section-title">Detailed Transaction Log</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Status</th>
                                <th>Final Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${report.orders.map(o => `
                                <tr>
                                    <td><strong>${o.orderId || o._id.toString().slice(-6).toUpperCase()}</strong></td>
                                    <td>${new Date(o.orderDate).toLocaleDateString()}</td>
                                    <td>${o.userName || o.address?.fullName || 'Guest User'}</td>
                                    <td>${o.orderItems.length} Item(s)</td>
                                    <td>
                                        <span class="status-pill status-${o.status.toLowerCase()}">
                                            ${o.status}
                                        </span>
                                    </td>
                                    <td>₹${o.finalPrice.toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="footer">
                        Essentials Electronics Admin Panel &copy; ${new Date().getFullYear()} | This is a computer-generated report.
                    </div>
                </div>
            </body>
            </html>
        `;

        await page.setContent(content);
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '0', bottom: '20px', left: '0', right: '0' } });
        await browser.close();

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename=sales-report.pdf',
            'Content-Length': pdfBuffer.length,
        });
        res.send(pdfBuffer);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating PDF');
    }
};

const generateGraphReport = async (req, res) => {
    try {
        const { duration, startDate, endDate } = req.query;
        const { start, end } = stringToDate(duration, startDate, endDate);

        const orders = await Order.find({
            orderDate: { $gte: start, $lte: end },
            status: { $nin: ['Cancelled', 'Returned'] }
        })
            .populate({
                path: 'orderItems.productId',
                populate: { path: 'category' }
            });

        const salesTrendMap = {};
        orders.forEach(o => {
            const dateStr = new Date(o.orderDate).toLocaleDateString('en-GB');
            if (!salesTrendMap[dateStr]) salesTrendMap[dateStr] = 0;
            salesTrendMap[dateStr] += o.finalPrice;
        });

        const salesTrend = Object.keys(salesTrendMap).sort((a, b) => {
            const [da, ma, ya] = a.split('/');
            const [db, mb, yb] = b.split('/');
            return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
        }).map(date => ({ date, revenue: salesTrendMap[date] }));

        const productSales = {};
        orders.forEach(order => {
            order.orderItems.forEach(item => {
                if (item.productId && item.productId.productName) {
                    const prodName = item.productId.productName;
                    if (!productSales[prodName]) productSales[prodName] = 0;
                    productSales[prodName] += item.quantity;
                }
            });
        });
        const topSellingProducts = Object.keys(productSales)
            .map(name => ({ productName: name, sellingCount: productSales[name] }))
            .sort((a, b) => b.sellingCount - a.sellingCount)
            .slice(0, 10);

        const categorySales = {};
        orders.forEach(order => {
            order.orderItems.forEach(item => {

                if (item.productId && item.productId.category) {

                    const catName = item.productId.category.name || item.productId.category.categoryName || 'Uncategorized';
                    if (!categorySales[catName]) categorySales[catName] = 0;
                    categorySales[catName] += item.quantity;
                }
            });
        });
        const topSellingCategorys = Object.keys(categorySales)
            .map(name => ({ categoryName: name, categorySalesCount: categorySales[name] }))
            .sort((a, b) => b.categorySalesCount - a.categorySalesCount)
            .slice(0, 7);

        const brandSales = {};
        orders.forEach(order => {
            order.orderItems.forEach(item => {
                if (item.productId && item.productId.brand) {
                    const brandName = item.productId.brand;

                    if (brandName) {
                        if (!brandSales[brandName]) brandSales[brandName] = 0;
                        brandSales[brandName] += item.quantity;
                    }
                }
            });
        });
        const topsellingBrand = Object.keys(brandSales)
            .map(brand => ({ _id: brand, totalSales: brandSales[brand] }))
            .sort((a, b) => b.totalSales - a.totalSales)
            .slice(0, 7);

        return res.json({
            salesTrend,
            topSellingProducts,
            topSellingCategorys,
            topsellingBrand
        });
    } catch (error) {
        console.error('Error generating graph report:', error);
        res.status(500).json({ message: 'Error generating graph report' });
    }
};

const loadDashboard = async (req, res) => {
    try {
        const report = await generateReport('1day');
        const {
            totalDiscount,
            totalAmount,
            salesCount,
            couponDeduction,
            averageOrderValue,
            salesTrend,
            returnedCount,
            cancelledCount,
            activeOrdersCount,
            successRate
        } = report;

        const recentOrders = await Order.find()
            .sort({ orderDate: -1 })
            .limit(5)
            .populate('orderItems.productId');

        const totalCustomers = await User.countDocuments({ isAdmin: false });

        return res.render('admin/dashboard', {
            totalDiscount,
            totalAmount,
            salesCount,
            couponDeduction,
            averageOrderValue,
            recentOrders,
            totalCustomers,
            salesTrend,
            returnedCount,
            cancelledCount,
            activeOrdersCount,
            successRate
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading dashboard');
    }
};

module.exports = {
    loadDashboard,
    getReport,
    downloadSalesReportPDF,
    generateGraphReport
};