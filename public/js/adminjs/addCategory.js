document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addCategoryForm');
    const categoryNameInput = document.getElementById('categoryName');
    const descriptionInput = document.getElementById('description');
    const imageInput = document.getElementById('categoryImage');
    const imagePreview = document.getElementById('imagePreview');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');

    const cropModalElement = document.getElementById('cropModal');
    const cropModal = new bootstrap.Modal(cropModalElement);
    const imageToCrop = document.getElementById('imageToCrop');
    const cropButton = document.getElementById('cropButton');
    const reCropBtn = document.getElementById('reCropBtn');

    let cropper;
    let isCropped = false;

    imageInput.addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (file) {
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (!validTypes.includes(file.type)) {
                showError('imageError', 'Invalid file type. Only JPG, JPEG, and PNG are allowed.');
                this.value = '';
                imagePreviewContainer.classList.add('d-none');
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                imageToCrop.src = e.target.result;
                cropModal.show();
            }
            reader.readAsDataURL(file);
        }
    });

    cropModalElement.addEventListener('shown.bs.modal', function () {
        cropper = new Cropper(imageToCrop, {
            aspectRatio: 1,
            viewMode: 1,
            guides: true,
            background: false,
            autoCropArea: 1,
            zoomable: true
        });
    });

    cropModalElement.addEventListener('hidden.bs.modal', function () {
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
    });

    cropButton.addEventListener('click', function () {
        if (cropper) {
            const canvas = cropper.getCroppedCanvas({
                width: 400,
                height: 400
            });

            canvas.toBlob((blob) => {
                const file = new File([blob], 'category.jpg', { type: 'image/jpeg' });
                const container = new DataTransfer();
                container.items.add(file);
                imageInput.files = container.files;

                imagePreview.src = canvas.toDataURL();
                imagePreviewContainer.classList.remove('d-none');
                isCropped = true;
                clearError('imageError');
                cropModal.hide();
            }, 'image/jpeg');
        }
    });

    reCropBtn.addEventListener('click', () => {
        cropModal.show();
    });

    form.addEventListener('submit', (e) => {
        let isValid = true;

        clearError('categoryNameError');
        clearError('descriptionError');
        clearError('imageError');

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

        const descValue = descriptionInput.value.trim();
        if (descValue === '') {
            showError('descriptionError', 'Description is required.');
            isValid = false;
        } else if (descValue.length < 10) {
            showError('descriptionError', 'Description must be at least 10 characters.');
            isValid = false;
        }

        if (!isCropped) {
            showError('imageError', 'Please upload and crop a category image.');
            isValid = false;
        }

        if (!isValid) {
            e.preventDefault();
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
