const Order = require('../../models/orderSchema');
const Cart = require('../../models/cartSchema');
const mongoose = require('mongoose');
const { products } = require('../admin/productControllers');
const Address = require('../../models/addressSchema');
const Product = require('../../models/productSchema')



function getUserIdFromSession(req) {
    return req.session?._id ?? req.session.passport?.user;
}


async function createOrder(orderInfo) {

    try {

        const {
            paymentMethod,
            deliveryAddress,
            userId
        } = orderInfo;

        // finding the cart of user and proceeding with cart data and quantity

        // find the cart and get the product and lookup for products collection for products details
        const cartItems = await Cart.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            { $project: { products: 1 } },
            {
                $lookup: {
                    from: 'products',
                    foreignField: '_id',
                    localField: 'products.productId',
                    as: 'productDetails'
                }
            }
        ]);



        const orderItems = [];
        for (const [index, ele] of cartItems[0].products.entries()) {
            orderItems.push({
                productId: ele.productId,
                quantity: ele.quantity,
                price: cartItems[0].productDetails[index].sellingPrice
            });

            // Reduce quantity in the Product collection
            const updatedProduct = await Product.findOneAndUpdate(
                { _id: ele.productId, quantity: { $gte: ele.quantity } },
                { $inc: { quantity: -ele.quantity } }, 
                { new: true }
            );

         
            if (!updatedProduct) {
                throw new Error(`Insufficient stock for product ${ele.productId}`);
            }
        }



        //calculationg total price
        const totalPrice = orderItems.reduce((acc, ele) => {
            return acc += ele.quantity * ele.price
        }, 0);


        //adderess finding  
        let address = await Address.findOne(
            {
                userId: userId,
                address: { $elemMatch: { _id: deliveryAddress } }
            },
            { 'address.$': 1 }
        );

        //creating order
        const order = new Order({
            userId:userId,
            orderItems: orderItems,
            totalPrice: totalPrice,
            finalPrice: totalPrice,
            address: address.address[0],// query of of mongo is an nested array of object
            paymentMethod: paymentMethod,
        })

        await order.save();
        return true;

    } catch (error) {

        console.log(error);
        return false;

    }

}


const placeOrder =async (req, res) => {
    try {

        const userId = getUserIdFromSession(req);

        const { paymentMethod, deliveryAddress } = req.body;

        const orderInfo = {
            paymentMethod,
            deliveryAddress,
            userId
        }

        //create new Order
        const order = await createOrder(orderInfo);

        if(order){
            await Cart.deleteOne({userId:userId})

           const orderDetails =  await Order.findOne({userId}).sort({orderDate:-1}).limit(1)
           
            res.render('user/purchase/orderSuccessPage',{orderDetails});
        }else{
            res.render('user/pageNotFound')
        }


    } catch (error) {
        console.log(error);

    }

}

const allOrders = async (req,res)=>{
    try {

        const userId = getUserIdFromSession(req);

          // pagenation 
          let currentpage = req.query.currentpage || 1 ;
          const limit = 5;
          
          const totalPages = Math.ceil(await Order.countDocuments({userId}) / limit )
  
          currentpage = currentpage >= totalPages ? totalPages : currentpage ;  
          currentpage = currentpage <= 0 ? 1 : currentpage
  
          const skip = limit * (currentpage - 1);
          

      

       const orders = await Order.find({ userId }).populate('orderItems.productId').sort({orderDate:-1}).skip(skip).limit(limit)

       res.render('user/purchase/orders',{orders,currentpage})

        
    } catch (error) {
        console.log(error);
        res.render('user/pageNotFound');
    }
}


const cancelOrder = async (req,res)=>{
    try {
        const {orderId,productId} = req.query;

        const response = await Order.updateOne(
            {orderId,'orderItems.productId':productId },
            {$set:{'orderItems.$.status':'Cancelled'}}
        );

        res.redirect('/orders')
         
        
    } catch (error) {
        console.log(error);

    }

}


const orderDetails = async (req,res)=>{
    try {

        const {orderId} = req.query;

        const orders = await Order.find({ orderId }).populate('orderItems.productId')

        console.log(orders);

        res.render('user/purchase/orderDetails',{orders})
        

        
    } catch (error) {
        console.log(error);
        
    }
}


module.exports = {
    placeOrder,
    allOrders,
    cancelOrder,
    orderDetails
}