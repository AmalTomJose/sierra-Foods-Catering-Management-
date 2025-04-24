const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/google',passport.authenticate('google',{
    scope:[
        'profile','email'
    ]
}))


//callback

router.get('/google/callback',passport.authenticate('google',{failureRedirect:'/login'}),(req,res)=>{
    console.log(req.session.passport.user)
    res.redirect('/')});

//logout
router.get( '/logout',(req,res)=>{
    req.logout(()=>{
        res.redirect('/login');
    })
});


module.exports = router;