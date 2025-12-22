const Order = require('../../models/orderSchema');
const Cart = require('../../models/cartSchema');
const mongoose = require('mongoose');
const { products } = require('../admin/productControllers');
const Address = require('../../models/addressSchema');
const Product = require('../../models/productSchema');
const Coupon = require('../../models/couponSchema');
const walletController = require('../../controllers/user/walletController')
const razorpayInstance = require('../../config/razorpay');
const Category = require('../../models/categorySchema');
const User = require('../../models/userSchema');
const Wallet = require('../../models/walletSchema');

function getUserIdFromSession(req) {
    return req.session?._id ?? req.session.passport?.user;
}

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

        const cartCoupon = await Cart.findOne({ userId }).select('coupon').populate('coupon');

        const orderItems = cartItems[0]?.products?.map((item, index) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: cartItems[0].productDetails[index].sellingPrice,
        }));

        const totalPrice = orderItems.reduce((acc, item) => acc + item.quantity * item.price, 0);

        const finalAmount = cartCoupon?.coupon ? totalPrice - cartCoupon.coupon.discount : totalPrice;

        return { finalAmount };

    } catch (error) {
        throw error
    }

};

async function createOrder(orderInfo) {
    try {
        const {
            paymentMethod,
            deliveryAddress,
            userId

        } = orderInfo;

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

        if (!cartItems.length || !cartItems[0].products.length) {

            throw new Error("Cart is empty. Cannot create an order.");

        }

        const cartCoupon = await Cart.findOne({ userId })
            .select('coupon')
            .populate('coupon');

        const orderItems = [];

        for (const [index, ele] of cartItems[0].products.entries()) {

            await Category.updateOne({ _id: ele.category }, { $inc: { categorySalesCount: ele.quantity } })

            orderItems.push({
                productId: ele.productId,
                quantity: ele.quantity,
                price: cartItems[0].productDetails[index].sellingPrice,
                status: (paymentMethod === 'Online Payment') ? 'Pending for Payment' : 'Pending',
                category: ele.category
            });

            const updatedProduct = await Product.findOneAndUpdate(
                { _id: ele.productId, quantity: { $gte: ele.quantity } },
                { $inc: { quantity: - ele.quantity, sellingCount: ele.quantity } },
                { new: true }
            );

            if (!updatedProduct) {
                throw new Error(`Insufficient stock for product ${ele.productId}`);
            };

        }

        const totalPrice = orderItems.reduce((acc, ele) => {
            return acc += ele.quantity * ele.price
        }, 0);

        let finalPrice = totalPrice;
        if (cartCoupon?.coupon) {

            finalPrice = totalPrice - cartCoupon.coupon.discount;

        }

        let address = await Address.findOne(
            {
                userId: userId,
                address: { $elemMatch: { _id: deliveryAddress } }
            },
            { 'address.$': 1 }
        );

        const coupon = cartCoupon?.coupon
            ? {
                couponId: cartCoupon.coupon._id,
                code: cartCoupon.coupon.couponCode,
                discountAmount: cartCoupon.coupon.discount
            }
            : null;

        const order = new Order({
            userId: userId,
            orderItems: orderItems,
            totalPrice: totalPrice,
            deliveryCharge: finalPrice < 500 ? 40 : 0,
            finalPrice: finalPrice += finalPrice < 500 ? 40 : 0,
            address: address.address[0],
            paymentMethod: paymentMethod,
            discount: cartCoupon?.coupon?.discount ?? 0,
            coupon,
            paymentId: paymentMethod === 'Online Payment' ? orderInfo.razorpayOrder : '',

        });

        await Cart.deleteOne({ userId: userId })

        await order.save();
        return true;

    } catch (error) {
        console.log(error);
        throw error
    };
};

const placeOrder = async (req, res) => {
    try {
        const userId = getUserIdFromSession(req);

        const { paymentMethod, deliveryAddress } = req.body;

        const orderInfo = {
            paymentMethod,
            deliveryAddress,
            userId
        }

        if (paymentMethod === 'COD') {
            const order = await createOrder(orderInfo);

            if (order) {
                const orderDetails = await Order.findOne({ userId })
                    .sort({ orderDate: -1 })
                    .limit(1);

                res.render('user/purchase/orderSuccessPage', { orderDetails });

            } else {
                res.render('user/purchase/orderFailedPage')
            };

        } else if (paymentMethod === 'Online Payment') {

            const { finalAmount } = await calculateTotalAmountAfterDiscount(userId)

            const razorpayOrder = await razorpayInstance.orders.create(
                {
                    amount: finalAmount * 100,
                    currency: 'INR',
                    receipt: `rcptid_${userId.toString().substring(0, 5) + Date.now().toString().substring(0, 5)}`,
                }
            );

            if (razorpayOrder) {
                orderInfo.razorpayOrder = razorpayOrder.id

                await createOrder(orderInfo);
            };

            if (razorpayOrder) {
                res.render('user/purchase/paymentPage',
                    { razorpayOrder, finalAmount, razorpayKey: process.env.RAZORPAY_KEY_ID }
                );
            } else {
                res.render('user/purchase/orderFailedPage')
            };
        } else if (paymentMethod === 'Wallet') {
            const { finalAmount } = await calculateTotalAmountAfterDiscount(userId);
            let totalAmountToCheck = finalAmount;
            if (totalAmountToCheck < 500) { totalAmountToCheck += 40; }

            const userWallet = await Wallet.findOne({ userId });

            if (userWallet && userWallet.balance >= totalAmountToCheck) {
                const order = await createOrder(orderInfo);
                if (order) {
                    const orderDetails = await Order.findOne({ userId }).sort({ orderDate: -1 }).limit(1);

                    await walletController.updateUserWallet(userId, totalAmountToCheck, 'debit', 'Order Payment', orderDetails.orderId);

                    res.render('user/purchase/orderSuccessPage', { orderDetails });
                }
            } else {
                console.log("Insufficient Wallet Balance");
                res.render('user/purchase/orderFailedPage');
            }
        };

    } catch (error) {
        console.log(error);
        res.render('user/pagenotFound');
    };

};

const allOrders = async (req, res) => {
    try {
        const userId = getUserIdFromSession(req);

        let currentpage = req.query.currentpage || 1;
        const limit = 5;
        const totalPages = Math.ceil(await Order.countDocuments({ userId }) / limit)

        currentpage = currentpage >= totalPages ? totalPages : currentpage;
        currentpage = currentpage <= 0 ? 1 : currentpage

        const skip = limit * (currentpage - 1);

        const orders = await Order.find({ userId })
            .populate('orderItems.productId')
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(limit)

        const userData = await User.findOne({ _id: userId });

        res.render('user/purchase/orders', { orders, currentpage, userData })

    } catch (error) {
        console.log(error);
        res.render('user/pageNotFound');
    };
};

const cancelOrder = async (req, res) => {
    try {
        const userId = getUserIdFromSession(req);

        const { orderId, productId, cancellationReason } = req.query;

        const order = await Order.findOne({ orderId });

        const orderItem = order.orderItems.find(item => item.productId.toString() === productId);

        const previousStatus = orderItem.status;

        const itemTotalPrice = orderItem.price * orderItem.quantity;
        order.totalPrice -= itemTotalPrice;
        orderItem.status = "Cancelled";
        orderItem.cancellationReason = cancellationReason;

        if (order.coupon) {

            const coupon = await Coupon.findById(order.coupon.couponId);

            if (coupon) {
                if (order.totalPrice < coupon.minPurchaseValue) {

                    order.couponApplied = false;
                    order.discount = 0;
                } else {
                    order.discount = coupon.discount;
                };
            } else {
                order.couponApplied = false;
                order.discount = 0;
            };
        };

        order.finalPrice = order.totalPrice - order.discount;

        if (order.paymentMethod === 'Online Payment' && previousStatus !== 'Pending for Payment') {
            await walletController.updateUserWallet(userId, itemTotalPrice - order.discount, 'credit', 'Cancellation Refund', order.orderId);
        }

        if (order.deliveryCharge && order.finalPrice < 500) {
            order.deliveryCharge = 40;
            order.finalPrice += 40
        };

        await Product.findOneAndUpdate(
            { _id: productId },
            { $inc: { quantity: orderItem.quantity, sellingCount: -orderItem.quantity } }

        );

        const category = await Product.findOne({ _id: productId }, { category: 1 });

        await Category.updateOne({ _id: category.category }, { $inc: { categorySalesCount: -orderItem.quantity } })

        await order.save();

        res.redirect('/orders');

    } catch (error) {
        console.log(error);
        res.status(500)
            .json({ message: "An error occurred while processing the order cancellation." });

    };
};

const orderDetails = async (req, res) => {
    try {
        const { orderId } = req.query;
        const userId = getUserIdFromSession(req);

        const orders = await Order.find({ orderId })
            .populate('orderItems.productId')

        const userData = await User.findOne({ _id: userId });

        res.render('user/purchase/orderDetails', { orders, userData })

    } catch (error) {
        console.log(error);
        res.render('user/pageNotFound');
    };
};

const retunOrder = async (req, res) => {
    try {
        const { orderId, productId } = req.query

        response = await Order.updateOne(
            { orderId, 'orderItems.productId': productId },
            { $set: { 'orderItems.$.status': 'ReturnRequested' } }
        );

        res.redirect('/orders');

    } catch (error) {
        console.log(error);
        res.render('user/pageNotFound');
    };
};

module.exports = {
    placeOrder,
    allOrders,
    cancelOrder,
    orderDetails,
    retunOrder,
    createOrder
}