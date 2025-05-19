const User = require('../models/userSchema');
const DailyCount = require('../models/dailybookingCount');
const Booking = require('../models/bookingModel');

const loadEventForm = async (req, res) => {
    try {
      const userId = req.session.user_id;
      const userData = await User.findById(userId);
  
      const bookings = await Booking.find({
        user: userId,
        status: 'active'
      });
  
      if (bookings.length > 0) {
        req.flash('error', 'You already have an active booking.');
        return res.redirect('/');
      }
  
      res.render('user/eventBooking', { user: userData });
    } catch (error) {
      console.log(error.message);
      res.redirect('/'); // Optional: redirect on error
    }
  };
  

const dailyCount = async(req,res)=>{
    const counts =  await DailyCount.find({});

    res.json(counts.map(entry=>({
        date:entry.date.toISOString().split('T')[0],
        count:entry.totalGuests
    })));  


}

const bookingdetails = async (req, res) => {
    try {
        console.log("Form Submission:", req.body);

        const userId = req.session.user_id;
        const { date, event, guest, place, time, district, pincode } = req.body;

        const venueDetails = new Booking({
            user: userId,
            eventDate: date,
            eventType: event,
            guestCount: guest,
            eventPlace: place,
            eventTime: time,
            eventDistrict: district,
            eventPincode: pincode
        });

        await venueDetails.save();
        console.log('Successfully saved booking');

    //     const eventday = new Date(date).toISOString().split('T')[0];
    //     await DailyCount.findOneAndUpdate({
    //         date:new Date(eventday)
    //     },
    // {
    //      $inc:{
    //         totalBookings:1,
    //         totalGuests:parseInt(guest)

    //      }

    // },{
    //     upsert:true,
    //     new:true
    // });
    // console.log('Booking saved and guest count updated');
    req.flash('success','Your  Booking was successfull!')

        res.redirect('/shop');
    } catch (error) {
        console.log("Booking Error:", error.message);
        res.status(500).send('Booking failed.');
    }
};


const cancelBooking = async(req,res)=>{
    try {
        const { reason } = req.body;
        const bookingId = req.params.id;

        const booking = await Booking.findByIdAndUpdate({_id:bookingId},{$set:{status:'cancelled',cancelReason:reason}})
    
      
        await booking.save();
    //         // Step 3: Normalize event date to YYYY-MM-DD
    // const eventDate = new Date(booking.eventDate).toISOString().split('T')[0];

    // // Step 4: Decrement from DailyCount
    // await DailyCount.findOneAndUpdate(
    //   { date: new Date(eventDate) },
    //   { 
    //     $inc: {
    //       totalBookings: -1,
    //       totalGuests: -parseInt(booking.guestCount) 
    //     },
    //   }
    // );

    
        res.json({ success: true });
      } catch (err) {
        res.status(500).json({ error: 'Failed to cancel booking' });
      }
}

module.exports = {
    loadEventForm,
    dailyCount,
    bookingdetails,
    cancelBooking
}

