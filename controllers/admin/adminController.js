const User = require('../../models/userSchema');
const bcrypt = require('bcryptjs');


//render admin login page 
const loadLogin = (req, res) => {
  try {
    //checking is session exists 
    if (req.session.user) {
      //redirect admin dashboard
      return res.redirect('admin/dashboard');
    }

    //renderlogin page
    return res.render('admin/login');

  } catch (error) {
    //logging error and sending server error 500
    console.log(error);
    res.status(500);
  }
};


//verifying admin user name and password then allow login 
const verifyLogin = async (req, res) => {
  try {
    //extracting user data from req body
    const { email, password } = req.body;

    //checking the entered email is exist
    const user = await User.findOne({ email, isAdmin: true });

    //render login page with error message (if no user exist)
    if (!user) {
      return res
        .status(403)
        .render('admin/login', { message: 'username or password invalid' });
    };

    //matching the entered password with DB password
    const passwordMatch = await bcrypt.compare(password, user.password);

    //verifying both entered email and password
    const verification = passwordMatch && email === user.email;

    //render dashboard if the credential is correct
    if (verification) {
      req.session.user = user.toObject();
      return res.redirect('admin/dashboard');
    };

    //if verification failed render login page with error message
    return res.render('admin/login', { message: 'username or password invalid' });

  } catch (error) {
    //logging error and render login page
    console.log(error);
    return res.render('admin/login', { message: 'internal server error' });
  }
};


//admin logout
const logout = (req, res) => {
  try {
    //destroying the session
    req.session.destroy((error) => {
      if (error) {
        console.log('logout error', error);
        return res.status(500).redirect('/admin/pagenotFound');
      }
    });

    //render admin login page
    return res.redirect('/admin');

  } catch (error) {
    //logging the error and redirect to page not found 
    console.log('error while destoring admin session', error);
    return res.status(500).redirect('/admin/pagenotFound');
  }
}


//error page
const pagenotFound = (req, res) => {
  return res.render('admin/pagenotFound');
}


module.exports = {
  loadLogin, //render admin login page 
  verifyLogin, //verifying admin user name and password and allow login 
  pagenotFound, //admin logout
  logout, //admin logout
};
