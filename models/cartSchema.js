const mongoose = require('mongoose');
const { Schema } = mongoose;

const cartSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true,
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
