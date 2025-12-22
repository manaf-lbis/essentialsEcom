const Product = require('../../models/productSchema');

/**
 * Search Suggestions API
 * Returns a list of products matching the search query for live suggestions.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSuggestions = async (req, res) => {
    try {
        const query = req.query.q ?? '';

        if (!query || query.length < 2) {
            return res.json([]);
        }

        // Search for products matching the query in name, brand, or description
        const products = await Product.find({
            isBlocked: false,
            $or: [
                { productName: { $regex: '.*' + query + '.*', $options: 'i' } },
                { brand: { $regex: '.*' + query + '.*', $options: 'i' } }
            ]
        })
            .select('productName productImage sellingPrice')
            .limit(6);

        // Format suggestions data
        const suggestions = products.map(product => ({
            id: product._id,
            name: product.productName,
            price: product.sellingPrice,
            image: product.productImage[0]
        }));

        res.json(suggestions);
    } catch (error) {
        console.error('Error fetching search suggestions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getSuggestions
};
