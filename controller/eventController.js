const User = require('../models/userSchema');

const loadEventForm = async(req,res)=>{
    try{
        const userId = req.session.user_id;
        const userData = await User.findById(userId);

        res.render('user/eventBooking',{user:userData,})


    }
    catch(error){
        console.log(error.message)
    }
}


module.exports = {
    loadEventForm
}

