const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../../models/userSchema');
const session = require('express-session');
const passport = require('../../config/passport');
const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const Wishlist = require('../../models/wishlistSchema')
const mongoose = require('mongoose');
const refferalsController = require('./referralsController');


// getting user id from session 
function getUserIdFromSession(req) {
  return req.session?._id ?? req.session.passport?.user;
}


// Signup page rendering
const loadSignupPage = (req, res) => {
  try {
    //rendering signup page
    return res.render('user/signup', { message: '' });
  } catch (error) {
    // log error and render error page
    console.log(error);
    return res.status(500).render('user/pagenotFound');
  };
};


//login page rendering
const loadLoginpage = (req, res) => {
  try {
    // render login page
    return res.render('user/login');

  } catch (error) {

    // if any error, log error and render error page
    console.log(error);
    return res.status(500).render('user/pagenotFound');
  }
};


// login page rendering
const loadHome = async (req, res) => {
  try {
    // extract user id from session
    const userId = getUserIdFromSession(req);

    // requiring all object to load home page
    const products = await Product.find({ isBlocked: false });
    
    const category = await Category.find({ isBlocked: false });
    const wishlist = await Wishlist.findOne({ userId }, { 'products.productId': 1 })

    let wishlistProducts = [];
    if (wishlist) {
      wishlistProducts = wishlist.products.map((ele) => ele.productId.toString());
    };

    // render home page
    return res.render('user/home', { products, category, wishlistProducts });

  } catch (error) {
    // logging error 
    console.log(error);
  }
};

// login page rendering
const userLogout = (req, res) => {
  try {
    // destroy current session and allow to logout
    req.session.destroy((error) => {
      if (error) {
        console.log('session destruction error');
        return res.render('user/pagenotFound');
      }

      // redirect login page
      return res.redirect('/');
    });

  } catch (error) {
    // log error
    console.log(error);
  }
};

// <====random otp  generating=====>
const otpGenerator = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generating otp using node mailer
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

    //sending Otp
    const info = await transport.sendMail(mailoption);
    return info;

  } catch (error) {
    // log error and throw error fro handling 
    console.log('error while sending otp');
    throw error;
  };

};




// Add New user request from user 
const addNewUser = async (req, res) => {
  try {
    // extracting details from session 
    const { name, email, phone, password, referralCode } = req.body;

    //checking the user is exist with the email
    const userExist = await User.findOne({ email: email });

    // checkin db user is already exist
    if (userExist) {
      // render signup page with error
      return res.render('user/signup', {
        message: 'Entred Email Already Exist',
      });
    };

    // generating random otp
    const otp = otpGenerator();

    // sending email with otp
    const sentInfo = await sendverification(email, otp);
    

    if (sentInfo.accepted.length > 0) {

      // saving otp to session
      req.session.userOtp = otp;

      // storing data to the session for later use
      req.session.userData = { name, email, phone, password, referralCode };

      // loging otp for test purpose
      console.log('first otp:', otp);

      // render otp endering page
      return res.render('user/otp', { message: '' });
    };

  } catch (error) {
    // log error and render signup page with error
    console.log(error);
    return res.render('user/signup', { message: 'Error while sending OTP' });
  };
};


//verify otp and and creating user
const verifyOtp = async (req, res) => {
  try {
    // extract use details from session
    const { name, phone, email, password, referralCode } = req.session.userData;
    const { enteredOtp } = req.body;
    
    // matching otp with saved otp
    if (enteredOtp === req.session.userOtp) {

      //hashing entred password
      const hashPassword = await bcrypt.hash(password, 10);

      // create and saving new user object to db
      const user = new User({ name, phone, email, password: hashPassword });
      await user.save()


      //refferal code 
      if (referralCode) {
        // creating new referral
        await refferalsController.createRefferal(referralCode, user._id)
      };

      //respond with success message
      res.status(200).json({ message: 'otp verified Sucessfully' });

    } else {
      // respond with error message
      return res.status(400).json({ message: 'invalid OTP' });
    };

  } catch (error) {
    // log error and render error page
    console.log(error);
    return res.status(500).render('user/pagenotFound');
  };

};


// user login
const verifyLogin = async (req, res) => {
  try {
    // extracting user details from request body
    const { email, password } = req.body;

    // checkinh user is exist
    const user = await User.findOne({ email, googleId: null, isAdmin: false });

    // if invalid user
    if (!user) {
      return res
        .status(401)
        .render('user/login', { error: 'invalid username or password' });
    }

    // if user is blocked
    if (user.isBlocked) {
      return res
        .status(403)
        .render('user/login', {
          error: 'Your account is blocked. Please contact Administrator.',
        });
    }

    // if invalid password
    if (!(await bcrypt.compare(password, user.password))) {
      return res
        .status(403)
        .render('user/login', { error: 'invalid username or password' });
    }

    // storing userid to the session 
    req.session._id = user._id;
    return res.redirect('/home');

  } catch (error) {
    // logging error and render login page
    console.error(`login Faild ${error}`);
    return res.render('user/login', { error: 'Login Faild, Try Again later' });
  }
};

// resent otp
const resentotp = async (req, res) => {
  try {
    // extract email from session 
    const { email } = req.session.userData;

    // generating random otp
    const otp = otpGenerator();

    //sent new otp via email 
    const sentInfo = await sendverification(email, otp);

    // storing otp to session
    req.session.userOtp = otp;

    // log otp for testing purpose
    console.log('resend:', otp);

    // senging success response
    res.status(200).json({ message: 'OTP Sent Successfully' });

  } catch (error) {
    // logging error and render error page
    console.log('unable to resent otp :', error);
    return res.status(500).render('user/pagenotFound');
  };
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
