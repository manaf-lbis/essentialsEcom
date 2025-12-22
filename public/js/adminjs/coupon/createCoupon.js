document.addEventListener('DOMContentLoaded', () => {
    const couponForm = document.getElementById('couponForm');
    const discountTypeSelect = document.getElementById('discountType');
    const maxDiscountField = document.getElementById('maxDiscountField');

    // Toggle Max Discount field
    discountTypeSelect.addEventListener('change', function () {
        if (this.value === 'percentage') {
            maxDiscountField.style.display = 'block';
        } else {
            maxDiscountField.style.display = 'none';
        }
    });

    couponForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Reset errors
        document.querySelectorAll('.text-danger').forEach(el => el.textContent = '');

        // Get values
        const couponCode = document.getElementById('couponCode').value.trim();
        const discountType = document.getElementById('discountType').value;
        const discountAmount = parseFloat(document.getElementById('discountAmount').value);
        const minPurchase = parseFloat(document.getElementById('minPurchase').value);
        const expiryDate = document.getElementById('expiryDate').value;
        const maxDiscount = parseFloat(document.getElementById('maxDiscountAmount').value);

        let isValid = true;

        // Validation Logic
        if (!couponCode) {
            document.getElementById('couponCodeError').textContent = 'Coupon Code is required';
            isValid = false;
        } else if (couponCode.length < 3) {
            document.getElementById('couponCodeError').textContent = 'Code must be at least 3 characters';
            isValid = false;
        }

        if (isNaN(discountAmount) || discountAmount <= 0) {
            document.getElementById('discountAmountError').textContent = 'Valid discount amount is required';
            isValid = false;
        }

        if (discountType === 'percentage' && discountAmount > 100) {
            document.getElementById('discountAmountError').textContent = 'Percentage cannot exceed 100%';
            isValid = false;
        }

        if (isNaN(minPurchase) || minPurchase < 0) {
            document.getElementById('minPurchaseError').textContent = 'Valid minimum purchase is required';
            isValid = false;
        }

        if (!expiryDate) {
            document.getElementById('expiryDateError').textContent = 'Expiry Date is required';
            isValid = false;
        } else if (new Date(expiryDate) < new Date()) {
            document.getElementById('expiryDateError').textContent = 'Expiry Date must be in the future';
            isValid = false;
        }

        if (isValid) {
            try {
                const formData = {
                    couponCode,
                    discount: discountAmount,
                    minPurchaseValue: minPurchase,
                    expiryDate,
                    discountType,
                    maxDiscountAmount: discountType === 'percentage' ? maxDiscount : null
                };

                const response = await fetch('/admin/newCoupon', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (response.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: 'Coupon created successfully!',
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => window.location.href = '/admin/coupons');
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.message || 'Failed to create coupon'
                    });
                }
            } catch (error) {
                console.error(error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Something went wrong'
                });
            }
        }
    });
});
