const User = require('../../models/userSchema');
const Address = require('../../models/addressSchema')
const bcrypt = require('bcryptjs')

//profile view
const profilePage = async (req, res) => {
    try {
        // Extract the user ID from the session object
        const _id = req.session?._id ?? req.session.passport?.user;

        // Retrieve user data from the database based on the extracted ID
        const userData = await User.findOne({ _id });

        // render the user's profile page with the retrieved data
        return res.render('user/profileSection/myprofile', { userData });

    } catch (error) {
        // Log the error
        console.log(error);

        // Render a 'Page Not Found' 
        res.render('user/pagenotFound');
    };
};


// updating user details
const updateUser = async (req, res) => {
    try {
        // Destructure user details and ID from the request body
        const { name, dateOfBirth, gender, phone, _id } = req.body;

        // Update the user document with the provided details
        const response = await User.updateOne(
            { _id },
            { $set: { name, dateOfBirth, gender, phone } }
        );

        // Respond client with a success message
        res.status(200).json({ message: 'sucess' });

    } catch (error) {
        // logging error and render error page
        console.log(error);
        res.render('user/pagenotFound');
    };
};


// loading address page 
const addressPage = async (req, res) => {
    try {
        // Extract the user ID from the session object
        const _id = req.session?._id ?? req.session.passport?.user;

        //checking is any address exist
        let addressDetails = await Address.findOne({ userId: _id });

        if (addressDetails) {
            // filter the available address
            addressDetails = addressDetails.address.filter((ele) => ele.isBlocked === false);

        } else {
            // else set an expty array
            addressDetails = []
        }

        // retrieve user data database
        const userData = await User.findOne({ _id })

        // render address section with retrieved data
        res.render('user/profileSection/addressManagement', { addressDetails, userData });


    } catch (error) {
        //logging error and render error page
        console.log(error);
        res.render('user/pagenotFound');
    };
};


//add new address
const addNewAddress = async (req, res) => {
    try {
        // destructure address details from the request body
        const { fullName, houseName, area, street, city, state, pincode, phone, defaultAddress, requestPage } = req.body;

        // extract the user ID from the session object
        const _id = req.session?._id ?? req.session.passport?.user;

        //checking is any user address exixt in this particular id
        const result = await Address.findOne({ userId: _id })

        if (result) {
            // if the new address id default clear all previous default address
            if (defaultAddress) {
                await Address.updateMany(
                    { userId: _id, 'address.defaultAddress': true },
                    { 'address.$.defaultAddress': false }
                )
            }

            // update address with destructred data
            await Address.updateOne(
                { userId: _id },
                { $push: { address: { fullName, houseName, area, street, city, state, pincode, phone, defaultAddress } } }
            );


            // if the request from checkout page redirect to checkout page 
            if (requestPage) {
                return res.redirect('/checkout')
            } else {
                return res.status(201).redirect('/address')
            };



        } else {
            //if no address exist , creating new address object using request data
            const address = new Address(
                { userId: _id, address: [{ fullName, houseName, area, street, city, state, pincode, phone, defaultAddress }] }
            );

            //saving new address object
            await address.save();

            // if the request from checkout page redirect to checkout page 
            if (requestPage) {
                return res.redirect('/checkout')
            } else {
                res.status(201).redirect('/address')
            };
        };

    } catch (error) {
        //logging error and respond with error message
        console.log(error);
        res.status(500).json({ mesage: 'Something went wrong' })
    };
};



const removeAddress = async (req, res) => {
    try {

        // extract the address ID from the query
        const addressId = req.query._id;

        // extract the user ID from the session
        const { _id } = req.session;

        // perfoming soft delete
        const result = await Address.updateOne(
            { 'address._id': addressId }, // Target the specific address by its _id
            { $set: { 'address.$.isBlocked': true } } // Use $ positional operator to update isBlocked
        );

        // respond with success message
        res.status(200).json({ message: 'Address sucessfully removed' });


    } catch (error) {

        // log  error and respond with an error message
        console.log(error);
        res.status(500).json({ message: 'internal server error' });
    };
};


//requiring individual address data for edit
const addressDataForEdit = async (req, res) => {
    try {
        // extract user ID from the session
        const userId = req.session?._id ?? req.session.passport?.user;

        // extract address ID from the query
        const addressId = req.query.addressId;

        // find the specfic address 
        const addressData = await Address.findOne(
            { userId },
            { address: { $elemMatch: { _id: addressId } } }
        );

        // Respond with the address details
        res.status(200).json(addressData)

    } catch (error) {
        //loggig error and respond with an error message
        console.log(error);
        res.status(400).json({ Message: 'something went Wrong' })
    };
};


// Update address details
const updateAddress = async (req, res) => {
    try {
        // Extract user ID from the session
        const userId = req.session?._id ?? req.session.passport?.user;

        // Destructure address fields from the request body
        const { fullName, houseName,
            area, street, city,
            state, pincode, phone,
            defaultAddress, addressId,
            requestPage } = req.body;

        // checking address is exist 
        const addressExist = await Address.find({ userId, 'address._id': addressId });

        if (addressExist) {

            // the new address is set as default clear all defalut address
            if (defaultAddress) {

                await Address.updateMany(
                    { userId, 'address.defaultAddress': true },
                    { 'address.$.defaultAddress': false }
                )
            }

            // Update the specific address details
            await Address.updateOne({ userId, 'address._id': addressId },
                {
                    $set: {
                        'address.$.fullName': fullName,
                        'address.$.houseName': houseName,
                        'address.$.area': area,
                        'address.$.street': street,
                        'address.$.city': city,
                        'address.$.state': state,
                        'address.$.pincode': pincode,
                        'address.$.phone': phone,
                        'address.$.defaultAddress': defaultAddress
                    }
                }
            )
        };


        // if the request from checkout page redirect to checkout page
        if (requestPage) {
            return res.redirect('/checkout')
        } else {
            return res.status(201).redirect('/address')
        };

    } catch (error) {
        // Log errors and render the error page
        console.log(error);
        res.render('user/pageNotFound')
    };
};


//reset Password
const resetPasswordPage = async (req, res) => {
    try {
        // extract user ID from the session
        const _id = req.session?._id ?? req.session.passport?.user;

        // fetch user data for rendering the page
        const userData = await User.findOne({ _id });

        // render the reset password page with user data
        res.render('user/profileSection/resetPassword', { userData });

    } catch (error) {
        // Log errors and render the error page
        console.log(error);
        res.render('user/pagenotFound');
    };
};



const resetPassword = async (req, res) => {
    try {
        // extract user ID from the session
        const _id = req.session?._id ?? req.session.passport?.user;

        // fetch user data for password validation
        const userData = await User.findOne({ _id });

        // destructure existing and new passwords from the request body
        const { existingPassword, newPassword } = req.body;
        const { password } = userData;

        // compare the entered with existing
        const isMatch = await bcrypt.compare(existingPassword, password);


        if (isMatch) {
            // updating new password in db after hashing
            const hashedNewPass = await bcrypt.hash(newPassword, 10);
            await User.updateOne({ _id },
                { $set: { password: hashedNewPass } }
            );

            // respond with success messag
            res.status(200).json({ message: 'password Updated Successfully' });

        } else {

            // Respond with failure message
            res.status(400).json({ message: 'password Not match' });
        };


    } catch (error) {

        // Log errors and render the error page
        console.log(error);
        res.status(500).redirect('user/pagenotFound');
    };
};





module.exports = {
    profilePage,
    updateUser,
    addressPage,
    addNewAddress,
    removeAddress,
    addressDataForEdit,
    updateAddress,
    resetPasswordPage,
    resetPassword

};
