const mongoose = require('mongoose');

// User Schema
const PostSchema = mongoose.Schema({
  title:{
    type: String,
    required: true
  },
  author:{
  type: String,
  required: true
  },
  body:{
    type: String,
    required: true
  },
  date:{
    type: String,
  }
});

let Post = module.exports = mongoose.model('Post', PostSchema);
