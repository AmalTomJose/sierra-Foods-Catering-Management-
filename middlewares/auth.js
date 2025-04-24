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
    console.log('Checking login...');

    const userId = req.session.user_id || (req.session.passport && req.session.passport.user);

    if (!userId) {
      return res.redirect('/login');
    }

    const userData = await User.findById(userId);

    if (userData && userData.isAdmin === 0 && userData.isBlocked === 0) {
      req.user = userData; // Optional: Attach user manually for non-passport logins
      return next();
    } else {
      req.session.destroy(); // clear invalid session
      return res.redirect('/login');
    }
  } catch (error) {
    console.log('Login middleware error:', error.message);
    return res.redirect('/login');
  }
};


const islogout = async (req, res, next) => {
  try {
    const userId = req.session.user_id || (req.session.passport && req.session.passport.user);

    if (!userId) {
      return next(); // no session? continue to login page
    }
    else {
      return res.redirect('/');
    }
  }
   catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  islogin,
  islogout
};
