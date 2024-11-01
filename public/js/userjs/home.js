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

  if(response.ok){

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
    

  }else{
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