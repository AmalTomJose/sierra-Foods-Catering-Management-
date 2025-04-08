const bcrypt = require("bcrypt");
const User = require("../models/userSchema");

const session = require("express-session");
const { loadHomepage } = require("./userController");



//admin Login//
const   adminLogin = async (req, res) => {
  try {
    res.set("cache-Control", "no-store");
  
    res.render("admin/login",{layout:'layouts/mainLayout',title:'admin login',msg:null});
  }  catch (error) {
     console.log(error.message);
  }
};


//  adminVerify
const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });
    console.log(userData);

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        if (userData.isAdmin == 1) {

          req.session.admin_id = userData._id;
          res.redirect("/admin/home");
          
        } else { 
          res.render("admin/login", {layout:'layouts/mainLayout',title:'admin login', msg: "Admin not Found" });
        }
      } else {
        res.render("admin/login", {layout:'layouts/mainLayout',title:'admin login', msg: "Incorrect Credentials" });
      }
    } else {
      res.render("admin/login", { layout:'layouts/mainLayout',title:'admin login',msg: "Admin not found" });
    }
  } catch (error) {
    console.log(error.message);
  }
};








      

const loadUserpage=async (req,res)=>{
  try{
    console.log('hii')
    const adminData = await User.findById(req.session.admin_id);
    const userData = await User.find({isAdmin:0})
    console.log(adminData);
    console.log(userData);
    res.render('admin/userDashboard',{users:userData,admin:adminData})
  }catch(error){
    console.error(error.message);
    res.status(500).send("Internal Server Error: " + error.message);
  }
};

const loadHome= async(req,res)=>{
  try{

    res.render('admin/dashboard')

  }
  catch(error)
  {
    console.log(error.message)
  }
}






const listUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Current page, default is 1
    const pageSize = 10; // Number of items per page
    const skip = (page - 1) * pageSize;

    const id = req.query.id;
    const Uservalue = await User.findById(id);

    if (Uservalue.isBlocked==1) {
      await User.updateOne(
        { _id: id },
        {
          $set: {
            isBlocked: 0,
          },
        }
      );
      if (req.session.user_id) delete req.session.user_id;
    } else {
      await User.updateOne(
        { _id: id },
        {
          $set: {
            isBlocked: 1,
          },
        }
      );
    }

    // Fetch paginated user data
    const paginatedUserData = await User.find({})
      .skip(skip)
      .limit(pageSize);

    res.redirect("/admin/userDashboard");
    
  } catch (error) {
    console.log(error.message);
  }
};



const adminLogout = async (req, res) => {
  try {

  
    delete req.session.admin_id;
 
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  
  }
};





module.exports = {
  adminLogin ,
  verifyLogin,
  adminLogout,
  loadHome,
  loadUserpage,
  listUser,
  
};