const userController = require('../../controllers/user/userController')
const User = require('../../models/userSchema');
const bcrypt = require('bcryptjs');




// random otp  generating
const otpGenerator = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

//check any user exist with this email 
const verifyEmail = async (req, res) => {
    try {
        //extracting mail from req body 
        const email = req.body.email

        // find user with requested email
        const result = await User.findOne({ email });


        if (result) {
            // generating Random Otp
            const otp = otpGenerator();

            //sending otp using node mailer
            const sentStatus = await userController.sendverification(email, otp);

            //email sended
            if (sentStatus.accepted.length > 0) {
                req.session.otp = otp; // saving otp to the session
                req.session.email = email;
                console.log(`recovery otp First :${otp}`);

                //respond to the client 
                res.status(200).json({ message: 'email sented sucessfully' })
            };

        } else {
            res.status(400).json({ message: 'invalid Email' })
        }

    } catch (error) {
        //logging error and respond to client
        console.log(error);
        res.status(500).json({ message: 'something went wrong' })

    };

};

//verifying entered otp 
const verifyOtp = (req, res) => {
    const userOtp = req.body.userOtp;

    //verifiying entered otp with session otp
    if (userOtp == req?.session?.otp) {
        res.status(200).json({ message: 'otp verified Sucessfull' });
    } else {
        res.status(400).json({ message: 'bad credentials' });
    }
}

//setting new password 
const changePassword = async (req, res) => {
    try {
        const { password } = req.body;
        const { email } = req.session;

        // hashing password
        const hashedPassword = await bcrypt.hash(password, 10)

        //update user with new password
        await User.updateOne(
            { email },
            { $set: { password: hashedPassword } }
        );

        res.status(200).json({ message: 'passsword Updated Sucessfully' })

    } catch (error) {
        ///logging error and respond to clint side
        console.log(error);
        res.status(500).json({ message: 'server error' })
    };
};


// rendering password changing page
const forgotPassword = (req, res) => {
    res.render('user/forgotPassword')
}




module.exports = {
    verifyEmail, //check any user exist with this email 
    forgotPassword, // rendering password changing page
    verifyOtp, //verifying entered otp 
    changePassword, //setting new password 
}

