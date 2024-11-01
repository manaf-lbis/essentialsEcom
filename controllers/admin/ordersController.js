const Order = require('../../models/orderSchema');


const getOrders = async (req, res) => {
    try {
        
        const allOrders = await Order.find({}).populate({
            path: 'orderItems.productId',
            model: 'Product',
            select: 'productName'
        }).sort({ orderDate: -1 })

        res.render('admin/orderManagement/orderListing', { allOrders });

    } catch (error) {

        console.log(error);
    }
}

const orderStatusUpdate = async (req, res) => {
    try {

        const { status, orderId, productId } = req.query;

        let response
        if (status === 'Delivered') {
            response = await Order.updateOne(
                { orderId, 'orderItems.productId': productId },
                { $set: { 'orderItems.$.status': status, 'orderItems.$.deliveryDate': Date.now() } });
        } else {
            response = await Order.updateOne(
                { orderId, 'orderItems.productId': productId },
                { $set: { 'orderItems.$.status': status } });
        }

        res.redirect('/admin/orders');

    } catch (error) {
        console.log(error);
        res.render('admin/pagenotFound')
    }

}


module.exports = {
    getOrders,
    orderStatusUpdate
} 