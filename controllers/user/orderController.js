const Order = require('../../models/orderSchema');
const Cart = require('../../models/cartSchema');
const mongoose = require('mongoose');
const { products } = require('../admin/productControllers');
const Address = require('../../models/addressSchema');
const Product = require('../../models/productSchema');
const Coupon = require('../../models/couponSchema')



function getUserIdFromSession(req) {
    return req.session?._id ?? req.session.passport?.user;
}


async function createOrder(orderInfo) {

    try {

        const {
            paymentMethod,
            deliveryAddress,
            userId
        } = orderInfo;

        // finding the cart of user and proceeding with cart data and quantity

        // find the cart and get the product and lookup for products collection for products details
        const cartItems = await Cart.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            { $project: { products: 1 } },
            {
                $lookup: {
                    from: 'products',
                    foreignField: '_id',
                    localField: 'products.productId',
                    as: 'productDetails'
                }
            }
        ]);

        // Checking cart is empty
        if (!cartItems.length || !cartItems[0].products.length) {
            throw new Error("Cart is empty. Cannot create an order.");
        }

        const cartCoupon = await Cart.findOne({ userId }).select('coupon').populate('coupon');




        const orderItems = [];
        for (const [index, ele] of cartItems[0].products.entries()) {
            orderItems.push({
                productId: ele.productId,
                quantity: ele.quantity,
                price: cartItems[0].productDetails[index].sellingPrice
            });

            // Reduce quantity in the Product collection
            const updatedProduct = await Product.findOneAndUpdate(
                { _id: ele.productId, quantity: { $gte: ele.quantity } },
                { $inc: { quantity: -ele.quantity } },
                { new: true }
            );


            if (!updatedProduct) {
                throw new Error(`Insufficient stock for product ${ele.productId}`);
            }
        }



        //calculationg total price
        const totalPrice = orderItems.reduce((acc, ele) => {
            return acc += ele.quantity * ele.price
        }, 0);

        //final price after discount
        let finalPrice = totalPrice;
        if (cartCoupon?.coupon) {
            finalPrice = totalPrice - cartCoupon.coupon.discount;
        }


        //adderess finding  
        let address = await Address.findOne(
            {
                userId: userId,
                address: { $elemMatch: { _id: deliveryAddress } }
            },
            { 'address.$': 1 }
        );



        // if coupon Define coupon object for order
        const coupon = cartCoupon?.coupon
            ? {
                couponId: cartCoupon.coupon._id,
                code: cartCoupon.coupon.couponCode,
                discountAmount: cartCoupon.coupon.discount
            }
            : null;




        //creating order
        const order = new Order({
            userId: userId,
            orderItems: orderItems,
            totalPrice: totalPrice,
            finalPrice: finalPrice,
            address: address.address[0],// query of of mongo is an nested array of object
            paymentMethod: paymentMethod,
            discount: cartCoupon?.coupon?.discount ?? 0,
            coupon,

        })


        await order.save();
        return true;

    } catch (error) {

        console.log(error);
        throw error

    }

}


const placeOrder = async (req, res) => {
    try {

        const userId = getUserIdFromSession(req);

        const { paymentMethod, deliveryAddress } = req.body;

        const orderInfo = {
            paymentMethod,
            deliveryAddress,
            userId
        }

        //create new Order
        const order = await createOrder(orderInfo);

        if (order) {
            await Cart.deleteOne({ userId: userId })

            const orderDetails = await Order.findOne({ userId }).sort({ orderDate: -1 }).limit(1)

            res.render('user/purchase/orderSuccessPage', { orderDetails });
        } else {
            res.render('user/pageNotFound')
        }


    } catch (error) {
        console.log(error);
        res.render('user/pagenotFound')
    }

}

const allOrders = async (req, res) => {
    try {

        const userId = getUserIdFromSession(req);

        // pagenation 
        let currentpage = req.query.currentpage || 1;
        const limit = 5;

        const totalPages = Math.ceil(await Order.countDocuments({ userId }) / limit)

        currentpage = currentpage >= totalPages ? totalPages : currentpage;
        currentpage = currentpage <= 0 ? 1 : currentpage

        const skip = limit * (currentpage - 1);


        const orders = await Order.find({ userId }).populate('orderItems.productId').sort({ orderDate: -1 }).skip(skip).limit(limit)

        res.render('user/purchase/orders', { orders, currentpage })


    } catch (error) {
        console.log(error);
        res.render('user/pageNotFound');
    }
}


const cancelOrder = async (req, res) => {
    try {
        const { orderId, productId } = req.query;

        // Find the order
        const order = await Order.findOne({orderId });

        // Locate the item to cancel within the order
        const orderItem = order.orderItems.find(item => item.productId.toString() === productId);

        // Calculate the total price after cancelling the item
        const itemTotalPrice = orderItem.price * orderItem.quantity;
        order.totalPrice -= itemTotalPrice;
        orderItem.status = "Cancelled";


        // If a coupon is applied
        if (order.coupon) {
            
            const coupon = await Coupon.findById(order.coupon.couponId);
            
            if (coupon) {
                
                if (order.totalPrice < coupon.minPurchaseValue) {
                    order.couponApplied = false;
                    order.discount = 0;
                } else {
                    order.discount = coupon.discount;
                }
            } else {
                console.log("Coupon not found ");
                order.couponApplied = false;
                order.discount = 0;
            }
        }
        
        order.finalPrice = order.totalPrice - order.discount;

        // Increment the stock
        await Product.findOneAndUpdate(
            { _id: productId },
            { $inc: { quantity: orderItem.quantity } }
        );

        await order.save();

        res.redirect('/orders');

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "An error occurred while processing the order cancellation." });
    }
};



const orderDetails = async (req, res) => {
    try {

        const { orderId } = req.query;

        const orders = await Order.find({ orderId }).populate('orderItems.productId')


        res.render('user/purchase/orderDetails', { orders })

    } catch (error) {
        console.log(error);

    }
}

const retunOrder = async (req,res)=>{
    try {
       const {orderId,productId} = req.query

        response = await Order.updateOne(
            { orderId, 'orderItems.productId': productId },
            { $set: { 'orderItems.$.status': 'ReturnRequested' } }
        );

        res.redirect('/orders');

    } catch (error) {
        console.log(error);
        
    }
}


module.exports = {
    placeOrder,
    allOrders,
    cancelOrder,
    orderDetails,
    retunOrder
}