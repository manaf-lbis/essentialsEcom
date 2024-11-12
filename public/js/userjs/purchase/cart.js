
//confirm before removing the item from cart
const removeBtn = document.querySelectorAll('.removeBtn');


removeBtn.forEach((ele) => {
  ele.addEventListener('click', removeItem)
})

async function removeItem(event) {

  event.preventDefault();

  await Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, Remove it!"

  }).then(async (result) => {

    if (result.isConfirmed) {
      await Swal.fire({
        title: "Item Removed!",
        text: "Cart Item Removed Sucessfully",
        icon: "success"
      });

      window.location.href = event.target.closest('a').href;

      //checking coupon 
      const couponCode = document.getElementById('couponCode');

      //check coupon is valid  //disable means there is a coupon available
      if (couponCode.hasAttribute('disabled')) {
        priceChangeListner();
      }


    }

  });

};



//checking cart is empty or not and prevent proceed to checkout page
const checkoutBtn = document.getElementById('checkoutBtn');

checkoutBtn.addEventListener('click', (event) => {

  event.preventDefault();

  const totalAmount = document.getElementById('totalAmount');

  if (Number(totalAmount.innerHTML.substring(2)) <= 0) {
    Swal.fire("Add Product To Proceed");

  } else {
    window.location.href = checkoutBtn.getAttribute('href')

  }

});


// changing product quanntity
const items = document.querySelectorAll('#items')
items.forEach((ele) => ele.addEventListener('click', qtyChangeRqst));

async function qtyChangeRqst(event) {
  try {

    const productId = event.target.closest('button').getAttribute('productId');
    const input = event.target.closest('div').querySelector('input[type="number"]').value;
    const priceOfItem = event.target.closest('.row').querySelector('.price').innerHTML;
    const totalPriceTag = event.target.closest('.row').querySelector('.totalPrice');




    // if the cart qty reached 
    if (Number(input) >= 5) {
      event.target.closest('div').querySelector('input[type="number"]').value = 5;

      Swal.fire({
        position: "top-end",
        icon: "error",
        title: "Max Qty Reached",
        showConfirmButton: false,
        timer: 1000,
        width: '200px',
        padding: '0.2rem',
        backdrop: false
      });

    }

    //checking coupon 
    const couponCode = document.getElementById('couponCode')

    // qty change req to server
    const response = await fetch(`/cartQtyChange/?productId=${productId}&count=${input}`, {
      method: 'GET',
      headers: {
        'content-Type': 'application/json'
      }
    })

    //if quantity is changed 
    if (response.ok) {

      //check coupon is valid  //disable means there is a coupon available
      if (couponCode.hasAttribute('disabled')) {
        priceChangeListner();
      }

      const data = await response.json()
      return updatePage(data, totalPriceTag, input, priceOfItem)
    }


    const responseData = await response.json();

    if (responseData.message === 'Out of Quantity') {

      // quantity is setting back to older
      event.target.closest('div').querySelector('input[type="number"]').value = input - 1 === 0 ? input : input - 1;

      Swal.fire({
        position: "top-end",
        icon: "error",
        title: "Out of Stock",
        showConfirmButton: false,
        timer: 1000,
        width: '200px',
        padding: '0.2rem',
        backdrop: false
      });

    }

  } catch (error) {

    console.log(error);

  }
}


// page updating
function updatePage(data, totalPriceTag, qty, priceOfItem) {

  document.getElementById('totalItems').innerHTML = `Items (${data.totalItems})`;
  document.getElementById('totalAmount').innerHTML = `₹ ${data.amountAfterDiscount}`;
  //total amout of summarry
  document.getElementById('price').innerHTML = `₹ ${data.totalAmount}`;

  console.log(`₹ ${data.discount}`);

  if (data.discount) {
    document.getElementById('couponDiscount').innerHTML = `₹ ${data.discount}`;
  }

  // total price of individual item 
  totalPriceTag.innerHTML = qty * priceOfItem

}


// coupon code checking
const couponBtn = document.getElementById('couponBtn');

couponBtn.addEventListener('click', async () => {
  const couponCode = document.getElementById('couponCode').value;

  const response = await fetch(`/checkCouponCode/?couponCode=${couponCode}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  const json = await response.json()

  if (response.ok) {

    const couponCodeMsg = document.getElementById('couponCodeMsg');
    couponCodeMsg.innerHTML = 'Coupon Applied Sucessfully';
    couponCodeMsg.classList.add('text-success')
    document.getElementById('couponCode').setAttribute('disabled', true);

    document.getElementById('couponDiscount').innerHTML = `₹ ${json.discount}`

    window.location.href = '/cart'

  } else {

    document.getElementById('couponDiscount').innerHTML = `₹ 0`
    const couponCodeMsg = document.getElementById('couponCodeMsg');
    couponCodeMsg.innerHTML = json.message;
    couponCodeMsg.classList.add('text-danger')


  }

})




//checking coupon after changing cart value
//listening price change 
const couponCode = document.getElementById('couponCode')

async function priceChangeListner() {  //calling when cart updated 


  const response = await fetch(`/couponAfterChange/?couponCode=${couponCode.value}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });


  if (response.ok) {

    const couponCodeMsg = document.getElementById('couponCodeMsg');
    couponCodeMsg.innerHTML = 'Coupon Applied Sucessfully';
    couponCodeMsg.classList.remove('text-danger')
    couponCodeMsg.classList.add('text-success')
    document.getElementById('couponCode').setAttribute('disabled', true)


  } else {

    const json = await response.json()
    const couponCodeMsg = document.getElementById('couponCodeMsg');
    couponCodeMsg.innerHTML = json.message;
    couponCodeMsg.classList.add('text-danger')
    document.getElementById('couponCode').removeAttribute('disabled');
    document.getElementById('couponCode').value = ''
    document.getElementById('couponDiscount').innerHTML = `₹ 0`
  }

}