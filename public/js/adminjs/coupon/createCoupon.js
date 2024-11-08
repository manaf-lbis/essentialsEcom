document.addEventListener("DOMContentLoaded", function () {
    const couponForm = document.getElementById('couponForm');
    const expiryDateInput = document.getElementById('expiryDate');

    const today = new Date().toISOString().split('T')[0];
    expiryDateInput.min = today;

    couponForm.addEventListener('submit', function (e) {

        e.preventDefault();

        let isValid = true;

        // Clear previous error messages
        document.getElementById('couponCodeError').textContent = '';
        document.getElementById('discountAmountError').textContent = '';
        document.getElementById('minPurchaseError').textContent = '';
        document.getElementById('expiryDateError').textContent = '';

        // Validation for Coupon Code
        const couponCode = document.getElementById('couponCode');
        if (couponCode.value.trim().length < 5) {
            document.getElementById('couponCodeError').textContent = 'Coupon code must be at least 5 characters.';
            isValid = false;
        }

        // Validation for Discount Amount
        const discountAmount = document.getElementById('discountAmount');
        if (discountAmount.value < 100) {
            document.getElementById('discountAmountError').textContent = 'Discount amount must be above ₹100.';
            isValid = false;
        }

        // Validation for Minimum Purchase Value
        const minPurchase = document.getElementById('minPurchase');
        if (minPurchase.value <= 0) {
            document.getElementById('minPurchaseError').textContent = 'Minimum purchase value must be greater than 0.';
            isValid = false;
        }

        // Validation for Expiry Date
        const expiryDate = document.getElementById('expiryDate');
        if (expiryDate.value < today) {
            document.getElementById('expiryDateError').textContent = 'Expiry date must be today or in the future.';
            isValid = false;
        }

        // Prevent form submission if validation fails
        if (isValid) {
            createCoupon()
        }

    });
});


async function createCoupon() {

    const couponForm = document.getElementById('couponForm');

    const formData = {
        couponCode: couponForm.couponCode.value,
        discount: couponForm.discount.value,
        minPurchaseValue: couponForm.minPurchaseValue.value,
        expiryDate: couponForm.expiryDate.value,
    };


   const response = await fetch('/admin/createCoupon', {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: {
            'Content-Type': 'application/json',
        }
    });

   const jsonResponse =  await response.json()

    if(response.ok){

        await Swal.fire({
            title: "Coupon Created Sucessfully",
            text: `Coupon Code '${jsonResponse.couponCode}'`,
        });

        window.location.href = '/admin/coupons'

    }else if(response.status === 400){

        await Swal.fire({
            icon:'error',
            title: "Coupon Not created",
            text: `Coupon Code Already Exist`,
        });
    }
    
}

