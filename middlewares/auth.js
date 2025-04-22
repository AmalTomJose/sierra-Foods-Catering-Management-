// const User = require('../models/userSchema');

// const islogin=async(req,res,next)=>{
//     try {
    
//       const userData = await User.findOne({ _id: req.session.user_id });
//   if (req.session.user_id && userData.isAdmin==0 && userData.isBlocked===0 ) {
// console.log('test')
//     next()
//   } else {
 
//     res.redirect('/login')
  
//   }


//     } catch(error){
//   console.log(error.message);
//     }
// }


// const islogout=async(req,res,next)=>{
//     try {
     
//       const userData = await User.findOne({ _id: req.session.user_id });
//         if (req.session.user_id && userData.isAdmin==0  ) {
  
//             res.redirect('/home')

//         } else{
       
//           next()
//         }
      

//     } catch(error){
//   console.log(error.message);
//     }
// }

// module.exports={
//     islogin,
//     islogout,
    
// }

const User = require('../models/userSchema');

const islogin = async (req, res, next) => {
  try {
    if (!req.session.user_id) {
      return res.redirect('/login');
    }

    const userData = await User.findOne({ _id: req.session.user_id });

    if (req.session.user_id && userData.isAdmin === 0 && userData.isBlocked === 0) {
      console.log('test');
      next();
    } else {
      req.session.destroy(); // clear invalid session
      res.redirect('/login');
    }
  } catch (error) {
    console.log(error.message);
  }
};

const islogout = async (req, res, next) => {
  try {
    if (!req.session.user_id) {
      return next(); // no session? continue to login page
    }

    const userData = await User.findOne({ _id: req.session.user_id });

    if (req.session.user_id  && userData.isAdmin == 0) {
      return res.redirect('/login');
    } else {
      return next();
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  islogin,
  islogout
};
