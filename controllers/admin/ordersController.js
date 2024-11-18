const Order = require('../../models/orderSchema');
const walletController = require('../../controllers/user/walletController');
const Product = require('../../models/productSchema')


const getOrders = async (req, res) => {
    try {
        const searchQuery = req.query.search ?? '';

        let currentPage = Number(req.query.pageReq) || 1;

        const limit = 5;
    
        const count = Math.ceil(await Order.countDocuments({}) / limit);

    
        currentPage = currentPage >= count ? count : currentPage ;  
        currentPage = currentPage <= 0 ? 1 : currentPage
    
    
        const skip = limit * (currentPage - 1);
        //pagenation logic end
    
        const allOrders = await Order.find({}).populate({
            path: 'orderItems.productId',
            model: 'Product',
            select: 'productName'
        }).sort({ orderDate: -1 }).skip(skip).limit(limit)

        res.render('admin/orderManagement/orderListing', { allOrders,currentPage });



    } catch (error) {

        console.log(error);
    }
}



const orderStatusUpdate = async (req, res) => {
    try {

        const { status, orderId, productId } = req.query;

        // need to return the amount to wallet
        if (status === 'Returned') {

            const order = await Order.findOne({ orderId });

            const orderItem = order.orderItems.find(item => item.productId.toString() === productId);

            const itemTotalPrice = orderItem.price * orderItem.quantity;

            // update the status and total price 
            await Order.updateOne(
                { orderId, 'orderItems.productId': productId },
                {
                    $set: {
                        'orderItems.$.status': status,
                        totalPrice: order.totalPrice - itemTotalPrice  
                    }
                }
            );

            await Product.updateOne(
                {_id:productId},
                {$inc:{quantity:1,sellingCount:-1}}
            )



            //update wallet 
            await walletController.updateUserWallet(order.userId,itemTotalPrice,'credit','Product Return')

            return res.redirect('/admin/orders');
        }

        
        let response
        if (status === 'Delivered') {
            response = await Order.updateOne(
                { orderId, 'orderItems.productId': productId },
                {
                     $set: { 'orderItems.$.status': status, 'orderItems.$.deliveryDate': Date.now() } 
                }
            );

        } else {
            response = await Order.updateOne(
                { orderId, 'orderItems.productId': productId },
                {
                     $set: { 'orderItems.$.status': status } 
                }
            );
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