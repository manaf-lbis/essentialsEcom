const Cart = require('../../models/cartSchema');
const mongoose = require('mongoose');
const Product = require('../../models/productSchema');

function getUserIdFromSession(req) {
    return req.session?._id ?? req.session.passport?.user;
}

async function getCartDetails(req) {
    try {

        const _id = req.session?._id ?? req.session.passport?.user;

        const cartitems = await Cart.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(_id) } },
            { $unwind: '$products' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'products.productId',
                    foreignField: '_id',
                    as: 'allProducts'
                }
            },
            {
                $lookup: {
                    from: 'coupons',
                    localField: 'coupon',
                    foreignField: '_id',
                    as: 'couponDetails'
                }
            },
            {
                $unwind: {
                    path: '$couponDetails',
                    preserveNullAndEmptyArrays: true
                }
            }
        ]);

        let totalAmount = 0;
        let totalItems = 0;

        if (cartitems) {
            for (let i = cartitems.length - 1; i >= 0; i--) {
                const item = cartitems[i];
                const product = item.allProducts[0];

                if (!product || product.quantity < item.products.quantity) {
                    await Cart.updateOne(
                        { userId: _id },
                        { $pull: { products: { productId: product?._id } } }
                    );
                    cartitems.splice(i, 1);
                } else {

                    totalAmount += product.sellingPrice * item.products.quantity;
                    totalItems += item.products.quantity;
                }
            }
        }

        let amountAfterDiscount = totalAmount;
        let discount = 0;
        let couponInvalidated = false;

        if (cartitems[0]?.couponDetails) {
            const couponDetails = cartitems[0].couponDetails;

            const isMinPurchaseValid = totalAmount >= (couponDetails.minPurchaseValue || 0);
            const isActive = couponDetails.isActive !== false;
            const isNotExpired = new Date(couponDetails.expiryDate) >= new Date();

            if (isMinPurchaseValid && isActive && isNotExpired) {

                if (couponDetails.discountType === 'percentage') {
                    const percentageDiscount = (totalAmount * couponDetails.discount) / 100;
                    discount = couponDetails.maxDiscountAmount
                        ? Math.min(percentageDiscount, couponDetails.maxDiscountAmount)
                        : percentageDiscount;
                } else {

                    discount = couponDetails.discount;
                }

                discount = Math.round(discount * 100) / 100;
                amountAfterDiscount = totalAmount - discount;
            } else {

                await Cart.updateOne(
                    { userId: _id },
                    { $unset: { coupon: "" } }
                );

                discount = 0;
                amountAfterDiscount = totalAmount;
                couponInvalidated = true;
            }
        }

        return { totalAmount, totalItems, cartitems, discount, amountAfterDiscount, couponInvalidated };
    } catch (error) {
        console.log(error);
        throw error;
    }
}

const getCartPage = async (req, res) => {
    try {

        const userId = getUserIdFromSession(req)

        const { totalAmount, totalItems, cartitems, discount, amountAfterDiscount } = await getCartDetails(req);

        const coupon = await Cart.findOne({ userId }).populate('coupon');

        res.render('user/purchase/cart', { cartitems, totalAmount, totalItems, coupon, discount, amountAfterDiscount })

    } catch (error) {

        console.log(error);
        res.render('user/pageNotFound')
    };
};

const checkAndAdd = async (user_id, _id, quantity) => {

    const result = await Cart.findOne({ userId: user_id });

    if (result) {

        const response = await Cart.exists({
            userId: user_id,
            products: { $elemMatch: { productId: _id } },
        });

        if (response) {

            await Cart.updateOne(
                { userId: user_id, 'products.productId': _id },
                { $inc: { 'products.$.quantity': quantity } }
            );

        } else {

            const category = await Product.findOne(
                { _id },
                { category: 1 }
            );

            await Cart.updateOne(
                { userId: user_id },
                { $push: { products: { productId: _id, quantity, category: category.category } } }
            );
        };

        return true;

    } else {

        const category = await Product.findOne({ _id }, { category: 1 });

        const Item = new Cart({
            userId: user_id,
            products: [{ productId: _id, quantity, category: category.category }],
        });

        await Item.save();

        return true;
    };
};

const addToCart = async (req, res) => {
    try {

        const user_id = getUserIdFromSession(req)

        const { _id, quantity } = req.body;

        if (quantity <= 0 || quantity >= 5) {
            return res.status(400).json({ message: 'not allowed' })
        }

        const productIsExist = await Product.findOne({ _id, isBlocked: false });

        let cartUpdateStatus = false;

        if (productIsExist) {

            cartUpdateStatus = checkAndAdd(user_id, _id, quantity);

        } else {

            return res.status(400).json({ message: 'product doesnt exist' })
        }

        if (quantity > productIsExist.quantity) {
            return res.status(400).json({ message: 'out of stock ' })
        }

        if (cartUpdateStatus) {
            return res.status(200).json({ message: 'cart updataed Sucessfully' });
        } else {
            return res.status(500).json({ message: 'internal Server error' });
        }

    } catch (error) {

        console.log(error);
        res.status(500).json({ message: 'internal Server error' });

    }
};

const removeCartItem = async (req, res) => {
    try {

        const { _id } = req.query;
        const userId = getUserIdFromSession(req);

        await Cart.updateOne({ userId: userId },
            { $pull: { products: { productId: _id } } }
        );

        res.redirect('/cart');

    } catch (error) {

        console.log(error);
        res.render('user/pageNotFound');
    };
};

const changeCartQty = async (req, res) => {
    try {

        const userId = getUserIdFromSession(req);

        const { productId, count } = req.query;

        const quantity = await Product.findOne(
            { _id: productId },
            { quantity: 1 }
        );

        if (count <= quantity.quantity) {

            const response = await Cart.findOneAndUpdate(
                { userId, "products.productId": productId },
                { $set: { 'products.$.quantity': Number(count) } },
                { new: true }
            );

            const { totalAmount, totalItems, cartitems, discount, amountAfterDiscount } = await getCartDetails(req);

            res.status(200).json({ totalAmount, totalItems, cartitems, discount, amountAfterDiscount });

        } else {
            res.status(400).json({ message: 'Out of Quantity' })
        }

    } catch (error) {

        console.log(error);
        res.render('user/pageNotFound');
    };
};

const cartQuantity = async (req, res) => {
    try {

        const userId = getUserIdFromSession(req);

        const cartQty = await Cart.findOne(
            { userId },
            { products: 1 }
        );

        res.status(200).json({ cartQty: cartQty?.products?.length ?? 0 })

    } catch (error) {

        console.log(error);
        res.status(500)
    }
}

module.exports = {
    addToCart,
    getCartPage,
    removeCartItem,
    getCartDetails,
    changeCartQty,
    cartQuantity,
};

