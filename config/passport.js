const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userSchema');



passport.use(new GoogleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:'/auth/google/callback'
},
async(accessToken,refreshToken,profile,done)=>{
    try{
      
        let user = await User.findOne({
            googleId:profile.id
        });
         // If not found, try matching by email to avoid duplicate accounts
    if (!user) {
        const email = profile.emails[0].value;
        user = await User.findOne({ email });
  
        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          await user.save();
        } else {
          // Create new user
          const names = profile.displayName.split(' ');
          user = await User.create({
            firstname: names[0] || 'Google',
            lastname: names[1] || '',
            email,
            googleId: profile.id,
            password: '', // No password since it's Google-authenticated
            isVerified: 1
          });
        }
      }

      if (user.isBlocked==1) {
        console.log('')
        return done(null, false, { msg: 'Your account is blocked.' });
      }
        return done(null,user)

    }
    catch(error){
        return done(error,null)
    }
}));


passport.serializeUser((user,done)=>done(null,user.id));
console.log('pass');
passport.deserializeUser(async(id,done)=>{
    const user =   await User.findById(id);
    done(null,user); 
});
