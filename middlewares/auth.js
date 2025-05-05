const User = require('../models/userSchema');

const islogin = async (req, res, next) => {
  try {
    console.log('Checking login...');
    const userId = req.session.user_id || (req.session.passport && req.session.passport.user);

    if (!userId) return res.redirect('/login');

    const userData = await User.findById(userId);
    if (!userData) {
      console.log("User not found");
      req.session.user_id = null;
      req.session.passport = null;
      return res.redirect('/login');
    }

    if (userData.isBlocked === 1) {
      console.log("Blocked user tried to log in");
      req.session.user_id = null;
      req.session.passport = null;
      return res.redirect('/login');
    }

    if (userData.isAdmin === 0 && userData.isBlocked === 0) {
      req.user = userData;
      console.log('activating next()--->')
      return next();
    }

    req.session.user_id = null;
    req.session.passport = null;
    return res.redirect('/login');
    
  } catch (error) {
    console.log('Login middleware error:', error.message);
    return res.redirect('/login');
  }
};

const islogout = async (req, res, next) => {
  try {
    const userId = req.session.user_id || (req.session.passport && req.session.passport.user);
    if (!userId) return next();
    return res.redirect('/');
  } catch (error) {
    console.log('Logout middleware error:', error.message);
    return next();
  }
};

module.exports = {
  islogin,
  islogout
};
