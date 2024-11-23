const User = require('../models/userSchema');


// getting user id from session 
function getUserIdFromSession(req) {
  return req.session?._id ?? req.session.passport?.user;
}

//checking the user is authenticated
const isAuthenticated = async (req, res, next) => {

  if (req.isAuthenticated() || req.session._id) {

    const _id = getUserIdFromSession(req);

    const user = await User.findOne({ _id })

    if (user.isBlocked) {

      req.session.destroy((error) => {
        if (error) {
          console.log('session destruction error');
          return res.render('user/pagenotFound');
        }

        return res.redirect('/');
      });


    } else {
      return next();
    }

  } else {
    return res.redirect('/');
  }

};

//checking user is not authenticated
const isNotAuthenticated = (req, res, next) => {

  if (!req.isAuthenticated() && !req.session._id) {

    return next();
  }

  return res.redirect('/home');
};

//admin authentication
const adminAuth = (req, res, next) => {

  if (req.session && req.session.user) {

    if (req.session.user.isAdmin === true) {
      return next();
    }
    return res.redirect('/admin');
  }
  return res.redirect('/admin');
};


module.exports = {
  isAuthenticated,
  isNotAuthenticated,
  adminAuth,
};