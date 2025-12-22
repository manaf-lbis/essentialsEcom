

const swiper = new Swiper('.swiper', {
  direction: 'horizontal',
  loop: false,
  slidesPerView: 1,
  spaceBetween: 10,
  navigation: {
    nextEl: '.swiper-next',
    prevEl: '.swiper-prev',
  },
  breakpoints: {
    576: { slidesPerView: 2 },
    768: { slidesPerView: 3 },
    992: { slidesPerView: 4 },
    1200: { slidesPerView: 5 }
  }
});

document.addEventListener('click', async (event) => {

  const cartBtn = event.target.closest('.btn-cart-action');
  if (cartBtn) {
    event.preventDefault();
    const productId = cartBtn.getAttribute('productid');
    const container = cartBtn.closest('.addtoCartSec') || cartBtn.closest('.button-area');

    if (container) {
      const qtyInput = container.querySelector('.quantitySelection') || container.querySelector('.quantity');
      const quantity = qtyInput ? qtyInput.value : 1;
      await addToCart(quantity, productId);
    }
    return;
  }

  const buyBtn = event.target.closest('.btn-buy-now-action');
  if (buyBtn) {
    event.preventDefault();
    const productId = buyBtn.getAttribute('productid');
    const container = buyBtn.closest('.addtoCartSec');

    if (container) {
      const qtyInput = container.querySelector('.quantitySelection');
      const quantity = qtyInput ? qtyInput.value : 1;
      await handleBuyNow(quantity, productId);
    }
    return;
  }
});

async function addToCart(quantity, _id) {
  try {
    const response = await fetch('/addToCart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity, _id })
    });

    if (response.ok) {
      SuccessToast("Added to Cart");
      if (typeof updateCartBadge === 'function') updateCartBadge();
    } else {
      const data = await response.json();
      ErrorToast(data.message || "Out of Stock");
    }
  } catch (error) {
    console.error('Add to Cart error:', error);
    ErrorToast("Something went wrong");
  }
}

async function handleBuyNow(quantity, _id) {
  try {
    const response = await fetch('/addToCart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity, _id })
    });

    if (response.ok) {
      SuccessToast("Heading to Checkout...");
      setTimeout(() => {
        window.location.href = '/checkout';
      }, 1000);
    } else {
      const data = await response.json();
      ErrorToast(data.message || "Out of Stock");
    }
  } catch (error) {
    console.error('Buy Now error:', error);
    ErrorToast("Something went wrong");
  }
}

document.addEventListener('change', async (event) => {
  if (event.target.classList.contains('quantitySelection')) {
    let qty = parseInt(event.target.value);
    const productId = event.target.getAttribute('productid');

    if (!qty || qty < 1) {
      event.target.value = 1;
      return;
    }

    if (qty > 5) {
      ErrorToast("Maximum 5 units allowed");
      event.target.value = 5;
      qty = 5;
    }

    try {
      const response = await fetch(`/checkProductQty?qty=${qty}&_id=${productId}`);
      const data = await response.json();

      if (!response.ok) {
        event.target.value = data.availableQty || 1;
        ErrorToast(data.message || "Insufficient stock");
      }
    } catch (error) {
      console.error('Check quantity error:', error);
    }
  }
});

window.updateMainImage = function (src) {
  const thumb = document.getElementById('thumb');
  if (thumb) {
    thumb.src = src;
    thumb.setAttribute('data-large-img-url', src);

    document.querySelectorAll('.smallThumbnail').forEach(img => {
      img.classList.toggle('active', img.getAttribute('src') === src);
    });
  }
};

const reviewForm = document.getElementById('reviewForm');
if (reviewForm) {
  reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(reviewForm);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        SuccessToast(result.message);
        reviewForm.reset();

        const container = document.getElementById('reviewListContainer');
        if (container) {
          const noReviewsMsg = container.querySelector('.text-center.py-5');
          if (noReviewsMsg) noReviewsMsg.remove();

          const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
          const newReviewHtml = `
            <div class="comment-card shadow-sm mb-3" style="animation: slideInRight 0.5s ease-out;">
              <div class="comment-header d-flex justify-content-between align-items-center">
                <div class="user-name fw-bold text-dark">${result.comment.userId.name}</div>
                <div class="comment-date small text-muted">
                  <i class="far fa-calendar-alt me-1"></i> ${dateStr}
                </div>
              </div>
              <p class="small text-muted mt-2 mb-0">${result.comment.comment}</p>
            </div>
          `;
          container.insertAdjacentHTML('afterbegin', newReviewHtml);

          const countBadge = document.getElementById('reviewCountBadge');
          if (countBadge) {
            const currentCount = parseInt(countBadge.innerText) || 0;
            countBadge.innerText = currentCount + 1;
          }
        }
      } else {
        ErrorToast(result.message || "Failed to post review");
      }
    } catch (error) {
      console.error('Review submission error:', error);
      ErrorToast("Something went wrong");
    }
  });
}

const style = document.createElement('style');
style.innerHTML = `
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
`;
document.head.appendChild(style);
