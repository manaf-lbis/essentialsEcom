const Coupon = require('../../models/couponSchema')

//coupons page
const coupons = async (req, res) => {
    try {

        //coupon page pagenation
        let currentPage = Number(req.query.pageReq) || 1;
        const limit = 5;
        const count = Math.ceil(await Coupon.countDocuments() / limit);
        currentPage = currentPage + 1 > count ? count : currentPage;
        const skip = (currentPage - 1) * limit;
        const coupons = await Coupon.find().skip(skip).limit(limit);

        //rendering coupon page
        res.render('admin/couponManagement/coupons', { coupons, currentPage });

    } catch (error) {
        //logging error and rendering error page
        console.log(error);
        return res.status(500).redirect('/admin/pagenotFound');
    }
}

//loading add coupon page
const createCouponPage = (req, res) => {
    try {
        //render coupon adding page
        res.render('admin/couponManagement/createCoupon')

    } catch (error) {
        //logging error 
        console.log(error);
    }
}

//Adding new coupon logic
const newCoupon = async (req, res) => {
    try {
        //extracting coupon details from body
        const { discount, minPurchaseValue, expiryDate } = req.body;
        const couponCode = req.body.couponCode.toUpperCase();

        //creating new coupon object
        const coupon = new Coupon(
            { couponCode, discount, minPurchaseValue, expiryDate }
        );

        //saving coupon to data base
        await coupon.save();

        //sending ajax response with created coupon code
        res.status(200).json({ message: 'coupon created sucessFully', couponCode });

    } catch (error) {
        //logging error and sending error response 
        console.log(error);
        res.status(400).json({ message: 'Something went wrong', errCode: error.errorResponse.code })
    }
};

//disabling coupon
const disableCoupon = async (req, res) => {
    try {
        //extract coupon id from request
        const { _id } = req.query;

        //update coupon status to blocked
        await Coupon.updateOne(
            { _id },
            { $set: { isActive: false } }
        );

        //sending success response
        res.status(200).json({ message: 'removed sucessfully' });

    } catch (error) {
        //logging errror and setting response status to 500
        console.log(error);
        res.status(500).json({ message: 'something went weong' });
    }
}



module.exports = {
    coupons, //coupons page
    createCouponPage, //loading add coupon page
    newCoupon,//Adding new coupon logic
    disableCoupon //disabling coupon
}