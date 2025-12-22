const mongoose = require('mongoose');
const Order = require('./models/orderSchema');
const User = require('./models/userSchema');
const Products = require('./models/productSchema');

async function createSampleOrders() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/essentials');
        console.log('Connected to MongoDB\n');

        const users = await User.find().limit(5);
        const products = await Products.find().limit(10);

        if (users.length === 0) {
            console.log('❌ No users found. Please create at least one user first.');
            process.exit(1);
        }

        if (products.length === 0) {
            console.log('❌ No products found. Please create at least one product first.');
            process.exit(1);
        }

        console.log(`Found ${users.length} users and ${products.length} products\n`);

        const statuses = ['Delivered', 'Delivered', 'Delivered', 'Shipped', 'Pending'];
        const orders = [];

        for (let i = 0; i < 25; i++) {
            const user = users[i % users.length];
            const product = products[i % products.length];
            const quantity = Math.floor(Math.random() * 3) + 1;
            const status = statuses[i % statuses.length];

            const daysAgo = Math.floor(Math.random() * 30);
            const orderDate = new Date();
            orderDate.setDate(orderDate.getDate() - daysAgo);

            const itemPrice = product.sellingPrice * quantity;
            const discount = Math.floor(Math.random() * 300);
            const finalPrice = Math.max(itemPrice - discount, 100);

            orders.push({
                userId: user._id,
                userName: user.name || 'Guest User',
                orderItems: [{
                    productId: product._id,
                    quantity: quantity,
                    price: product.sellingPrice
                }],
                totalPrice: itemPrice,
                discount: discount,
                finalPrice: finalPrice,
                address: user.addresses && user.addresses.length > 0 ? user.addresses[0]._id : null,
                invoiceDate: orderDate,
                orderDate: orderDate,
                status: status,
                couponApplied: Math.random() > 0.6,
                paymentMethod: Math.random() > 0.5 ? 'online' : 'cod',
                paymentId: status === 'Delivered' ? `PAY${Date.now()}${i}` : null
            });
        }

        await Order.insertMany(orders);
        console.log(`✅ Created ${orders.length} sample orders!`);
        console.log(`Date range: ${orders[orders.length - 1].orderDate.toLocaleDateString()} to ${orders[0].orderDate.toLocaleDateString()}\n`);

        const delivered = orders.filter(o => o.status === 'Delivered').length;
        const totalRevenue = orders.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + o.finalPrice, 0);

        console.log('Summary:');
        console.log(`  Delivered: ${delivered}`);
        console.log(`  Total Revenue: ₹${totalRevenue}`);
        console.log(`  Avg Order Value: ₹${Math.round(totalRevenue / delivered)}`);

        mongoose.disconnect();
        console.log('\n✅ Done! Refresh your dashboard now.');

    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

createSampleOrders();
