const cancelOrderBtn = document.getElementById('cancelOrderBtn');

if(cancelOrderBtn){
    cancelOrderBtn.addEventListener('click', (event) => {

        // stop a tag submission 
        event.preventDefault();

        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        }).then((result) => {

            if (result.isConfirmed) {
                // Redirecting to the href of the a tag after confirmation
                window.location.href = cancelOrderBtn.href;
                
                Swal.fire({
                    title: "Deleted!",
                    text: "Your file has been deleted.",
                    icon: "success"
                });
            }
        });
    });

}



const ratingBtn = document.querySelectorAll('.ratingBtn');

ratingBtn.forEach((ele)=>{
    ele.addEventListener('click',rateProduct)
})

let rating = 0

const myRating = document.getElementById('myRating')
myRating.addEventListener('change.coreui.rating', (event) => {
  
    rating = event.value
    console.log(event);
    
})


function rateProduct(event){

   const orderId = event.target.closest('.mainCard').querySelector('.orderId').innerHTML
   const productId = event.target.closest('.mainCard').querySelector('.productId').getAttribute('productId')
   console.log(orderId,productId,rating);



   //call when submit button clicked
   const ratingSubmit = document.getElementById('ratingSubmit')
   ratingSubmit.addEventListener('click', async ()=>{

        const comment = document.getElementById('comment').value;

        const response = await fetch('/rateProduct',{
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body:JSON.stringify({comment,productId,orderId,rating})
        });

       if(response.ok){
        window.location.href = '/orders'
       }else{

        Swal.fire({
            title: "error!",
            text: "Something went wrong.",
            icon: "success"
        });

       }
        

   })

}

