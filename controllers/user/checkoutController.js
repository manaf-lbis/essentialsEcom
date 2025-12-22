const Address = require('../../models/addressSchema');
const Cart = require('../../models/cartSchema')
const User = require('../../models/userSchema')
const Product = require('../../models/productSchema')


//requiring cart details function from controller
const cartController = require('../../controllers/user/cartController')

//extract user id from session 
function getUserIdFromSession(req) {
    return req.session?._id ?? req.session.passport?.user;
}

const Wallet = require('../../models/walletSchema');

//render checkout page
const getCheckutPage = async (req, res) => {
    try {
        //extract user id from session 
        const userId = getUserIdFromSession(req);

        //find user cart
        const cart = await Cart.findOne({ userId });

        //checking the cart is empty or not 
        if (cart.products.length <= 0) {
            return res.redirect('/cart')
        }

        //find the available address of user
        let userAddress = await Address.findOne(
            { userId }
        ) ?? [];

        //filtering the address that is not blocked by user
        if (userAddress.address) {
            userAddress = userAddress.address.filter((ele) => !ele.isBlocked);
        }

        //fetching cart details using cartdetails function
        const { totalAmount, totalItems, amountAfterDiscount, discount } = await cartController.getCartDetails(req);

        //fetching coupon details that added in the cart 
        const coupon = await Cart.findOne({ userId }).populate('coupon');

        // Fetch user wallet
        const wallet = await Wallet.findOne({ userId });

        //calculating shipping charge
        const deliveryCharge = amountAfterDiscount < 500 ? 40 : 0;

        //render checkout page
        res.render('user/purchase/checkout', {
            totalAmount,
            totalItems,
            userAddress,
            amountAfterDiscount: (amountAfterDiscount + deliveryCharge),
            discount, deliveryCharge,
            coupon,
            wallet // Pass wallet to view
        });

    } catch (error) {
        //logging error and render error page
        console.log(error);
        res.render('user/pageNotFound');
    };
};



module.exports = {
    getCheckutPage, //render checkout page
}