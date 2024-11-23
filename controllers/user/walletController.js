const Wallet = require('../../models/walletSchema')


// getting user id from session 
function getUserIdFromSession(req) {
    return req.session?._id ?? req.session.passport?.user;
}


// loading wallet details
const getWallet = async (req, res) => {
    try {
        // extract userid from session  
        const userId = getUserIdFromSession(req);

        // find the wallet of user
        const wallet = await Wallet.findOne({ userId });

        // sort the wallet based on transation date 
        if (wallet && wallet.transactions) {
            wallet.transactions.sort((a, b) =>  new Date(b.date) - new Date(a.date)) ;
        }

        // render wallet page with wallet data 
        res.render('user/wallet/wallet', { wallet });

    } catch (error) {
        // logging error 
        console.log(error);
    };
};


// updating new transation in wallet ( user id, amount , type('credit'/debit), description )
const updateUserWallet = async (userId, amount, transationType, description) => { 
    try {
        // checking user have a wallet or not
        const walletExist = await Wallet.findOne({ userId });

        if (walletExist) {

            if (transationType === 'credit') {
                // updating wallet
                await Wallet.updateOne(
                    { userId },
                    {
                        $inc: { balance: amount }, //updating bal
                        $push: { transactions: { type: transationType, amount, description } } //add new transation
                    }
                )
            } else {
                // updating wallet
                await Wallet.updateOne(
                    { userId },
                    {
                        $inc: { balance: -amount }, //updating bal
                        $push: { transactions: { type: transationType, amount, description } } //add new transation
                    }
                );
            };
            
        } else {
            // if no wallet , creating new wallet object
            const newWallet = new Wallet(
                { userId, balance: amount, transactions: [{ type: transationType, amount, description }] }
            )
            
            //saving new wallet with new transation
            await newWallet.save();
        }


    } catch (error) {
        // logging error
        console.log(error);
    };

};

module.exports = {
    getWallet,
    updateUserWallet,
}