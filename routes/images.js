var express = require('express');
var router = express.Router();

const crypto = require('crypto');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const path = require('path');
const mongoose = require('mongoose');
const config = require('../config/database');

let db = mongoose.connection;

// Check connection
db.once('open', () => {
  console.log('gfs initialized');
  //Init Stream
  gfs = Grid(db.db, mongoose.mongo);
  gfs.collection('images');
});

// Create storage engine
const storage = new GridFsStorage({
  url: config.database,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(8, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'images'
        };
        resolve(fileInfo);
      });
    });
  }
});

const upload = multer({ storage });


/* GET images listing. */
router.get('/', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      res.render('images', { files: false , text: 'No images to show'});
    } else {
      files.map(file => {
        if (
          file.contentType === 'image/jpeg' ||
          file.contentType === 'image/png'
        ) {
          file.isImage = true;
        } else {
          file.isImage = false;
        }
      });
      res.render('images', { files: files, text: null });
    }
  });
});

// Upload image
router.post('/upload', upload.single('file'), (req, res) => {
  res.redirect('/images');
});


// @route GET /image/:filename
// @desc Display Image
router.get('/image/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }
    // Check if image
    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
      // Read output to browser
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
        err: 'Not an image'
      });
    }
  });
});

// Add Route
router.get('/upload', function(req, res){
  res.render('add_images', {
    title:'Add Image'
  });
});


// Delete Image
router.delete('/image/:id', (req, res) => {
  gfs.remove({ _id: req.params.id, root: 'images' }, (err, gridStore) => {
  if (err) {
  console.log(err);
  req.flash('error','Delete image was not successful');
  res.render('/images')
  }
  res.redirect('/images');
  });
});



module.exports = router;
