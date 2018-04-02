const mongoose = require('mongoose');
//const uniqueValidator = require('mongoose-unique-validator');

// User Schema
const UserSchema = mongoose.Schema({
  name:{
    type: String,
    required: true
  },
  email:{
    type: String,
    required: false,
    unique: true,
    //uniqueCaseInsensitive: true
  },
  username:{
    type: String,
    required: true,
    unique: true,
    //uniqueCaseInsensitive: true
  },
  password:{
    type: String,
    required: true
  },
  created_at: Date,
  updated_at: Date
});

// Apply the uniqueValidator plugin to userSchema.
//UserSchema.plugin(uniqueValidator, { message: 'Error, expected {PATH} to be unique.' } );
let User = module.exports = mongoose.model('User', UserSchema);
