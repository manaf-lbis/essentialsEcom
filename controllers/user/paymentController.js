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

            // Retrieve order info from session
            const pendingOrder = req.session.pendingOrder;

            const { razorpayOrderId, userId } = pendingOrder


            await Order.updateOne(
                { paymentId: razorpayOrderId },
                { $set: { 'orderItems.$[elem].status': 'Pending', paymentId: razorpay_payment_id } },
                {
                    arrayFilters: [{ 'elem.status': 'Pending for Payment' }],
                }
            );


            const orderDetails = await Order.findOne({ userId: userId })
                .sort({ orderDate: -1 })
                .limit(1)

            //clearing session variable
            delete req.session.pendingOrder;

            res.render('user/purchase/orderSuccessPage', { orderDetails });


        } else {

            console.log('signature fail');


            // Signature verification failed
            res.render('user/purchase/orderFailedPage');

        }

    } catch (error) {

        console.log(error);
        res.render('user/purchase/orderFailedPage');

    }

};


const retryPayment = async (req, res) => {

    try {
        const { orderId } = req.query;

        //fetching order details
        const order = await Order.findOne({ orderId });

        // Create Razorpay order
        const razorpayOrder = await razorpayInstance.orders.create(
            {
                amount: order.finalPrice * 100,//converting to paise
                currency: 'INR',
                receipt: `rcptid_${order.userId.toString().substring(0, 5) + Date.now().toString().substring(0, 5)}`,
            }
        );

        //storing details to the session for later use
        req.session.pendingOrder = {

            userId: order.userId,
            razorpayOrderId: order.paymentId

        };


        if (razorpayOrder) {

            res.render('user/purchase/paymentPage',
                { razorpayOrder, finalAmount: order.finalPrice, razorpayKey: process.env.RAZORPAY_KEY_ID }
            );

        } else {

            res.render('user/purchase/orderFailedPage');
        }



    } catch (error) {

        console.log(error);

    }
}



module.exports = {
    paymentResponse,
    retryPayment
}