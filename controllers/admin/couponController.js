const Coupon = require('../../models/couponSchema')

const coupons = async (req, res) => {
    try {

        let currentPage = Number(req.query.pageReq) || 1;
        const limit = 10;
        const count = Math.ceil(await Coupon.countDocuments() / limit);
        currentPage = currentPage > count ? count : currentPage;
        currentPage = currentPage <= 0 ? 1 : currentPage;
        const skip = (currentPage - 1) * limit;
        const coupons = await Coupon.find().skip(skip).limit(limit);

        res.render('admin/couponManagement/coupons', { coupons, currentPage });

    } catch (error) {

        console.log(error);
        return res.status(500).redirect('/admin/pagenotFound');
    }
}

const createCouponPage = (req, res) => {
    try {

        res.render('admin/couponManagement/createCoupon')

    } catch (error) {

        console.log(error);
    }
}

const newCoupon = async (req, res) => {
    try {

        const { discount, minPurchaseValue, expiryDate, discountType, maxDiscountAmount } = req.body;
        const couponCode = req.body.couponCode.toUpperCase();

        const coupon = new Coupon(
            { couponCode, discount, minPurchaseValue, expiryDate, discountType, maxDiscountAmount }
        );

        await coupon.save();

        res.status(200).json({ message: 'coupon created sucessFully', couponCode });

    } catch (error) {

        console.log(error);
        res.status(400).json({ message: 'Something went wrong', errCode: error.errorResponse.code })
    }
};

const disableCoupon = async (req, res) => {
    try {

        const { _id } = req.query;

        await Coupon.updateOne(
            { _id },
            { $set: { isActive: false } }
        );

        res.status(200).json({ message: 'removed sucessfully' });

    } catch (error) {

        console.log(error);
        res.status(500).json({ message: 'something went weong' });
    }
}

module.exports = {
    coupons,
    createCouponPage,
    newCoupon,
    disableCoupon
}