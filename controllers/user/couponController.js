const Coupon = require('../../models/couponSchema');
const cartController = require('../../controllers/user/cartController')
const Cart = require('../../models/cartSchema')

function getUserIdFromSession(req) {
    return req.session?._id ?? req.session.passport?.user;
}

const couponValidity = async (couponCode, req, res) => {

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

    const cartDetails = await cartController.getCartDetails(req);

    if (cartDetails.totalAmount < coupon.minPurchaseValue) {
        res.status(400).json({ message: `Minimum purchase value should be ${coupon.minPurchaseValue}` });
        return false;
    }

    return coupon
};

const checkCouponCode = async (req, res) => {
    try {

        const { couponCode } = req.query;

        const userId = getUserIdFromSession(req)

        const isValid = await couponValidity(couponCode, req, res);

        if (!isValid) return;

        let discountAmount = 0;
        if (isValid.discountType === 'percentage') {
            const cartDetails = await cartController.getCartDetails(req);
            const percentageDiscount = (cartDetails.totalAmount * isValid.discount) / 100;
            discountAmount = isValid.maxDiscountAmount ? Math.min(percentageDiscount, isValid.maxDiscountAmount) : percentageDiscount;
        } else {
            discountAmount = isValid.discount;
        }

        discountAmount = Math.round(discountAmount * 100) / 100;

        await Cart.updateOne({ userId }, { $set: { coupon: isValid._id } })

        return res.status(200).json({ message: 'coupon Applied Sucessfully', discount: discountAmount, code: isValid.couponCode })

    } catch (error) {

        console.log(error);
        return res.status(500).json({ message: 'Server Error' });
    }
}

const couponAfterChange = async (req, res) => {
    try {
        const { couponCode } = req.query;

        const userId = getUserIdFromSession(req);

        const isValid = await couponValidity(couponCode, req, res);

        if (!isValid) {
            await Cart.updateOne({ userId }, { $unset: { coupon: '' } })
            return;
        }

        return res.status(200).json({ message: 'you can continue with this coupon' })

    } catch (error) {
        console.log(error);
        return res.status(400).json({ message: 'coupon not valid' })
    };

};

const getAvailableCoupons = async (req, res) => {
    try {
        const userId = getUserIdFromSession(req);

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
    checkCouponCode,
    couponAfterChange,
    getAvailableCoupons,
    removeCoupon
}