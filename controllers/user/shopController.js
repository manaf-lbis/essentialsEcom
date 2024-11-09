const Product = require('../../models/productSchema');
const { options } = require('../../routes/userRouter');
const Category = require('../../models/categorySchema')




const search = async (req, res) => {
    try {

        const categories =await Category.find({isBlocked:false})

        const searchQuery  = req.query.searchQuery ?? '';
        const priceRange = req.query.priceRange ?? 1000000;
        let sort = req.query.sort ?? {};


        

        if (sort === 'ace'){
            sort = { sellingPrice : 1 }

        }else if(sort === 'dec'){
            sort = { sellingPrice : -1 }

        }else if(sort === 'new'){
            sort = {createdAt:-1}

        }else if(sort === 'atz'){
            sort = {productName:1}

        }else if (sort === 'zta'){
            sort = {productName:-1}

        }else if(sort === 'ratings'){
            sort = {averageRating : -1}
        }



        const products = await Product.find({
            isBlocked: false,
            $or: [
                { productName: { $regex: '.*' + searchQuery + '.*', $options: 'i' } },
                { brand: { $regex: '.*' + searchQuery + '.*', $options: 'i' } },
                { description: { $regex: '.*' + searchQuery + '.*', $options: 'i' } },
            ],
            sellingPrice:{$lte:priceRange},
        }
        ).sort(sort).limit(15);


    //    console.log(products);//=================================
       

        res.render('user/shop',{products,searchQuery,categories})


    } catch (error) {
        console.log(error);


    }
}


module.exports = {
    search
}