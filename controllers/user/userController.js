const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../../models/userSchema');
const session = require('express-session');
const passport = require('../../config/passport');
const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const Wishlist = require('../../models/wishlistSchema')
const mongoose = require('mongoose');
const refferalsController = require('./referralsController');

function getUserIdFromSession(req) {
  return req.session?._id ?? req.session.passport?.user;
}

const loadSignupPage = (req, res) => {
  try {
    return res.render('user/signup', { message: '' });
  } catch (error) {
    console.log(error);
    return res.status(500).render('user/pagenotFound');
  };
};

const loadLandingPage = (req, res) => {
  try {
    const userId = getUserIdFromSession(req);
    return res.render('user/landing', { userId });

  } catch (error) {
    console.log(error);
    return res.status(500).render('user/pagenotFound');
  }
};

const loadLoginpage = (req, res) => {
  try {
    return res.render('user/login');

  } catch (error) {
    console.log(error);
    return res.status(500).render('user/pagenotFound');
  }
};

const loadHome = async (req, res) => {
  try {
    const userId = getUserIdFromSession(req);

    const products = await Product.find({ isBlocked: false });

    const category = await Category.find({ isBlocked: false });
    const wishlist = await Wishlist.findOne({ userId }, { 'products.productId': 1 })

    let wishlistProducts = [];
    if (wishlist) {
      wishlistProducts = wishlist.products.map((ele) => ele.productId.toString());
    };

    return res.render('user/home', { products, category, wishlistProducts });

  } catch (error) {
    console.log(error);
  }
};

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

const otpGenerator = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

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

    const info = await transport.sendMail(mailoption);
    return info;

  } catch (error) {
    console.log('error while sending otp');
    throw error;
  };

};

const addNewUser = async (req, res) => {
  try {
    const { name, email, phone, password, referralCode } = req.body;

    const userExist = await User.findOne({ email: email });

    if (userExist) {
      return res.render('user/signup', {
        message: 'Entred Email Already Exist',
      });
    };

    const otp = otpGenerator();

    const sentInfo = await sendverification(email, otp);

    if (sentInfo.accepted.length > 0) {

      req.session.userOtp = otp;

      const hashedPassword = await bcrypt.hash(password, 10);

      req.session.userData = { name, email, phone, password: hashedPassword, referralCode };

      console.log('first otp:', otp);

      return res.render('user/otp', { message: '' });
    };

  } catch (error) {
    console.log(error);
    return res.render('user/signup', { message: 'Error while sending OTP' });
  };
};

const verifyOtp = async (req, res) => {
  try {
    if (!req.session.userData) {
      return res.status(400).json({ message: 'Session expired, please try signing up again.' });
    }

    const { name, phone, email, password, referralCode } = req.session.userData;
    const { enteredOtp } = req.body;

    if (enteredOtp === req.session.userOtp) {

      const user = new User({ name, phone, email, password });
      await user.save()

      if (referralCode) {
        await refferalsController.createRefferal(referralCode, user._id)
      };

      req.session._id = user._id;

      return res.status(200).json({ message: 'otp verified Sucessfully' });

    } else {
      return res.status(400).json({ message: 'invalid OTP' });
    };

  } catch (error) {
    console.log(error);
    return res.status(500).render('user/pagenotFound');
  };

};

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
  };
};

const googleAuth = (req, res) => {
  res.redirect('/home');
};

module.exports = {
  loadLandingPage,
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
