require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const db = require('./config/db');
const expressLayouts = require('express-ejs-layouts');



db();

const userRouter = require('./routes/userRouter');
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

//setting Routers..
app.use('/',userRouter);
// app.use('/admin',adminRouter);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});







