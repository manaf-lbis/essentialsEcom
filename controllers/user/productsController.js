const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const Comments = require('../../models/commentsSchema')

const getDetailedPage = async (req,res)=>{

    try {

        const _id = req.params.id;
        const dbResult  = await Product.findOne({_id});
    
        const categoryId = dbResult.category;
        
    
        const recomented = await Product.find({'category':categoryId});
        const comments = await Comments.findOne({productId:_id}).populate({
            path: 'comments.userId', 
            model: 'User', 
            select: 'name' 
          });
    

        res.render('user/productDetails',{dbResult,recomented,comments})
        
    } catch (error) {
        console.log(error);
        res.render('user/pageNotFound');
    }
   
     
}



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
        console.log(error); 
    }
}






module.exports ={
    getDetailedPage,
    checkQty
}