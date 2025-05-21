const User = require('../models/userSchema');
const bcrypt = require('bcrypt');
const message = require('../config/mailer');
const mongoose = require('mongoose');
const Booking = require('../models/bookingModel')

const Product = require('../models/itemModel');
const Category = require('../models/categoryModels');
const { loadProducts } = require('./productController');

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



const loadProductDetail = async(req,res)=>{
  try{
    const userId = req.session.user_id;
    const userData = await User.findById(userId);
    const id = req.params.id;
    const productDetail = await Product.findById(id).populate('category').populate('subcategory');
    const booking= await Booking.findOne({ user: userId })
    .sort({ createdAt: -1 }) // Sort by most recent
    .select("guestCount"); 
    const qty = booking.guestCount     
    console.log('The quantity entered by the user while selecting the booking is:',qty)
      console.log(productDetail)
    res.render('user/product/singleProduct',{
      user:userData,
      product:productDetail,
      qty
    })

  }
  catch(error)
  {
    console.log(error.message)
  }
}



//login page (GET)
const loadLogin = async(req,res)=>{
    try{
        res.render('user/auth/login',{msg:null,layout:'./layouts/mainLayout',title:'login'})

    } 
    catch(error)
    {
        res.status(500).send("Server Error");
    }
}

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
    console.log("User logged in:", req.session.user_id);
    return res.redirect("/");
  
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
    const {firstname,lastname,email,phoneno,password} =  req.body  ;
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
    try {
      res.render("user/auth/otp",{layout:'layouts/mainLayout',title:'otp',message:null});
    } catch (error) {
      console.log(error.message);
    }
  };


  // //POST OTP
  // const verifyOtp = async (req, res) => {
  //   try {
    
  //     const userData = req.session.user_id;
      
  //     const fullOTP = req.body.otp;
  //      console.log(userData);
  //      console.log(fullOTP);
    
  //     if (!req.session.user_id) {
        
  //       if (fullOTP == req.session.otp) {

  //           const hashedPassword = await bcrypt.hash(userData.password,10);
            
  //           const user = new User({
  //               firstname : userData.firstname,
  //           lastname: userData.lastname,
  //           email: userData.email,
  //           phoneno: userData.phoneno,
  //           password: hashedPassword,
  //           isAdmin: 0,
  //           isBlocked: 0,
  //           googleId:undefined
  //         });
  
  //         const userDataSave = await user.save();
  //         if (userDataSave && userDataSave.isAdmin === 0) {
        
  //           req.session.user_id = userDataSave._id;
  
  //           res.redirect('/');
  //         } else {
  //           res.render("user/otp", {layout:'layouts/mainLayout',title:'otp' , message: "Registration Failed" });
          
  //         }
  //       } else {
  //         res.render("user/otp", {layout:'layouts/mainLayout',title:'otp' ,message: "invailid otp" });
          
  //       }
  //     } else {
  //       if (fullOTP.trim() == req.session.otp.trim()) {
  //         res.redirect("/resetPassword");
  //       } else {
  //         res.render("user/otp", { layout:'layouts/mainLayout',title:'otp',message: "Incorrect OTP. Please try again." });
  //       }
  //     }
  //   } 
  //   catch (error) {
  //     console.log(error.message);
  //   }
  // };
  
  

  
  const verifyOtp = async (req, res) => {
    try {
      const fullOTP = req.body.otp;
  
      // FLOW 1: REGISTRATION (no user_id set)
      if (!req.session.user_id && req.session.tempUser) {
        const userData = req.session.tempUser;
  
        if (fullOTP === req.session.otp) {
          const hashedPassword = await bcrypt.hash(userData.password, 10);
          const user = new User({ ...userData, password: hashedPassword });
          const savedUser = await user.save();
          req.session.user_id = savedUser._id;
          res.redirect('/');
        } else {
          return res.render("user/auth/otp", { layout: 'layouts/mainLayout', message: "Invalid OTP" });
        }
  
      // FLOW 2: FORGOT PASSWORD
      } else if (req.session.resetUser) {
        if (fullOTP === req.session.otp) {
          res.redirect("/resetPassword");
        } else {
          res.render("user/auth/otp", { layout: 'layouts/mainLayout', message: "Incorrect OTP. Try again." });
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
      // Retrieve user data from session storage
      const userData = req.session.userData;
  
      if (!userData) {
        res.status(400).json({ message: "Invalid or expired session" });
      } else {
        delete req.session.otp;
        const data = await message.sendVerifyMail(req, userData.email);
      }
  
      // Generate and send new OTP using Twilio
  
      res.render("user/auth/otp", { layout:'layouts/mainLayout',title:'otp',message: "OTP resent successfully" });
    } catch (error) {
      console.error("Error: ", error);
      res.render("user/auth/otp", { layout:'layouts/mainLayout',title:'otp',message: "Failed to send otp" });
    }
  };
  

//logout

const userlogout = async (req, res) => {
  try {
      
        if (req.session.passport) {
          req.session.passport.user = null;
      }
          req.session.user_id = null;
          console.log('hiii');
          return res.redirect('/login');

  } catch (error) {
      console.log(error.message);
      return res.status(500).send("Internal Server Error");
  }
};


 const getForgotPassword = async(req,res)=>{
  try{
     return res.render('user/auth/forget',{layout:'layouts/mainLayout',title:'forgetpassword'} )

  }
  catch(error)
  {
    console.log(error.message)
  }
 }

//  const forgotPasswordOTP = async (req, res) => {
//   try {
//     const emaildata = req.body.email;
//     console.log("Email received:", emaildata);

//     const userExist = await User.findOne({ email: emaildata });
 
//     if (userExist) {
//       req.session.userData = userExist;
//       req.session.user_id = userExist._id;
//       console.log(userExist._id);
    
//       // Assuming you have a message-sending utility
//       const data = await message.sendVerifyMail(req, userExist.email);
     
    
//       res.render("user/otp",{layout:'layouts/mainLayout',title:'otp' ,message:null});
//     }
//      else {
//       res.render("user/forget", {
//         layout:'layouts/mainLayout',title:'otp' ,
//         error: "Attempt Failed",
//         User: null,
        
//       });
//     }
//   } catch (error) {
//     console.log("Error:", error.message);
//   }
// };

const forgotPasswordOTP = async (req, res) => {
  try {
    const email = req.body.email;
    const user = await User.findOne({ email });

    if (!user) {
      return res.render("user/auth/forgotPassword", {
        layout: 'layouts/mainLayout',
        message: "Email not found",
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    req.session.otp = otp;
    req.session.resetUser = user._id; // Store only the _id for security

    // Send OTP via email here
    console.log("OTP for reset:", otp);

    res.redirect("/otp"); // Reuse same OTP page
  } catch (err) {
    console.log(err.message);
  }
};


// const loadResetPassword = async(req,res) => {
//   try{
//     if(req.session.user_id){
//       const userId = req.session.user_id
//       const user = await User.findById(userId)
//       res.render("user/resetPassword",{User: user})
//     }else {
//       res.redirect("user/forget")
//     }
//   }catch(error){
//     console.log(error.message);
//   }
// }
const loadResetPassword = async (req, res) => {
  if (!req.session.resetUser) return res.redirect("/login");
  res.render("user/auth/resetPassword", { layout: 'layouts/mainLayout',title:'forget password' });
};



// const resetPassword = async (req, res) => {
//   try {
//     const user_id = req.session.user_id;
//     const password = req.body.password;
//     const secure_password = await securePassword(password);

//     const updatedData = await User.findOneAndUpdate(
//       { _id: user_id },
//       { $set: { password: secure_password } },
//       { new: true } // to return the updated document
//     );

//     if (updatedData) {
//       res.redirect("/login");
//     }
//   } catch (error) {
//     console.log(error.message);
//   }
// };


const resetPassword  = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.render("user/auth/resetPassword", {
        layout: 'layouts/mainLayout',
        message: "Passwords do not match",
        title:'forget password'
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(req.session.resetUser, {
      password: hashed,
    });

    // Cleanup session
    req.session.resetUser = null;
    req.session.otp = null;

    res.redirect("/login");
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

    if (search) {
      query.item_name = { $regex: new RegExp(search, 'i') };
    }

    if (category) {
      query.category = new mongoose.Types.ObjectId(category);
    }

    let sortOption = { item_price: 1 };
    if (sort === 'desc') {
      sortOption = { item_price: -1 };
    }

    const productData = await Product.aggregate([
      { $match: query },
      { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' }},
      { $unwind: '$category' },
      { $match: { 'category.cat_status': true }},
      { $sort: sortOption },
      { $skip: (page - 1) * perPage },
      { $limit: perPage }
    ]);

    const totalCountResult = await Product.aggregate([
      { $match: query },
      { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' }},
      { $unwind: '$category' },
      { $match: { 'category.cat_status': true }},
      { $count: 'total' }
    ]);

    const totalProducts = totalCountResult[0]?.total || 0;
    const totalPages = Math.ceil(totalProducts / perPage);

    const categories = await Category.find({ cat_status: true });

    res.render('user/product/shop', {
      products: productData,
      user:userData,
      categories,
      currentPage: page,
      totalPages,
      sort,
      query: req.query
    });

  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};







const loadProduct = async (req, res) => {
  try {
    const { search, category, sort, page } = req.query;
      console.log(req.query)
    console.log('hello')

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
console.log(query )
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


    console.log(totalCountResult);
    
    const totalProducts = totalCountResult[0]?.total || 0;
    const totalPages = Math.ceil(totalProducts / perPage);

    

    console.log(query)

    const productData = await Product.aggregate([
      // Match initial product filters
      { $match: query },
    
      // Lookup and join category data
      {
        $lookup: {
          from: 'categories', // collection name in MongoDB (check the actual name if pluralized)
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      // Unwind the category array
      { $unwind: '$category' },
    
      // Filter only products whose category.cat_status is true
      { $match: { 'category.cat_status': true } },
    
      // Sort
      { $sort: sortOption },
    
      // Pagination
      { $skip: (currentPage - 1) * perPage },
      { $limit: perPage }
    ]);
console.log(productData)

    res.render('partials/user/shopCategory', {
      products:productData,
      currentPage,
      totalPages,
      layout: false,  // Ensure only the partial view is rendered
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error in Ajax');
  }
};


  const loadProfile = async(req,res)=>{
    try{
      console.log('loadprofile')
      const userId = req.session.user_id;
      const userData = await User.findById(userId);
      console.log(userData)
      if(userData)
      {
        console.log('test')
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

// const loadProfile = async (req, res) => {
//   try {
//     console.log('test');
//     const userId = req.session.user_id;

//     if (!userId) {
//       return res.redirect('/login');
//     }

//     const userData = await User.findById(userId);

//     if (userData) {
//       console.log('User found:', userData.name); // Optional: confirm it's the right user
//       res.render('user/userProfile', { userData });
//     } else {
//       res.redirect('/login');
//     }
//   } catch (error) {
//     console.error('Error loading profile:', error);
//     res.status(500).send('Something went wrong while loading your profile.');
//   }
// };


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
    userEdit

}