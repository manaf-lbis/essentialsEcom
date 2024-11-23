const User = require('../../models/userSchema');

//list all users 
const getUsers = async (req,res)=>{
    try {
        //pagenation for user listing page
        const searchQuery = req.query.search ?? '';
        let currentPage = Number(req.query.pageReq) || 1 ;  //initially current page is 1, when clicking next/prev chage that as current 
        const limit = 5; //   total user/users per page

        const totalPage = Math.ceil(await User.countDocuments({isAdmin:false})/limit);

        currentPage =  currentPage+1 > totalPage ? totalPage:currentPage;
        let skip = (currentPage-1)*5;

        //find users matching with search query
        const userData = await User.find({
            isAdmin:false,
            $or:[
                {name:{$regex: '.*'+searchQuery+'.*',$options:'i'}},
                {email:{$regex: '.*'+searchQuery+'.*',$options:'i'}},
                {phone:{$regex: '.*'+searchQuery+'.*',$options:'i'}}
            ]
        }).skip(skip).limit(limit);

        //render admin user listing page 
        res.render('admin/userManagement',{userData,searchQuery,currentPage,totalPage});

    } catch (error) {
        //logging error and render error page
        console.log(error); 
        res.render('admin/pagenotFound')
    }
};

//block user
const blockUser = async (req,res)=>{
    try {
        //extract user id from requuest parameter
        const id = req.params.id;

        //set user status to blocked
        const userData = await User.updateOne(
            {_id:id},
            {$set:{isBlocked:true}}
        );

        //redirect to users listing page
        res.redirect('/admin/usermanagement');

    } catch (error) {
        //logging error and render error page
        console.log(error);
        res.render('admin/pagenotFound');
    }
};

//unblocking user
const unblockUser = async (req,res)=>{
    try {
        //extract user id from requuest parameter
        const id = req.params.id;

        //setting user status to unblocked
        await User.updateOne(
            {_id:id},
            {$set:{isBlocked:false}}
        );

        //redirect to users listing page
        res.redirect('/admin/usermanagement');

    } catch (error) {
        //logging error and render error page
        console.log(error);
        res.render('admin/pagenotFound')
    }
}


module.exports ={
    getUsers, // list all users
    blockUser, // blocking user
    unblockUser , // unblocking user
} 