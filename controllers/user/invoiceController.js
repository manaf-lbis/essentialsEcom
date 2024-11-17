const { renderFile } = require("ejs");
const Order = require('../../models/orderSchema')
const path = require('path')
const ejs = require('ejs');

const generateInvoice = async (req, res) => {

    try {

        const { orderId } = req.query;

        const orders = await Order.findOne({ orderId }).populate('orderItems.productId')


        const invoicePath = path.join(__dirname, '../../views/user/invoice/invoice.ejs');
        console.log(await ejs.renderFile(invoicePath, {orders}));


        
         

    } catch (error) {

        console.log(error);

    }

};


module.exports = {
    generateInvoice
}