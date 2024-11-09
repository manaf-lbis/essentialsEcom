const Cart = require('../../models/cartSchema');
const mongoose = require('mongoose');
const Product = require('../../models/productSchema');
const { products } = require('../admin/productControllers');

// getting user id from session 
function getUserIdFromSession(req) {
    return req.session?._id ?? req.session.passport?.user;
}


// cart page loading logic implimented 
async function getCartDetails(req) {
    try {

        const _id = getUserIdFromSession(req)

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

            cartitems.forEach((ele) => {

                totalAmount += ele.allProducts[0].sellingPrice * ele.products.quantity;
                totalItems += ele.products.quantity;
            })
        }

        let amountAfterDiscount = totalAmount;
        let discount = 0;

        if(cartitems[0]?.couponDetails?.discount){
            discount = cartitems[0]?.couponDetails?.discount;
            amountAfterDiscount = totalAmount - cartitems[0]?.couponDetails?.discount
        }


    
        return { totalAmount, totalItems, cartitems, discount, amountAfterDiscount }

    } catch (error) {
        console.log(error);
        throw error
    }

}


//cart requiring 
const getCartPage = async (req, res) => {
    try {
        const userId = getUserIdFromSession(req)

        const { totalAmount, totalItems, cartitems,amountAfterDiscount } = await getCartDetails(req);

        const coupon = await Cart.findOne({userId}).populate('coupon');
        

        res.render('user/purchase/cart', { cartitems, totalAmount, totalItems ,coupon, amountAfterDiscount})

    } catch (error) {
        console.log(error);
        res.render('user/pageNotFound')
    }

}



//Add to cart logic 
const checkAndAdd = async (user_id, _id, quantity) => {

    const result = await Cart.findOne({ userId: user_id });//checking is there any cart exist

    if (result) {

        //checking existing cart contain this product
        const response = await Cart.exists({
            userId: user_id,
            products: { $elemMatch: { productId: _id } },
        });

        if (response) {

            //product exist updatinfg the quantity 
            await Cart.updateOne(
                { userId: user_id, 'products.productId': _id },
                { $inc: { 'products.$.quantity': quantity } }
            );

        } else {

            //product not exist adding the product to array
            await Cart.updateOne(
                { userId: user_id },
                { $push: { products: { productId: _id, quantity } } }
            );
        }

        return true;

    } else {

        //creating new cart

        const Item = new Cart({
            userId: user_id,
            products: [{ productId: _id, quantity }],
        });
        Item.save();

        return true;
    }
}



const addToCart = async (req, res) => {

    try {
        const user_id = getUserIdFromSession(req)
        const { _id, quantity } = req.body;

        if (quantity <= 0 || quantity >= 5) {
            return res.status(400).json({ message: 'not allowed' })
        }

        // checking is product Exist or product is blocked
        const productIsExist = await Product.findOne({ _id, isBlocked: false });



        let status = false;

        if (productIsExist) {
            // cart adding logic 
            status = checkAndAdd(user_id, _id, quantity);

        } else {
            return res.status(400).json({ message: 'product doesnt exist' })
        }


        if (quantity > productIsExist) {
            return res.status(400).json({ message: 'out of stock ' })
        }


        if (status) {

            return res.status(200).json({ message: 'cart updataed Sucessfully' });

        } else {

            return res.status(500).json({ message: 'internal Server error' });
        }


    } catch (error) {

        console.log(error);
        res.status(500).json({ message: 'internal Server error' });

    }
};


const removeCartItem = async (req, res) => {

    try {

        const { _id } = req.query;
        const userId = getUserIdFromSession(req)

        await Cart.updateOne({ userId: userId }, { $pull: { products: { productId: _id } } })

        res.redirect('/cart')

    } catch (error) {
        console.log(error);
        res.render('user/pageNotFound')
    }
}


const changeCartQty = async (req, res) => {
    try {
        const userId = getUserIdFromSession(req);

        const { productId, count } = req.query;

        const quantity = await Product.findOne({ _id: productId }, { quantity: 1 });



        if (count <= quantity.quantity) {

            const response = await Cart.findOneAndUpdate(
                { userId, "products.productId": productId },
                { $set: { 'products.$.quantity': Number(count) } },
                { new: true }
            )


            //getiing cart data for updating the page
            const { totalAmount, totalItems, cartitems, discount,amountAfterDiscount} = await getCartDetails(req);


            res.status(200).json({ totalAmount, totalItems, cartitems, discount ,amountAfterDiscount});

        } else {
            res.status(400).json({ message: 'Out of Quantity' })
        }




    } catch (error) {
        console.log(error);


    }

}


module.exports = {
    addToCart,
    getCartPage,
    removeCartItem,
    getCartDetails,
    changeCartQty
};


