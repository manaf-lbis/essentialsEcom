const User = require('../../models/userSchema');
const Referral = require('../../models/refferalSchema');
const walletController = require('../../controllers/user/walletController')

// getting user id from session 
function getUserIdFromSession(req) {
    return req.session?._id ?? req.session.passport?.user;
}


const referralsPage = async (req, res) => {
    try {

        const _id = getUserIdFromSession(req);
        const userData = await User.findOne({ _id });

        const referrals = await Referral.find({referrer:_id}).populate('referredUser','name');

        res.render('user/profileSection/referralPage', { userData, referrals});

    } catch (error) {

        console.log(error);
    }
}


const checkReferralCode = async (req, res) => {
    try {
        const { referralCode } = req.query;
        const codeExist = await User.findOne({ referralCode });

        if (!codeExist) {
            res.status(400).json({ message: 'invalid referral code' })
        } else {
            res.status(200).json({ message: 'code verified Sucess' })
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'iSomething went wrong' })
    }
}

const createRefferal = async (referralCode, newUserId) =>{
    try {
        const refferedUserId = await User.findOne({referralCode},{_id:1});

        const referral =  new Referral({
            referrer:refferedUserId,
            referredUser:newUserId,
            reward:150
        });

        await referral.save()

        await walletController.updateUserWallet(refferedUserId,150,'credit','Referal Reward')

        
    } catch (error) {
        console.log(error);
        
        
    }


}


module.exports = {
    referralsPage,
    checkReferralCode,
    createRefferal
}