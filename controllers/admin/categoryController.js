const Category = require('../../models/categorySchema');
const Product = require('../../models/productSchema');
const { products } = require('./productControllers');




const listCategory = async (req, res) => {
    
    try {

        // pagenation 
        let currentpage = req.query.currentpage || 1 ;
        const limit = 5;
        
        const totalPages = Math.ceil(await Category.countDocuments() / limit )

        currentpage = currentpage >= totalPages ? totalPages : currentpage ;  
        currentpage = currentpage <= 0 ? 1 : currentpage

        const skip = limit * (currentpage - 1);
        
    

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
    
    
        return res.render('admin/category', { dbData, currentpage });

        
    } catch (error) {
        console.log(error);
        res.render('admin/pagenotFound');;
    }

   
};





const addCategoryPage = (req, res) => {
    try {
        res.render('admin/addcategory', { message: '' });
    } catch (error) {
        console.log(error);
    }
};



const addCategory = async (req, res) => {
    try {
        const { categoryName, description } = req.body;
        const { filename } = req.file;

        const categoryNameTrimmed = categoryName.trim();

        const isExist = await Category.findOne({categoryName:{$regex: new RegExp(categoryNameTrimmed,'i')} });

        if (isExist) {
            return res.render('admin/addcategory', { message: 'Category Exists' });
        }

        const category = new Category({
            categoryName: categoryNameTrimmed,
            description,
            image: filename,
        });

        await category.save();

        return res.redirect('/admin/category');
    } catch (error) {
        console.log('Error while adding category: ', error);
        return res.status(500).redirect('/admin/pagenotFound');
    }
};



const removeCategory = async (req, res) => {
    try {
        const id = req.query.id;
        await Category.updateOne({ _id: id }, { $set: { isBlocked: true } });

        const result = await Product.updateMany(
            { category: id },
            { $set: { isBlocked: true } }
        );

        return res.redirect('/admin/category');
    } catch (error) {
        console.log(error);
        return res.status(500).redirect('/admin/pagenotFound');
    }
};



const editCategoryPage = async (req, res) => {
    try {
        const _id = req.query.id;

        const dbResult = await Category.findOne({ _id });
        res.render('admin/editcategory', { dbResult });
    } catch (error) {
        console.log(error);
    }
};




const updateCategory = async (req, res) => {
    try {
        const { categoryName, description, _id } = req.body;

        await Category.updateOne({ _id }, { categoryName, description });

        res.redirect('/admin/category');
    } catch (error) {
        console.log(error);
    }
};





const restoreCategory = async (req, res) => {
    try {
        const _id = req.query.id;

        await Category.updateOne({ _id }, { $set: { isBlocked: false } });
        const result = await Product.updateMany(
            { category: _id },
            { $set: { isBlocked: false } }
        );

        res.redirect('/admin/category');
    } catch (error) {
        console.log(error);
        return res.status(500).redirect('/admin/pagenotFound');
    }
};





module.exports = {
    listCategory,
    addCategory,
    removeCategory,
    addCategoryPage,
    editCategoryPage,
    updateCategory,
    restoreCategory,
};
