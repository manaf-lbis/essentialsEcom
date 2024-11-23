const Product = require('../../models/productSchema');
const { options } = require('../../routes/userRouter');
const Category = require('../../models/categorySchema')



// search controlle
const search = async (req, res) => {
    try {
        // find the category is available
        const categories =await Category.find({isBlocked:false})

        // is there is any search query otherwise setting a default value
        const searchQuery  = req.query.searchQuery ?? '';
        const priceRange = req.query.priceRange ?? 1000000;
        let sort = req.query.sort ?? {};
        const categoryQuery  = req.query.category ?? '';

        // defining sort 
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
        };


        // searching product using query
        let products = await Product.find({
            isBlocked: false,
            $or: [
                { productName: { $regex: '.*' + searchQuery + '.*', $options: 'i' } },
                { brand: { $regex: '.*' + searchQuery + '.*', $options: 'i' } },
                { description: { $regex: '.*' + searchQuery + '.*', $options: 'i' } },
            ],
            sellingPrice:{$lte:priceRange},
        }
        ).sort(sort).limit(15);

        // finding the product related to search category
        if(categoryQuery){
            products = products.filter((ele)=>{
               return ele.category.toString() ===  categoryQuery
            })
        };

        // render shop page
        res.render('user/shop',{products,searchQuery,categories,categoryQuery})

    } catch (error) {
        //logging error and render error page
        console.log(error);
        res.render('user/pageNotFound');
    };
};


module.exports = {
    search
}