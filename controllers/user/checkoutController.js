const Address = require('../../models/addressSchema');
const Cart = require('../../models/cartSchema')
const User = require('../../models/userSchema')


//requiring cart details function from controller
const cartController = require('../../controllers/user/cartController')


function getUserIdFromSession(req){
    return req.session?._id ?? req.session.passport?.user;
}


const getCheckutPage = async (req,res)=>{
    try {

        const userId = getUserIdFromSession(req);
        const cart = await Cart.findOne({userId});

        //checking the cart is empty or not 
        if(cart.products.length <=0){
            return res.redirect('/cart')
        }
        
        
        let userAddress = await Address.findOne(
            {userId}
        ) ?? [] ;

        

        userAddress = userAddress.address.filter((ele)=> !ele.isBlocked );
        

        const {totalAmount,totalItems} = await cartController.getCartDetails(req);

        res.render('user/purchase/checkout',{totalAmount,totalItems,userAddress});
        
        
    } catch (error) {

        console.log(error);
        
        
    }
}



module.exports ={
    getCheckutPage,
}