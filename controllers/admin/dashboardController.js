const Order = require('../../models/orderSchema');
const Products = require('../../models/productSchema')


const stringToDate = (duration)=> {

    if (duration === '1day') {

      return new Date(Date.now() - (1000 * 60 * 60 * 24));

    } else if (duration === '1week') {

        return new Date(Date.now() - (1000 * 60 * 60 * 24 * 7));

    } else if (duration === '1month') {

        return new Date(Date.now() - (1000 * 60 * 60 * 24 * 31));
    }

};



const generateReport = async (duration) => {
    try {

        const date = stringToDate(duration)


        const orders = await Order.find({ orderDate: { $gte: date } }).populate('orderItems.productId')

        const totalAmount = orders.reduce((acc, ele) => {
            return acc + ele.finalPrice
        }, 0)

        const salesCount = orders.reduce((acc,ele)=>{
            return acc+=ele.orderItems.length

        },0)

        const couponDeduction = orders.reduce((acc,ele)=>{
            return acc+ele.discount
        },0)


        let totalDiscount = 0;

        orders.forEach(order => {
            const orderDiscount = order.orderItems.reduce((sum, item) => {
                const discount = (item.productId.regularPrice || 0) - (item.productId.sellingPrice || 0);
                return sum + discount; 
            }, 0);
            totalDiscount += orderDiscount; 
        });

        return {totalDiscount,totalAmount,salesCount,couponDeduction}
        
    } catch (error) {
        console.log(error);
        throw error
    }

}






const getReport = async (req, res) => {
    try {
        const duration = req.query.duration;

       const {totalDiscount,totalAmount,salesCount,couponDeduction} = await generateReport(duration);

       return res.status(200).json({totalDiscount,totalAmount,salesCount,couponDeduction})


    } catch (error) {
        console.log(error);

    }
}




const generateGraphReport =async (req,res)=>{
    try {

        const {duration}= req.query;

        const date = stringToDate(duration);

        const topSellingProducts = await Products.find().sort({sellingCount:-1}).limit(10).populate('category');



        console.log(topSellingProducts);
        




        res.status(200).json({message:'good'})
        


    } catch (error) {
        console.log(error);
        
        
    }
}








const loadDashboard = async (req, res) => {

    const {totalDiscount,totalAmount,salesCount,couponDeduction} = await generateReport('1day')

    return res.render('admin/dashboard',{totalDiscount,totalAmount,salesCount,couponDeduction});

};

module.exports = {
    loadDashboard,
    getReport,
    generateGraphReport
}