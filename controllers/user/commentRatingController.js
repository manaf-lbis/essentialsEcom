const Comments = require('../../models/commentsSchema');
const Order = require('../../models/orderSchema');
const Product = require('../../models/productSchema');
const mongoose = require('mongoose')

// getting user id from session
function getUserIdFromSession(req) {
    return req.session?._id ?? req.session.passport?.user;
}

//comment adding
const addComment = async (req, res) => {
    try {
        //extracting comment details from body
        const { productId, comment } = req.body;

        //extracting user id from session
        const userId = getUserIdFromSession(req);

        //checking any comment array exixt on that product 
        const commentExixt = await Comments.findOne({ productId });


        if (commentExixt) {
            //push new comment
            await Comments.updateOne(
                { productId },
                { $push: { comments: { userId, comment } } }
            );

        } else {
            //create new comment object 
            const newComment = new Comments({
                productId,
                comments: [{ userId, comment },],
            });

            //saving new comment object
            await newComment.save();
        };

        //redirect to product page
        res.redirect(`/product/${productId}`)

    } catch (error) {
        //logging error and render error page
        console.log(error);
        res.render('user/pageNotFound')
    };
};

//add rating after delivery
const addrating = async (req, res) => {
    try {
        //extract details from body 
        const { productId, comment, orderId, rating } = req.body;

        //extract user id from session
        const userId = getUserIdFromSession(req);


        //checking any comment array exist
        const commentExixt = await Comments.findOne({ productId });

        if (commentExixt) {
            //adding new comment and rating
            await Comments.updateOne(
                { productId },
                { $push: { comments: { userId, comment, rating } } }
            );

        } else {
            //creating new comment object
            const newComment = new Comments({
                productId,
                comments: [{ userId, comment, rating },],
            });

            //saving comment object to database
            await newComment.save();
        };

        // rating update on order page 
        await Order.updateOne(
            { orderId, "orderItems.productId": productId },
            { $set: { 'orderItems.$.rating': Number(rating), 'orderItems.$.isRated': true } }
        )

        //calculating avg rating of the product
        const averageRating = await Comments.aggregate([
            { $match: { productId: new mongoose.Types.ObjectId(productId) } },
            { $unwind: '$comments' },
            { $group: { _id: '$productId', averageRating: { $avg: '$comments.rating' } } }
        ]);

        //updating new avg rating on product
        await Product.updateOne(
            { _id: productId },
            { $set: { averageRating: averageRating[0].averageRating } }
        )


        //respond with success message
        res.status(200).json({ message: "sucessfull" })

    } catch (error) {
        //logging error and sending error to clint side
        console.log(error);
        res.ststus(500).json({ message: 'internal server error' })
    };

};


module.exports = {
    addComment, //comment adding
    addrating, //add rating after delivery
};
