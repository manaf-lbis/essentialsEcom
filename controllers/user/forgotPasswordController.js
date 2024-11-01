const userController = require('../../controllers/user/userController')
const User = require('../../models/userSchema');
const bcrypt = require('bcrypt');




// <====random otp  generating=====>
const otpGenerator = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};


const verifyEmail = async (req, res) => {
    try {

        const email = req.body.email
        const result = await User.findOne({ email });

        if (result) {

            // generating Random Otp
            const otp = otpGenerator();

            //sending otp
            const sentStatus = await userController.sendverification(email, otp);

            if (sentStatus.accepted.length > 0) {
                req.session.otp = otp;
                req.session.email = email;
                console.log(`recovery otp First :${otp}`);
                
                res.status(200).json({ message: 'email sented sucessfully' })
            }


        } else {
            res.status(400).json({ message: 'invalid Email' })
        }

    } catch (error) {

        console.log(error);
        res.status(400).json({ message: 'invalid Email' })

    }

}

const verifyOtp = (req,res)=>{
   const userOtp =  req.body.userOtp;

   if(userOtp == req.session.otp){
    res.status(200).json({message:'otp verified Sucessfull'});
   }else{
    res.status(400).json({message:'bad credentials'});
   }
}


const changePassword= async(req,res)=>{

    try {
        const {password} = req.body;
        const {email} = req.session;

        // hashing password
        const hashedPassword = await  bcrypt.hash(password,10)

        const dbResult =  await User.updateOne({email},{$set:{password:hashedPassword}});

        res.status(200).json({message:'passsword Updated Sucessfully'})

    } catch (error) {
        console.log(err);
        res.status(500).json({message:'server error'})
    }

    
   

}


// rendering password changing page
const forgotPassword = (req, res) => {
    res.render('user/forgotPassword')
}




module.exports = {
    verifyEmail,
    forgotPassword,
    verifyOtp,
    changePassword,
}

