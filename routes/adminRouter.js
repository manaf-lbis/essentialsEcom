const express = require('express');
const router = express.Router();
const config = require('../config/multer');
const adminController = require('../controllers/admin/adminController');
const userController = require('../controllers/admin/userController');
const categoryController = require('../controllers/admin/categoryController');
const productController = require('../controllers/admin/productControllers');
const ordersController = require('../controllers/admin/ordersController');
const couponController = require('../controllers/admin/couponController');
const auth = require('../middlewares/usersMiddleware');
const dashboardController = require('../controllers/admin/dashboardController')

router.get('/', adminController.loadLogin);
router.post('/', adminController.verifyLogin);
router.get('/dashboard', auth.adminAuth, dashboardController.loadDashboard);
router.get('/logout', adminController.logout);
router.get('/pagenotFound', adminController.pagenotFound);

router.get('/usermanagement', auth.adminAuth, userController.getUsers);
router.post('/blockUser/:id', auth.adminAuth, userController.blockUser);
router.post('/unblockUser/:id', auth.adminAuth, userController.unblockUser);

router.get('/category', auth.adminAuth, categoryController.listCategory);
router.get('/addCategory', auth.adminAuth, categoryController.addCategoryPage);
router.post('/category', auth.adminAuth, config.upload.single('image'), categoryController.addCategory);
router.get('/removeCategory', auth.adminAuth, categoryController.removeCategory);
router.get('/editCategoryPage', auth.adminAuth, categoryController.editCategoryPage);
router.post('/updateCategory', auth.adminAuth, config.upload.single('image'), categoryController.updateCategory);
router.get('/restoreCategory', auth.adminAuth, categoryController.restoreCategory);

router.get('/products', auth.adminAuth, productController.products);
router.get('/addProduct', auth.adminAuth, productController.addproductPage);
router.post('/addProduct', auth.adminAuth, config.upload.array('images', 6), productController.addProduct);
router.post('/blockProduct/:id', auth.adminAuth, productController.blockProduct);
router.post('/unblockProduct/:id', auth.adminAuth, productController.unblockProduct);
router.get('/editProduct/:id', auth.adminAuth, productController.editProduct);
router.post('/updateProduct', auth.adminAuth, config.upload.array('images', 6), productController.updateProduct);
router.post('/removeProductImage', auth.adminAuth, productController.removeImage)

router.get('/orders', auth.adminAuth, ordersController.getOrders);
router.get('/updateOrderStatus', auth.adminAuth, ordersController.orderStatusUpdate);

router.get('/getReport', auth.adminAuth, dashboardController.getReport);
router.get('/graphReport', auth.adminAuth, dashboardController.generateGraphReport);
router.get('/downloadPDF', auth.adminAuth, dashboardController.downloadSalesReportPDF);

router.get('/coupons', auth.adminAuth, couponController.coupons);
router.get('/addCoupons', auth.adminAuth, couponController.createCouponPage);
router.post('/createCoupon', auth.adminAuth, couponController.newCoupon);
router.get('/disableCoupon', auth.adminAuth, couponController.disableCoupon);

module.exports = router;