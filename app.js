const express = require('express');
const app = express();
const session = require('express-session');
const env = require('dotenv').config();
const path = require('path');
const passport = require('./config/passport');
const cookieParser = require('cookie-parser');
const db = require('./config/db');
const userRouter = require('./routes/userRouter');
const adminRouter = require('./routes/adminRouter');
const razorpay = require('./config/razorpay');


db();


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});


//initialize passport middleware
app.use(passport.initialize());
app.use(passport.session());

//setting viewengine 
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// user router
app.use('/', userRouter);

// admin Router
app.use('/admin', adminRouter);


//Google authentication routes
app.use('/auth', userRouter)

const port = process.env.PORT || 3000;
//listening to the port 
app.listen(port, () =>
  console.log(`running on port ${port}`)
);