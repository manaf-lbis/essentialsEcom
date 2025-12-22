

document.addEventListener('DOMContentLoaded', () => {
    const viewCouponsBtn = document.getElementById('viewCouponsBtn');
    const applyCouponBtn = document.getElementById('applyCouponBtn');
    const removeCouponBtn = document.getElementById('removeCouponBtn');
    const couponList = document.getElementById('couponList');
    const couponCodeInput = document.getElementById('couponCodeInput');

    const initialDiscount = parseFloat(document.getElementById('discountValue').innerText.replace(/[^\d.]/g, ''));
    if (initialDiscount > 0) {
        document.getElementById('appliedCouponSection').style.display = 'block';
        document.getElementById('appliedCouponMsg').innerText = 'Coupon Applied';
        document.getElementById('viewCouponsBtn').style.display = 'none';
        document.getElementById('couponCodeInput').disabled = true;
        document.getElementById('applyCouponBtn').disabled = true;
    }

    viewCouponsBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/available-coupons');
            const data = await response.json();

            if (data.coupons && data.coupons.length > 0) {
                let html = '<ul class="list-group">';
                data.coupons.forEach(coupon => {
                    const desc = coupon.discountType === 'percentage'
                        ? `${coupon.discount}% OFF (Max ₹${coupon.maxDiscountAmount || '∞'})`
                        : `₹${coupon.discount} OFF`;

                    html += `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${coupon.couponCode}</strong><br>
                                <small>${desc}</small><br>
                                <small class="text-muted">Min Purchase: ₹${coupon.minPurchaseValue}</small>
                            </div>
                            <button class="btn btn-sm btn-primary apply-coupon-list-btn" data-code="${coupon.couponCode}">Apply</button>
                        </li>
                    `;
                });
                html += '</ul>';
                couponList.innerHTML = html;

                document.querySelectorAll('.apply-coupon-list-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const code = e.target.getAttribute('data-code');
                        couponCodeInput.value = code;
                        $('#couponModal').modal('hide');
                        applyCoupon(code);
                    });
                });

            } else {
                couponList.innerHTML = '<p class="text-center">No coupons available.</p>';
            }

        } catch (error) {
            console.error('Error fetching coupons:', error);
            couponList.innerHTML = '<p class="text-danger">Failed to load coupons.</p>';
        }
    });

    applyCouponBtn.addEventListener('click', () => {
        const code = couponCodeInput.value.trim();
        if (code) applyCoupon(code);
    });

    removeCouponBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/remove-coupon');
            const data = await response.json();

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Removed',
                    text: 'Coupon removed successfully',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    window.location.reload();
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.message || 'Failed to remove coupon'
                });
            }
        } catch (error) {
            console.error(error);
        }
    });

    async function applyCoupon(code) {
        try {
            const response = await fetch(`/checkCouponCode?couponCode=${code}`);
            const data = await response.json();

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Applied',
                    text: `Coupon '${code}' applied! Savings: ₹${data.discount}`,
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {

                    window.location.reload();
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid Coupon',
                    text: data.message || 'Could not apply coupon'
                });
            }

        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Something went wrong.'
            });
        }
    }

});
