const express = require('express');
const router = express();
const userController = require('../controller/userController');
const expressEjsLayouts = require('express-ejs-layouts');
const{islogin,islogout} = require('../middlewares/auth')
const categoryController = require('../controller/categoryController');


router.use(expressEjsLayouts)




router.set('layout','./layouts/user')




router.get('/pageNotFound',userController.pageNotFound);


//LOGIN PAGE
router.get('/login',islogout,userController.loadLogin);
router.post('/login',userController.loginPage);

//HOME PAGE
router.get('/',userController.loadHomepage);

router.get('/shop/',islogin,userController.loadShop);
router.get('/shop/ajax',islogin,userController.loadproduct )
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






//logout
router.get ('/logout',islogin,userController.userlogout)

module.exports = router;