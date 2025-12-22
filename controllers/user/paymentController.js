const Order = require('../../models/orderSchema')
const crypto = require('crypto')
const createOrder = require('../../controllers/user/orderController')
const Cart = require('../../models/cartSchema')
const razorpayInstance = require('../../config/razorpay')

const paymentResponse = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        const secret = process.env.RAZORPAY_KEY_SECRET;

        const generatedSignature = crypto
            .createHmac('sha256', secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generatedSignature === razorpay_signature) {

            const orderDetails = await Order.findOne({ paymentId: razorpay_order_id });

            if (!orderDetails) {
                console.log("Order not found with paymentId:", razorpay_order_id);
                return res.render('user/purchase/orderFailedPage');
            }

            const updating = await Order.updateOne(
                { _id: orderDetails._id },
                {
                    $set: {
                        'orderItems.$[elem].status': 'Pending',
                        paymentId: razorpay_payment_id
                    }
                },
                { arrayFilters: [{ 'elem.status': 'Pending for Payment' }] }
            );

            if (updating.modifiedCount === 0) {
                console.log("Failed to update order status for orderId:", orderDetails.orderId);

            }

            orderDetails.paymentId = razorpay_payment_id;

            res.render('user/purchase/orderSuccessPage', { orderDetails });

        } else {

            console.log('Signature verification failed');
            console.log('Expected signature:', generatedSignature);
            console.log('Received signature:', razorpay_signature);
            res.render('user/purchase/orderFailedPage');
        }

    } catch (error) {
        console.error('Error in paymentResponse:', error);
        res.render('user/purchase/orderFailedPage');
    }
};

const retryPayment = async (req, res) => {
    try {

        const { orderId } = req.query;

        const order = await Order.findOne({ orderId });

        const razorpayOrder = await razorpayInstance.orders.create(
            {
                amount: order.finalPrice * 100,
                currency: 'INR',
                receipt: `rcptid_${order.userId.toString().substring(0, 5) + Date.now().toString().substring(0, 5)}`,
            }
        );

        if (razorpayOrder) {

            order.paymentId = razorpayOrder.id;
            await order.save();

            res.render('user/purchase/paymentPage',
                { razorpayOrder, finalAmount: order.finalPrice, razorpayKey: process.env.RAZORPAY_KEY_ID }
            );
        } else {

            res.render('user/purchase/orderFailedPage');
        };

    } catch (error) {

        console.log(error);
        res.render('user/purchase/orderFailedPage');
    };
};

module.exports = {
    paymentResponse,
    retryPayment,
}