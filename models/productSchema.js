const mongoose = require('mongoose');
const { Schema } = mongoose;

const producSchema = new Schema({
  productName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  regularPrice: {
    type: Number,
    required: true,
  },
  sellingPrice: {
    type: Number,
    required: true,
  },
  offer: {
    type: Schema.Types.ObjectId,
    ref: 'Offer',
  },
  color: {
    type: String,
    required: true,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  material: {
    type: String,
    required: true,
  },
  productImage: {
    type: [String],
  },
  status: {
    type: String,
    enum: ['Available', 'Out of Stock'],
    default:'Available'
  },
  averageRating:{
    type:Number,
    min:[0],
    max:[5]
  }
});

const Product = mongoose.model('Product', producSchema);
module.exports = Product;
