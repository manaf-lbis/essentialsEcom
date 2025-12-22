const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const path = require('path');
const fs = require('fs');

const products = async (req, res) => {
  try {

    const searchQuery = req.query.search ?? '';
    let currentPage = Number(req.query.pageReq) || 1;
    const limit = 10;

    const count = Math.ceil(await Product.countDocuments({
      $or: [
        { 'productName': { $regex: '.*' + searchQuery + '.*', $options: 'i' } },
        { 'brand': { $regex: '.*' + searchQuery + '.*', $options: 'i' } }
      ]
    }) / limit);

    currentPage = currentPage >= count ? count : currentPage;
    currentPage = currentPage <= 0 ? 1 : currentPage
    const skip = limit * (currentPage - 1);

    const products = await Product.find({
      $or: [
        { 'productName': { $regex: '.*' + searchQuery + '.*', $options: 'i' } },
        { 'brand': { $regex: '.*' + searchQuery + '.*', $options: 'i' } }

      ]
    }).skip(skip).limit(limit);

    res.render('admin/productmanagement', { products, currentPage, totalPages: count, searchQuery });

  } catch (error) {

    console.log(error);
    return res.status(500).redirect('pagenotFound');
  }
};

const addproductPage = async (req, res) => {
  try {

    const category = await Category.find();
    res.render('admin/addproduct', { category, message: '' });

  } catch (error) {

    console.log(error);
    return res.status(500).redirect('pagenotFound');
  }
};

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

    const product = new Product({
      productName, brand, color, size, category, regularPrice,
      sellingPrice, material, description, quantity,
      productImage: imagesArray
    });

    await product.save();

    return res.status(200).json({ success: true, message: 'Product added successfully' });

  } catch (error) {

    console.error('Error:', error);
    return res.status(500).redirect('pagenotFound');
  }
};

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

const editProduct = async (req, res) => {
  try {

    const _id = req.params.id;

    const dbResult = await Product.findOne({ _id });

    res.render('admin/editproduct', { dbResult })

  } catch (error) {

    console.log(error);
    return res.status(500).redirect('pagenotFound');
  }
};

const updateProduct = async (req, res) => {
  try {

    const { productName, brand, color, size, quantity,
      regularPrice, sellingPrice, material, description, _id, status
    } = req.body;

    const imagesArray = req.files.map(file => `/uploads/${file.filename}`);

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

    res.status(200).json({ message: 'sucessfully updated' })

  } catch (error) {

    console.log(error);
    return res.status(500).redirect('pagenotFound');
  }
};

const removeImage = async (req, res) => {
  try {
    const { productId, image } = req.body;

    await Product.updateOne(
      { _id: productId },
      { $pull: { productImage: image } }
    );

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
  products,
  addproductPage,
  addProduct,
  editProduct,
  updateProduct,
  removeImage,
  blockProduct,
  unblockProduct,
};
