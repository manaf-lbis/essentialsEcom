const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const Comments = require('../../models/commentsSchema')



//loading product detailed page
const getDetailedPage = async (req,res)=>{
    try {
        // extract user id from request
        const _id = req.params.id;

        // fetch product details from db
        const dbResult  = await Product.findOne({_id});
        const categoryId = dbResult.category;
        
        //fetching related product using category
        const recomented = await Product.find({'category':categoryId});

        // fetching comments related to this product
        const comments = await Comments.findOne({productId:_id}).populate({
            path: 'comments.userId', 
            model: 'User', 
            select: 'name' 
          });
    
        // render product details page
        res.render('user/productDetails',{dbResult,recomented,comments})
        
    } catch (error) {
        //log error and render error page 
        console.log(error);
        res.render('user/pageNotFound');
    };
};


const checkQty =async (req,res)=>{
    try {
     const {_id,qty} = req.query
     const product=  await Product.findOne({_id});

     if( Number(qty) >= product.quantity){
        res.status(400).json({message:'out of stock',availableQty: product.quantity});
     }else{
        res.status(200).json({mesage:'ok'})
     }

    } catch (error) {
        // logging error
        console.log(error); 
    };
};



module.exports = {
    getDetailedPage,
    checkQty,
}