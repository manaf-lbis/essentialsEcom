const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, 'views');

// Mock Data for Checkout
const checkoutData = {
    totalAmount: 1000,
    totalItems: 2,
    userAddress: [{
        _id: 'addr1',
        fullName: 'Test User',
        houseName: 'Test House',
        area: 'Test Area',
        street: 'Test Street',
        pincode: '123456',
        isBlocked: false,
        defaultAddress: true
    }],
    amountAfterDiscount: 1040,
    discount: 0,
    deliveryCharge: 40,
    coupon: null,
    wallet: { balance: 5000 } // Test with wallet
};

// Mock Data for Order Details
const orderDetailsData = {
    orders: [{
        orderId: 'ORD123',
        orderDate: new Date(),
        address: {
            fullName: 'Test User',
            houseName: 'Test House',
            area: 'Test Area',
            state: 'Test State',
            pincode: '123456'
        },
        paymentMethod: 'COD',
        totalPrice: 1000,
        discount: 0,
        deliveryCharge: 40,
        finalPrice: 1040,
        coupon: null,
        orderItems: [{
            productId: {
                productName: 'Test Product',
                productImage: ['image.jpg'],
                color: 'Red',
                size: 'M',
                brand: 'Test Brand',
                sellingPrice: 500
            },
            quantity: 2,
            status: 'Delivered'
        }]
    }],
    userData: { name: 'Test User', email: 'test@example.com' }
};

// Mock Data for Wishlist
const wishlistData = {
    wishlist: {
        products: [{
            productId: {
                _id: 'prod1',
                productName: 'Wishlist Product',
                productImage: ['image.jpg'],
                color: 'Blue',
                sellingPrice: 1200,
                quantity: 10
            }
        }]
    },
    currentpage: 1,
    totalPages: 1,
    userData: { name: 'Test User', email: 'test@example.com' }
};

const logFile = path.join(__dirname, 'verification_log.txt');

function log(message) {
    console.log(message);
    fs.appendFileSync(logFile, message + '\n');
}

async function testPage(pagePath, data, pageName) {
    try {
        const fullPath = path.join(viewsDir, pagePath);
        log(`Testing ${pageName} at ${fullPath}...`);

        if (!fs.existsSync(fullPath)) {
            log(`FAIL: File not found: ${fullPath}`);
            return;
        }

        const template = fs.readFileSync(fullPath, 'utf8');

        // EJS render options
        const options = {
            filename: fullPath, // Important for includes
            root: viewsDir
        };

        ejs.render(template, data, options);
        log(`SUCCESS: ${pageName} compiled and rendered successfully.`);

    } catch (err) {
        log(`FAIL: ${pageName} failed to render.`);
        log('Error Message: ' + err.message);
        // Clean up stack trace for readability
        const stackLines = err.stack.split('\n').slice(0, 10);
        log('Stack Trace Preview:\n' + stackLines.join('\n'));
    }
}

async function runTests() {
    fs.writeFileSync(logFile, ''); // Clear log
    log('--- Starting Page Verification ---');
    await testPage('user/purchase/checkout.ejs', checkoutData, 'Checkout Page');
    log('\n');
    await testPage('user/purchase/orderDetails.ejs', orderDetailsData, 'Order Details Page');
    log('\n');
    await testPage('user/purchase/wishlist.ejs', wishlistData, 'Wishlist Page');
    log('--- Verification Complete ---');
}

runTests();
