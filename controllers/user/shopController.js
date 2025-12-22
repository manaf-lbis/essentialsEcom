const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema')

const search = async (req, res) => {
    try {

        const categories = await Category.find({ isBlocked: false })

        const searchQuery = req.query.searchQuery ?? '';
        const priceRange = req.query.priceRange ?? 1000000;
        let sort = req.query.sort ?? {};
        const categoryQuery = req.query.category ?? '';

        if (sort === 'ace') {
            sort = { sellingPrice: 1 }

        } else if (sort === 'dec') {
            sort = { sellingPrice: -1 }

        } else if (sort === 'new') {
            sort = { createdAt: -1 }

        } else if (sort === 'atz') {
            sort = { productName: 1 }

        } else if (sort === 'zta') {
            sort = { productName: -1 }

        } else if (sort === 'ratings') {
            sort = { averageRating: -1 }
        };

        let query = {
            isBlocked: false,
            $or: [
                { productName: { $regex: '.*' + searchQuery + '.*', $options: 'i' } },
                { brand: { $regex: '.*' + searchQuery + '.*', $options: 'i' } },
                { description: { $regex: '.*' + searchQuery + '.*', $options: 'i' } },
            ],
            sellingPrice: { $lte: priceRange }
        };

        if (categoryQuery) {
            query.category = categoryQuery;
        };

        const products = await Product.find(query).sort(sort).limit(15);

        res.render('user/shop', { products, searchQuery, categories, categoryQuery })

    } catch (error) {

        console.log(error);
        res.render('user/pageNotFound');
    };
};

module.exports = {
    search
}