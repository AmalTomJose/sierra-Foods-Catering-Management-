const User = require('../models/userSchema');
const bcrypt = require('bcrypt');
const message = require('../config/mailer');


const Product = require('../models/itemModel');
const Category = require('../models/categoryModels');

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
       res.render('user/pagenotfound')

    }
    catch(error)
    {
        res.redirect('/pageNotFound')
    }
}





const loadHomepage = async(req,res)=>{
    try{
      console.log(req.session.user_id)
      const productData = await Product.find({item_status:true});
      const categories = await Category.find();

        return res.render('user/home',{
          products : productData,
          User:null,
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
    const id = req.params.id;
    const productDetail = await Product.findById(id).populate('category').populate('subcategory');
     console.log(productDetail)
    res.render('user/singleProduct',{
      product:productDetail
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
        res.render('user/login',{msg:null})

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
      return res.render("user/login", { msg: "User not found." });
    }
  
    if (existingUser.isBlocked === 1) {
      return res.render("user/login", { msg: "Your account is blocked." });
    }
  
    const passwordMatch = await bcrypt.compare(password, existingUser.password);
  
    if (!passwordMatch) {
      return res.render("user/login", { msg: "Password is incorrect." });
    }
  
    if (existingUser.isAdmin === 1) {
      return res.render("user/login", { msg: "User not found." });
    }
  
    // Login success
    req.session.user_id = existingUser._id;
    console.log("User logged in:", req.session.user_id);
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
        res.render('user/signup',{title:'signup Page',layout:'layouts/mainLayout',msg:null})

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
         return res.render('user/signup',{title:'signup Page',msg:'User Already Exist',layout:'layouts/mainLayout'})
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
      res.render("user/otp",{layout:'layouts/mainLayout',title:'otp',message:null});
    } catch (error) {
      console.log(error.message);
    }
  };


  //POST OTP
  const verifyOtp = async (req, res) => {
    try {
    
      const userData = req.session.userData;
      
      const fullOTP = req.body.otp;
       console.log(userData);
       console.log(fullOTP);
    
      if (!req.session.user_id) {
        
        if (fullOTP == req.session.otp) {

            const hashedPassword = await bcrypt.hash(userData.password,10);
            
            const user = new User({
                firstname : userData.firstname,
            lastname: userData.lastname,
            email: userData.email,
            phoneno: userData.phoneno,
            password: hashedPassword,
            isAdmin: 0,
            isBlocked: 0,
            googleId:undefined
          });
  
          const userDataSave = await user.save();
          if (userDataSave && userDataSave.isAdmin === 0) {
        
            req.session.user_id = userDataSave._id;
  
            res.render('user/login',{layout:'layouts/mainLayout',title:'otp',msg:'Sucessfully Created Account'});
          } else {
            res.render("user/otp", { message: "Registration Failed" });
          
          }
        } else {
          res.render("user/otp", {layout:'layouts/mainLayout',title:'otp' ,message: "invailid otp" });
          
        }
      } else {
        if (fullOTP.trim() == req.session.otp.trim()) {
          res.redirect("/resetPassword");
        } else {
          res.render("user/otp", { layout:'layouts/mainLayout',title:'otp',message: "Incorrect OTP. Please try again." });
        }
      }
    } 
    catch (error) {
      console.log(error.message);
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
  
      res.render("user/otp", { layout:'layouts/mainLayout',title:'otp',message: "OTP resent successfully" });
    } catch (error) {
      console.error("Error: ", error);
      res.render("user/otp", { layout:'layouts/mainLayout',title:'otp',message: "Failed to send otp" });
    }
  };
  

//logout

 const userlogout = async(req,res)=>{
    try{
        req.session.destroy();
        console.log('hiii')
    res.render('user/login',{msg:'Sucessfully Logged Out'})

    }
    catch(error)
    {
        console.log(error.message)
    }
 }

 const getForgotPassword = async(req,res)=>{
  try{
     return res.render('user/forget')

  }
  catch(error)
  {
    console.log(error.message)
  }
 }

 const forgotPasswordOTP = async (req, res) => {
  try {
    const emaildata = req.body.email;
    console.log("Email received:", emaildata);

    const userExist = await User.findOne({ email: emaildata });
 
    if (userExist) {
      req.session.userData = userExist;
      req.session.user_id = userExist._id;
      console.log(userExist._id);
    
      // Assuming you have a message-sending utility
      const data = await message.sendVerifyMail(req, userExist.email);
     
    
      res.render("user/otp",{message:null});
    }
     else {
      res.render("forget", {
        error: "Attempt Failed",
        User: null,
        
      });
    }
  } catch (error) {
    console.log("Error:", error.message);
  }
};



const loadResetPassword = async(req,res) => {
  try{
    if(req.session.user_id){
      const userId = req.session.user_id
      const user = await User.findById(userId)
      res.render("user/resetPassword",{User: user})
    }else {
      res.redirect("user/forget")
    }
  }catch(error){
    console.log(error.message);
  }
}

const resetPassword = async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const password = req.body.password;
    const secure_password = await securePassword(password);

    const updatedData = await User.findOneAndUpdate(
      { _id: user_id },
      { $set: { password: secure_password } },
      { new: true } // to return the updated document
    );

    if (updatedData) {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};






const loadShop = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userData = await User.findById(userId);
    let query ={item_status:true};

    // Extracting query parameters
    let { search: searchQuery, category: categoryId, sort, page } = req.query;

    // Reset the page to 1 if search or category filter is applied
    if (searchQuery || categoryId) {
        page = 1; // Reset to page 1 if there's a new search or category selection
    } else {
        page = parseInt(page) || 1; // Use the existing page number or default to 1
    }

    const perPage = 9;
    // Apply search and category filters to the query
    if (searchQuery) {
      query.item_name = { $regex: new RegExp(searchQuery, 'i') };
    }
    if (categoryId) {
      query.category = categoryId;
    }

    // Sorting logic remains the same
    let sortOption = {};
    if (sort === 'asc') {
        sortOption = { item_price: 1 };
    } else if (sort === 'desc') {
        sortOption = { item_price: -1 };
    }

  
    console.log(query)

    // The rest of your product fetching logic remains unchanged
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / perPage);
    const productData = await Product.find(query)
      .populate('category')
      .sort(sortOption)
      .skip((page - 1) * perPage)
      .limit(perPage);



    const categories = await Category.find();
    res.render('user/shop', {
      products: productData,
      userData,
      categories,
      currentPage: page,
      totalPages: totalPages,
      sort,
      category: categoryId,
      searchQuery: searchQuery,       
      query: req.query // Pass the entire query object to your template
    });
    
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};

const loadproduct = async (req, res) => {
  try {
    const { search, category, sort, page } = req.query;

    const perPage = 9;
    const currentPage = parseInt(page) || 1;

    let query = {item_status:true};
    if (search) {
      query.item_name = { $regex: new RegExp(search, 'i') };
    }
    if (category) {
      query.category = category;
    }

    let sortOption = {};
    if (sort === 'asc') {
      sortOption = { item_price: 1 };
    } else if (sort === 'desc') {
      sortOption = { item_price: -1 };
    }

    const products = await Product.find(query)
      .sort(sortOption)
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.render('partials/user/shopCategory', { products, layout: false });

  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error in Ajax');
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
    loadproduct

}