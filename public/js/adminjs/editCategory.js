document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('editCategoryForm');
    const categoryNameInput = document.getElementById('categoryName');
    const descriptionInput = document.getElementById('description');
    const imageInput = document.getElementById('categoryImage');
    const imagePreview = document.getElementById('imagePreview');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');

    // Real-time Image Preview
    if (imageInput) {
        imageInput.addEventListener('change', function (event) {
            const file = event.target.files[0];
            if (file) {
                // Validate file type
                const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
                if (!validTypes.includes(file.type)) {
                    showError('imageError', 'Invalid file type. Only JPG, JPEG, and PNG are allowed.');
                    this.value = ''; // Clear input
                    imagePreviewContainer.classList.add('d-none');
                    return;
                }

                const reader = new FileReader();
                reader.onload = function (e) {
                    imagePreview.src = e.target.result;
                    imagePreviewContainer.classList.remove('d-none');
                    clearError('imageError');
                }
                reader.readAsDataURL(file);
            } else {
                imagePreviewContainer.classList.add('d-none');
            }
        });
    }

    // Form Validation on Submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        let isValid = true;

        // Clear previous errors
        clearError('categoryNameError');
        clearError('descriptionError');
        clearError('imageError');

        // 1. Validate Category Name
        const nameValue = categoryNameInput.value.trim();
        if (nameValue === '') {
            showError('categoryNameError', 'Category Name is required.');
            isValid = false;
        } else if (!/^[a-zA-Z\s]+$/.test(nameValue)) {
            showError('categoryNameError', 'Category Name should contain only alphabets.');
            isValid = false;
        } else if (nameValue.length < 3) {
            showError('categoryNameError', 'Category Name must be at least 3 characters.');
            isValid = false;
        }

        // 2. Validate Description
        const descValue = descriptionInput.value.trim();
        if (descValue === '') {
            showError('descriptionError', 'Description is required.');
            isValid = false;
        } else if (descValue.length < 10) {
            showError('descriptionError', 'Description must be at least 10 characters.');
            isValid = false;
        }

        if (isValid) {
            form.submit();
        }
    });

    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    function clearError(elementId) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = '';
        }
    }
});
