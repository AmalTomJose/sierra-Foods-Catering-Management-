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
router.get('/home',userController.loadHomepage)

//REGISTRATION

router.get('/signup',islogout,userController.loadSignup);
router.post('/signup',userController.signupPage)
router.get('/otp',userController.loadOtp);
router.post('/otp',userController.verifyOtp);
router.get('/resendOTP',userController.resendOTP)


router.get('/item',categoryController.loadItem)




//logout
router.get ('/logout',islogin,userController.userlogout)

module.exports = router;