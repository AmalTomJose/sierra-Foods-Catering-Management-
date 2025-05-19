    const Booking = require('../models/bookingModel');
    module.exports = async function (req, res, next) {

    try {
        const booking = await Booking.findOne({
        user: req.session.user_id,
        status: 'active'
        });

        if (booking) {
        // User already has an active booking, block access
        req.flash('error', 'You already have an active booking.');

        const backURL = req.get('Referer') || '/';
    return res.redirect(backURL);
        
        }

        // No active booking, allow access
        next();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
    };