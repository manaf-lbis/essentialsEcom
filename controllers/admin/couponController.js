const Coupon = require('../../models/couponSchema')

const coupons = async (req,res)=>{
    try {

        let currentPage = Number(req.query.pageReq) || 1;
        const limit = 5;
        const count = Math.ceil(await Coupon.countDocuments() / limit);
        currentPage = currentPage + 1 > count ? count : currentPage;
        const skip = (currentPage - 1) * limit;


        const coupons = await Coupon.find()

        res.render('admin/couponManagement/coupons',{coupons,currentPage})
        

    } catch (error) {
        console.log(error);
        
        
    }
}


const createCouponPage = (req,res)=>{
    try {
        
        res.render('admin/couponManagement/createCoupon')

        
    } catch (error) {

        console.log(error);
        
        
    }
}

const newCoupon = async (req,res)=>{
    try {
        const {discount,minPurchaseValue,expiryDate} = req.body;
        const couponCode = req.body.couponCode.toUpperCase();
        const coupon = new Coupon({couponCode,discount,minPurchaseValue,expiryDate})

        await coupon.save();

        res.status(200).json({message:'coupon created sucessFully',couponCode})

        
    } catch (error) {

        res.status(400).json({message:'Something went wrong',errCode:error.errorResponse.code})

        console.log(error);
           
    }
}

const disableCoupon = async (req,res)=>{
    try {
        const {_id} = req.query;

        
        console.log(await Coupon.updateOne({_id},{$set:{isActive:false}}));
        
        res.status(200).json({message:'removed sucessfully'});
         
    } catch (error) {
        console.log(error);
        res.status(500).json({message:'something went weong'});
    }
}



module.exports = {
    coupons,
    createCouponPage,
    newCoupon,
    disableCoupon
}