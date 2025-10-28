const User = require('../models/userSchema');
const Address = require('../models/addressModel');
const Booking = require('../models/bookingModel');
const Order = require('../models/orderModel');
const bcrypt = require("bcrypt");



const loadBookedEvents = async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) return res.redirect("/login");

    const userData = await User.findById(userId);

    // Get all bookings of the user
    const bookings = await Booking.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    // Extract booking IDs
    const bookingIds = bookings.map(b => b._id);

    // Fetch orders linked to these bookings
    const orders = await Order.find({ booking: { $in: bookingIds } })
      .select("booking _id orderTotal createdAt")
      .lean();

    // Create a map for quick lookup
    const orderMap = {};
    orders.forEach(order => {
      orderMap[order.booking.toString()] = order;
    });

    // Merge order info into bookings
    const bookingsWithOrders = bookings.map(booking => ({
      ...booking,
      order: orderMap[booking._id.toString()] || null,
    }));

    // Render page
    if (!bookings.length) {
      return res.render("user/profile/bookings", {
        user: userData,
        bookings: [],
        message: "You have not booked any events yet.",
      });
    }

    return res.render("user/profile/bookings", {
      user: userData,
      bookings: bookingsWithOrders,
      message: null,
    });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    
  }
};

  



const loadAddress = async(req,res)=>{
    try{
        const userId = req.session.user_id;
        const userData = await User.findById(userId);
console.log(userData)
        if(userData){
            const addressData = await Address.find({user:userId});
            res.render('user/profile/userAddress',{user:userData,addressData});
        }
        else{
            res.redirect('/login');
        }

    }
    catch(error){
        console.log(error.message);
    }
}

const loadAddAddress = async(req,res)=>{
    try{
        const userId = req.session.user_id;
        const userData = await User.findById(userId);
        if(userData){
            res.render('user/profile/addAddress',{user:userData});

        }
        else{
            res.redirect('/login')
        }

    }
    catch(error){
        console.log(error.message);
    }
}

const addAddress = async(req,res)=>{
    try{
        const userId = req.session.user_id;
        const {houseName,street,city,state,pincode} = req.body;


        const address = new Address({
            user:userId,
            housename:houseName,
            street,
            city,
            state,
            pincode,
            is_listed:true
        })
        const addressData = await address.save();
        res.redirect('/userAddress');

    }
    catch(error){
        console.log(error.message);
    }
}


const loadEditAddress = async(req,res)=>{
    try{
        const userId = req.session.user_id;
        const userData = await User.findById(userId);
        const id = req.query.id;
        const address = await Address.findById(id);;
        

        res.render('user/profile/editAddress',{user:userData,Address:address})

    }
    catch(error){
        console.log(error.message);
    }
}


const editAddress = async(req,res)=>{
    try{
        const id = req.body.address_id;
        const { houseName,street,city,state,pincode } = req.body;
        const updateData = await Address.findByIdAndUpdate(
            {_id:id},
            {
                $set:{
                    housename:houseName,
                    street,
                    city,
                    state,
                    pincode,
                    is_listed:true

                }
            }
        )
        res.redirect('/userAddress')

    }
    catch(error){
        console.log(error.message)
    }
}


const deleteAddress = async(req,res)=>{
    try{
        const id = req.query.id;
        const addressData = await Address.findOneAndUpdate({
            _id:id}
        ,{
            $set:{
                is_listed:false
            }
        })
res.redirect('/userAddress')

    }
    catch(error){
        console.log(error.message)
    }
}


const changePasswordFromProfile = async (req, res) => {
    try {
      const userId = req.session.user_id;
      const { currentPassword, newPassword, confirmPassword } = req.body;
  
      const user = await User.findById(userId);
  
      // Validate fields
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.render("user/profile/userProfile", {
          user,
          message: "All fields are required",
          messageType: "danger",
        });
      }
  
      if (newPassword.length < 8) {
        return res.render("user/profile/userProfile", {
          user,
          message: "Password must be at least 8 characters",
          messageType: "danger",
        });
      }
  
      if (newPassword !== confirmPassword) {
        return res.render("user/profile/userProfile", {
          user,
          message: "Passwords do not match",
          messageType: "danger",
        });
      }
  
      if (!user) {
        return res.render("user/profile/userProfile", {
          message: "User not found",
          messageType: "danger",
        });
      }
  
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.render("user/profile/userProfile", {
          user,
          message: "Current password is incorrect",
          messageType: "danger",
        });
      }
  
      const hashed = await bcrypt.hash(newPassword, 10);
      user.password = hashed;
      await user.save();
  
      return res.render("user/profile/userProfile", {
        user,
        message: "Password updated successfully",
        messageType: "success",
      });
  
    } catch (err) {
      console.log("Password change error:", err.message);
      return res.render("user/profile/userProfile", {
        message: "Something went wrong",
        messageType: "danger",
      });
    }
  };
  




module.exports = {
    loadAddress,
    loadAddAddress,
    addAddress,
    loadEditAddress,
    editAddress,
    deleteAddress,
     changePasswordFromProfile,
     loadBookedEvents
}