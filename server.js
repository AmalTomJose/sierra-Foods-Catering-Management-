require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const db = require('./config/db');




db();
const expressLayouts = require('express-ejs-layouts');

const userRouter = require('./routes/userRouter');
//setting PORT from .env file.
const PORT = process.env.PORT  || 4004;
//setting view engine for ejs.
app.set('view engine','ejs');
app.use(expressLayouts);

//setting public as a static file.
app.use(express.static(path.join(__dirname, 'public')));


// to get value from form
app.use(express.json());
app.use(express.urlencoded({extended:true}));

//setting Routers..
app.use('/user',userRouter)

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});







