const LocalStrategy = require('passport-local').Strategy;
const config = require('../config/database');
const bcrypt = require('bcryptjs');
const FacebookStrategy = require('passport-facebook').Strategy;

//Bring in models
let User = require('../models/user');

module.exports = function(passport){
  // Local Strategy
  passport.use(new LocalStrategy(function(username, password, done){
    // Match Username
    let query = (username.indexOf('@') === -1) ? {username: username.toLowerCase()} : {email: username.toLowerCase()};
    User.findOne(query, function(err, user){
      if(err) throw err;
      if(!user){
        return done(null, false, {message: 'No user found'});
      }

      // Match Password
      bcrypt.compare(password, user.password, function(err, isMatch){
        if(err) throw err;
        if(isMatch){
          return done(null, user);
        } else {
          return done(null, false, {message: 'Wrong password'});
        }
      });
    });
  }));


  //Facebook Strategy
  passport.use(new FacebookStrategy({
  clientID: 443385299449892,
  clientSecret: '44d27f6f7874696906668ef248372dbd',
  callbackURL: "http://localhost:3000/users/login/facebook/return"
},
function(accessToken, refreshToken, profile, done) {
User.findOrCreate({ facebookId: profile.id }, function (err, user) {
return done(err, user);
});
}
));


  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

}
