const User = require('../../models/userSchema');

const getUsers = async (req, res) => {
    try {

        const searchQuery = req.query.search ?? '';
        let currentPage = Number(req.query.pageReq) || 1;
        const limit = 10;

        const totalPage = Math.ceil(await User.countDocuments({ isAdmin: false }) / limit);

        currentPage = currentPage > totalPage ? totalPage : currentPage;
        currentPage = currentPage <= 0 ? 1 : currentPage;
        let skip = (currentPage - 1) * limit;

        const userData = await User.find({
            isAdmin: false,
            $or: [
                { name: { $regex: '.*' + searchQuery + '.*', $options: 'i' } },
                { email: { $regex: '.*' + searchQuery + '.*', $options: 'i' } },
                { phone: { $regex: '.*' + searchQuery + '.*', $options: 'i' } }
            ]
        }).skip(skip).limit(limit);

        res.render('admin/userManagement', { userData, searchQuery, currentPage, totalPage });

    } catch (error) {

        console.log(error);
        res.render('admin/pagenotFound')
    }
};

const blockUser = async (req, res) => {
    try {

        const id = req.params.id;

        await User.updateOne(
            { _id: id },
            { $set: { isBlocked: true } }
        );

        res.status(200).json({ message: 'User blocked successfully' });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
};

const unblockUser = async (req, res) => {
    try {

        const id = req.params.id;

        await User.updateOne(
            { _id: id },
            { $set: { isBlocked: false } }
        );

        res.status(200).json({ message: 'User unblocked successfully' });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
}

module.exports = {
    getUsers,
    blockUser,
    unblockUser,
}