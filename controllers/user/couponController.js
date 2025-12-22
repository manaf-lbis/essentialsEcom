const Coupon = require('../../models/couponSchema');
const cartController = require('../../controllers/user/cartController')
const Cart = require('../../models/cartSchema')


//extract user id from session 
function getUserIdFromSession(req) {
    return req.session?._id ?? req.session.passport?.user;
}

//validity check using coupon code
const couponValidity = async (couponCode, req, res) => {

    //checking coupon code in db
    const coupon = await Coupon.findOne({ couponCode });


    if (!coupon) {
        res.status(400).json({ message: 'Invalid Coupon Code' });
        return false;
    }

    if (!coupon.isActive) {
        res.status(400).json({ message: 'Coupon Inactive' });
        return false;
    }

    if (coupon.expiryDate < Date.now()) {
        res.status(400).json({ message: 'Coupon Expired' });
        return false;
    }

    // Check cart total amount
    const cartDetails = await cartController.getCartDetails(req);

    //cart value lesstan minimum purchase amount
    if (cartDetails.totalAmount < coupon.minPurchaseValue) {
        res.status(400).json({ message: `Minimum purchase value should be ${coupon.minPurchaseValue}` });
        return false;
    }

    return coupon // Coupon is valid
};


//cheking coupon code validity
const checkCouponCode = async (req, res) => {
    try {
        //extracting coupon code from query
        const { couponCode } = req.query;

        //extract user id from session 
        const userId = getUserIdFromSession(req)

        //checking validity of coupon
        const isValid = await couponValidity(couponCode, req, res);

        if (!isValid) return;

        // Calculate discount based on type
        let discountAmount = 0;
        if (isValid.discountType === 'percentage') {
            const cartDetails = await cartController.getCartDetails(req); // Need total amount
            const percentageDiscount = (cartDetails.totalAmount * isValid.discount) / 100;
            discountAmount = isValid.maxDiscountAmount ? Math.min(percentageDiscount, isValid.maxDiscountAmount) : percentageDiscount;
        } else {
            discountAmount = isValid.discount;
        }

        // Round to 2 decimal places
        discountAmount = Math.round(discountAmount * 100) / 100;


        //adding coupon to cart
        await Cart.updateOne({ userId }, { $set: { coupon: isValid._id } })

        return res.status(200).json({ message: 'coupon Applied Sucessfully', discount: discountAmount, code: isValid.couponCode })

    } catch (error) {

        console.log(error);
        return res.status(500).json({ message: 'Server Error' });
    }
}




//checking coupon after changing cart value
const couponAfterChange = async (req, res) => {
    try {
        const { couponCode } = req.query;
        //extract user id from session 
        const userId = getUserIdFromSession(req);

        //checking validity of coupon
        const isValid = await couponValidity(couponCode, req, res);

        //coupon not valid removing coupon from cart
        if (!isValid) {
            await Cart.updateOne({ userId }, { $unset: { coupon: '' } })
            return;
        }

        //respond to client
        return res.status(200).json({ message: 'you can continue with this coupon' })


    } catch (error) {
        console.log(error);
        return res.status(400).json({ message: 'coupon not valid' })
    };

};




// Get available coupons for the user
const getAvailableCoupons = async (req, res) => {
    try {
        const userId = getUserIdFromSession(req);

        // Find active coupons that are not expired
        const coupons = await Coupon.find({
            isActive: true,
            expiryDate: { $gte: new Date() }
        }).sort({ expiryDate: 1 });

        return res.status(200).json({ coupons });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Error fetching coupons' });
    }
};

// Remove coupon from cart
const removeCoupon = async (req, res) => {
    try {
        const userId = getUserIdFromSession(req);

        await Cart.updateOne({ userId }, { $unset: { coupon: '' } });

        return res.status(200).json({ message: 'Coupon removed successfully' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Error removing coupon' });
    }
};

module.exports = {
    checkCouponCode, //cheking coupon code validity
    couponAfterChange, //checking coupon after changing cart value
    getAvailableCoupons,
    removeCoupon
}