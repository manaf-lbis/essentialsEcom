const Category = require('../../models/categorySchema');
const Product = require('../../models/productSchema');


//category Listing Page
const listCategory = async (req, res) => {
    try {
        //pagenation logic
        let currentpage = req.query.currentpage || 1;
        const limit = 5;

        //counting the total documnet for calculating pages
        const totalPages = Math.ceil(await Category.countDocuments() / limit)

        currentpage = currentpage >= totalPages ? totalPages : currentpage;
        currentpage = currentpage <= 0 ? 1 : currentpage;
        const skip = limit * (currentpage - 1);

        //fetching requested page data from db
        const dbData = await Category.aggregate([
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: 'category',
                    as: 'products',
                },
            },
        ]).skip(skip).limit(limit);

        //rendering category listing page
        return res.render('admin/category', { dbData, currentpage });

    } catch (error) {
        //loging error and render error page
        console.log(error);
        res.render('admin/pagenotFound');
    }

};


//adding new category
const addCategoryPage = (req, res) => {
    try {
        //render category adding form
        res.render('admin/addcategory', { message: '' });

    } catch (error) {
        //logging error and render error page
        console.log(error);
        res.render('admin/pagenotFound');
    }

};


//creating new category 
const addCategory = async (req, res) => {
    try {

        //extracting data from the request
        const { categoryName, description } = req.body;
        const { filename } = req.file;

        const categoryNameTrimmed = categoryName.trim();

        //checking the cattegory already exists
        const isExist = await Category.findOne(
            { categoryName: { $regex: new RegExp(categoryNameTrimmed, 'i') } }
        );

        if (isExist) {
            return res.render('admin/addcategory', { message: 'Category Exists' });
        }

        //creating new category 
        const category = new Category({
            categoryName: categoryNameTrimmed,
            description,
            image: filename,
        });

        //saving new category to DB
        await category.save();

        // Redirect to the category list page
        return res.redirect('/admin/category');

    } catch (error) {
        //log error and redirect error page
        console.log('Error while adding category: ', error);
        return res.status(500).redirect('/admin/pagenotFound');
    }
};


//category blocking
const removeCategory = async (req, res) => {
    try {
        //extractig data from request
        const id = req.query.id;

        //updating the category status to blocked
        await Category.updateOne(
            { _id: id },
            { $set: { isBlocked: true } }
        );

        //updating the products related to the category setting blocked
        await Product.updateMany(
            { category: id },
            { $set: { isBlocked: true } }
        );

        //redirecting to category listing page
        return res.redirect('/admin/category');

    } catch (error) {
        //logging error and redirect to error page
        console.log(error);
        return res.status(500).redirect('/admin/pagenotFound');
    }
};


//category details editing page
const editCategoryPage = async (req, res) => {
    try {
        //extracting category id from req
        const _id = req.query.id;

        //fin the related category and render page with category data (for edit)
        const dbResult = await Category.findOne({ _id });
        res.render('admin/editcategory', { dbResult });

    } catch (error) {
        //logging error and render error page
        console.log(error);
        return res.status(500).redirect('/admin/pagenotFound');

    }
};


//category details updating
const updateCategory = async (req, res) => {
    try {
        //extracting data from body
        const { categoryName, description, _id } = req.body;

        //updating new details in dataBase
        await Category.updateOne(
            { _id },
            { categoryName, description }
        );

        //redirecting category listing page
        res.redirect('/admin/category');

    } catch (error) {
 
        //logging error and redirecting error page 
        console.log(error);
        return res.redirect('/admin/pagenotFound');
    }
};

//restore deleted category
const restoreCategory = async (req, res) => {
    try {
        //extracting category Id from req 
        const _id = req.query.id;

        // updating category status unblocked
        await Category.updateOne(
            { _id },
            { $set: { isBlocked: false }
        });

        //updating all products in this category unbolocked
        await Product.updateMany(
            { category: _id },
            { $set: { isBlocked: false } }
        );

        //redirect category listing page
        res.redirect('/admin/category');

    } catch (error) {
        //logging error and redirect to error page 
        console.log(error);
        return res.status(500).redirect('/admin/pagenotFound');
    }
};





module.exports = {
    listCategory, //category Listing Page
    addCategory, //creating new category 
    removeCategory, //category blocking
    addCategoryPage, //adding new category
    editCategoryPage, //category details editing page
    updateCategory, //category details updating
    restoreCategory, //restore deleted category
};
