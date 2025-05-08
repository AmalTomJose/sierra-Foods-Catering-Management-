const User = require('../models/userSchema');
const DailyCount = require('../models/dailybookingCount');
const Booking = require('../models/bookingModel');

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

        const eventday = new Date(date).toISOString().split('T')[0];
        await DailyCount.findOneAndUpdate({
            date:new Date(eventday)
        },
    {
         $inc:{
            totalBookings:1,
            totalGuests:parseInt(guest)

         }

    },{
        upsert:true,
        new:true
    });
    console.log('Booking saved and guest count updated');
        res.redirect('/shop');
    } catch (error) {
        console.log("Booking Error:", error.message);
        res.status(500).send('Booking failed.');
    }
};




module.exports = {
    loadEventForm,
    dailyCount,
    bookingdetails
}

