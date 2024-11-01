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






module.exports ={
    getDetailedPage,
}