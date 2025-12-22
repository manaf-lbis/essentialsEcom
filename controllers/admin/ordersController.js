const Order = require('../../models/orderSchema');
const walletController = require('../../controllers/user/walletController');
const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema')

const getOrders = async (req, res) => {
    try {
        const searchQuery = req.query.search ?? '';
        const filterStatus = req.query.status || 'All';
        let currentPage = Number(req.query.pageReq) || 1;
        const limit = 10;

        let query = {};

        if (filterStatus !== 'All') {
            query['orderItems.status'] = filterStatus;
        }

        const totalDocuments = await Order.countDocuments(query);
        const totalPages = Math.ceil(totalDocuments / limit);

        currentPage = currentPage > totalPages ? totalPages : currentPage;
        currentPage = currentPage <= 0 ? 1 : currentPage;
        const skip = limit * (currentPage - 1);

        const allOrders = await Order.find(query).populate({
            path: 'orderItems.productId',
            model: 'Product',
            select: 'productName'
        }).sort({ orderDate: -1 }).skip(skip).limit(limit)

        res.render('admin/orderManagement/orderListing', {
            allOrders,
            currentPage,
            totalPages,
            filterStatus,
            searchQuery: searchQuery
        });

    } catch (error) {
        console.log(error);
        res.render('admin/pagenotFound');
    };
};

const statusPriority = {
    'Pending': 0,
    'Processing': 1,
    'Shipped': 2,
    'Delivered': 3,
    'ReturnRequested': 3,
    'Cancelled': 4,
    'Returned': 4,
    'Rejected': 4
};

const orderStatusUpdate = async (req, res) => {
    try {
        const { status: newStatus, orderId, productId } = req.query;

        const order = await Order.findOne({ orderId });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        const orderItem = order.orderItems.find(item => item.productId.toString() === productId);
        if (!orderItem) return res.status(404).json({ success: false, message: 'Item not found' });

        const currentStatus = orderItem.status;

        if (['Cancelled', 'Returned', 'Rejected'].includes(currentStatus)) {
            return res.json({ success: false, message: `Cannot change status from ${currentStatus}.` });
        }

        if (currentStatus === 'ReturnRequested') {
            if (newStatus !== 'Returned' && newStatus !== 'Rejected') {
                return res.json({ success: false, message: 'Return Request must be either Returned (Approved) or Rejected.' });
            }
        }

        const currentPriority = statusPriority[currentStatus] || 0;
        const newPriority = statusPriority[newStatus] || 0;

        if (newStatus !== 'Returned' && newStatus !== 'Cancelled' && newStatus !== 'Rejected' && newStatus !== 'ReturnRequested') {
            if (newPriority <= currentPriority) {
                return res.json({ success: false, message: `Cannot revert status from ${currentStatus} to ${newStatus}.` });
            }
        }

        if (newStatus === 'Returned') {

            const itemTotalPrice = orderItem.price * orderItem.quantity;
            await Order.updateOne(
                { orderId, 'orderItems.productId': productId },
                {
                    $set: {
                        'orderItems.$.status': newStatus,
                        totalPrice: order.totalPrice - itemTotalPrice
                    }
                }
            );

            await Product.updateOne(
                { _id: productId },
                { $inc: { quantity: orderItem.quantity, sellingCount: -orderItem.quantity } }
            );

            await Category.updateOne(
                { _id: orderItem.category },
                { $inc: { categorySalesCount: -orderItem.quantity } }
            );

            await walletController.updateUserWallet(order.userId, itemTotalPrice, 'credit', 'Product Return', order.orderId);

            return res.json({ success: true, message: 'Return processed & Refund initiated successfully' });
        }

        let updateData = { 'orderItems.$.status': newStatus };
        if (newStatus === 'Delivered') {
            updateData['orderItems.$.deliveryDate'] = Date.now();
        }

        await Order.updateOne(
            { orderId, 'orderItems.productId': productId },
            { $set: updateData }
        );

        return res.json({ success: true, message: 'Status updated successfully' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }

}

module.exports = {
    getOrders,
    orderStatusUpdate
}