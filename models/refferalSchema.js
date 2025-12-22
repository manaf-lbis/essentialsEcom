const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const referralSchema = new Schema({

    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    referredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    reward: {
      type: Number,
      default: 0
    }
  });

const Referral = mongoose.model('Referral', referralSchema);

module.exports =  Referral
