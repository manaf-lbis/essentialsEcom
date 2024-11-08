
const couponDeleteBtn = document.querySelectorAll('.couponDeleteBtn');

couponDeleteBtn.forEach((ele)=>{
    ele.addEventListener('click',removecoupon)
})

async function removecoupon(event){
    event.preventDefault()
   const href = event.target.closest('a').getAttribute('href');

   await Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!"
  }).then((result) => {

    if (result.isConfirmed) {
        sendeServerReq(href);
    }

  });

} 

async function sendeServerReq(href){

   const response =  await fetch(href,{
        method:'GET'
    });

    if(response.ok){
        await Swal.fire({
            title: "Deleted!",
            text: "Your file has been deleted.",
            icon: "success"
        });
        window.location.href = '/admin/coupons'

    }

}





