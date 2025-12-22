const User = require('../../models/userSchema');

//list all users 
const getUsers = async (req, res) => {
    try {
        //pagenation for user listing page
        const searchQuery = req.query.search ?? '';
        let currentPage = Number(req.query.pageReq) || 1;  //initially current page is 1, when clicking next/prev chage that as current 
        const limit = 10; //   total user/users per page

        const totalPage = Math.ceil(await User.countDocuments({ isAdmin: false }) / limit);

        currentPage = currentPage > totalPage ? totalPage : currentPage;
        currentPage = currentPage <= 0 ? 1 : currentPage;
        let skip = (currentPage - 1) * limit;

        //find users matching with search query
        const userData = await User.find({
            isAdmin: false,
            $or: [
                { name: { $regex: '.*' + searchQuery + '.*', $options: 'i' } },
                { email: { $regex: '.*' + searchQuery + '.*', $options: 'i' } },
                { phone: { $regex: '.*' + searchQuery + '.*', $options: 'i' } }
            ]
        }).skip(skip).limit(limit);

        //render admin user listing page 
        res.render('admin/userManagement', { userData, searchQuery, currentPage, totalPage });

    } catch (error) {
        //logging error and render error page
        console.log(error);
        res.render('admin/pagenotFound')
    }
};

//block user
const blockUser = async (req, res) => {
    try {
        //extract user id from requuest parameter
        const id = req.params.id;

        //set user status to blocked
        await User.updateOne(
            { _id: id },
            { $set: { isBlocked: true } }
        );

        //sending success response
        res.status(200).json({ message: 'User blocked successfully' });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
};

//unblocking user
const unblockUser = async (req, res) => {
    try {
        //extract user id from requuest parameter
        const id = req.params.id;

        //setting user status to unblocked
        await User.updateOne(
            { _id: id },
            { $set: { isBlocked: false } }
        );

        //sending success response
        res.status(200).json({ message: 'User unblocked successfully' });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
}


module.exports = {
    getUsers, // list all users
    blockUser, // blocking user
    unblockUser, // unblocking user
} 