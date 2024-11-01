const Comments = require('../../models/commentsSchema');
const Order = require('../../models/orderSchema');
const Product = require('../../models/productSchema');
const mongoose = require('mongoose')

// getting user id from session
function getUserIdFromSession(req) {
    return req.session?._id ?? req.session.passport?.user;
}

const addComment = async (req, res) => {
    try {

        const { productId, comment } = req.body;

        const userId = getUserIdFromSession(req);

        const commentExixt = await Comments.findOne({ productId });

        if (commentExixt) {
            await Comments.updateOne({ productId }, { $push: { comments: { userId, comment } } })

        } else {
            const newComment = new Comments({
                productId,
                comments: [{userId,comment},],
            });

            await newComment.save();
        }

        res.redirect(`/product/${productId}`)

    } catch (error) {

        console.log(error);
        res.render('user/pageNotFound')
    }
};



const addrating = async (req,res)=>{
    try {

        const { productId, comment,orderId,rating } = req.body;

        const userId = getUserIdFromSession(req);


        //checking any comment exist
        const commentExixt = await Comments.findOne({ productId });

        if (commentExixt) {
            await Comments.updateOne({ productId }, { $push: { comments: { userId, comment ,rating} } })

        } else {
            const newComment = new Comments({
                productId,
                comments: [{userId,comment,rating},],
            });

            await newComment.save();
        }

        // rating updae on orderside
        await Order.updateOne({orderId,"orderItems.productId":productId} ,{$set:{'orderItems.$.rating':Number(rating),'orderItems.$.isRated':true}})

        //calsulating avg rating of the product
         const averageRating =  await Comments.aggregate([
            {$match:{productId: new mongoose.Types.ObjectId(productId)}},
            {$unwind:'$comments'},
            {$group:{_id:'$productId' ,averageRating:{$avg:'$comments.rating'} }}
           ])

            await Product.updateOne({_id:productId},{$set:{averageRating:averageRating[0].averageRating}})

    
        res.status(200).json({message:"sucessfull"})
        


    } catch (error) {

        console.log(error); 
        res.ststus(500).json({message:'internal server error'})
    }

}


module.exports = {
    addComment,
    addrating,
};
