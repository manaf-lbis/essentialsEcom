const mongoose = require('mongoose');
const { Schema } = mongoose;

const couponSchema = new Schema({
    couponCode: {
        type: String,
        required: true,
        unique: true
    },
    discount: {
        type: Number,
        required: true,
    },
    expiryDate: {
        type: Date,
        required: true
    },
    usedCount:{
        type: Number,
        default: 0
    },
    minPurchaseValue: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
},
    {
        timestamps: true
    }
);

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;

