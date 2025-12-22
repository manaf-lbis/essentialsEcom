const Wishlist = require('../../models/wishlistSchema');
const User = require('../../models/userSchema');

function getUserIdFromSession(req) {
    return req.session?._id ?? req.session.passport?.user;
}

const wishlist = async (req, res) => {
    try {

        const userId = getUserIdFromSession(req);

        let currentpage = parseInt(req.query.currentpage) || 1;
        const limit = 5;

        const wishlist = await Wishlist.findOne({ userId }).populate('products.productId');

        const userData = await User.findById(userId);

        if (wishlist) {
            const totalProducts = wishlist.products.length;
            const totalPages = Math.ceil(totalProducts / limit);

            currentpage = Math.min(Math.max(currentpage, 1), totalPages);
            const skip = (currentpage - 1) * limit;
            const paginatedProducts = wishlist.products.slice(skip, skip + limit);

            res.render('user/purchase/wishlist', {
                wishlist: { ...wishlist.toObject(), products: paginatedProducts },
                currentpage,
                totalPages,
                userData
            });

        } else {

            res.render('user/purchase/wishlist', {
                wishlist: { products: [] },
                currentpage,
                totalPages: 1,
                userData
            });
        };

    } catch (error) {

        console.log(error);
        res.render('user/pageNotFound');
    };
};

const wishlistToggle = async (req, res) => {
    try {
        const userId = getUserIdFromSession(req);
        const { productId } = req.query

        const wishlist = await Wishlist.findOne({ userId });

        if (wishlist) {

            const productExist = wishlist.products.some((product) => {
                return product.productId.toString() === productId.toString()
            });

            if (productExist) {

                await Wishlist.updateOne(
                    { userId },
                    { $pull: { products: { productId: productId } } }
                );

                res.status(200).json({ message: 'Item Removed' })

            } else {

                await Wishlist.updateOne(
                    { userId },
                    { $push: { products: { productId: productId } } }
                );

                res.status(200).json({ message: 'Added To Wishlist' })
            };

        } else {

            const wishlist = new Wishlist(
                { userId, products: [{ productId: productId }] }
            );

            await wishlist.save();

            res.status(200).json({ message: 'Added To Wishlist' })
        };

    } catch (error) {

        console.log(error);
        res.status(500).json({ message: 'Something went Wrong' });
    };
};

const removeFromWishlist = async (req, res) => {
    try {

        const userId = getUserIdFromSession(req)
        const { productId } = req.query;

        await Wishlist.updateOne(
            { userId },
            { $pull: { products: { productId } } }
        );

        res.status(200).json({ message: 'removed' })

    } catch (error) {

        console.log(error);
        res.status(500).json({ message: 'Something went Wrong' });
    };
};

module.exports = {
    wishlist,
    wishlistToggle,
    removeFromWishlist,
}