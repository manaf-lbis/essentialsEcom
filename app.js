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

app.set('trust proxy', 1);

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

app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/', userRouter);

app.use('/admin', adminRouter);

app.use('/auth', userRouter)

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`running on port ${port}`);
  console.log('BREVO_API_KEY status:', process.env.BREVO_API_KEY ? 'DEFINED' : 'NOT DEFINED');
  console.log('EMAIL_USER status:', process.env.EMAIL_USER ? 'DEFINED' : 'NOT DEFINED');
});