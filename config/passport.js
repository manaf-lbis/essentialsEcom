const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const dotenv = require('dotenv').config();
const User = require('../models/userSchema');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `https://essentials.manaf.live/auth/google/callback`,
    },
    async (acessToken, refreshToken, profile, done) => {
      let user = await User.findOne({ googleId: profile.id });
      try {

        if (user) {
          return done(null, user);

        } else {
          const user = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
          });
          await user.save();
          return done(null, user);
        }

      } catch (error) {
        return done(null, user);

      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    if (user) {
      done(null, user);

    } else {
      done(new Error('User not found'), null);

    }
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
