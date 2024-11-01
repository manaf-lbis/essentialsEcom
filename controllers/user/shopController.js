const Product = require('../../models/productSchema');
const { options } = require('../../routes/userRouter');




const search = async (req, res) => {
    try {
        
        
        const searchQuery  = req.query.searchQuery ?? '';
        const priceRange = req.query.priceRange ?? 1000000;
        console.log(req.query, priceRange );








        const products = await Product.find({
            isBlocked: false,
            $or: [
                { productName: { $regex: '.*' + searchQuery + '.*', $options: 'i' } },
                { brand: { $regex: '.*' + searchQuery + '.*', $options: 'i' } },
                { description: { $regex: '.*' + searchQuery + '.*', $options: 'i' } },
            ],
            sellingPrice:{$lte:priceRange},
            


        }
        ).limit(15);

    //    console.log(products);//=================================
       

        res.render('user/shop',{products,searchQuery})


    } catch (error) {
        console.log(error);


    }
}


module.exports = {
    search
}