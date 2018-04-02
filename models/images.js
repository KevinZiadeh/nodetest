const mongoose = require('mongoose');

// User Schema
const ImagesSchema = mongoose.Schema({
  src:{
    type: String,
    required: true
  },
  uploader:{
    type: String,
    required: true
  }
});

let Images = module.exports = mongoose.model('Image', ImagesSchema);
