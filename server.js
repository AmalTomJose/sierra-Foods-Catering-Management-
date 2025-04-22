require('dotenv').config();
require('./config/passport')
const express = require('express');
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

db();

//Initializing Session
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized: true
}));

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

//setting public as a static file.
app.use(express.static(path.join(__dirname, 'public')));


// to get value from form
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use((req, res, next) => {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private"
    );
    next();
});


//setting Routers..
app.use('/',userRouter);
app.use('/admin', adminRouter);
app.use('/auth',authRoute)

app.use((req, res, next) => {
    res.status(404).render("user/pagenotfound", { userData: null ,layout:'layouts/mainLayout',title:'asdfjsn'});
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});







