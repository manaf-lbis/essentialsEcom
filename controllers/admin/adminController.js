const User = require('../../models/userSchema');
const bcrypt = require('bcrypt');

const loadLogin = (req, res) => {
  try {
    if (req.session.user) {
      return res.redirect('admin/dashboard');
    }
    return res.render('admin/login');

  } catch (error) {
    console.log(error);
    res.status(500);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);

    const user = await User.findOne({ email, isAdmin: true });

    if (!user) {
      return res
        .status(403)
        .render('admin/login', { message: 'username or password invalid' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    const verification = passwordMatch && email === user.email;
    // console.log('verification:', verification);

    if (verification) {
      req.session.user = user.toObject();
      return res.redirect('admin/dashboard');
    }

    return res.render('admin/login', { message: 'username or password invalid' });

  } catch (error) {
    return res.render('admin/login', { message: 'server error' });
  }
};


const logout = (req, res) => {
  try {
    req.session.destroy((error) => {
      if (error) {
        console.log('logout error', error);
        return res.status(500).redirect('/admin/pagenotFound');
      }
    })
    return res.redirect('/admin');
  } catch (error) {
    console.log('error while destoring admin session', error);
    return res.status(500).redirect('/admin/pagenotFound');
  }

}


const pagenotFound = (req, res) => {
  return res.render('admin/pagenotFound');
}


module.exports = {
  loadLogin,
  verifyLogin,

  pagenotFound,
  logout,
};
