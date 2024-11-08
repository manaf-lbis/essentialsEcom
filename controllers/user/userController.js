const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const User = require('../../models/userSchema');
const session = require('express-session');
const passport = require('../../config/passport');
const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const Wishlist = require('../../models/wishlistSchema')
const mongoose = require('mongoose');
const  refferalsController  = require('./referralsController');


// getting user id from session 
function getUserIdFromSession(req) {
  return req.session?._id ?? req.session.passport?.user;
}


// <<<====Signup page rendering===>>>
const loadSignupPage = (req, res) => {
  try {
    return res.render('user/signup', { message: '' });
  } catch (error) {
    console.log(error);
    return res.status(500).render('user/pagenotFound');
  }
};

// <<<====login page rendering===>>>
const loadLoginpage = (req, res) => {
  try {
    return res.render('user/login');
  } catch (error) {
    console.log(error);
    return res.status(500);
  }
};

// <<<====login page rendering===>>>
const loadHome = async (req, res) => {
  try {

    const userId = getUserIdFromSession(req);

    const products = await Product.find({ isBlocked: false });
    const category = await Category.find({ isBlocked: false });
    const wishlist = await Wishlist.findOne({ userId }, { 'products.productId': 1 })

    let wishlistProducts = [];
    if (wishlist) {
      wishlistProducts = wishlist.products.map((ele) => ele.productId.toString());
    }


    return res.render('user/home', { products, category, wishlistProducts });

  } catch (error) {
    console.log(error);
  }
};

// <<<====login page rendering===>>>
const userLogout = (req, res) => {
  try {
    req.session.destroy((error) => {
      if (error) {
        console.log('session destruction error');
        return res.render('user/pagenotFound');
      }
      return res.redirect('/');
    });
  } catch (error) {
    console.log(error);
  }
};

// <====random otp  generating=====>
const otpGenerator = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// <====Generating otp using node mailer=====>
const sendverification = async (email, otp) => {
  try {
    const transport = nodemailer.createTransport({
      service: 'gmail',
      port: 587,
      secure: false,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    const mailoption = {
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: 'Verify your identity',
      text: `YOUR OTP is ${otp}`,
    };

    // <====sending Otp======>
    const info = await transport.sendMail(mailoption);
    return info;
  } catch (error) {
    console.log('error while sending otp');
    throw error;
  }
};




// <====!!! Add New user request from user !!!=====>
const addNewUser = async (req, res) => {
  try {
    const { name, email, phone, password, referralCode } = req.body;
    const userExist = await User.findOne({ email: email });

    //  <===checkin db user is already exist====>
    if (userExist) {
      return res.render('user/signup', {
        message: 'Entred Email Already Exist',
      });
    }

    const otp = otpGenerator();
    const sentInfo = await sendverification(email, otp);

    if (sentInfo.accepted.length > 0) {
      req.session.userOtp = otp;
      req.session.userData = { name, email, phone, password, referralCode};
      console.log('first otp:', otp);
      return res.render('user/otp', { message: '' });

    }

  } catch (error) {

    console.log(error);
    return res.render('user/signup', { message: 'Error while sending OTP' });
    
  }
};

//===== verify otp and and creating user  =============>
const verifyOtp = async (req, res) => {
  try {
    const { name, phone, email, password ,referralCode} = req.session.userData;
    const { enteredOtp } = req.body;

    if (enteredOtp === req.session.userOtp) {

      //new user creating
      const hashPassword = await bcrypt.hash(password, 10);
      const user = new User({ name, phone, email, password: hashPassword });
      await user.save()
      
      
      //refferal code 
      if(referralCode){
       await refferalsController.createRefferal(referralCode, user._id)
      }


      res.status(200).json({ message: 'otp verified Sucessfully' });
    } else {
      console.log('otp invalid');
      return res.status(400).json({ message: 'Bad OTP' });
    }
  } catch (error) {
    console.log('mongoooo err', error);
    return res.status(500).render('user/pagenotFound');
  }
};

//================== user login=====================
const verifyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, googleId: null, isAdmin: false });

    if (!user) {
      return res
        .status(401)
        .render('user/login', { error: 'invalid username or password' });
    }

    if (user.isBlocked) {
      return res
        .status(403)
        .render('user/login', {
          error: 'Your account is blocked. Please contact Administrator.',
        });
    }

    if (!(await bcrypt.compare(password, user.password))) {
      return res
        .status(403)
        .render('user/login', { error: 'invalid username or password' });
    }

    req.session._id = user._id;
    return res.redirect('/home');
  } catch (error) {
    console.error(`login Faild ${error}`);
    return res.render('user/login', { error: 'Login Faild, Try Again later' });
  }
};

// <=====resent otp ==========>
const resentotp = async (req, res) => {
  try {
    const { email } = req.session.userData;

    const otp = otpGenerator();
    const sentInfo = await sendverification(email, otp);

    req.session.userOtp = otp;
    console.log('resend:', otp);
    res.status(200).json({ message: 'OTP Sent Successfully' });
  } catch (error) {
    console.log('unable to resent otp :', error);
    return res.status(500).render('user/pagenotFound');
  }
};

//google auth
const googleAuth = (req, res) => {
  res.redirect('/home');
};


module.exports = {
  loadLoginpage,
  loadSignupPage,
  addNewUser,
  resentotp,
  verifyOtp,
  loadHome,
  verifyLogin,
  userLogout,
  googleAuth,
  sendverification,
};
