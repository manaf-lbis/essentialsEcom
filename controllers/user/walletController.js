const Wallet = require('../../models/walletSchema')


// getting user id from session 
function getUserIdFromSession(req) {
    return req.session?._id ?? req.session.passport?.user;
}


const getWallet = async (req, res) => {
    try {
        const userId = getUserIdFromSession(req)

        const wallet = await Wallet.findOne({ userId })

        res.render('user/wallet/wallet', { wallet })

    } catch (error) {
        console.log(error);


    }
}



const updateUserWallet = async (userId, amount, transationType, description) => {
    try {

        const walletExist = await Wallet.findOne({ userId });

        if (walletExist) {

            if (transationType === 'credit') {

                await Wallet.updateOne(
                    { userId },
                    {
                        $inc: { balance: amount }, //updating bal
                        $push: { transactions: { type: transationType, amount, description } } //add new transation
                    }
                )
            } else {

                await Wallet.updateOne(
                    { userId },
                    {
                        $inc: { balance: -amount }, //updating bal
                        $push: { transactions: { type: transationType, amount, description } } //add new transation
                    }
                )

            }


        } else {
            const newWallet = new Wallet(
                { userId, balance: amount, transactions: [{ type: transationType, amount, description }] }
            )
            await newWallet.save();
        }


    } catch (error) {
        console.log(error);


    }

}

module.exports = {
    getWallet,
    updateUserWallet,
}