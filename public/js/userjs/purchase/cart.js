

const removeBtn = document.querySelectorAll('.removeBtn');

removeBtn.forEach((ele) => {
  ele.addEventListener('click', removeItem)
})

async function removeItem(event) {
  event.preventDefault();

  const result = await ConfirmAction(
    "Are you sure?",
    "You won't be able to revert this!",
    "Yes, Remove it!"
  );

  if (result.isConfirmed) {
    SuccessToast("Cart Item Removed Successfully");
    setTimeout(() => {
      window.location.href = event.target.closest('a').href;
    }, 1000);
  }
}

const checkoutBtn = document.getElementById('checkoutBtn');
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', (event) => {
    event.preventDefault();
    const totalAmount = document.getElementById('totalAmount');
    if (Number(totalAmount.innerHTML.trim().substring(2)) <= 0) {
      WarningToast("Add Product To Proceed");
    } else {
      window.location.href = checkoutBtn.getAttribute('href')
    }
  });
}

const items = document.querySelectorAll('#items')
items.forEach((ele) => ele.addEventListener('click', qtyChangeRqst));

async function qtyChangeRqst(event) {
  try {
    const productId = event.target.closest('button').getAttribute('productId');
    const input = event.target.closest('div').querySelector('input[type="number"]').value;
    const priceOfItem = event.target.closest('.row').querySelector('.price').innerHTML;
    const totalPriceTag = event.target.closest('.row').querySelector('.totalPrice');

    if (Number(input) >= 5) {
      event.target.closest('div').querySelector('input[type="number"]').value = 5;
      ErrorToast("Max Qty Reached");
      return;
    }

    const response = await fetch(`/cartQtyChange/?productId=${productId}&count=${input}`, {
      method: 'GET',
      headers: { 'content-Type': 'application/json' }
    })

    if (response.ok) {
      const data = await response.json()
      return updatePage(data, totalPriceTag, input, priceOfItem)
    }

    const responseData = await response.json();
    if (responseData.message === 'Out of Quantity') {
      event.target.closest('div').querySelector('input[type="number"]').value = input - 1 === 0 ? input : input - 1;
      ErrorToast("Out of Stock");
    }
  } catch (error) {
    console.log(error);
  }
}

function updatePage(data, totalPriceTag, qty, priceOfItem) {
  if (data.amountAfterDiscount < 500) {
    document.getElementById('shippingCharge').innerHTML = 40;
    data.amountAfterDiscount += 40
  } else {
    document.getElementById('shippingCharge').innerHTML = 0;
  }

  document.getElementById('totalItems').innerHTML = `Items (${data.totalItems})`;
  document.getElementById('totalAmount').innerHTML = `₹ ${data.amountAfterDiscount}`;
  document.getElementById('price').innerHTML = `₹ ${data.totalAmount}`;

  const dv = document.getElementById('discountValue');
  if (data.discount > 0) {
    if (dv) dv.innerHTML = `₹ ${data.discount}`;
  } else {

    if (dv) dv.innerHTML = `₹ 0`;

    const appliedSection = document.getElementById('appliedCouponSection');
    if (appliedSection) {
      appliedSection.style.display = 'none';
      const viewBtn = document.getElementById('viewCouponsBtn');
      if (viewBtn) viewBtn.style.display = 'block';
      const codeInput = document.getElementById('couponCodeInput');
      if (codeInput) {
        codeInput.disabled = false;
        codeInput.value = '';
      }
      const applyBtn = document.getElementById('applyCouponBtn');
      if (applyBtn) applyBtn.disabled = false;
    }

    if (data.couponInvalidated) {
      WarningToast("Coupon removed as minimum purchase requirement not met");
    }
  }
  totalPriceTag.innerHTML = qty * priceOfItem
}
