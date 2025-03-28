const express = require('express');
const router = express();
const adminController = require('../controller/adminController');
const adminAuth =require('../middlewares/adminAuth');
const expressEjsLayouts = require('express-ejs-layouts');
const categoryController =  require('../controller/categoryController')

//Setting layout for adminside
router.use(expressEjsLayouts);
router.set('layout','./layouts/admin')

//LOGIN
router.get('/',adminAuth.islogout,adminController.adminLogin)
router.post('/',adminAuth.islogout,adminController.verifyLogin);


//HOME
router.get('/home',adminAuth.islogin,adminController.loadHome)


//userDashboard
router.get('/userDashboard',adminAuth.islogin,adminController.loadUserpage)
router.get('/unlistUser',adminAuth.islogin,adminController.listUser)

//Category
router.get('/category',adminAuth.islogin,categoryController.loadCategory)


//logout
router.get('/logout',adminController.adminLogout)



module.exports = router;
