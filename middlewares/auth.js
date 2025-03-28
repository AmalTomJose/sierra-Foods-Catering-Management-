const User = require('../models/userSchema');

const islogin=async(req,res,next)=>{
    try {
    
      const userData = await User.findOne({ _id: req.session.user_id });
  if (req.session.user_id && userData.isAdmin==0 && userData.is_blocked===0 ) {
console.log('test')
    next()
  } else {
 
    res.redirect('/login')
  
  }


    } catch(error){
  console.log(error.message);
    }
}


const islogout=async(req,res,next)=>{
    try {
     
      const userData = await User.findOne({ _id: req.session.user_id });
        if (req.session.user_id && userData.isAdmin==0  ) {
  
            res.redirect('/home')

        } else{
       
          next()
        }
      

    } catch(error){
  console.log(error.message);
    }
}

module.exports={
    islogin,
    islogout,
    
}