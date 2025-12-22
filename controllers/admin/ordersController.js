const Order = require('../../models/orderSchema');
const walletController = require('../../controllers/user/walletController');
const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema')


//fetching all orders for listing
const getOrders = async (req, res) => {
    try {
        const searchQuery = req.query.search ?? '';
        const filterStatus = req.query.status || 'All'; // New Filter
        let currentPage = Number(req.query.pageReq) || 1;
        const limit = 10;

        let query = {};

        // Search Logic (Basic search by order ID or user name if possible, simplified here)
        // Note: Advanced search might require aggregation if searching inside populated fields, 
        // but for now keeping it simple or relying on existing structure.
        // If searchQuery is needed, we might need to adjust logic. 
        // Assuming search is secondary to the "filter" request right now.

        // Filter Logic
        if (filterStatus !== 'All') {
            query['orderItems.status'] = filterStatus;
        }

        //count documents with filter
        const totalDocuments = await Order.countDocuments(query);
        const totalPages = Math.ceil(totalDocuments / limit);

        currentPage = currentPage > totalPages ? totalPages : currentPage;
        currentPage = currentPage <= 0 ? 1 : currentPage;
        const skip = limit * (currentPage - 1);

        //fetching orders
        const allOrders = await Order.find(query).populate({
            path: 'orderItems.productId',
            model: 'Product',
            select: 'productName'
        }).sort({ orderDate: -1 }).skip(skip).limit(limit)

        res.render('admin/orderManagement/orderListing', {
            allOrders,
            currentPage,
            totalPages, // Pass totalPages to view
            filterStatus,
            searchQuery: searchQuery
        });

    } catch (error) {
        console.log(error);
        res.render('admin/pagenotFound');
    };
};


// Status Priority Map
const statusPriority = {
    'Pending': 0,
    'Processing': 1,
    'Shipped': 2,
    'Delivered': 3,
    'ReturnRequested': 3, // Parallel to Delivered, user requests this
    'Cancelled': 4, // Terminal
    'Returned': 4,  // Terminal
    'Rejected': 4   // Terminal
};

//changing order status
const orderStatusUpdate = async (req, res) => {
    try {
        const { status: newStatus, orderId, productId } = req.query;

        const order = await Order.findOne({ orderId });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        const orderItem = order.orderItems.find(item => item.productId.toString() === productId);
        if (!orderItem) return res.status(404).json({ success: false, message: 'Item not found' });

        const currentStatus = orderItem.status;

        // Terminal State Check - Cannot move FROM these
        if (['Cancelled', 'Returned', 'Rejected'].includes(currentStatus)) {
            return res.json({ success: false, message: `Cannot change status from ${currentStatus}.` });
        }

        // Return Flow Specifics
        if (currentStatus === 'ReturnRequested') {
            if (newStatus !== 'Returned' && newStatus !== 'Rejected') {
                return res.json({ success: false, message: 'Return Request must be either Returned (Approved) or Rejected.' });
            }
        }

        // Hierarchy Check (Preventing Backtracking)
        // statusPriority[undefined] is 0, handle safely
        const currentPriority = statusPriority[currentStatus] || 0;
        const newPriority = statusPriority[newStatus] || 0;

        // Allow 'ReturnRequested' -> 'Returned' (3 -> 4)
        // Allow 'Delivered' -> 'ReturnRequested' (3 -> 3) - User side usually handles this, but admin might force it?
        // Block 'Shipped' (2) -> 'Pending' (0)

        // If not a return flow and priorities dictate backward movement => Block
        if (newStatus !== 'Returned' && newStatus !== 'Cancelled' && newStatus !== 'Rejected' && newStatus !== 'ReturnRequested') {
            if (newPriority <= currentPriority) {
                return res.json({ success: false, message: `Cannot revert status from ${currentStatus} to ${newStatus}.` });
            }
        }

        // Special Case: Returned/Cancelled check
        if (newStatus === 'Returned') {
            // ... [Existing Return Logic] ...
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

        // Update Status
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
    getOrders, //fetching all orders for listing
    orderStatusUpdate //changing order status
} 