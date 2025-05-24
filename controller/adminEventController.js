 const Booking = require('../models/bookingModel');
 const User = require('../models/userSchema');
 const Order = require('../models/orderModel')




const listEvents = async (req, res) => {
   try {
     const page = parseInt(req.query.page) || 1;
     const limit = 10;
     const skip = (page - 1) * limit;
 
     const totalBookings = await Booking.countDocuments();
     const totalPages = Math.ceil(totalBookings / limit);
 
     const bookings = await Booking.find({})
       .populate('user')
       .sort({ createdAt: -1 })
       .skip(skip)
       .limit(limit);
 
     res.render('admin/events/events', {
       bookings,
       currentPage: page,
       totalPages
     });
   } catch (err) {
     console.error(err);
     res.status(500).render('admin/500', { message: 'Server error' });
   }
 };
 
 const viewBookingDetails = async(req,res)=>{
    try{

    

    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId).populate('user');
    if (!booking) {
      return res.status(404).render('admin/404', { message: 'Booking not found' });
    }

    let order = null;
    if (booking.status === 'completed') {
      order = await Order.findOne({ address: booking._id })
        .populate('user')
        .populate({
          path: 'items.product',
          model: 'Item'
        });
    }
      console.log('The order Details are:',order)

    res.render('admin/events/bookingDetails', { booking, order });
  } catch (err) {
    console.error(err);
    res.status(500).render('admin/500', { message: 'Server Error' });
  }
    
 }

module.exports = {
    listEvents,
    viewBookingDetails
}