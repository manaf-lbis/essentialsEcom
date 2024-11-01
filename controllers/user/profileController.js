const User = require('../../models/userSchema');
const Address = require('../../models/addressSchema')
const bcrypt = require('bcrypt')

const profilePage = async (req, res) => {
    try {
        const _id = req.session?._id ?? req.session.passport?.user;

        const userData = await User.findOne({ _id });

        return res.render('user/profileSection/myprofile', { userData });
    } catch (error) {
        console.log(error);
        res.render('user/pagenotFound');
    }
};

const updateUser = async (req, res) => {
    try {
        const { name, dateOfBirth, gender, phone, _id } = req.body;

        const response = await User.updateOne(
            { _id },
            { $set: { name, dateOfBirth, gender, phone } }
        );

        res.status(200).json({ message: 'sucess' });

    } catch (error) {
        console.log(error);
        res.render('user/pagenotFound');
    }
};

const addressPage = async (req, res) => {
    try {

        const _id = req.session?._id ?? req.session.passport?.user;

        //checking is any address exist
        let addressDetails = await Address.findOne({ userId: _id });

        if (addressDetails) {
            addressDetails = addressDetails.address.filter((ele) => ele.isBlocked === false);
        } else {
            addressDetails = []
        }

        const userData = await User.findOne({ _id })

        res.render('user/profileSection/addressManagement', { addressDetails, userData });


    } catch (error) {
        console.log(error);
        res.render('user/pagenotFound');

    }
}


const addNewAddress = async (req, res) => {
    try {

        const { fullName, houseName, area, street, city, state, pincode, phone, defaultAddress,requestPage } = req.body;
        const _id = req.session?._id ?? req.session.passport?.user;

        //checking is any user address exixt in this particular id
        const result = await Address.findOne({ userId: _id })



        if (result) {

            // if the new address id default clear all previous default address
            if (defaultAddress) {
                await Address.updateMany({ userId: _id, 'address.defaultAddress': true }, { 'address.$.defaultAddress': false })
            }

            await Address.updateOne({ userId: _id }, { $push: { address: { fullName, houseName, area, street, city, state, pincode, phone, defaultAddress } } });
           
            
            // if the request from checkout page redirect to checkout page
            if(requestPage){
                return res.redirect('/checkout')

             }else{
                return res.status(201).redirect('/address')
             }

        } else {

            const address = new Address({ userId: _id, address: [{ fullName, houseName, area, street, city, state, pincode, phone, defaultAddress }] });
            await address.save();

            
            if(requestPage){
               return res.redirect('/checkout')
            }else{
                res.status(201).redirect('/address')
            }
            

        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ mesage: 'Something went wrong' })
    }
}



const removeAddress = async (req, res) => {

    try {
        const addressId = req.query._id;
        const { _id } = req.session;

        const result = await Address.updateOne(
            { 'address._id': addressId }, // Target the specific address by its _id
            { $set: { 'address.$.isBlocked': true } } // Use $ positional operator to update isBlocked
        );

        res.status(200).json({ message: 'Address sucessfully removed' })


    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'internal server error' })

    }
}


//requiring individual address data for edit
const addressDataForEdit = async (req, res) => {
    try {
        const userId = req.session?._id ?? req.session.passport?.user;
        const addressId = req.query.addressId;

        const addressData = await Address.findOne({ userId }, { address: { $elemMatch: { _id: addressId } } })


        res.status(200).json(addressData)


    } catch (error) {

        console.log(error);
        res.status(400).json({ Message: 'something went Wrong' })

    }
}

const updateAddress = async (req, res) => {
    try {

        const userId = req.session?._id ?? req.session.passport?.user;

        const { fullName, houseName, area, street, city, state, pincode, phone, defaultAddress, addressId, requestPage } = req.body;

        // checking address is exist 
        const addressExist = await Address.find({ userId, 'address._id': addressId });

        if (addressExist) {
            // the new address is set as default clear all defalut address
            if (defaultAddress) {
                await Address.updateMany({ userId, 'address.defaultAddress': true }, { 'address.$.defaultAddress': false })
            }

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
        }


           // if the request from checkout page redirect to checkout page
         if(requestPage){
            return res.redirect('/checkout')

         }else{
            return res.status(201).redirect('/address')

         }
      
    } catch (error) {
        console.log(error);
        res.render('user/pageNotFound')
    }

}

//reset Password

const resetPasswordPage = async (req,res)=>{
    try {

        const _id = req.session?._id ?? req.session.passport?.user;

        const userData = await User.findOne({ _id });
        res.render('user/profileSection/resetPassword',{userData});
        
    } catch (error) {

        console.log(error);
        res.render('user/pagenotFound');

    }
}

const resetPassword = async (req,res)=>{
    try {

        const _id = req.session?._id ?? req.session.passport?.user;

        const userData = await User.findOne({ _id });

        const {existingPassword,newPassword} = req.body;
        const {password} = userData;


        const isMatch = await bcrypt.compare(existingPassword,password);

       
        if(isMatch){

            const hashedNewPass = await bcrypt.hash(newPassword,10);

            await User.updateOne({_id},{$set:{password:hashedNewPass}});
            res.status(200).json({message:'password Updated Successfully'});
        }else{

            res.status(400).json({message:'password Not match'});
        }
        
        
    } catch (error) {

        console.log(error);
        res.status(500).redirect('user/pagenotFound');

    }
}








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
