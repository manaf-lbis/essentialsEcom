const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const orderSchema = new Schema({

  orderId: {
    type: String,
    default: () => uuidv4().slice(-12),
    unique: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderItems: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      category:{
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
        default: 0,
      },
      status: {
        type: String,
        required: true,
        default: 'Pending',
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Rejected', 'ReturnRequested', 'Returned', 'Pending for Payment'],
      },
      deliveryDate: {
        type: Date,
      },
      isRated: {
        type: Boolean,
        default: false
      },
      rating: {
        type: Number,
        min: [0],
        max: [5]
      },
      cancellationReason: {
        type: String,
      },
    },
  ],
  totalPrice: {
    type: Number,
    default: 0,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  finalPrice: {
    type: Number,
    default: 0,
  },
  address: {

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
    isBlocked: {
      type: Boolean
    }
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  coupon: {
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
    code: String,
    discountAmount: Number
  },
  deliveryCharge: {
    type: Number,
    max: 40,
    default: 0
  },
  paymentMethod: {
    type: String,
    required: true
  },
  paymentId: {
    type: String
  },
},
  {
    timestamps: true
  }
);

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
