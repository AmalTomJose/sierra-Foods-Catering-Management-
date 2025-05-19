// middleware/userState.js
const Booking = require('../models/bookingModel');

module.exports = async (req, res, next) => {
  res.locals.isAuthenticated = !!req.session.user_id;

  if (req.session.user_id) {
    const userId = req.session.user_id;

    const booking = await Booking.findOne({ user:userId, status: 'active' });
    res.locals.hasBooked = !!booking;
    res.locals.booking =booking;
  } else {
    res.locals.hasBooked = false;
  }

  next();
};
