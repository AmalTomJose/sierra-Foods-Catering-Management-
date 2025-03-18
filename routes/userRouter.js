const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');



router.get('/pageNotFound',userController.pageNotFound);
router.get('/',userController.loadHomepage);
router.get('/login',userController.loadLogin);


module.exports = router;