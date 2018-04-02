var express = require('express');
var router = express.Router();

// Article Model
let Images = require('../models/images');

/* GET users listing. */
router.get('/', function(req, res, next) {
  Images.find({}, function(err, images){
    if(err){
      console.log(err)
    } else{
      res.render('images', {
        title: 'Images',
        images: images
      });
    }
  });
});

// Add Route
router.get('/add', function(req, res){
  res.render('add_images', {
    title:'Add Image'
  });
});

// Add Submit POST Route
router.post('/add', function(req, res){

    let images = new Images();
    images.src = req.body.src;
    images.uploader = req.body.uploader;

    images.save(function(err){
      if(err){
        console.log(err);
        return;
      } else {
        console.log('success','Image Added');
        res.redirect('/');
      }
    });
  });

module.exports = router;
