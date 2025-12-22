const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const userController = require('../controllers/user/userController');
const userMiddleware = require('../middlewares/usersMiddleware');
const productsController = require('../controllers/user/productsController');
const forgotPassword = require('../controllers/user/forgotPasswordController');
const profileController = require('../controllers/user/profileController');
const cartController = require('../controllers/user/cartController');
const checkoutController = require('../controllers/user/checkoutController');
const orderController = require('../controllers/user/orderController');
const commentRatingController = require('../controllers/user/commentRatingController');
const shopController = require('../controllers/user/shopController');
const wishlistController = require('../controllers/user/wishlistController');
const referralsController = require('../controllers/user/referralsController');
const wallerController = require('../controllers/user/walletController');
const couponController = require('../controllers/user/couponController');
const paymentController = require('../controllers/user/paymentController.js');
const invoiceController = require('../controllers/user/invoiceController.js');
const apiSearchController = require('../controllers/user/apiSearchController');
const { authLimiter, otpLimiter } = require('../middlewares/rateLimiters');

router.get('/api/search-suggestions', userMiddleware.isAuthenticated, apiSearchController.getSuggestions);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/user' }), userController.googleAuth)

router.get('/', userController.loadLandingPage);
router.get('/login', userMiddleware.isNotAuthenticated, userController.loadLoginpage);
router.get('/signup', userMiddleware.isNotAuthenticated, userController.loadSignupPage);
router.post('/signup', authLimiter, userController.addNewUser);
router.get('/resentotp', otpLimiter, userController.resentotp);
router.post('/verify-otp', authLimiter, userController.verifyOtp);
router.post('/login', authLimiter, userController.verifyLogin);
router.get('/home', userMiddleware.isAuthenticated, userController.loadHome);
router.get('/logout', userController.userLogout);

router.get('/forgotPassword', forgotPassword.forgotPassword);
router.post('/verifyEmail', authLimiter, forgotPassword.verifyEmail);
router.post('/verifyOtp', otpLimiter, forgotPassword.verifyOtp);
router.post('/changePassword', authLimiter, forgotPassword.changePassword);

router.get('/profile', userMiddleware.isAuthenticated, profileController.profilePage);
router.post('/updateUser', userMiddleware.isAuthenticated, profileController.updateUser);
router.get('/address', userMiddleware.isAuthenticated, profileController.addressPage);
router.post('/addNewAddress', userMiddleware.isAuthenticated, profileController.addNewAddress);
router.get('/removeAddress', userMiddleware.isAuthenticated, profileController.removeAddress);
router.get('/addressDataForEdit', userMiddleware.isAuthenticated, profileController.addressDataForEdit);
router.post('/updateAddress', userMiddleware.isAuthenticated, profileController.updateAddress);

router.get('/resetPassword', userMiddleware.isAuthenticated, profileController.resetPasswordPage)
router.post('/resetPassword', userMiddleware.isAuthenticated, profileController.resetPassword)

router.get('/referrals', userMiddleware.isAuthenticated, referralsController.referralsPage)
router.get('/checkReferralCode', referralsController.checkReferralCode)

router.get('/product/:id', userMiddleware.isAuthenticated, productsController.getDetailedPage);
router.get('/checkProductQty/', userMiddleware.isAuthenticated, productsController.checkQty);

router.get('/search', userMiddleware.isAuthenticated, shopController.search);

router.get('/cart', userMiddleware.isAuthenticated, cartController.getCartPage);
router.post('/addToCart', userMiddleware.isAuthenticated, cartController.addToCart);
router.get('/removeCartItem', userMiddleware.isAuthenticated, cartController.removeCartItem)
router.get('/cartQtyChange', userMiddleware.isAuthenticated, cartController.changeCartQty)
router.get('/cartQuantity', userMiddleware.isAuthenticated, cartController.cartQuantity)

router.get('/checkout', userMiddleware.isAuthenticated, checkoutController.getCheckutPage)

router.get('/orders', userMiddleware.isAuthenticated, orderController.allOrders);
router.post('/placeOrder', userMiddleware.isAuthenticated, orderController.placeOrder);
router.get('/cancelOrder', userMiddleware.isAuthenticated, orderController.cancelOrder);
router.get('/orderDetailPage', userMiddleware.isAuthenticated, orderController.orderDetails);
router.get('/returnOrder', userMiddleware.isAuthenticated, orderController.retunOrder);

router.post('/comment', userMiddleware.isAuthenticated, commentRatingController.addComment);
router.post('/rateProduct', userMiddleware.isAuthenticated, commentRatingController.addrating);

router.get('/wishlist', userMiddleware.isAuthenticated, wishlistController.wishlist)
router.get('/wishlistToggle', userMiddleware.isAuthenticated, wishlistController.wishlistToggle)
router.get('/removeFromWishlist', userMiddleware.isAuthenticated, wishlistController.removeFromWishlist)

router.get('/walletLedger', userMiddleware.isAuthenticated, wallerController.getWallet)

router.get('/checkCouponCode', userMiddleware.isAuthenticated, couponController.checkCouponCode)
router.get('/couponAfterChange', userMiddleware.isAuthenticated, couponController.couponAfterChange)
router.get('/available-coupons', userMiddleware.isAuthenticated, couponController.getAvailableCoupons)
router.get('/remove-coupon', userMiddleware.isAuthenticated, couponController.removeCoupon)

router.post('/payment/callback', paymentController.paymentResponse)
router.get('/retryPayment', userMiddleware.isAuthenticated, paymentController.retryPayment)

router.get('/invoice', userMiddleware.isAuthenticated, invoiceController.generateInvoice)

module.exports = router;

