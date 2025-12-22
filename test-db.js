const mongoose = require('mongoose');
const Order = require('./models/orderSchema');

mongoose.connect('mongodb://127.0.0.1:27017/essentials')
    .then(async () => {
        console.log('=== DATABASE CHECK ===\n');

        const totalOrders = await Order.countDocuments();
        console.log(`Total Orders in DB: ${totalOrders}`);

        if (totalOrders === 0) {
            console.log('\n❌ NO ORDERS FOUND! This is why analytics are empty.');
            mongoose.disconnect();
            return;
        }

        const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });
        const successfulOrders = await Order.countDocuments({
            status: { $nin: ['Cancelled', 'Returned'] }
        });

        console.log(`Delivered Orders: ${deliveredOrders}`);
        console.log(`Successful Orders (not cancelled/returned): ${successfulOrders}`);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayOrders = await Order.countDocuments({ orderDate: { $gte: today } });
        const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const weekOrders = await Order.countDocuments({ orderDate: { $gte: last7Days } });

        console.log(`\nOrders Today: ${todayOrders}`);
        console.log(`Orders Last 7 Days: ${weekOrders}`);

        const sampleOrder = await Order.findOne().lean();
        console.log(`\nSample Order:`);
        console.log(`  ID: ${sampleOrder._id}`);
        console.log(`  Status: ${sampleOrder.status}`);
        console.log(`  Final Price: ₹${sampleOrder.finalPrice}`);
        console.log(`  Order Date: ${sampleOrder.orderDate}`);
        console.log(`  User ID: ${sampleOrder.userId}`);

        const successOrders = await Order.find({
            status: { $nin: ['Cancelled', 'Returned'] }
        });

        const totalRevenue = successOrders.reduce((sum, o) => sum + o.finalPrice, 0);
        const avgOrderValue = successOrders.length > 0 ? totalRevenue / successOrders.length : 0;

        console.log(`\n=== EXPECTED ANALYTICS (All Time) ===`);
        console.log(`Sales Count: ${successOrders.length}`);
        console.log(`Total Revenue: ₹${totalRevenue}`);
        console.log(`Average Order Value: ₹${Math.round(avgOrderValue)}`);

        mongoose.disconnect();
        console.log('\n✅ Check complete');
    })
    .catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
    });
