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
router.post('/resetPAssword',islogout,userController.resetPassword)


//USER
router.get('/userprofile',islogin,userController.loadProfile);
router.post('/userprofile',multer.uploadUser.single('image'), userController.userEdit);
router.get('/userAddress',islogin,addressController.loadAddress)
router.get('/addAddress',islogin,addressController.loadAddAddress)
router.post('/addAddress',islogin,addressController.addAddress)
router.get('/editAddress',islogin,addressController.loadEditAddress)
router.post('/editAddress',islogin,addressController.editAddress)
router.get('/deleteAddress',islogin,addressController. deleteAddress)



//WISHLIST

router.get('/wishlist',islogin,wishlistController.loadWishlist);
router.post('/addToWishlist',islogin,wishlistController.addToWishlist)
router.delete('/removeWishlist',islogin,wishlistController.removeFromWishlist)


//EVENT DETAILS
router.get('/eventDetails',islogin,eventController.loadEventForm)
router.get('/bookings/daily-count',islogin,eventController.dailyCount)
router.post('/bookings',islogin,eventController.bookingdetails);




//CART

// router.get('/cart',islogin,cartController.loadCartPage);







//logout
router.get ('/logout',islogin,userController.userlogout)

module.exports = router;