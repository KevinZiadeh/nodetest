var express = require('express');
var router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const nodemailer = require('nodemailer')
const mongoose = require('mongoose');
const nev = require('email-verification')(mongoose);
const async = require('async');
const crypto = require('crypto');
const config = require('../config/database');

//Bring in models
let User = require('../models/user.js')

//verification email Config
nev.configure({
    verificationURL: 'http://localhost:3000/users/email-verification/${URL}',
    persistentUserModel: User,
    tempUserCollection: 'nodetest_tempusers',

    transportOptions: {
        service: 'gmail',
        auth: {
            user: 'kevinziadeh@gmail.com',
            pass: '26-11Zkevin'
        }
    },
    verifyMailOptions: {
        from: 'Do Not Reply <no_reply@outlook.com>',
        subject: 'Please confirm account',
        html: 'Click the following link to confirm your account:</p><p>${URL}</p>',
        text: 'Please confirm your account by clicking the following link: ${URL}'
    },
    shouldSendConfirmation: true,
    confirmMailOptions: {
    from: 'Do Not Reply <user@gmail.com>',
    subject: 'Successfully verified!',
    html: '<p>Your account has been successfully verified.</p>',
    text: 'Your account has been successfully verified.'
    },
}, function(error, options){
});

// generating the model, pass the User model defined earlier
nev.generateTempUserModel(User, function(err, tempUserModel) {
    if (err) {
        console.log(err);
        return;
    }
    console.log('generated temp user model: ' + (typeof tempUserModel === 'function'));
});


//User Registeration
//Get request
router.get('/register', (req, res) => {
  res.render('register', {
    title: 'Register'
  })
})

//Post request
router.post('/register', (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;
  const password2 = req.body.password2;

  req.checkBody('name','Name is required').notEmpty();
  req.checkBody('email','Email is required').notEmpty();
  req.checkBody('email','Email is not valid').isEmail();
  req.checkBody('username','Username is required').notEmpty();
  req.checkBody('password','Password is required').notEmpty();
  req.checkBody('password2','Passwords do not match').equals(req.body.password);

  //Get Errors
  let errors = req.validationErrors();

  if(errors){
   res.render('register', {
     errors:errors,
     title: 'Register'
   });
 } else {
     let newUser = new User({
       name:name,
       email:email.toLowerCase(),
       username:username.toLowerCase(),
       password:password
     });
     bcrypt.genSalt(10, function(err, salt){
       bcrypt.hash(newUser.password, salt, function(err, hash){
         if(err){
           console.log(err);
         }
         newUser.password = hash;
         nev.createTempUser(newUser, function(err, existingPersistentUser, newTempUser) {
            if (err) {
              req.flash('error','Username is already taken');
              res.redirect('/users/register');
            }

            // user already exists in persistent collection
            if (existingPersistentUser) {
                req.flash('error','Email is already taken');
                res.render('register', {
                  title: 'Register'
                });
            }

            // new user created
            if (newTempUser) {
                var URL = newTempUser[nev.options.URLFieldName];

                nev.sendVerificationEmail(email, URL, function(err, info) {
                    if (err) {
                        return res.status(404).send('ERROR: sending verification email FAILED');
                    }
                    res.render('email_Verification', {
                      title: 'Registration',
                      msg: 'An email has been sent to you. Please check it to verify your account.',
                      info: info
                    });
                });

                // user already exists in temporary collection!
            } else {
                res.render('email_Verification', {
                  title: 'Registration',
                  msg: 'You have already signed up. Please check your email to verify your account.'
                });
            }
        })
       })
     })
   }
})

// resend verification button was clicked
router.post('/resend', (req, res) => {
  const email = req.body.email
  nev.resendVerificationEmail(email, function(err, userFound) {
    if (err) {
      res.render('email_Verification', {
        title: 'Registration',
        msg: 'Resending verification email failed.'
      });
    }
    if (userFound) {
      res.render('email_Verification', {
        title: 'Registration',
        msg: 'An email has been sent to you, yet again. Please check it to verify your account.'
      });
    }
    else {
      res.render('email_Verification', {
        title: 'Registration',
        msg: 'Your verification code has expired. Please sign up again.'
      })
    }
  })
})


// user accesses the link that is sent
router.get('/email-verification/:URL', function(req, res) {
    var url = req.params.URL;

    nev.confirmTempUser(url, function(err, user) {
        if (user) {
            req.flash('success','You are now registered and can log in');
            res.redirect('/users/login');
        } else {
          req.flash('error','Username is already taken');
          res.redirect('/users/register');
        }
    });
})



//Login page
//Local Strategy
//GET request
router.get('/login', (req, res) => {
  res.render('login', {
    title: 'Login'
  })
})

//POST Request
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next)
})


//Facebook Strategy
router.get('/login/facebook',
  passport.authenticate('facebook'));

router.get('/login/facebook/return',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });


// logout
router.get('/logout', function(req, res){
  req.logout();
  req.flash('success', 'You are logged out');
  res.redirect('/users/login');
});


// Edit information
// GET request
router.get('/edit/:id', ensureAuthenticated, function(req, res){
  User.findById(req.user._id, (err, user) => {
    res.render('edit_user', {
      title: 'Edit User',
      user: user
    })
  })
});

//POST request
router.post('/edit/:id', ensureAuthenticated, (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const username = req.body.username;
  const oldpassword = req.body.oldpassword;
  const newpassword = req.body.newpassword;
  const newpassword2 = req.body.newpassword2;

  req.checkBody('name','Name is required').notEmpty();
  req.checkBody('email','Email is required').notEmpty();
  req.checkBody('email','Email is not valid').isEmail();
  req.checkBody('username','Username is required').notEmpty();
  req.checkBody('newpassword','Password is required').notEmpty();
  req.checkBody('newpassword2','Passwords do not match').equals(req.body.newpassword);


  // Match Password
  User.findById(req.user._id, (err, user) => {
    bcrypt.compare(oldpassword, user.password, function(err, isMatch){
      if(err) throw err;
      if(isMatch){
        //Get Errors
        let errors = req.validationErrors();

          if(errors){
            User.findById(req.user._id, (err, user) => {
              if (err) {
                console.log(err)
              } else{
                res.render('edit_user', {
                  title: 'Edit Information',
                  user: user,
                  errors:errors
                });
              }
            })
          } else {
             let user = {};
             user.name = name;
             user.email = email.toLowerCase();
             user.username = username.toLowerCase();
             user.password = newpassword;
               bcrypt.genSalt(10, function(err, salt){
                 bcrypt.hash(user.password, salt, function(err, hash){
                   if(err){
                     console.log(err);
                   }
                   user.password = hash

                 let query = {_id: req.params.id}

                 User.update(query, user, (err, user) => {
                   if(err){
                     console.log(err);
                     return
                   } else{
                     req.flash('success','User Updated');
                     res.redirect('/');
                   }
                 })
               })
             })
           }
      } else {
        req.flash('danger','Old password is incorrect');
        res.redirect('/users/edit/'+user.id);
      }
    })
  })
})

//forgot password
router.get('/forgot', (req, res) => {
  res.render('forgot', {
    title: 'Reset Password',
    user: req.user
  })
})

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          res.redirect('/users/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'kevinziadeh@gmail.com',
          pass: '26-11Zkevin'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'kevinziadeh@gmail.com',
        subject: 'Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/users/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      transporter.sendMail(mailOptions, function(err) {
        req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/users/forgot');
  });
});

//reset password
router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      res.redirect('/users/forgot');
    }
    res.render('reset', {
      user: req.user
    });
  });
});

router.post('/reset/:token', function(req, res) {
  const password = req.body.password;
  const confirm = req.body.confirm;

  req.checkBody('password','Password is required').notEmpty();
  req.checkBody('confirm','Passwords do not match').equals(req.body.password);

  //Get Errors
  let errors = req.validationErrors();

  if(errors){
   res.render('reset', {
     errors:errors,
     title: 'Reset Password'
   });
  } else {
      async.waterfall([
        function(done) {
          User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
            if (!user) {
              req.flash('error', 'Password reset token is invalid or has expired.');
              res.redirect('back');
            }

            user.password = req.body.password;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            bcrypt.genSalt(10, function(err, salt){
              bcrypt.hash(user.password, salt, function(err, hash){
                if(err){
                  console.log(err);
                }
                user.password = hash

                user.save(function(err) {
                  req.logIn(user, function(err) {
                    done(err, user);
                  });
                });
              })
            })
          });
        },
        function(user, done) {
          var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'kevinziadeh@gmail.com',
              pass: '26-11Zkevin'
            }
          });
          var mailOptions = {
            to: user.email,
            from: 'kevinziadeh@gmail.com',
            subject: 'Your password has been changed',
            text: 'Hello,\n\n' +
            'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
          };
          transporter.sendMail(mailOptions, function(err) {
            req.flash('success', 'Success! Your password has been changed.');
            done(err);
          });
        }
      ], function(err) {
        res.redirect('/');
      });
  }
});

// Access Control
function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    return next();
  } else {
    req.flash('danger', 'Please login');
    res.redirect('/users/login');
  }
}
module.exports = router;
