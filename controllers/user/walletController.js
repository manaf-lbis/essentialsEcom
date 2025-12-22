const Wallet = require('../../models/walletSchema');
const User = require('../../models/userSchema');

function getUserIdFromSession(req) {
    return req.session?._id ?? req.session.passport?.user;
}

const getWallet = async (req, res) => {
    try {

        const userId = getUserIdFromSession(req);

        const wallet = await Wallet.findOne({ userId });

        const userData = await User.findOne({ _id: userId });

        let transactions = [];
        let totalPages = 0;
        let currentPage = 1;
        const limit = 10;

        if (wallet && wallet.transactions) {

            wallet.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

            currentPage = parseInt(req.query.page) || 1;
            const startIndex = (currentPage - 1) * limit;
            const endIndex = startIndex + limit;

            totalPages = Math.ceil(wallet.transactions.length / limit);
            transactions = wallet.transactions.slice(startIndex, endIndex);
        }

        res.render('user/wallet/wallet', {
            wallet,
            userData,
            transactions,
            currentPage,
            totalPages,
            activePage: 'walletLedger'
        });

    } catch (error) {

        console.log(error);
    };
};

const updateUserWallet = async (userId, amount, transationType, description, orderId = null) => {
    try {

        const walletExist = await Wallet.findOne({ userId });

        const transaction = {
            type: transationType,
            amount,
            description,
            orderId: orderId
        };

        if (walletExist) {

            if (transationType === 'credit') {

                await Wallet.updateOne(
                    { userId },
                    {
                        $inc: { balance: amount },
                        $push: { transactions: transaction }
                    }
                )
            } else {

                await Wallet.updateOne(
                    { userId },
                    {
                        $inc: { balance: -amount },
                        $push: { transactions: transaction }
                    }
                );
            };

        } else {

            const newWallet = new Wallet(
                { userId, balance: amount, transactions: [transaction] }
            )

            await newWallet.save();
        }

    } catch (error) {

        console.log(error);
    };

};

module.exports = {
    getWallet,
    updateUserWallet,
}