const mongoose = require('mongoose');
const { Schema } = mongoose;

const addressSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  address: [
    {
      _id: {
        type: Schema.Types.ObjectId, 
        default: () => new mongoose.Types.ObjectId(), 
      },
      fullName: {
        type: String,
        required: true,
      },
      houseName: {
        type: String,
        required: true,
      },
      area: {
        type: String,
        required: true,
      },
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      pincode: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      defaultAddress:{
        type:Boolean,
        default:false
      },
      isBlocked:{
        type:Boolean,
        default:false
      }
    },
  ],
});

const Address = mongoose.model('Address',addressSchema);
module.exports = Address;