const User = require('../models/userSchema');
const bcrypt = require('bcrypt');
const message = require('../config/mailer');
const mongoose = require('mongoose');
const Booking = require('../models/bookingModel')

const Product = require('../models/itemModel');
const Category = require('../models/categoryModels');
const { loadProducts } = require('./productController');
const Offer = require('../models/offerModel')
const Wallet = require('../models/walletModel')

const generateRandomCode = (firstname)=>{
  const random = Math.floor(1000 + Math.random() * 9000); // 4 digits
  return `${firstname.slice(0,3).toUpperCase()}${random}`; 
}


// Function to create wallet
const createWalletForUser = async (userId) => {
  try {
      const existingWallet = await Wallet.findOne({ user: userId });
      if (existingWallet) return existingWallet;

      const newWallet = new Wallet({ user: userId });
      await newWallet.save();
      return newWallet;
  } catch (err) {
      console.error("❌ Error creating wallet:", err);
  }
};

const loadWallet = async (req, res) => {
  try {
    const userId = req.session.user_id;
    let wallet = await Wallet.findOne({ user: userId }).populate('transactions.orderId');

    // If wallet doesn't exist, create one
    if (!wallet) {
      wallet = await Wallet.create({ user: userId, balance: 0 });
    }

    res.render('user/profile/wallet', { user: userId, wallet });
  } catch (err) {
    console.error('Error loading wallet:', err);
    res.status(500).render('error', { message: 'Failed to load wallet' });
  }
};







const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};



const pageNotFound = async(req,res)=>{
    try{
       res.render('user/general/pagenotfound')

    }
    catch(error)
    {
        res.redirect('/pageNotFound')
    }
}





const loadHomepage = async(req,res)=>{
    try{

      const productData = await Product.find({item_status:true});
      const categories = await Category.find();
      const userId = req.session.user_id;
    const userData = await User.findById(userId);
   
   
      res.render('user/general/home',{
        products:productData,
        user:userData,
        categories
      })
  

   


    }
    catch(error){
        console.log("Home page not found");
        res.status(500).send("Server Error");
    }


}


const loadProductDetail = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userData = await User.findById(userId);
    const id = req.params.id;

    // 🛍️ Fetch product details
    const product = await Product.findById(id)
      .populate('category')
      .populate('subcategory');

    if (!product) {
      return res.redirect('/shop');
    }

    // 🧾 Fetch user's active booking (for guest count)
    const booking = await Booking.findOne({ user: userId, status: 'active' })
      .sort({ createdAt: -1 })
      .select('guestCount');

    const today = new Date();

    // 🎯 Fetch active offers (product, category, global)
    const activeOffers = await Offer.find({
      isActive: true,
      startDate: { $lte: today },
      endDate: { $gte: today },
    });

    // 🔎 Find offers related to this product
    const productOffer = activeOffers.find(o =>
      o.applicableTo === 'product' &&
      Array.isArray(o.products) &&
      o.products.some(pid => pid.toString() === product._id.toString())
    );

    const categoryOffer = activeOffers.find(o =>
      o.applicableTo === 'category' &&
      o.category?.toString() === product.category?._id?.toString()
    );

    const globalOffer = activeOffers.find(o => o.applicableTo === 'all');

    // ⚙️ Determine best offer (product / category / global)
    let bestOffer = null;
    let bestDiscount = 0;

    const calculateDiscount = (offer) => {
      if (!offer) return 0;
      return offer.discountType === 'percentage'
        ? (product.item_price * offer.discountValue) / 100
        : offer.discountValue;
    };

    const offers = [productOffer, categoryOffer, globalOffer];
    for (const offer of offers) {
      const discount = calculateDiscount(offer);
      if (discount > bestDiscount) {
        bestDiscount = discount;
        bestOffer = offer;
      }
    }

    // 💰 Apply best offer
    if (bestOffer) {
      product.offerPrice = Math.max(product.item_price - bestDiscount, 0);
      product.appliedOffer = bestOffer;
    } else {
      product.offerPrice = product.item_price;
    }

    // 👥 Get guest count and minimum order quantity
    const guestCount = booking?.guestCount || 0;
    const minOrderQty = guestCount > 0 ? Math.floor(guestCount / 2) : 0;

    // 🧩 Fetch similar products (same category, exclude current one)
    const similarProducts = await Product.find({
      category: product.category?._id,
      _id: { $ne: product._id },
      item_status: true
    }).limit(5);

    // 🧭 Render single product page
    return res.render('user/product/singleProduct', {
      user: userData,
      product,
      guestCount,
      minOrderQty,
      error: booking ? null : 'Please Book an Event first to order items.',
      similarProducts
    });

  } catch (error) {
    console.error('❌ loadProductDetail error:', error.message);
    res.status(500).send('Internal Server Error');
  }
};



// Login Page (GET)
const loadLogin = async (req, res) => {
  try {
    res.render('user/auth/login', {
      msg: null,
      layout: './layouts/mainLayout',
      title: 'login',

      // ✅ Pass flash messages
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

//login page(POST)

const loginPage = async(req,res)=>{
    
  try { 
    const { email, password } = req.body;
  
    
    const existingUser = await User.findOne({ email });
  
    if (!existingUser) {
      return res.render("user/auth/login", { msg: "User not found." ,layout:'./layouts/mainLayout',title:'login'});
    }
  
    if (existingUser.isBlocked === 1) {
      return res.render("user/auth/login", { msg: "Your account is blocked.",layout:'./layouts/mainLayout',title:'login' });
    }
  
    const passwordMatch = await bcrypt.compare(password, existingUser.password);
  
    if (!passwordMatch) {
      return res.render("user/auth/login", { msg: "Password is incorrect." ,layout:'./layouts/mainLayout',title:'login'});
    }
  
    if (existingUser.isAdmin === 1) {
      return res.render("user/auth/login", { msg: "User not found." ,layout:'./layouts/mainLayout',title:'login' });
    }
  
    // Login success
    req.session.user_id = existingUser._id;
    return res.redirect("/shop");
  
  } 
  catch(error)
    {
        console.error("Error during login:", error);
        res.status(500).send("Internal Server Error");

    }
}
//signup page(GET)

const loadSignup = async(req,res)=>{
    try
    {
        res.render('user/auth/signup',{title:'signup Page',msg:null,layout:'./layouts/mainLayout'})

    }
    catch(error)
    {
        res.status(500).send("Not loading signupPage")
    }
}


//signup page(POST)
const signupPage = async (req,res)=>{
    const {firstname,lastname,email,phoneno,password,referralCode} =  req.body  ;
    try{
        const existingUser = await User.findOne({email});
         
        if(existingUser)
        {
         return res.render('user/auth/signup',{title:'signup Page',msg:'User Already Exist',layout:'layouts/mainLayout'})
        }
        else{
            req.session.userData = req.body;
            req.session.register=1;
            req.session.email =email;
            req.session.resetUser=email;
            if(req.session.email){
                const data = await message.sendVerifyMail(req,req.session.email);
                res.redirect('/otp')
            }
            // const hashedPassword = await bcrypt.hash(password,10);

            // const newUser = new User({
            //     firstname,
            //     lastname,
            //     email,
            //     phoneno,
            //     password:hashedPassword,
            //     googleId:  undefined
            // });
           
            // await newUser.save();
            // return res.render('user/login',{msg:'Successfully Created Account'});
    

        }    

    }
    catch(error)
    {
        console.error("Error for saving the user",error);
        res.status(500).send('Internal Servor error');

    }
}

// GET OTP PAGE
const loadOtp = async (req, res) => {
  try{
      res.render("user/auth/otp",{layout:'layouts/user',user:'',title:'otp',message:null});
    } catch (error) {
      console.log(error.message)
    }
  };

  
  

  
  const verifyOtp = async (req, res) => {
    try {
      const fullOTP = req.body.otp;

      // FLOW 1: REGISTRATION (no user_id set)
      if (req.session.userData&&req.session.register==1) {
  
  
        if (fullOTP == req.session.otp) {
          const userData = req.session.userData
          const referralCode = userData.referralCode
          const hashedPassword = await bcrypt.hash(userData.password, 10);
          let referredByUser = null;
          if(referralCode){
            referredByUser = await User.findOne({ referralCode :referralCode});

          }
          const user = new User({ ...userData, password: hashedPassword ,referredBy:referredByUser?referredByUser._id:null});
          user.referralCode = generateRandomCode(user.firstname)
          const savedUser = await user.save();
          await createWalletForUser(user._id)
          if (referredByUser) {
            await Wallet.updateOne(
              { user: referredByUser._id },
              { $inc: { balance: 100 } }
            );
            await Wallet.updateOne({user:savedUser._id},{$inc: { balance: 50 } })
          }

          req.session.user_id = savedUser._id;
       
          req.flash('success', 'User registered successfully');

       
          res.redirect('/');
        } else {
          return res.render("user/auth/otp", { layout: 'layouts/user',user:'',title:'otp', message: "Invalid OTP" });
        }
  
      // FLOW 2: FORGOT PASSWORD
      } else if (req.session.resetUser) {
        if (fullOTP === req.session.otp) {
          res.redirect("/resetPassword");
        } else {
          res.render("user/auth/otp", { layout: 'layouts/user',user:'',title:'otp', message: "Incorrect OTP. Try again." });
        }
      } else {
        res.redirect("/login"); // fallback
      }
    } catch (err) {
      console.log(err.message);
    }
  };
  


  const resendOTP = async (req, res) => {
    try {
      // ✅ Retrieve email from session (stored in forgotPasswordOTP)
      const email = req.session.email;
  
      if (!email) {
        return res.render("user/auth/otp", {
          layout: 'layouts/user',
          user: '',
          title: 'otp',
          message: "Session expired. Please try again.",
        });
      }
  
      // ✅ Remove old OTP and generate new one via sendVerifyMail()
      delete req.session.otp;
      await message.sendVerifyMail(req, email);
  
      // ✅ Show OTP page again with a success message
      res.render("user/auth/otp", {
        layout: 'layouts/user',
        user: '',
        title: 'otp',
        message: "OTP resent successfully",
      });
  
    } catch (error) {
      console.error("Error while resending OTP:", error);
      res.render("user/auth/otp", {
        layout: 'layouts/user',
        user: '',
        title: 'otp',
        message: "Failed to resend OTP. Please try again.",
      });
    }
  };
  

//logout

const userlogout = async (req, res) => {
  try {
      
        if (req.session.passport) {
          req.session.passport.user = null;
      }
          req.session.user_id = null;
          return res.redirect('/login');

  } catch (error) {
      console.log(error.message);
      return res.status(500).send("Internal Server Error");
  }
};


 const getForgotPassword = async(req,res)=>{
  try{
     return res.render('user/auth/forget',{user:'',msg:'', layout:'layouts/user',title:'forgetpassword'} )

  }
  catch(error)
  {
    console.log(error.message)
  }
 }

const forgotPasswordOTP = async (req, res) => {
  try {
    const email = req.body.email;
    const user = await User.findOne({ email });

    if (!user) {
      return res.render("user/auth/forget", {
        user: '',
        layout: 'layouts/user',
        msg: "Email not found",
        title: 'forget password'
      });
    }

    // Store user info for reset
    req.session.resetUser = user._id;
    req.session.email = email;

    // ✅ Only this call will generate & send OTP
    await message.sendVerifyMail(req, email);


    res.redirect("/otp"); // Reuse same OTP page
  } catch (err) {
    console.log(err.message);
  }
};


const loadResetPassword = async (req, res) => {
  if (!req.session.resetUser) return res.redirect("/login");
  res.render("user/auth/resetPassword", { user:'', layout: 'layouts/user',title:'forget password' });
};


const resetPassword  = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.render("user/auth/resetPassword", {
        layout: 'layouts/user',  // ✅ use same layout as other user pages
        message: "Passwords do not match",
        title:'Forget Password'
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(req.session.resetUser, { password: hashed });

    // Cleanup session
    req.session.resetUser = null;
    req.session.otp = null;

    req.flash('success', 'Password changed successfully!');

  res.redirect('/login');
    
  } catch (err) {
    console.log(err.message);
  }
};




const loadShop = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userData = await User.findById(userId);

    let { search, category, sort, page } = req.query;
    page = parseInt(page) || 1;

    const perPage = 8;
    let query = { item_status: true };

    // 🔍 Search filter
    if (search) {
      query.item_name = { $regex: new RegExp(search, 'i') };
    }

    // 🏷️ Category filter
    if (category) {
      query.category = new mongoose.Types.ObjectId(category);
    }

    // 🔢 Sorting
    let sortOption = { item_price: 1 };
    if (sort === 'desc') {
      sortOption = { item_price: -1 };
    }

    const today = new Date();

    // 🎯 Fetch active offers (including product/category/global)
    const activeOffers = await Offer.find({
      isActive: true,
      startDate: { $lte: today },
      endDate: { $gte: today }
    });

    // 🛍️ Fetch products
    const productData = await Product.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      { $match: { 'category.cat_status': true } },
      { $sort: sortOption },
      { $skip: (page - 1) * perPage },
      { $limit: perPage }
    ]);

    // ⚡ Apply best offer logic
    const updatedProducts = productData.map(product => {
      // Find matching offers
      const productOffer = activeOffers.find(o =>
        o.applicableTo === 'product' &&
        Array.isArray(o.products) &&
        o.products.some(pid => pid.toString() === product._id.toString())
      );

      const categoryOffer = activeOffers.find(o =>
        o.applicableTo === 'category' &&
        o.category?.toString() === product.category._id.toString()
      );

      const globalOffer = activeOffers.find(o => o.applicableTo === 'all');

      // Determine best discount
      let bestOffer = null;
      let bestDiscount = 0;

      const calculateDiscount = (offer) => {
        if (!offer) return 0;
        return offer.discountType === 'percentage'
          ? (product.item_price * offer.discountValue) / 100
          : offer.discountValue;
      };

      // Compare offers
      const offers = [productOffer, categoryOffer, globalOffer];
      for (const offer of offers) {
        const discount = calculateDiscount(offer);
        if (discount > bestDiscount) {
          bestDiscount = discount;
          bestOffer = offer;
        }
      }

      // Apply best offer
      if (bestOffer) {
        product.offerPrice = Math.max(product.item_price - bestDiscount, 0);
        product.appliedOffer = bestOffer;
      } else {
        product.offerPrice = product.item_price;
      }

      return product;
    });

    // 📊 Pagination count
    const totalCountResult = await Product.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      { $match: { 'category.cat_status': true } },
      { $count: 'total' }
    ]);

    const totalProducts = totalCountResult[0]?.total || 0;
    const totalPages = Math.ceil(totalProducts / perPage);
    const categories = await Category.find({ cat_status: true });
 
    // 🧭 Render shop page
    res.render('user/product/shop', {
      products: updatedProducts,
      user: userData,
      categories,
      currentPage: page,
      totalPages,
      sort,
      query: req.query
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
};



const loadProduct = async (req, res) => {
  try {
    const { search, category, sort, page } = req.query;
    const perPage = 8;
    const currentPage = parseInt(page) || 1;

    let query = { item_status: true };

    if (search) {
      query.item_name = { $regex: new RegExp(search, 'i') };
    }

    if (category) {
      query.category = new mongoose.Types.ObjectId(category);
    }

    let sortOption = {};
    if (sort === 'asc') {
      sortOption = { item_price: 1 };
    } else if (sort === 'desc') {
      sortOption = { item_price: -1 };
    }

    const today = new Date();

    // ✅ Fetch active offers
    const activeOffers = await Offer.find({
      isActive: true,
      startDate: { $lte: today },
      endDate: { $gte: today }
    });

    // ✅ Get paginated products with category info
    const productData = await Product.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      { $match: { 'category.cat_status': true } },
      { $sort: sortOption },
      { $skip: (currentPage - 1) * perPage },
      { $limit: perPage }
    ]);

    // ✅ Apply best offer (product / category / global)
    const updatedProducts = productData.map(product => {
      const productOffer = activeOffers.find(o =>
        o.applicableTo === 'product' &&
        Array.isArray(o.products) &&
        o.products.some(pid => pid.toString() === product._id.toString())
      );

      const categoryOffer = activeOffers.find(o =>
        o.applicableTo === 'category' &&
        o.category?.toString() === product.category._id.toString()
      );

      const globalOffer = activeOffers.find(o => o.applicableTo === 'all');

      let bestOffer = null;
      let bestDiscount = 0;

      const calculateDiscount = (offer) => {
        if (!offer) return 0;
        return offer.discountType === 'percentage'
          ? (product.item_price * offer.discountValue) / 100
          : offer.discountValue;
      };

      const offers = [productOffer, categoryOffer, globalOffer];
      for (const offer of offers) {
        const discount = calculateDiscount(offer);
        if (discount > bestDiscount) {
          bestDiscount = discount;
          bestOffer = offer;
        }
      }

      if (bestOffer) {
        product.offerPrice = Math.max(product.item_price - bestDiscount, 0);
        product.appliedOffer = bestOffer;
      } else {
        product.offerPrice = product.item_price;
      }

      return product;
    });

    // ✅ Pagination count
    const totalCountResult = await Product.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      { $match: { 'category.cat_status': true } },
      { $count: 'total' }
    ]);

    const totalProducts = totalCountResult[0]?.total || 0;
    const totalPages = Math.ceil(totalProducts / perPage);

    // ✅ Render partial view
    res.render('partials/user/shopCategory', {
      products: updatedProducts,
      currentPage,
      totalPages,
      layout: false,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error in Ajax');
  }
};


  const loadProfile = async(req,res)=>{
    try{
      const userId = req.session.user_id;
      const userData = await User.findById(userId);
      if(userData)
      {
        res.render('user/profile/userProfile',{user:userData,message:null});
      }
      else{
        res.redirect('/login')
      }

    }
  catch(error){
    console.log(error.message)
  }
};

const userEdit = async (req, res) => {
  try {
    let id = req.body.user_id;
    const userData = await User.findById(id);
    const { name, mobile } = req.body;

    let updateData;

    if (!req.file) {
      updateData = await User.findByIdAndUpdate(
        { _id: id },
        {
          $set: {
            firstname:name,
            phoneno:mobile,
          },
        }
      );
    } else {
      updateData = await User.findByIdAndUpdate(
        { _id: id },
        {
          $set: {
            firstname:name,
            phoneno:mobile,
            image: req.file.filename,
          },
        }
      );
    }

    await updateData.save();
res.redirect('/userprofile');
  } catch (error) {
    console.log(error.message);
  }
};



module.exports = {

    loadHomepage,
    loadShop,
    loadProductDetail,
    pageNotFound,
    loadLogin,
    loadSignup,
    signupPage,
    loginPage,
    loadOtp,
    verifyOtp,
    resendOTP,
    getForgotPassword,
    forgotPasswordOTP,
    loadResetPassword,
    resetPassword,
    userlogout,
    loadProduct,
    loadProfile,
    userEdit,
    loadWallet,
    

}