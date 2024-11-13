const cancelOrderBtn = document.querySelectorAll('.cancelOrderBtn');

cancelOrderBtn.forEach((ele) => {
    ele.addEventListener('click', cancelOrder)
})

async function cancelOrder(event) {

    // stop a tag submission 
    event.preventDefault();

    await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Cancell order!"
    }).then(async (result) => {

        if (result.isConfirmed) {

            //asking the reson for cancellation 
            const { value: text } = await Swal.fire({
                input: "textarea",
                inputLabel: "Message",
                inputPlaceholder: "Type your message here...",
                inputAttributes: {
                    "aria-label": "Type your message here"
                },
                showCancelButton: true
            });
            if (text.trim()) {
            // Redirecting to the href of the a tag after confirmation
            window.location.href = event.target.closest('a').getAttribute('href').trim() + `&cancellationReason=${text}`
           
            
            await Swal.fire({
                title: "Cancelled!",
                text: "Order Cancelled.",
                icon: "success"
            });

            }


        }
    });
};




const ratingBtn = document.querySelectorAll('.ratingBtn');

ratingBtn.forEach((ele) => {
    ele.addEventListener('click', rateProduct)
})

let rating = 0

const myRating = document.getElementById('myRating')
myRating.addEventListener('change.coreui.rating', (event) => {

    rating = event.value
    console.log(event);

})


function rateProduct(event) {

    const orderId = event.target.closest('.mainCard').querySelector('.orderId').innerHTML
    const productId = event.target.closest('.mainCard').querySelector('.productId').getAttribute('productId')
    console.log(orderId, productId, rating);



    //call when submit button clicked
    const ratingSubmit = document.getElementById('ratingSubmit')
    ratingSubmit.addEventListener('click', async () => {

        const comment = document.getElementById('comment').value;

        const response = await fetch('/rateProduct', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ comment, productId, orderId, rating })
        });

        if (response.ok) {
            window.location.href = '/orders';
        } else {

            Swal.fire({
                title: "error!",
                text: "Something went wrong.",
                icon: "success"
            });

        }


    })

}

document.querySelectorAll('.orderReturnBtn').forEach((ele) => {
    ele.addEventListener('click', returnProduct)

})

async function returnProduct(event) {
    event.preventDefault()


    await Swal.fire({
        title: "Are you sure?",
        text: "are you sure want to return this product!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Confirm Return!"
    }).then(async (result) => {

        if (result.isConfirmed) {
            // Redirecting to the href of the a tag after confirmation
            window.location.href = event.target.closest('a').getAttribute('href');

            await Swal.fire({
                title: "Cancelled!",
                text: "Return Cancelled.",
                icon: "success"
            });
        }
    });


}