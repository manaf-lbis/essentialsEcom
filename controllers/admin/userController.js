const User = require('../../models/userSchema');


const getUsers = async (req,res)=>{

    try {
        const searchQuery = req.query.search ?? '';

        let currentPage = Number(req.query.pageReq) || 1 ;  //initially current page is 1, when clicking next/prev chage that as current 
       
        const limit = 5; //   total user/users per page

        const totalPage = Math.ceil(await User.countDocuments({isAdmin:false})/limit);

        currentPage =  currentPage+1 > totalPage ? totalPage:currentPage;

        // const pageReq = req.query.pagereq; //requesting current or previous page

        let skip = (currentPage-1)*5;

        

        // console.log(searchQuery);
        const userData = await User.find({
            isAdmin:false,
            $or:[
                {name:{$regex: '.*'+searchQuery+'.*',$options:'i'}},
                {email:{$regex: '.*'+searchQuery+'.*',$options:'i'}},
                {phone:{$regex: '.*'+searchQuery+'.*',$options:'i'}}
            ]
        }).skip(skip).limit(limit);
    


        res.render('admin/userManagement',{userData,searchQuery,currentPage,totalPage});


    } catch (error) {
        console.log(error);
        
    }
};

const blockUser = async (req,res)=>{
    try {
        const id = req.params.id;
        const userData = await User.updateOne({_id:id},{$set:{isBlocked:true}});
        res.redirect('/admin/usermanagement');

    } catch (error) {
        console.log(error);
        res.render('admin/pagenotFound')
    }
}


const unblockUser = async (req,res)=>{
    try {
        const id = req.params.id;
        const userData = await User.updateOne({_id:id},{$set:{isBlocked:false}});
        res.redirect('/admin/usermanagement');

    } catch (error) {
        console.log(error);
        res.render('admin/pagenotFound')
    }
}







module.exports ={
    getUsers,
    blockUser,
    unblockUser
} 