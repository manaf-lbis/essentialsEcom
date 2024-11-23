const User = require('../../models/userSchema');
const Referral = require('../../models/refferalSchema');
const walletController = require('../../controllers/user/walletController')

// getting user id from session 
function getUserIdFromSession(req) {
    return req.session?._id ?? req.session.passport?.user;
}

//refferal page rendering 
const referralsPage = async (req, res) => {
    try {
         //extract user id from session 
        const _id = getUserIdFromSession(req);
        const userData = await User.findOne({ _id });

        //finding reffred user and populate their name
        const referrals = await Referral.find({referrer:_id}).populate('referredUser','name');

        //render referral page 
        res.render('user/profileSection/referralPage', { userData, referrals});

    } catch (error) {
        //logging error and render errror page 
        console.log(error);
        res.render('user/pageNotFound');
    }
}

//checking referral code while applying
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

//create new refferal in reffered user and adding refferral reward
const createRefferal = async (referralCode, newUserId) =>{
    try {
        //find refferal code 
        const refferedUserId = await User.findOne(
            {referralCode},
            {_id:1}
        );

        //create new referral object 
        const referral =  new Referral({
            referrer:refferedUserId,
            referredUser:newUserId,
            reward:150 
        });

        //saving new referral in db 
        await referral.save()

        //adding refferel reward to reffered person 
        await walletController.updateUserWallet(refferedUserId,150,'credit','Referal Reward')

        
    } catch (error) {
        console.log(error);
        
    };
};


module.exports = {
    referralsPage, //refferal page rendering 
    checkReferralCode, //checking referral code while applying
    createRefferal, //create new refferal in reffered user and adding refferral reward
}