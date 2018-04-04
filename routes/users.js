var express = require('express');
var router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');

//Bring in models
let User = require('../models/user.js')

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
         newUser.save(function(err){
           if(err){
             console.log(err);
             req.flash('error','Email/Username already taken');
             res.render('register', {
               title: 'Register'
             });
             return;
           } else {
             req.flash('success','You are now registered and can log in');
             res.redirect('/users/login');
           }
         });
       });
     });
   }
})


//Login page
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


// logout
router.get('/logout', function(req, res){
  req.logout();
  req.flash('success', 'You are logged out');
  res.redirect('/users/login');
});


module.exports = router;
