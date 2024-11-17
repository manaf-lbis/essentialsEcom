
async function updateBadge(){
        
    const response = await fetch('/cartQuantity');
    const data = await response.json();

    document.getElementById('cartBadge').innerHTML = data.cartQty;

}


document.addEventListener('DOMContentLoaded', updateBadge);
document.addEventListener('click',updateBadge)