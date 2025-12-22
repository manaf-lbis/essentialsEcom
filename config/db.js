const mongoose = require('mongoose');
const env = require('dotenv').config();

const connectDB = async () => {
  try {

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Data Base connected sucessfully ');

  } catch (error) {
    console.error('Error while connecting DB :', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
