const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: false,
  },
  googleId: {
    type: String,
    sparse:true
  },
  password: {
    type: String,
    required: false,
  },
  gender: {
    type: String,
    required: false,
  },
  dateOfBirth:{
    type: Date,
    required:false
  },
  address: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Address',
    },
  ],
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  createdOn: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('User', userSchema);
module.exports = User;
