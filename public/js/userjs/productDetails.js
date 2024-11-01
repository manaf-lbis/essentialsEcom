
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

const smallThumbnail = document.querySelectorAll('.smallThumbnail');


smallThumbnail.forEach((ele)=>{
  ele.addEventListener("click",changeImage)
});


function changeImage(event){

  const imageSrc = event.target.src;
  const thumbImage = document.getElementById('thumb');

  // Change the src of the thumbnail image
  thumbImage.src = imageSrc;

  // Update the data-large-img-url attribute
  thumbImage.setAttribute('data-large-img-url', imageSrc);
 

}
