const swiper = new Swiper('.swiper', {
  // Optional parameters
  direction: 'horizontal',
  loop: true,
  slidesPerView: 1, // Number of slides to show

  // autoplay: {
  //     delay: 2000,            // Auto-scroll delay (3 seconds)
  //     disableOnInteraction: false, // Continue autoplay after user interaction
  // },
  // If we need pagination
  pagination: {
    el: '.swiper-pagination',
  },

  // Navigation arrows
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },

});


//add to cart logic
const cartBtn = document.querySelectorAll('.btn-cart')

cartBtn.forEach((ele) => {
  ele.addEventListener('click', getValues)
});


function getValues(event) {

  const card = event.target.closest('.row');
  const quantity = card.querySelector('.quantity').value
  const productId = card.querySelector('.quantity').getAttribute('productid');

  addToCart(quantity, productId);
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
      title: "Added to Cart",
      showConfirmButton: false,
      timer: 1000,
      width: '200px',
      padding: '0.2rem',
      backdrop: false
    });


  }

}

// checking the qty of this product is availabel or not 
const quantitySelection = document.querySelectorAll('.quantitySelection');


quantitySelection.forEach((ele) => {
  ele.addEventListener('change', checkQuantity)
})


async function checkQuantity(event) {

  const qty = event.target.value

  const _id = event.target.getAttribute('productid');

  if (qty >= 5) {

    Swal.fire({
      position: "top-end",
      icon: "error",
      title: "Max qty reached",
      showConfirmButton: false,
      timer: 1000,
      width: '200px',
      padding: '0.2rem',
      backdrop: false
    });
    qty = 5;
  }


  //checking stock is the product qty is avilable(when qty incrementing)
  const response = await fetch(`/checkProductQty/?qty=${qty}&_id=${_id}`, {
    method: 'GET',
    headers: {
      'content-Type': 'appllication/json'
    }
  })

  const json = await response.json()

  if (!response.ok) {
    event.target.value = json.availableQty

    Swal.fire({
      position: "top-end",
      icon: "error",
      title: "out Of stock",
      showConfirmButton: false,
      timer: 1000,
      width: '200px',
      padding: '0.2rem',
      backdrop: false
    });

  }

}


//wishlist
const wishlistToggle = document.querySelectorAll('.wishlistToggle');
wishlistToggle.forEach((wishlist) => {
  wishlist.addEventListener('click', wishlistFunc)
})

async function wishlistFunc(event) {
  try {
    event.preventDefault()
    const href = event.target.closest('a').getAttribute('href');

    const response = await fetch(href, {
      method: 'GET',
      headers: {
        'content-type': 'aaplication/json'
      }
    });

    const json = await response.json();

    const svg = event.target.closest('.wishlistBtn').querySelector('svg');

    

    //if item is added change heart color to red
    if (json.message === 'Item Removed') {

      svg.style.fill =  'grey';

      svg.classList.add('grow-shrink');

      // Remove bounce class after animation ends
      svg.addEventListener('animationend', () => {
        svg.classList.remove('grow-shrink');
      }, { once: true });

    } else if(json.message === 'Added To Wishlist') {

      svg.style.fill = 'red';

      svg.classList.add('grow-shrink');

      // Remove bounce class after animation ends
      svg.addEventListener('animationend', () => {
        svg.classList.remove('grow-shrink');
      }, { once: true });

    }


  } catch (error) {
    console.log(error);

  }
}