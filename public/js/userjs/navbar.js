/**
 * Navbar and Live Search Functionality
 */

// Function to update the cart badge quantity
async function updateCartBadge() {
    try {
        const response = await fetch('/cartQuantity');
        const data = await response.json();
        const badge = document.getElementById('cartBadge');
        if (badge) {
            badge.textContent = data.cartQty || 0;
            badge.style.display = data.cartQty > 0 ? 'inline-block' : 'none';
        }
    } catch (error) {
        console.error('Error updating cart badge:', error);
    }
}

// Live Search logic
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();

    const searchInput = document.getElementById('navbarSearchInput');
    const suggestionsContainer = document.getElementById('searchSuggestions');
    const suggestionsList = document.getElementById('suggestionsList');
    const viewAllBtn = document.getElementById('viewAllResults');
    let debounceTimer;

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();

            clearTimeout(debounceTimer);
            if (query.length < 2) {
                suggestionsContainer.classList.add('d-none');
                return;
            }

            debounceTimer = setTimeout(async () => {
                try {
                    const response = await fetch(`/api/search-suggestions?q=${encodeURIComponent(query)}`);
                    const suggestions = await response.json();

                    if (suggestions.length > 0) {
                        renderSuggestions(suggestions);
                        suggestionsContainer.classList.remove('d-none');
                        viewAllBtn.onclick = () => {
                            window.location.href = `/search?searchQuery=${encodeURIComponent(query)}`;
                        };
                    } else {
                        suggestionsContainer.classList.add('d-none');
                    }
                } catch (error) {
                    console.error('Error fetching suggestions:', error);
                }
            }, 300); // 300ms debounce
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                suggestionsContainer.classList.add('d-none');
            }
        });

        // Show suggestions again if input is focused and has text
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim().length >= 2 && suggestionsList.children.length > 0) {
                suggestionsContainer.classList.remove('d-none');
            }
        });
    }

    /**
     * Renders the suggestions list
     * @param {Array} suggestions - List of product suggestions
     */
    function renderSuggestions(suggestions) {
        suggestionsList.innerHTML = '';
        suggestions.forEach(item => {
            const div = document.createElement('div');
            div.className = 'suggestion-item p-2 d-flex align-items-center border-bottom-0 hover-bg-light cursor-pointer transition-all';
            div.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="rounded-2 me-3" style="width: 40px; height: 40px; object-fit: cover;">
                <div class="flex-grow-1 overflow-hidden">
                    <div class="fw-bold text-dark text-truncate small">${item.name}</div>
                    <div class="text-primary smaller fw-bold">₹${item.price.toFixed(2)}</div>
                </div>
            `;
            div.onclick = () => {
                window.location.href = `/product/${item.id}`;
            };
            suggestionsList.appendChild(div);
        });
    }
});