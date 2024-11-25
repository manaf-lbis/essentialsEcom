const Cart = require('../../models/cartSchema');
const mongoose = require('mongoose');
const Product = require('../../models/productSchema');


// extracting user id from session 
function getUserIdFromSession(req) {
    return req.session?._id ?? req.session.passport?.user;
}

// fetching cart details
async function getCartDetails(req) {
    try {
        // Fetch user id from session
        const _id = req.session?._id ?? req.session.passport?.user;

        // Populating all details of cart items including product details and coupon details
        const cartitems = await Cart.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(_id) } },
            { $unwind: '$products' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'products.productId',
                    foreignField: '_id',
                    as: 'allProducts'
                }
            },
            {
                $lookup: {
                    from: 'coupons',
                    localField: 'coupon',
                    foreignField: '_id',
                    as: 'couponDetails'
                }
            },
            {
                $unwind: {
                    path: '$couponDetails',
                    preserveNullAndEmptyArrays: true
                }
            }
        ]);

        let totalAmount = 0;
        let totalItems = 0;

        if (cartitems) {
            for (let i = cartitems.length - 1; i >= 0; i--) {
                const item = cartitems[i];
                const product = item.allProducts[0];

                // Check stock availability
                if (!product || product.quantity < item.products.quantity) {
                    await Cart.updateOne(
                        { userId: _id },
                        { $pull: { products: { productId: product?._id } } }
                    );
                    cartitems.splice(i, 1); // Remove item from array
                } else {
                    // Calculate totals
                    totalAmount += product.sellingPrice * item.products.quantity;
                    totalItems += item.products.quantity;
                }
            }
        }

        let amountAfterDiscount = totalAmount;
        let discount = 0;

        if (cartitems[0]?.couponDetails?.discount) {
            discount = cartitems[0]?.couponDetails?.discount;
            amountAfterDiscount = totalAmount - cartitems[0]?.couponDetails?.discount;
        }

        // Return the results
        return { totalAmount, totalItems, cartitems, discount, amountAfterDiscount };
    } catch (error) {
        console.log(error);
        throw error;
    }
}


//loading cart page
const getCartPage = async (req, res) => {
    try {
        //fetching user id from session 
        const userId = getUserIdFromSession(req)

        //populating cart details using getCartDetails function
        const { totalAmount, totalItems, cartitems, amountAfterDiscount } = await getCartDetails(req);

        //fetching coupon details that added in the cart 
        const coupon = await Cart.findOne({ userId }).populate('coupon');

        //render cart page with details
        res.render('user/purchase/cart', { cartitems, totalAmount, totalItems, coupon, amountAfterDiscount })

    } catch (error) {
        //logging error and render error page
        console.log(error);
        res.render('user/pageNotFound')
    };
};

//Add to cart logic 
const checkAndAdd = async (user_id, _id, quantity) => {

    const result = await Cart.findOne({ userId: user_id });//checking is there any cart exist

    if (result) { //updating existing cart
        //checking existing cart contain this product
        const response = await Cart.exists({
            userId: user_id,
            products: { $elemMatch: { productId: _id } },
        });

        if (response) {
            //product exist updating the quantity 
            await Cart.updateOne(
                { userId: user_id, 'products.productId': _id },
                { $inc: { 'products.$.quantity': quantity } }
            );

        } else {
            //find the category of the product
            const category = await Product.findOne(
                { _id },
                { category: 1 }
            );

            //product not exist adding the product to array
            await Cart.updateOne(
                { userId: user_id },
                { $push: { products: { productId: _id, quantity, category: category.category } } }
            );
        };
        //return success 
        return true;

    } else { // creating new cart
        //find the category
        const category = await Product.findOne({ _id }, { category: 1 });

        //creating new cart object
        const Item = new Cart({
            userId: user_id,
            products: [{ productId: _id, quantity, category: category.category }],
        });

        //saving new cart in db 
        await Item.save();

        return true;
    };
};

//Adding product to cart
const addToCart = async (req, res) => {
    try {
        //extract user id from session 
        const user_id = getUserIdFromSession(req)

        //extract product id and quantity from req bodu
        const { _id, quantity } = req.body;

        //max qty allowed by a user is 5
        if (quantity <= 0 || quantity >= 5) {
            return res.status(400).json({ message: 'not allowed' })
        }

        // checking is product Exist or product is blocked
        const productIsExist = await Product.findOne({ _id, isBlocked: false });

        //initialise 
        let cartUpdateStatus = false;

        if (productIsExist) {
            // cart adding function 
            cartUpdateStatus = checkAndAdd(user_id, _id, quantity);

        } else {
            //respond error
            return res.status(400).json({ message: 'product doesnt exist' })
        }

        //checking the product qty available
        if (quantity > productIsExist.quantity) {
            return res.status(400).json({ message: 'out of stock ' })
        }


        if (cartUpdateStatus) {
            return res.status(200).json({ message: 'cart updataed Sucessfully' });
        } else {
            return res.status(500).json({ message: 'internal Server error' });
        }


    } catch (error) {
        //logging error and and respond to client side
        console.log(error);
        res.status(500).json({ message: 'internal Server error' });

    }
};

//remove item from cart
const removeCartItem = async (req, res) => {
    try {
        //extracting product id from query
        const { _id } = req.query;
        const userId = getUserIdFromSession(req);

        //removing product from cart array
        await Cart.updateOne({ userId: userId },
            { $pull: { products: { productId: _id } } }
        );

        //redirect to cart
        res.redirect('/cart');

    } catch (error) {
        //logging error and render error page
        console.log(error);
        res.render('user/pageNotFound');
    };
};

//changing qty of cproduct in cart
const changeCartQty = async (req, res) => {
    try {
        //extract user id from session 
        const userId = getUserIdFromSession(req);

        //extract prodcuct details from query
        const { productId, count } = req.query;

        //incrementing qty
        const quantity = await Product.findOne(
            { _id: productId },
            { quantity: 1 }
        );

        //checking the available qty of product
        if (count <= quantity.quantity) {

            //update the qty of product in the cart
            const response = await Cart.findOneAndUpdate(
                { userId, "products.productId": productId },
                { $set: { 'products.$.quantity': Number(count) } },
                { new: true }
            );

            //getiing cart data for updating the page
            const { totalAmount, totalItems, cartitems, discount, amountAfterDiscount } = await getCartDetails(req);

            //sending ajax response for updating cart page
            res.status(200).json({ totalAmount, totalItems, cartitems, discount, amountAfterDiscount });

        } else {
            res.status(400).json({ message: 'Out of Quantity' })
        }

    } catch (error) {
        //logging error and render error page
        console.log(error);
        res.render('user/pageNotFound');
    };
};

//find the quantity of cart
const cartQuantity = async (req, res) => {
    try {
        //extract user id from session 
        const userId = getUserIdFromSession(req);

        const cartQty = await Cart.findOne(
            { userId },
            { products: 1 }
        );

        //respond cart qty
        res.status(200).json({ cartQty: cartQty?.products?.length ?? 0 })


    } catch (error) {
        //logging error and respond the error code
        console.log(error);
        res.status(500)
    }
}


module.exports = {
    addToCart, //Adding product to cart
    getCartPage, //loading cart page
    removeCartItem, //remove item from cart
    getCartDetails, // fetching all datas for showing cart
    changeCartQty, //changing qty of cproduct in cart
    cartQuantity,//find the quantity of cart
};


