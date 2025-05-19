require('dotenv').config();
require('./config/passport')
const express = require('express');
const nocache = require('nocache')
const app = express();
const path = require('path');
const db = require('./config/db');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session')
const mongoose = require('mongoose')
const userRouter = require('./routes/userRouter');
const adminRouter = require('./routes/adminRouter');
const passport = require('passport');
const authRoute = require('./routes/authRoute');
const flash = require('connect-flash');
const userState = require('./middlewares/userState')

db();

//Initializing Session
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized: true
}));


app.use(flash());

// Make flash messages available in all views
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});


app.use(userState);

//PASSPORT MIDDLEWARE
app.use(passport.initialize());
app.use(passport.session());

//setting PORT from .env file.
const PORT = process.env.PORT  || 4004;
//setting view engine for ejs.
app.set('view engine','ejs');
// app.set('views', [path.join(__dirname,'views/layouts'),path.join(__dirname, 'views/user'), path.join(__dirname, 'views/admin')])
app.set('views',path.join(__dirname,'views'))
app.use(expressLayouts);


// setting public as a static file with no-cache headers
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
      res.setHeader("Cache-Control", "no-store");
    }
  }));
  

// to get value from form
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use(nocache());

app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  }) ;


//setting Routers..
app.use('/',userRouter);
app.use('/admin', adminRouter);
app.use('/auth',authRoute)

app.use((req, res, next) => {
    res.status(404).render("user/pagenotfound", { userData: null ,layout:'layouts/mainLayout',title:"Page Not Found"});
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});







