const Order = require('../../models/orderSchema');
const walletController = require('../../controllers/user/walletController');
const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema')


//fetching all orders for listing
const getOrders = async (req, res) => {
    try {
        //pagenation implimentation
        const searchQuery = req.query.search ?? '';
        let currentPage = Number(req.query.pageReq) || 1;
        const limit = 5;

        //counting the doucoments
        const count = Math.ceil(await Order.countDocuments({}) / limit);

        currentPage = currentPage >= count ? count : currentPage;
        currentPage = currentPage <= 0 ? 1 : currentPage
        const skip = limit * (currentPage - 1);


        //fetching all orders
        const allOrders = await Order.find({}).populate({
            path: 'orderItems.productId',
            model: 'Product',
            select: 'productName'
        }).sort({ orderDate: -1 }).skip(skip).limit(limit)

        //render the orderlisting page with orders
        res.render('admin/orderManagement/orderListing', { allOrders, currentPage });

    } catch (error) {
        // logging error and render page not found
        console.log(error);
        res.render('admin/pagenotFound');
    };
};



//changing order status
const orderStatusUpdate = async (req, res) => {
    try {
        //extracting order details form query 
        const { status, orderId, productId } = req.query;

        // if order returned refund order amount to the wallet
        if (status === 'Returned') {
            //find the items from the order
            const order = await Order.findOne({ orderId });

            //find the targeted product from the order items for 'Returning'
            const orderItem = order.orderItems.find(item => item.productId.toString() === productId);

            //calculating the total price of item that returning
            const itemTotalPrice = orderItem.price * orderItem.quantity;

            // update the status and total price of order
            await Order.updateOne(
                { orderId, 'orderItems.productId': productId },
                {
                    $set: {
                        'orderItems.$.status': status,
                        totalPrice: order.totalPrice - itemTotalPrice
                    }
                }
            );

            //increase the product qty in stock  and decreasin the selling count
            await Product.updateOne(
                { _id: productId },
                { $inc: { quantity: orderItem.quantity, sellingCount: -orderItem.quantity } }
            )

            // update category selling count
            await Category.updateOne(
                { _id: orderItem.category },
                { $inc: { categorySalesCount: -orderItem.quantity } }
            )

            //update wallet 
            await walletController.updateUserWallet(order.userId, itemTotalPrice, 'credit', 'Product Return')

            return res.redirect('/admin/orders');
        }


        //if the item is delivered updating the delivery statu to delivered wit date
        if (status === 'Delivered') {
            await Order.updateOne(
                { orderId, 'orderItems.productId': productId },
                {
                    $set: { 'orderItems.$.status': status, 'orderItems.$.deliveryDate': Date.now() }
                }
            );

        } else {
            //updaing deliverry status from query
            await Order.updateOne(
                { orderId, 'orderItems.productId': productId },
                {
                    $set: { 'orderItems.$.status': status }
                }
            );
        };

        //redirect to order listing page
        res.redirect('/admin/orders');

    } catch (error) {
        //logging error and render error page
        console.log(error);
        res.render('admin/pagenotFound')
    }

}


module.exports = {
    getOrders, //fetching all orders for listing
    orderStatusUpdate //changing order status
} 