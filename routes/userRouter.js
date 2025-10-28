const express = require('express');
const router = express();
const userController = require('../controller/userController');
const expressEjsLayouts = require('express-ejs-layouts');
const{islogin,islogout} = require('../middlewares/auth')
const categoryController = require('../controller/categoryController');
const multer= require('../middlewares/multer');
const addressController = require('../controller/addressController');
const wishlistController = require('../controller/wishlistController');
const cartController = require('../controller/cartController');
const eventController = require('../controller/eventController');
const orderController = require('../controller/orderController');
const couponController = require('../controller/couponController');



router.use(expressEjsLayouts)




router.set('layout','./layouts/user')




router.get('/pageNotFound',userController.pageNotFound);


//LOGIN PAGE
router.get('/login',islogout,userController.loadLogin);
router.post('/login',islogout,userController.loginPage);

//HOME PAGE
router.get('/', userController.loadHomepage);

router.get('/shop',islogin,userController.loadShop);
router.get('/shop/ajax',islogin,userController.loadProduct )
router.get('/product/:id', islogin,userController.loadProductDetail);


//REGISTRATION

router.get('/signup',islogout,userController.loadSignup);
router.post('/signup',islogout,userController.signupPage)
router.get('/otp',islogout,userController.loadOtp);
router.post('/otp',islogout,userController.verifyOtp);
router.get('/resendOTP',islogout,userController.resendOTP)


router.get('/forget-password',islogout,userController.getForgotPassword);
router.post('/forget',islogout,userController.forgotPasswordOTP)
router.get('/resetPassword',islogout,userController.loadResetPassword)
router.post('/resetPassword',islogout,userController.resetPassword)

//USER
router.get('/userprofile',islogin,userController.loadProfile);
router.post('/userprofile',multer.uploadUser.single('image'), userController.userEdit);
router.get('/userAddress',islogin,addressController.loadAddress)
router.get('/addAddress',islogin,addressController.loadAddAddress)
router.post('/addAddress',islogin,addressController.addAddress)
router.get('/editAddress',islogin,addressController.loadEditAddress)
router.post('/editAddress',islogin,addressController.editAddress)
router.get('/deleteAddress',islogin,addressController. deleteAddress)
router.post('/changePasswordFromProfile',islogin,addressController.changePasswordFromProfile)
router.get('/bookedEvents',islogin,addressController.loadBookedEvents)



//WISHLIST

router.get('/wishlist',islogin,wishlistController.loadWishlist);
router.post('/addToWishlist',islogin,wishlistController.addToWishlist)
router.delete('/removeWishlist',islogin,wishlistController.removeFromWishlist)

//WALLET 
router.get('/wallet',islogin,userController.loadWallet)



//EVENT DETAILS
router.get('/eventDetails',islogin,eventController.loadEventForm)
router.get('/bookings/daily-count',islogin,eventController.dailyCount)
router.post('/bookings',islogin,eventController.bookingdetails);
router.post('/cancel/:id',islogin,eventController.cancelBooking)




//CART
router.get('/cart',islogin,cartController.loadCart)
router.post('/cart',islogin,cartController.addtoCart )
router.delete('/remove-cart-item',islogin,cartController.removeCart)
router.put('/updateCart',islogin,cartController.updateCart)


//CHECKOUT

router.get('/checkout',islogin,orderController.loadCheckout)
router.post('/checkout',islogin,orderController.checkOutPost)
router.get('/updateBooking',islogin,orderController.loadUpdateBooking )
router.post('/updateBooking',islogin,orderController.updateBooking)


router.post('/checkout/create-razorpay-order',islogin,orderController.createRazorpayOrder)
router.post('/checkout/verify-razorpay',islogin,orderController.verifyPayment)


router.get('/order/:id/failure', orderController.failurePage);
router.get('/orderFailed', orderController.failurePage);


//orderSuccess
router.get('/orders',islogin,orderController.loadOrderDetails)
router.get('/orderSuccess',islogin,orderController.loadOrderSuccess)
router.get('/orderDetails/:id',islogin,orderController.loadOrderHistory)
router.post('/cancel-item/:orderId/:itemId', orderController.cancelItem);
router.post('/cancel-order/:orderId',islogin,orderController.cancelOrder);




//coupon
router.post('/applyCoupon',islogin,couponController.applyCoupon)     
router.post('/availableCoupons',islogin, couponController.getAvailableCoupons);





//logout
router.get ('/logout',islogin,userController.userlogout)

module.exports = router;