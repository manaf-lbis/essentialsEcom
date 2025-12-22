
const priceRange = document.getElementById('priceRange');
priceRange.addEventListener('input', () => {
    document.getElementById('price-value').innerHTML = document.getElementById('priceRange').value
});

