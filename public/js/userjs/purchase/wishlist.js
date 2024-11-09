
//add to cart logic
const cartBtn = document.querySelectorAll('.addtoCartBtn');


cartBtn.forEach((ele) => {
    ele.addEventListener('click', getValues)
});


function getValues(event) {
    const productId = event.target.closest('div').getAttribute('productId')
    addToCart(1, productId);
}


async function addToCart(quantity, _id) {

    const response = await fetch('/addToCart', {
        method: 'POST', headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity, _id })
    });

    if (response.ok) {

        Swal.fire({
            position: "top-end",
            icon: "success",
            title: "Added to Cart",
            showConfirmButton: false,
            timer: 1000,
            width: '200px',
            padding: '0.2rem',
            backdrop: false
        });


    } else {
        Swal.fire({
            position: "top-end",
            icon: "error",
            title: "Adding Failed",
            showConfirmButton: false,
            timer: 1000,
            width: '200px',
            padding: '0.2rem',
            backdrop: false
        });
    }
}


//Item remove from wishlist

const removeFromWishlistBtn = document.querySelectorAll('.removeFromWishlist');


removeFromWishlistBtn.forEach((ele) => {
    ele.addEventListener('click', removeFromWishlist)
});

async function removeFromWishlist(event) {

    const productId = event.target.closest('div').getAttribute('productId');

    Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!"
    }).then(async (result) => {
        if (result.isConfirmed) {

            const response = await fetch(`/removeFromWishlist/?productId=${productId}`, {
                method: 'get',
                headers: {
                    'content-type': 'application/json'
                }
            });

            if (response.ok) {

                await Swal.fire({
                    position: "top-end",
                    icon: "success",
                    title: "Item removed",
                    showConfirmButton: false,
                    timer: 1000,
                    width: '200px',
                    padding: '0.2rem',
                    backdrop: false
                });

                console.log('success');


                window.location.href = '/wishlist';

            }
        }
    });


}