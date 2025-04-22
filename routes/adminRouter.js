const express = require('express');
const router = express();
const adminController = require('../controller/adminController');
const adminAuth =require('../middlewares/adminAuth');
const expressEjsLayouts = require('express-ejs-layouts');
const categoryController =  require('../controller/categoryController');
const subcategoryController = require('../controller/subcategoryController')
const productController = require('../controller/productController');
const multer= require('../middlewares/multer');
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
router.post("/editProduct",multer.uploadProduct.array('image'), productController.storeEditProduct)
      //blocking item
router.get('/blockProduct',adminAuth.islogin,productController.blockProduct) 
//logout
router.get('/logout',adminController.adminLogout)



module.exports = router;
