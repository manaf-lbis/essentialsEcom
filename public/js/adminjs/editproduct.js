
// State Management
let cropper = null;
let currentCropIndex = null;
const croppedBlobs = {};
const originalFiles = {};

// DOM Elements
const form = document.getElementById('editProductForm');
const cropModal = new bootstrap.Modal(document.getElementById('cropModal'), { keyboard: false });
const cropImageTarget = document.getElementById('cropImageTarget');
const btnApplyCrop = document.getElementById('btnApplyCrop');

// 1. Handle File Selection
function handleImageNative(input, index) {
    if (input.files && input.files[0]) {
        const file = input.files[0];

        // Validate File Type
        if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
            Swal.fire({ icon: 'error', title: 'Invalid File', text: 'Please select a valid image (JPG, PNG, WEBP).' });
            input.value = ''; // Reset
            return;
        }

        originalFiles[index] = file;

        // Show Preview
        const preview = document.getElementById(`preview-${index}`);
        const uploadContent = document.getElementById(`upload-content-${index}`);
        const actions = document.getElementById(`actions-${index}`);
        const existingView = document.getElementById(`existing-view-${index}`);

        // Hide existing view if present (though logic usually hides it via delete first, but if overwriting?)
        if (existingView) existingView.style.display = 'none';

        const reader = new FileReader();
        reader.onload = function (e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            if (uploadContent) uploadContent.style.display = 'none';
            if (actions) actions.style.display = 'flex';
        };
        reader.readAsDataURL(file);
    }
}

// 2. Init Crop Modal
function initCrop(index) {
    currentCropIndex = index;
    const file = originalFiles[index];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        cropImageTarget.src = e.target.result;
        if (cropper) cropper.destroy();
        cropModal.show();
        setTimeout(() => {
            cropper = new Cropper(cropImageTarget, { aspectRatio: 1, viewMode: 1, autoCropArea: 0.8 });
        }, 200);
    };
    reader.readAsDataURL(file);
}

// 3. Apply Crop
btnApplyCrop.addEventListener('click', () => {
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas({ width: 800, height: 800, imageSmoothingQuality: 'high' });

    canvas.toBlob((blob) => {
        croppedBlobs[currentCropIndex] = blob;
        const preview = document.getElementById(`preview-${currentCropIndex}`);
        preview.src = URL.createObjectURL(blob);
        cropModal.hide();
    }, 'image/jpeg', 0.9);
});

// 4. Remove New Image
function removeImage(index) {
    const input = document.getElementById(`image${index}`);
    const preview = document.getElementById(`preview-${index}`);
    const uploadContent = document.getElementById(`upload-content-${index}`);
    const actions = document.getElementById(`actions-${index}`);

    input.value = '';
    preview.src = '';
    preview.style.display = 'none';
    uploadContent.style.display = 'block';
    actions.style.display = 'none';

    delete originalFiles[index];
    delete croppedBlobs[index];
}

// 5. Delete Existing Image (AJAX)
async function deleteExistingImage(productId, imageName, index) {

    const count = getActualImageCount();
    if (count <= 2) {
        Swal.fire({ icon: 'warning', title: 'Cannot Delete', text: 'A product must have at least 2 images.' });
        return;
    }

    const { isConfirmed } = await Swal.fire({
        title: 'Delete Image?',
        text: "This image will be removed permanently.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    });

    if (isConfirmed) {
        try {
            // Updated to use POST and JSON body
            constresponse = await fetch('/admin/removeProductImage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, image: imageName })
            });

            const response = await fetch('/admin/removeProductImage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, image: imageName })
            });

            const data = await response.json();

            if (data.success) {
                // Update UI: Remove existing view, show upload view
                const existingView = document.getElementById(`existing-view-${index}`);
                if (existingView) existingView.remove();

                const uploadContent = document.getElementById(`upload-content-${index}`);
                if (uploadContent) uploadContent.style.display = 'block';

                // Allow clicking the container to trigger file input
                const dropZone = document.getElementById(`drop-zone-${index}`);
                if (dropZone) dropZone.setAttribute('onclick', `document.getElementById('image${index}').click()`);

                const imgInput = document.getElementById(`image${index}`);
                if (imgInput) imgInput.value = '';

                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Image deleted',
                    showConfirmButton: false,
                    timer: 1500
                });

            } else {
                throw new Error(data.message);
            }
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'Failed to delete image: ' + e.message, 'error');
        }
    }
}

// Helper: Count total images (Current Visible Existing + New Uploads)
function getActualImageCount() {
    // Count existing images visible
    const existing = document.querySelectorAll('[id^="existing-view-"]').length; // fixed selector to match DIVs not img
    // Count new files selected
    const newFiles = Object.keys(originalFiles).length;
    return existing + newFiles;
}

// 6. Validation
function validateForm() {
    let isValid = true;
    const required = ['productName', 'description', 'brand', 'color', 'size', 'material', 'quantity', 'regularPrice', 'sellingPrice'];

    required.forEach(field => {
        const el = document.getElementById(field);
        if (!el.value.trim()) {
            el.classList.add('is-invalid');
            isValid = false;
        } else {
            el.classList.remove('is-invalid');
        }
    });

    const regPrice = parseFloat(document.getElementById('regularPrice').value);
    const sellPrice = parseFloat(document.getElementById('sellingPrice').value);

    if (sellPrice >= regPrice) {
        document.getElementById('sellingPrice').classList.add('is-invalid');
        isValid = false;
    }

    // Image Count Check
    if (getActualImageCount() < 2) {
        Swal.fire({ icon: 'warning', title: 'Images Missing', text: 'Product must have at least 2 images (Max 6).' });
        isValid = false;
    }

    return isValid;
}

// 7. Submit
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    Swal.fire({ title: 'Updating...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const formData = new FormData(form);

    // Remove default images field to avoid duplicates/wrong types
    formData.delete('images');

    for (let i = 1; i <= 6; i++) {
        const blob = croppedBlobs[i];
        const original = originalFiles[i];
        if (blob) {
            formData.append('images', blob, `image-${i}.jpg`);
        } else if (original) {
            formData.append('images', original);
        }
    }

    try {
        const response = await fetch('/admin/updateProduct', {
            method: 'POST',
            body: formData
        });

        // Controller returns JSON usually? Wait, updateProduct in controller calls res.status(200).json or redirect?
        // Let's check controller. It returns JSON { message: 'sucessfully updated' }.

        const result = await response.json();
        if (response.ok) {
            Swal.fire({ icon: 'success', title: 'Success', text: 'Product updated successfully.' })
                .then(() => window.location.href = '/admin/products');
        } else {
            throw new Error(result.message || 'Update failed');
        }
    } catch (error) {
        Swal.fire('Error', error.message, 'error');
    }
});
