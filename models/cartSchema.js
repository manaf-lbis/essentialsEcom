const mongoose = require('mongoose');
const Category = require('./categorySchema');
const { Schema } = mongoose;

const cartSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  coupon:{
    type: Schema.Types.ObjectId,
    ref: 'Coupon'
  },
  products: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: 'product',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min:[1]
      },
      category:{
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
      },
      addedOn: {
        type: Date,
        required: true,
        default: Date.now(),
      },
    },
  ],
},{
  timestamps:true
});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;

