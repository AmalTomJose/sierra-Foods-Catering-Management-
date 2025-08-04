const express = require('express');
const router = express();
const adminController = require('../controller/adminController');
const adminAuth =require('../middlewares/adminAuth');
const expressEjsLayouts = require('express-ejs-layouts');
const categoryController =  require('../controller/categoryController');
const subcategoryController = require('../controller/subcategoryController')
const productController = require('../controller/productController');
const multer= require('../middlewares/multer');
const adminOrderController = require('../controller/adminOrderController')
const adminEventControlller = require('../controller/adminEventController');
const adminCouponController = require('../controller/adminCouponController')


//Setting layout for adminside
router.use(expressEjsLayouts);
router.set('layout','./layouts/admin')

//LOGIN
router.get('/',adminAuth.islogout,adminController.adminLogin)
router.post('/',adminAuth.islogout,adminController.verifyLogin);


//HOME
router.get('/home',adminAuth.islogin,adminController.loadHome)
router.get('/salesReport',adminAuth.islogin,adminController.getSalesReport)

//userDashboard
router.get('/userDashboard',adminAuth.islogin,adminController.loadUserpage)
router.get('/unlistUser',adminAuth.islogin,adminController.listUser)

//Category
router.get('/category',adminAuth.islogin,categoryController.loadCategory)
router.get('/unlistCategory',adminAuth.islogin,categoryController.unlistCategory)
router.get('/editCategory',adminAuth.islogin,categoryController.loadeditCategory)
router.post('/editCategory',categoryController.editCategory)


router.get('/addCategory',adminAuth.islogin,categoryController.loadaddCategory)
router.post('/addCategory',categoryController.addCategory)//adminAuth.islogin



// fetching categorylist  & Subcategorylist
router.get('/loadcategory',adminAuth.islogin,categoryController.loadcategory)
router.get('/subcategory/:id',subcategoryController.loadsubcategory)

//SubCategory

router.get('/subCategory',adminAuth.islogin,subcategoryController.loadSubcategory)
router.get('/unlistsubCategory',adminAuth.islogin,subcategoryController.unlistsubCategory)
router.get('/editsubCategory',adminAuth.islogin,subcategoryController.loadeditsubCategory)
router.post('/editSubcategory',subcategoryController.editsubCategory)

router.get('/addsubCategory',adminAuth.islogin,subcategoryController.loadaddSubcategory)
router.post('/addsubCategory',subcategoryController.addSubcategory)



//PRODUCTS

router.get('/products',adminAuth.islogin,productController.loadProducts);
router.get('/addproduct',adminAuth.islogin,productController.loadAddproduct)
router.post('/addproduct',multer.uploadProduct.array("image"),productController.addProduct)
router.get('/deleteProduct',adminAuth.islogin,productController.deleteProduct)
router.get('/editProduct',adminAuth.islogin,productController.loadeditProduct);
router.post('/editProduct',multer.uploadProduct.array('image'), productController.storeEditProduct)
router.get("/removeImage",adminAuth.islogin,productController.removeImage)


//ALL ORDERS
router.get('/allOrder',adminAuth.islogin,adminOrderController.listUserOrders)
router.get('/orderDetails',adminAuth.islogin,adminOrderController.listOrderDetails)
router.post('/orderstatus',adminAuth.islogin,adminOrderController.orderStatus)
router.post('/update-item-status',adminAuth.islogin,adminOrderController.itemStatus)

//ALL EVENTS
router.get('/events',adminAuth.islogin,adminEventControlller.listEvents)
router.get('/events/:id',adminAuth.islogin ,adminEventControlller.viewBookingDetails)



//Notifications if a user request for refund

router.get('/notifications',adminAuth.islogin,adminController.viewNotifications);
router.post('/notifications/markRead',adminAuth.islogin,adminController.markAllAsRead);
router.get('/notifications/count',adminAuth.islogin,adminController.getUnreadCount)


//COUPONS

router.get('/coupons',adminAuth.islogin,adminCouponController.getCoupons);
router.get('/addCoupon',adminAuth.islogin,adminCouponController.addCoupon);
router.post('/saveCoupon',adminAuth.islogin,adminCouponController.saveCoupon);
router.post('/coupon/delete/:id',adminAuth.islogin,adminCouponController.deleteCoupon);


//OFFERS

router.get('/offers',adminAuth.islogin,adminCouponController.getOffers);
router.get('/addOffer',adminAuth.islogin,adminCouponController.addOffer );
router.post('/saveOffer',adminAuth.islogin,adminCouponController.saveOffer)
router.post('/offer/delete/:id',adminAuth.islogin,adminCouponController.deleteOffer)


      //blocking item
router.get('/blockProduct',adminAuth.islogin,productController.blockProduct) 
//logout
router.get('/logout',adminController.adminLogout)





module.exports = router;
