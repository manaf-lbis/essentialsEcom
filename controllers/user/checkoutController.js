const Address = require('../../models/addressSchema');
const Cart = require('../../models/cartSchema')
const User = require('../../models/userSchema')
const Product = require('../../models/productSchema')

const cartController = require('../../controllers/user/cartController')

function getUserIdFromSession(req) {
    return req.session?._id ?? req.session.passport?.user;
}

const Wallet = require('../../models/walletSchema');

const getCheckutPage = async (req, res) => {
    try {

        const userId = getUserIdFromSession(req);

        const cart = await Cart.findOne({ userId });

        if (cart.products.length <= 0) {
            return res.redirect('/cart')
        }

        let userAddress = await Address.findOne(
            { userId }
        ) ?? [];

        if (userAddress.address) {
            userAddress = userAddress.address.filter((ele) => !ele.isBlocked);
        }

        const { totalAmount, totalItems, amountAfterDiscount, discount } = await cartController.getCartDetails(req);

        const coupon = await Cart.findOne({ userId }).populate('coupon');

        const wallet = await Wallet.findOne({ userId });

        const deliveryCharge = amountAfterDiscount < 500 ? 40 : 0;

        res.render('user/purchase/checkout', {
            totalAmount,
            totalItems,
            userAddress,
            amountAfterDiscount: (amountAfterDiscount + deliveryCharge),
            discount, deliveryCharge,
            coupon,
            wallet
        });

    } catch (error) {

        console.log(error);
        res.render('user/pageNotFound');
    };
};

module.exports = {
    getCheckutPage,
}