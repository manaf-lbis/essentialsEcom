const Order = require('../../models/orderSchema')
const crypto = require('crypto')
const createOrder = require('../../controllers/user/orderController')
const Cart = require('../../models/cartSchema')
const razorpayInstance = require('../../config/razorpay')


// adding payment response to order (callback from razorpay)
const paymentResponse = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        const secret = process.env.RAZORPAY_KEY_SECRET;

        // generating signature using razorpay secret key
        const generatedSignature = crypto
            .createHmac('sha256', secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generatedSignature === razorpay_signature) {

            // FIRST: Find the order using razorpay_order_id (set during createOrder)
            const orderDetails = await Order.findOne({ paymentId: razorpay_order_id });

            if (!orderDetails) {
                console.log("Order not found with paymentId:", razorpay_order_id);
                return res.render('user/purchase/orderFailedPage');
            }

            // SECOND: Update the order status and replace paymentId with actual payment_id
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

            // Verify update was successful
            if (updating.modifiedCount === 0) {
                console.log("Failed to update order status for orderId:", orderDetails.orderId);
                // Even if status update fails, payment was verified, so show success
            }

            // Update the paymentId in our fetched order for display
            orderDetails.paymentId = razorpay_payment_id;

            // Render order success page
            res.render('user/purchase/orderSuccessPage', { orderDetails });

        } else {
            // Signature verification failed
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

//retrying payment
const retryPayment = async (req, res) => {
    try {
        // extracting order id from request
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

        if (razorpayOrder) {

            // Update the existing order with the NEW razorpay order ID
            // This is critical so that the callback can find the order.
            order.paymentId = razorpayOrder.id;
            await order.save();


            //render payment page
            res.render('user/purchase/paymentPage',
                { razorpayOrder, finalAmount: order.finalPrice, razorpayKey: process.env.RAZORPAY_KEY_ID }
            );
        } else {
            // render order failed page
            res.render('user/purchase/orderFailedPage');
        };

    } catch (error) {
        // logging error and render order fail page
        console.log(error);
        res.render('user/purchase/orderFailedPage');
    };
};



module.exports = {
    paymentResponse, // adding payment response to order (callback from razorpay)
    retryPayment,//retrying payment
}