const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const path = require('path');
const fs = require('fs');

//products listing page
const products = async (req, res) => {
  try {
    //paroduct page pagenation
    const searchQuery = req.query.search ?? '';
    let currentPage = Number(req.query.pageReq) || 1;
    const limit = 10;

    //count products for page nation
    const count = Math.ceil(await Product.countDocuments({
      $or: [
        { 'productName': { $regex: '.*' + searchQuery + '.*', $options: 'i' } },
        { 'brand': { $regex: '.*' + searchQuery + '.*', $options: 'i' } }
      ]
    }) / limit);

    currentPage = currentPage >= count ? count : currentPage;
    currentPage = currentPage <= 0 ? 1 : currentPage
    const skip = limit * (currentPage - 1);

    //find the product on search query
    const products = await Product.find({
      $or: [
        { 'productName': { $regex: '.*' + searchQuery + '.*', $options: 'i' } },
        { 'brand': { $regex: '.*' + searchQuery + '.*', $options: 'i' } }

      ]
    }).skip(skip).limit(limit);

    //render product listing page
    res.render('admin/productmanagement', { products, currentPage, totalPages: count, searchQuery });


  } catch (error) {
    //logging error and render error page
    console.log(error);
    return res.status(500).redirect('pagenotFound');
  }
};


//add product page 
const addproductPage = async (req, res) => {
  try {
    //fetch categorys for category selection in adding page
    const category = await Category.find();
    res.render('admin/addproduct', { category, message: '' });

  } catch (error) {
    //logging error and render error page
    console.log(error);
    return res.status(500).redirect('pagenotFound');
  }
};


//new product submission 
const addProduct = async (req, res) => {
  try {
    //server side vaidation on image file uploads
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded.' });
    }

    //extracting product details from req body
    const {
      productName, brand, color, size, category, regularPrice,
      sellingPrice, material, description, quantity
    } = req.body;

    //changing name of image file
    const imagesArray = req.files.map(file => `/uploads/${file.filename}`);

    // Create a new product object
    const product = new Product({
      productName, brand, color, size, category, regularPrice,
      sellingPrice, material, description, quantity,
      productImage: imagesArray
    });

    // Save new product object on db 
    await product.save();

    //respond with sucess message
    return res.status(200).json({ success: true, message: 'Product added successfully' });

  } catch (error) {
    //logging error and render error page
    console.error('Error:', error);
    return res.status(500).redirect('pagenotFound');
  }
};


//soft delete on product (Block)
const blockProduct = async (req, res) => {
  try {
    const _id = req.params.id;
    await Product.updateOne({ _id }, { isBlocked: true });
    return res.status(200).json({ success: true, message: 'Product blocked successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error blocking product' });
  }
};

//restore product (Unblock)
const unblockProduct = async (req, res) => {
  try {
    const _id = req.params.id;
    await Product.updateOne({ _id }, { isBlocked: false });
    return res.status(200).json({ success: true, message: 'Product unblocked successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Error unblocking product' });
  }
};


//edit request for a product
const editProduct = async (req, res) => {
  try {
    //extract product id for request params
    const _id = req.params.id;

    //fetching product details from databse
    const dbResult = await Product.findOne({ _id });

    //render the edit page with collected data
    res.render('admin/editproduct', { dbResult })

  } catch (error) {
    //logging error and redirect to error page
    console.log(error);
    return res.status(500).redirect('pagenotFound');
  }
};


// update edit to database
const updateProduct = async (req, res) => {
  try {
    //extracting updated product details from req body
    const { productName, brand, color, size, quantity,
      regularPrice, sellingPrice, material, description, _id, status
    } = req.body;

    //changing product image name 
    const imagesArray = req.files.map(file => `/uploads/${file.filename}`);

    // updating database with updated product details
    await Product.updateOne({ _id },
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

    //sending sucess response to client side
    res.status(200).json({ message: 'sucessfully updated' })

  } catch (error) {
    //logging error and redirect to error page
    console.log(error);
    return res.status(500).redirect('pagenotFound');
  }
};


//deleting the product image
const removeImage = async (req, res) => {
  try {
    const { productId, image } = req.body; // Changed to body for POST/DELETE usually, but let's check how it's called
    // Wait, AJAX usually sends JSON body.

    //remove matched image address from database
    await Product.updateOne(
      { _id: productId },
      { $pull: { productImage: image } }
    );

    //removing matched image from uploads directory
    const filePath = path.join(__dirname, '../../public', image);
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (error) => {
        if (error) console.log(error);
        else console.log('image deleted');
      });
    }

    return res.json({ success: true, message: 'Image removed successfully' });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};



module.exports = {
  products, //products listing page
  addproductPage, //add product page 
  addProduct, //new product submission 
  editProduct, //edit request for a product
  updateProduct, // update edit to database
  removeImage, //deleting the product image
  blockProduct, //soft delete (Block)
  unblockProduct, //restore (Unblock)
};
