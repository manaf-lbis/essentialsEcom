const Wallet = require('../../models/walletSchema');
const User = require('../../models/userSchema');


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

        // fetch user data
        const userData = await User.findOne({ _id: userId });

        let transactions = [];
        let totalPages = 0;
        let currentPage = 1;
        const limit = 10; // Items per page

        // sort the wallet based on transation date 
        if (wallet && wallet.transactions) {
            // Sort by date descending
            wallet.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Pagination Logic
            currentPage = parseInt(req.query.page) || 1;
            const startIndex = (currentPage - 1) * limit;
            const endIndex = startIndex + limit;

            totalPages = Math.ceil(wallet.transactions.length / limit);
            transactions = wallet.transactions.slice(startIndex, endIndex);
        }

        // render wallet page with wallet data and pagination info
        res.render('user/wallet/wallet', {
            wallet,
            userData,
            transactions,
            currentPage,
            totalPages,
            activePage: 'walletLedger'
        });

    } catch (error) {
        // logging error 
        console.log(error);
    };
};


// updating new transation in wallet ( user id, amount , type('credit'/debit), description, orderId )
const updateUserWallet = async (userId, amount, transationType, description, orderId = null) => {
    try {
        // checking user have a wallet or not
        const walletExist = await Wallet.findOne({ userId });

        // Create transaction object
        const transaction = {
            type: transationType,
            amount,
            description,
            orderId: orderId // Add orderId reference
        };

        if (walletExist) {

            if (transationType === 'credit') {
                // updating wallet
                await Wallet.updateOne(
                    { userId },
                    {
                        $inc: { balance: amount }, //updating bal
                        $push: { transactions: transaction } //add new transation
                    }
                )
            } else {
                // updating wallet
                await Wallet.updateOne(
                    { userId },
                    {
                        $inc: { balance: -amount }, //updating bal
                        $push: { transactions: transaction } //add new transation
                    }
                );
            };

        } else {
            // if no wallet , creating new wallet object
            const newWallet = new Wallet(
                { userId, balance: amount, transactions: [transaction] }
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