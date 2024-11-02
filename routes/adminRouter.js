const express = require('express');
const router = express.Router();
const config = require('../config/multer');
const adminController = require('../controllers/admin/adminController');
const userController = require('../controllers/admin/userController');
const categoryController = require('../controllers/admin/categoryController');
const productController = require('../controllers/admin/productControllers');
const ordersController = require('../controllers/admin/ordersController');
// const offerController = require('../controllers/admin/offerController');
// const couponController = require('../controllers/admin/couponController');
const auth = require('../middlewares/usersMiddleware');





router.get('/pagenotFound', adminController.pagenotFound);

router.get('/', adminController.loadLogin);
router.post('/', adminController.verifyLogin);
router.get('/dashboard', auth.adminAuth, adminController.loadDashboard);
router.get('/logout', adminController.logout);

//user management
router.get('/usermanagement', auth.adminAuth, userController.getUsers);
router.post('/blockUser/:id', auth.adminAuth, userController.blockUser);
router.post('/unblockUser/:id', auth.adminAuth, userController.unblockUser);

//category
router.get('/category', auth.adminAuth, categoryController.listCategory);
router.get('/addCategory', auth.adminAuth, categoryController.addCategoryPage);
router.post('/category', auth.adminAuth, config.upload.single('image'), categoryController.addCategory);
router.get('/removeCategory',auth.adminAuth, categoryController.removeCategory);
router.get('/editCategoryPage',auth.adminAuth, categoryController.editCategoryPage);
router.post('/updateCategory',auth.adminAuth, categoryController.updateCategory);
router.get('/restoreCategory',auth.adminAuth, categoryController.restoreCategory);

//product
router.get('/products', auth.adminAuth, productController.products);
router.get('/addProduct', auth.adminAuth, productController.addproductPage);
router.post('/addProduct', auth.adminAuth, config.upload.array('images', 3), productController.addProduct);
router.get('/removeProduct/:id', auth.adminAuth, productController.removeProduct);
router.get('/editProduct/:id', auth.adminAuth, productController.editProduct);
router.post('/updateProduct', auth.adminAuth,config.upload.array('images', 3),productController.updateProduct);

router.get('/removeProductImage',auth.adminAuth,productController.removeImage)



//orders
router.get('/orders', auth.adminAuth,ordersController.getOrders);
router.get('/updateOrderStatus', auth.adminAuth,ordersController.orderStatusUpdate);



//offers
router.get('/offers');

//coupon
router.get('/coupon');

module.exports = router;
