const Order = require('../../models/orderSchema');
const Cart = require('../../models/cartSchema');
const mongoose = require('mongoose');
const { products } = require('../admin/productControllers');
const Address = require('../../models/addressSchema');
const Product = require('../../models/productSchema');
const Coupon = require('../../models/couponSchema');
const walletController = require('../../controllers/user/walletController')
const razorpayInstance = require('../../config/razorpay');
const Category = require('../../models/categorySchema')


function getUserIdFromSession(req) {
    return req.session?._id ?? req.session.passport?.user;
}


// Calculate Total Amount After Discount
async function calculateTotalAmountAfterDiscount(userId) {
    try {
        const cartItems = await Cart.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            { $project: { products: 1 } },
            {
                $lookup: {
                    from: 'products',
                    foreignField: '_id',
                    localField: 'products.productId',
                    as: 'productDetails',
                },
            },

        ]);

        //populating coupon details from cart
        const cartCoupon = await Cart.findOne({ userId }).select('coupon').populate('coupon');

        const orderItems = cartItems[0].products.map((item, index) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: cartItems[0].productDetails[index].sellingPrice,
        }));

        // Calculate total price
        const totalPrice = orderItems.reduce((acc, item) => acc + item.quantity * item.price, 0);

        // Apply discount if available
        const finalAmount = cartCoupon?.coupon ? totalPrice - cartCoupon.coupon.discount : totalPrice;

        return { finalAmount };

    } catch (error) {
        //throw error for handling error 
        throw error
    }

};


//creating new order
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

        const cartCoupon = await Cart.findOne({ userId })
            .select('coupon')
            .populate('coupon');


        const orderItems = [];

        for (const [index, ele] of cartItems[0].products.entries()) {

            // update category selling count
            await Category.updateOne({ _id: ele.category }, { $inc: { categorySalesCount: ele.quantity } })


            orderItems.push({
                productId: ele.productId,
                quantity: ele.quantity,
                price: cartItems[0].productDetails[index].sellingPrice,
                status: paymentMethod !== 'COD' ? 'Pending for Payment' : 'Pending',
                category: ele.category
            });

            // Reduce quantity in the Product collection
            const updatedProduct = await Product.findOneAndUpdate(
                { _id: ele.productId, quantity: { $gte: ele.quantity } },
                { $inc: { quantity: - ele.quantity, sellingCount: ele.quantity } },
                { new: true }
            );


            if (!updatedProduct) {
                throw new Error(`Insufficient stock for product ${ele.productId}`);
            };

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


        //creating order object 
        const order = new Order({
            userId: userId,
            orderItems: orderItems,
            totalPrice: totalPrice,
            deliveryCharge: finalPrice < 500 ? 40 : 0,
            finalPrice: finalPrice += finalPrice < 500 ? 40 : 0,
            address: address.address[0],// query of of mongo is an nested array of object
            paymentMethod: paymentMethod,
            discount: cartCoupon?.coupon?.discount ?? 0,
            coupon,
            paymentId: paymentMethod !== 'COD' ? orderInfo.razorpayOrder : '', //initalise payment id with order id after order sucess change to payment id 

        });

        //clearing the cart
        await Cart.deleteOne({ userId: userId })

        await order.save();
        return true;

    } catch (error) {
        // logg error and throw error for handling error
        console.log(error);
        throw error
    };
};

// creating new order
const placeOrder = async (req, res) => {
    try {
        //extract user id from session 
        const userId = getUserIdFromSession(req);

        // extract details from request body 
        const { paymentMethod, deliveryAddress } = req.body;

        //creating new object with order details
        const orderInfo = {
            paymentMethod,
            deliveryAddress,
            userId
        }


        if (paymentMethod === 'COD') {
            //create new Order
            const order = await createOrder(orderInfo);

            if (order) {
                //find the last created order
                const orderDetails = await Order.findOne({ userId })
                    .sort({ orderDate: -1 })
                    .limit(1);

                //redner order success page
                res.render('user/purchase/orderSuccessPage', { orderDetails });

            } else {
                //render order fail page 
                res.render('user/purchase/orderFailedPage')
            };


        } else if (paymentMethod === 'Online Payment') {

            // calculate the final amout for making online payment 
            const { finalAmount } = await calculateTotalAmountAfterDiscount(userId)

            // Create Razorpay order
            const razorpayOrder = await razorpayInstance.orders.create(
                {
                    amount: finalAmount * 100,//converting to paise
                    currency: 'INR',
                    receipt: `rcptid_${userId.toString().substring(0, 5) + Date.now().toString().substring(0, 5)}`,
                }
            );


            if (razorpayOrder) {
                //adding razor pay orderid to orderInfo object 
                orderInfo.razorpayOrder = razorpayOrder.id

                //creating new order with status pending
                await createOrder(orderInfo);

                // Store order details in session for later use
                req.session.pendingOrder = {
                    userId,
                    razorpayOrderId: razorpayOrder.id,
                };
            };


            if (razorpayOrder) {
                // rendering payment confirmation page
                res.render('user/purchase/paymentPage',
                    { razorpayOrder, finalAmount, razorpayKey: process.env.RAZORPAY_KEY_ID }
                );
            } else {
                // render order fail page
                res.render('user/purchase/orderFailedPage')
            };
        };

    } catch (error) {
        // logging error and render error page
        console.log(error);
        res.render('user/pagenotFound');
    };

};


const allOrders = async (req, res) => {
    try {
        //extract user id from session 
        const userId = getUserIdFromSession(req);

        // pagenation 
        let currentpage = req.query.currentpage || 1;
        const limit = 5;
        const totalPages = Math.ceil(await Order.countDocuments({ userId }) / limit)

        currentpage = currentpage >= totalPages ? totalPages : currentpage;
        currentpage = currentpage <= 0 ? 1 : currentpage

        const skip = limit * (currentpage - 1);

        //listing all order in decenting order
        const orders = await Order.find({ userId })
            .populate('orderItems.productId')
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(limit)

        //render orders page with order details
        res.render('user/purchase/orders', { orders, currentpage })


    } catch (error) {
        //logging error and render error page
        console.log(error);
        res.render('user/pageNotFound');
    };
};


//cancell Individual order
const cancelOrder = async (req, res) => {
    try {
        //logging error and render error page
        const userId = getUserIdFromSession(req);

        // extracting order details from request object
        const { orderId, productId, cancellationReason } = req.query;

        // Find the order
        const order = await Order.findOne({ orderId });

        // Locate the item to cancel within the order
        const orderItem = order.orderItems.find(item => item.productId.toString() === productId);


        // Calculate the total price after cancelling the item
        const itemTotalPrice = orderItem.price * orderItem.quantity;
        order.totalPrice -= itemTotalPrice;
        orderItem.status = "Cancelled";
        orderItem.cancellationReason = cancellationReason;


        // if coupon is applied in the order
        if (order.coupon) {

            const coupon = await Coupon.findById(order.coupon.couponId);

            if (coupon) {
                // final amout after canellation is lessthan minimum purchase value of coupon
                if (order.totalPrice < coupon.minPurchaseValue) {

                    //removing coupon from order
                    order.couponApplied = false;
                    order.discount = 0;
                } else {
                    // continue with the same discount
                    order.discount = coupon.discount;
                };
            } else {
                //removing coupon from the order 
                order.couponApplied = false;
                order.discount = 0;
            };
        };

        // calculating final price
        order.finalPrice = order.totalPrice - order.discount;

        if (order.paymentMethod === 'Online Payment') {
            //refund the order amount to wallet
            await walletController.updateUserWallet(userId, itemTotalPrice - order.discount, 'credit', 'Cancellation Refund');
        }

        //final price is lessthan 500 add delivery charge
        if (order.deliveryCharge && order.finalPrice < 500) {
            order.deliveryCharge = 40;
            order.finalPrice += 40
        };

        // Increment the stock after cancellation
        await Product.findOneAndUpdate(
            { _id: productId },
            { $inc: { quantity: orderItem.quantity, sellingCount: -orderItem.quantity } }

        );


        //finding the product category for decrementing the categoy sales count
        const category = await Product.findOne({ _id: productId }, { category: 1 });

        // update category selling count
        await Category.updateOne({ _id: category.category }, { $inc: { categorySalesCount: -orderItem.quantity } })

        // saving order object
        await order.save();

        //redirect to order page
        res.redirect('/orders');

    } catch (error) {
        // logging error and respond with status 500
        console.log(error);
        res.status(500)
            .json({ message: "An error occurred while processing the order cancellation." });

    };
};


// render order details page
const orderDetails = async (req, res) => {
    try {
        // extracting order id from request
        const { orderId } = req.query;
        
        // find the order details
        const orders = await Order.find({ orderId })
            .populate('orderItems.productId')

        //render order details page with all details
        res.render('user/purchase/orderDetails', { orders })

    } catch (error) {
        //logging error and render error page
        console.log(error);
        res.render('user/pageNotFound');
    };
};

//order return after delivery
const retunOrder = async (req, res) => {
    try {
        // extracting order details from query 
        const { orderId, productId } = req.query

        // changing order status to ReturnRequested
        response = await Order.updateOne(
            { orderId, 'orderItems.productId': productId },
            { $set: { 'orderItems.$.status': 'ReturnRequested' } }
        );

        //redirect to order page
        res.redirect('/orders');

    } catch (error) {
        //logging error and render error page
        console.log(error);
        res.render('user/pageNotFound');
    };
};


module.exports = {
    placeOrder, // creating new order
    allOrders, //listing orders 
    cancelOrder, //cancell order
    orderDetails, // render order details page
    retunOrder, // return order
    createOrder // creating order with order details
}