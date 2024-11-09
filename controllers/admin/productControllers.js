const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const path = require('path');
const fs = require('fs');
const { error } = require('console');


const products = async (req, res) => {

  try {
    const searchQuery = req.query.search ?? '';

    let currentPage = Number(req.query.pageReq) || 1;
    const limit = 5;

    const count = Math.ceil(await Product.countDocuments({
      $or: [
        { 'productName': { $regex: '.*' + searchQuery + '.*', $options: 'i' } },
        { 'brand': { $regex: '.*' + searchQuery + '.*', $options: 'i' } }
      ]
    }) / limit);

    
    currentPage = currentPage >= count ? count : currentPage ;  
    currentPage = currentPage <= 0 ? 1 : currentPage


    const skip = limit * (currentPage - 1);

  
    const products = await Product.find({
      $or: [
        { 'productName': { $regex: '.*' + searchQuery + '.*', $options: 'i' } },
        { 'brand': { $regex: '.*' + searchQuery + '.*', $options: 'i' } }

      ]
    }).skip(skip).limit(limit);


    res.render('admin/productmanagement', { products, currentPage, searchQuery });


  } catch (error) {

    console.log(error);



  }
};


//add product page 
const addproductPage = async (req, res) => {
  try {
    const category = await Category.find();
    res.render('admin/addproduct', { category, message: '' });
  } catch (error) {
    console.log(error);
  }
};

// add new product submission
const addProduct = async (req, res) => {
  try {

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded.' });
    }

    const {
      productName, brand, color, size, category, regularPrice,
      sellingPrice, material, description, quantity
    } = req.body;


    const imagesArray = req.files.map(file => `/uploads/${file.filename}`);

    // Create a new product document
    const product = new Product({
      productName, brand, color, size, category, regularPrice,
      sellingPrice, material, description, quantity,
      productImage: imagesArray
    });

    // Save 
    await product.save();

    // Fetch categories 
    // const dbCategory = await Category.find({});


    return res.status(200).json({ success: true, message: 'Product added successfully' });

  } catch (error) {
    // Log and handle errors
    console.error('Error:', error);
    return res.status(500).redirect('pagenotFound');
  }
};



const removeProduct = async (req, res) => {
  try {
    const _id = req.params.id;

    const result = await Product.updateOne({ _id }, { isBlocked: true });
    res.redirect('/admin/products')

  } catch (error) {

    console.log(error);
  }

};


const editProduct = async (req, res) => {
  try {

    const _id = req.params.id;
    const dbResult = await Product.findOne({ _id });

    res.render('admin/editproduct', { dbResult })

  } catch (error) {

    console.log(error);
  }
}


const updateProduct = async (req, res) => {
  try {

    const { productName, brand, color, size, quantity,
      regularPrice, sellingPrice, material, description, _id, status
    } = req.body;

    const imagesArray = req.files.map(file => `/uploads/${file.filename}`);

    const dbResult = await Product.updateOne({ _id },
      {
        $set: {
          productName,
          brand,
          color,
          size,
          quantity,
          regularPrice,
          sellingPrice,
          material,
          description,
          status,
        },
        $push: {
          productImage: { $each: imagesArray }
        }
      }
    );


    res.status(200).json({ message: 'sucessfully updated' })

  } catch (error) {

    console.log(error);
  }
}



const removeImage = async (req, res) => {
  try {
    const { productId, image } = req.query


    await Product.updateOne({ _id: productId }, { $pull: { productImage: image } })

    fs.unlink(`public${image}`, (error) => {

      if (error) {
        console.log(error);
      } else {
        console.log('image deleted');
      }

    })

    res.redirect(`/admin/editProduct/${productId}`)

  } catch (error) {
    console.log(error);


  }
}



module.exports = {
  products,
  addproductPage,
  addProduct,
  removeProduct,
  editProduct,
  updateProduct,
  removeImage
};
