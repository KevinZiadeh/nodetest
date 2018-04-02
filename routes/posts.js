var express = require('express');
var router = express.Router();


// Post Model
let Post = require('../models/post');
// User Model
let User = require('../models/user');


/* GET home page. */
router.get('/', function(req, res, next) {
  Post.find({}, function(err, posts){
    if(err){
      console.log(err)
    } else{
      res.render('posts', {
        title: 'Post List',
        posts: posts
      });
    }
  });
});


// Add post
// Add Submit POST Route
router.post('/', ensureAuthenticated, function(req, res){
  req.checkBody('title','Title is required').notEmpty();
  req.checkBody('body','Description is required').notEmpty();

  //Get Errors
  let errors = req.validationErrors();

  if(errors){
    Post.find({}, function(err, posts){
      if(err){
        console.log(err)
      } else{
        res.render('posts', {
          title: 'Post List',
          posts: posts,
          errors: errors
        });
      }
    });
  } else {
    let post = new Post();
    post.title = req.body.title;
    post.author = req.user._id;
    post.body = req.body.body;
    post.date = new Date().toDateString();

    post.save(function(err){
      if(err){
        console.log(err);
        return;
      } else {
        req.flash('success','Post Added');
        res.redirect('/posts');
      }
    });
  }
});


//Edit post
//Add GET request
router.get('/edit/:id', ensureAuthenticated, (req, res) => {
  Post.findById(req.params.id, (err, post) => {
    if(err){
      console.log(err)
    }if (post.author != req.user._id) {
      req.flash('danger', 'Not Authorized');
      res.redirect('/');
    } else{
        res.render('edit_post', {
          title: 'Edit Info',
          post: post
        })
    }
  })
});

//Add POST request
router.post('/edit/:id', (req, res) => {

  let post = {};
  post.title = req.body.title;
  post.body = req.body.body;
  post.date = new Date().toDateString();

  let query = {_id: req.params.id}

  Post.update(query, post, (err, post) => {
    if(err){
      console.log(err);
      return
    } else{
      req.flash('success','Post Updated');
      res.redirect('/posts/'+req.params.id);
    }
  })
});


//Get Single post
router.get('/:id', function(req, res){
  Post.findById(req.params.id, (err, post) => {
    User.findById(post.author, (err, user) => {
      if(err){
        console.log(err);
      } else{
        res.render('post', {
          title: post.title,
          author: user.name,
          post: post
        })
      }
    })
  })
})


// Delete User
router.delete('/:id', function(req, res){
  if(!req.user._id){
  res.status(500).send();
}

  let query = {_id:req.params.id}

  Post.findById(req.params.id, function(err, post){
    if(post.author != req.user._id){
      res.status(500).send();
    } else {
      Post.remove(query, function(err){
        if(err){
          console.log(err);
        }
        res.send('Success');
      });
    }
  });
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
