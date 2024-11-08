
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

  addToCart(quantity, productId)
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
      title: "Out of Stock",
      showConfirmButton: false,
      timer: 1000,
      width: '200px',
      padding: '0.2rem',
      backdrop: false
    });


  }


}

const smallThumbnail = document.querySelectorAll('.smallThumbnail');


smallThumbnail.forEach((ele) => {
  ele.addEventListener("click", changeImage)
});


function changeImage(event) {

  const imageSrc = event.target.src;
  const thumbImage = document.getElementById('thumb');

  // Change the src of the thumbnail image
  thumbImage.src = imageSrc;

  // Update the data-large-img-url attribute
  thumbImage.setAttribute('data-large-img-url', imageSrc);

}


//checking qty of this is avilable or not 
const quantitySelection = document.querySelectorAll('.quantitySelection');

quantitySelection.forEach((ele)=>{
  ele.addEventListener('change',checkQuantity)
})


async function checkQuantity(event){
  
  const qty = event.target.value

  const _id = event.target.getAttribute('productid');

  if(qty >=5){

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


  //checking stock is the product qty is avilable
  const response = await fetch(`/checkProductQty/?qty=${qty}&_id=${_id}`,{
    method:'GET',
    headers:{
      'content-Type':'appllication/json'
    }
  })

  const json = await response.json()

  if(!response.ok){
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

