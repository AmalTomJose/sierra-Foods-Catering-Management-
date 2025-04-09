const User = require('../models/userSchema');
const bcrypt = require('bcrypt');
const message = require('../config/mailer');


const Product = require('../models/itemModel');
const Category = require('../models/categoryModels');


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
      const userId = req.session.user_id;
      const userData = await User.findById(userId)
      const productData = await Product.find({item_status:true});
      const categories = await Category.find();

        return res.render('user/sampleHome',{
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
    const {email,password} = req.body;
     console.log(email)
     console.log(password)
    try{ 
      
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
          if (existingUser.isBlocked==1) {
            res.render("user/login", { msg: "Your account is blocked." });
            return; // Exit the function to prevent further execution
          }
    
          const passwordmatch = await bcrypt.compare(password, existingUser.password);
    
          if (passwordmatch) {
            if (existingUser.isAdmin==1) {
              res.render("user/login", { msg: "User not Found" });
            } else {
              req.session.user_id = existingUser._id;
              console.log(req.session.user_id)
              res.redirect("/home");
              // res.render('home',{user:req.session})
            }
          } else {
            res.render("user/login", { msg: " password is incorrect" });
          }
        } else {
          res.render("user/login", { msg: "User  Not Found" });
        }
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
  
      res.render("otp", { layout:'layouts/mainLayout',title:'otp',message: "OTP resent successfully" });
    } catch (error) {
      console.error("Error: ", error);
      res.render("otp", { layout:'layouts/mainLayout',title:'otp',message: "Failed to send otp" });
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

module.exports = {
    loadHomepage,
    pageNotFound,
    loadLogin,
    loadSignup,
    signupPage,
    loginPage,
    loadOtp,
    verifyOtp,
    resendOTP,
    userlogout

}