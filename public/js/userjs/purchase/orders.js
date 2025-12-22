const cancelOrderBtn = document.querySelectorAll('.cancelOrderBtn');

cancelOrderBtn.forEach((ele) => {
    ele.addEventListener('click', cancelOrder)
})

async function cancelOrder(event) {
    event.preventDefault();

    const result = await ConfirmAction(
        "Are you sure?",
        "You won't be able to revert this!",
        "Confirm Cancellation!"
    );

    if (result.isConfirmed) {
        const { value: text } = await Swal.fire({
            input: "textarea",
            inputLabel: "Cancellation Reason",
            inputPlaceholder: "Tell us why you're cancelling...",
            showCancelButton: true,
            confirmButtonText: 'Confirm Cancellation',
            cancelButtonText: 'Back'
        });

        if (text && text.trim()) {
            SuccessToast("Order Cancelled.");
            window.location.href = event.target.closest('a').getAttribute('href').trim() + `&cancellationReason=${text}`;
        }
    }
}

const ratingBtn = document.querySelectorAll('.ratingBtn');
let selectedRating = 0;

const myRating = document.getElementById('myRating');
if (myRating) {
    myRating.addEventListener('change.coreui.rating', (event) => {
        selectedRating = event.value;
    });
}

ratingBtn.forEach((ele) => {
    ele.addEventListener('click', (event) => {
        const btn = event.currentTarget;
        const orderId = btn.closest('.card').querySelector('.orderId').innerText.trim();
        const productId = btn.closest('.mainCard').querySelector('.productId').getAttribute('productId');
        document.getElementById('modalOrderId').value = orderId;
        document.getElementById('modalProductId').value = productId;
        selectedRating = 0;
        document.getElementById('comment').value = '';
    });
});

const ratingSubmit = document.getElementById('ratingSubmit');
if (ratingSubmit) {
    ratingSubmit.addEventListener('click', async () => {
        const orderId = document.getElementById('modalOrderId').value;
        const productId = document.getElementById('modalProductId').value;
        const comment = document.getElementById('comment').value;
        const rating = selectedRating;

        if (!rating || rating === 0) {
            WarningToast("Please select a star rating.");
            return;
        }

        try {
            const response = await fetch('/rateProduct', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ comment, productId, orderId, rating })
            });

            if (response.ok) {
                SuccessToast("Your review has been submitted.");
                window.location.reload();
            } else {
                ErrorToast("Something went wrong.");
            }
        } catch (error) {
            console.error(error);
            ErrorToast("Network error occurred.");
        }
    });
}

document.querySelectorAll('.orderReturnBtn').forEach((ele) => {
    ele.addEventListener('click', returnProduct)
})

async function returnProduct(event) {
    event.preventDefault()

    const result = await ConfirmAction(
        "Are you sure?",
        "Are you sure you want to return this product?",
        "Confirm Return!"
    );

    if (result.isConfirmed) {
        SuccessToast("Return request submitted.");
        setTimeout(() => {
            window.location.href = event.target.closest('a').getAttribute('href');
        }, 1000);
    }
}