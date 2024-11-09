const express = require('express');
const router = express.Router();
const passport = require('../config/passport')
const userController = require('../controllers/user/userController');
const userMiddleware = require('../middlewares/usersMiddleware')
const productsController = require('../controllers/user/productsController')
const forgotPassword = require('../controllers/user/forgotPasswordController');
const profileController = require('../controllers/user/profileController');
const cartController = require('../controllers/user/cartController')
const checkoutController = require('../controllers/user/checkoutController')
const orderController = require('../controllers/user/orderController');
const commentRatingController = require('../controllers/user/commentRatingController');
const shopController = require('../controllers/user/shopController')
const wishlistController = require('../controllers/user/wishlistController')
const referralsController = require('../controllers/user/referralsController')
const wallerController = require('../controllers/user/walletController');
const couponController = require('../controllers/user/couponController')


// google auth 
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/user' }), userController.googleAuth)

//user route
router.get('/', userMiddleware.isNotAuthenticated, userController.loadLoginpage);
router.get('/signup', userMiddleware.isNotAuthenticated, userController.loadSignupPage);
router.post('/signup', userController.addNewUser);
router.get('/resentotp', userController.resentotp);
router.post('/verify-otp', userController.verifyOtp);
router.post('/login', userController.verifyLogin);
router.get('/home', userMiddleware.isAuthenticated, userController.loadHome);

//forgot password
router.get('/forgotPassword', forgotPassword.forgotPassword);
router.post('/verifyEmail', forgotPassword.verifyEmail);
router.post('/verifyOtp', forgotPassword.verifyOtp);
router.post('/changePassword', forgotPassword.changePassword);


// profile section 
router.get('/profile', userMiddleware.isAuthenticated, profileController.profilePage);
router.post('/updateUser', userMiddleware.isAuthenticated, profileController.updateUser);
router.get('/address', userMiddleware.isAuthenticated, profileController.addressPage);
router.post('/addNewAddress', userMiddleware.isAuthenticated, profileController.addNewAddress);
router.get('/removeAddress', userMiddleware.isAuthenticated, profileController.removeAddress);
router.get('/addressDataForEdit', userMiddleware.isAuthenticated, profileController.addressDataForEdit);
router.post('/updateAddress', userMiddleware.isAuthenticated, profileController.updateAddress);

//reset Password
router.get('/resetPassword', userMiddleware.isAuthenticated, profileController.resetPasswordPage)
router.post('/resetPassword', userMiddleware.isAuthenticated, profileController.resetPassword)


//referral section
router.get('/referrals', userMiddleware.isAuthenticated,referralsController.referralsPage)
router.get('/checkReferralCode',referralsController.checkReferralCode)



router.get('/logout', userController.userLogout);

//product details
router.get('/product/:id', userMiddleware.isAuthenticated, productsController.getDetailedPage);
router.get('/checkProductQty/', userMiddleware.isAuthenticated, productsController.checkQty);


//shop page
router.get('/search', userMiddleware.isAuthenticated, shopController.search);


//cart
router.get('/cart', userMiddleware.isAuthenticated, cartController.getCartPage);
router.post('/addToCart', userMiddleware.isAuthenticated, cartController.addToCart);
router.get('/removeCartItem', userMiddleware.isAuthenticated, cartController.removeCartItem)
router.get('/cartQtyChange', userMiddleware.isAuthenticated, cartController.changeCartQty)


// checkout
router.get('/checkout', userMiddleware.isAuthenticated, checkoutController.getCheckutPage)

///order
router.get('/orders', userMiddleware.isAuthenticated, orderController.allOrders);
router.post('/placeOrder', userMiddleware.isAuthenticated, orderController.placeOrder);
router.get('/cancelOrder', userMiddleware.isAuthenticated, orderController.cancelOrder);
router.get('/orderDetailPage', userMiddleware.isAuthenticated, orderController.orderDetails);


//comments and rating 
router.post('/comment', userMiddleware.isAuthenticated, commentRatingController.addComment);
router.post('/rateProduct', userMiddleware.isAuthenticated, commentRatingController.addrating);

//wishlist
router.get('/wishlist', userMiddleware.isAuthenticated, wishlistController.wishlist)
router.get('/wishlistToggle', userMiddleware.isAuthenticated, wishlistController.wishlistToggle)
router.get('/removeFromWishlist', userMiddleware.isAuthenticated, wishlistController.removeFromWishlist)

//wallet
router.get('/walletLedger', userMiddleware.isAuthenticated, wallerController.getWallet)


//coupon
router.get('/checkCouponCode',userMiddleware.isAuthenticated,couponController.checkCouponCode )
router.get('/couponAfterChange',userMiddleware.isAuthenticated,couponController.couponAfterChange )






module.exports = router;



