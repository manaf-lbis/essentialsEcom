
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
        SuccessToast("Added to Cart");
    } else {
        ErrorToast("Adding Failed");
    }
}


//Item remove from wishlist

const removeFromWishlistBtn = document.querySelectorAll('.removeFromWishlist');


removeFromWishlistBtn.forEach((ele) => {
    ele.addEventListener('click', removeFromWishlist)
});

async function removeFromWishlist(event) {

    const productId = event.target.closest('div').getAttribute('productId');

    const result = await ConfirmAction(
        "Are you sure?",
        "You won't be able to revert this!",
        "Yes, remove it!"
    );

    if (result.isConfirmed) {
        const response = await fetch(`/removeFromWishlist/?productId=${productId}`, {
            method: 'get',
            headers: { 'content-type': 'application/json' }
        });

        if (response.ok) {
            SuccessToast("Item removed");
            setTimeout(() => {
                window.location.href = '/wishlist';
            }, 1000);
        }
    }
}

