const Wishlist = require('../../models/wishlistSchema');
const User = require('../../models/userSchema');

function getUserIdFromSession(req) {
    return req.session?._id ?? req.session.passport?.user;
}

// loading wishlist
const wishlist = async (req, res) => {
    try {
        // extract user id from session 
        const userId = getUserIdFromSession(req);

        // Pagination
        let currentpage = parseInt(req.query.currentpage) || 1;
        const limit = 5;

        // populate user wishlist products  details
        const wishlist = await Wishlist.findOne({ userId }).populate('products.productId');

        // Fetch user data for sidebar
        const userData = await User.findById(userId);


        if (wishlist) {
            const totalProducts = wishlist.products.length;
            const totalPages = Math.ceil(totalProducts / limit);

            currentpage = Math.min(Math.max(currentpage, 1), totalPages);
            const skip = (currentpage - 1) * limit;
            const paginatedProducts = wishlist.products.slice(skip, skip + limit);

            // render wishlist page with query details
            res.render('user/purchase/wishlist', {
                wishlist: { ...wishlist.toObject(), products: paginatedProducts },
                currentpage,
                totalPages,
                userData // Pass user data for sidebar
            });

        } else {
            //render wishlist
            res.render('user/purchase/wishlist', {
                wishlist: { products: [] },
                currentpage,
                totalPages: 1,
                userData // Pass user data for sidebar
            });
        };

    } catch (error) {
        // logging error and render error page
        console.log(error);
        res.render('user/pageNotFound');
    };
};


//toggle based on product availablity
const wishlistToggle = async (req, res) => {
    try {
        const userId = getUserIdFromSession(req);
        const { productId } = req.query

        // find wishlist products
        const wishlist = await Wishlist.findOne({ userId });

        if (wishlist) {

            // checking the product
            const productExist = wishlist.products.some((product) => {
                return product.productId.toString() === productId.toString()
            });


            if (productExist) {
                // if exist , remove product from wishlist
                await Wishlist.updateOne(
                    { userId },
                    { $pull: { products: { productId: productId } } }
                );

                // respond with sucess message
                res.status(200).json({ message: 'Item Removed' })

            } else {
                // adding the product to wishlist
                await Wishlist.updateOne(
                    { userId },
                    { $push: { products: { productId: productId } } }
                );

                // respond with success message
                res.status(200).json({ message: 'Added To Wishlist' })
            };

        } else {

            // creating new wishlist object
            const wishlist = new Wishlist(
                { userId, products: [{ productId: productId }] }
            );

            // saving new object to database
            await wishlist.save();

            // respond with success message 
            res.status(200).json({ message: 'Added To Wishlist' })
        };

    } catch (error) {
        // logging error and sending error status
        console.log(error);
        res.status(500).json({ message: 'Something went Wrong' });
    };
};


// removing product from wishlist
const removeFromWishlist = async (req, res) => {
    try {
        // extract user id from session
        const userId = getUserIdFromSession(req)
        const { productId } = req.query;

        // remove product from wishlist array
        await Wishlist.updateOne(
            { userId },
            { $pull: { products: { productId } } }
        );

        // respond with success message
        res.status(200).json({ message: 'removed' })

    } catch (error) {
        // log error  and respond with error message
        console.log(error);
        res.status(500).json({ message: 'Something went Wrong' });
    };
};



module.exports = {
    wishlist,
    wishlistToggle,
    removeFromWishlist,
}