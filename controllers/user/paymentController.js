const Order = require('../../models/orderSchema')
const crypto = require('crypto')
const createOrder = require('../../controllers/user/orderController')
const Cart = require('../../models/cartSchema')


const paymentResponse = async (req, res) => {
    try {

        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;


        const secret = process.env.RAZORPAY_KEY_SECRET; // Replace with your Razorpay secret key
        const generatedSignature = crypto
            .createHmac('sha256', secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generatedSignature === razorpay_signature) {

            // Retrieve order info from session
            const pendingOrder = req.session.pendingOrder;

            const orderInfo = {
                paymentMethod: pendingOrder.paymentMethod,
                deliveryAddress: pendingOrder.deliveryAddress,
                userId: pendingOrder.userId
            }

            //create new Order
            const order = await createOrder.createOrder(orderInfo);

            if (order) {
                await Cart.deleteOne({ userId: pendingOrder.userId })

                const orderDetails = await Order.findOne({ userId: pendingOrder.userId }).sort({ orderDate: -1 }).limit(1)
                res.render('user/purchase/orderSuccessPage', { orderDetails });

            } else {
                res.render('user/purchase/orderFailedPage')
            }



        } else {
            // Signature verification failed
            res.render('user/purchase/orderFailedPage');
        }
    } catch (error) {
        console.log(error);
        res.render('user/purchase/orderFailedPage');
    }

};



module.exports = {
    paymentResponse
}