
// State Management
let cropper = null;
let currentCropIndex = null;
const croppedBlobs = {}; // Stores final blobs: {1: Blob, 2: Blob, 3: Blob}
const originalFiles = {}; // Stores original files: {1: File, ...}

// DOM Elements
const form = document.getElementById('productForm');
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
        const reader = new FileReader();
        reader.onload = function (e) {
            const preview = document.getElementById(`preview-${index}`);
            const uploadContent = document.getElementById(`upload-content-${index}`);
            const actions = document.getElementById(`actions-${index}`);

            preview.src = e.target.result;
            preview.style.display = 'block';
            uploadContent.style.display = 'none';
            actions.style.display = 'flex';
        };
        reader.readAsDataURL(file);
    }
}

// 2. Init Crop Modal
function initCrop(index) {
    currentCropIndex = index;
    const file = originalFiles[index]; // Always crop from original
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        cropImageTarget.src = e.target.result;

        // Destroy old cropper if exists
        if (cropper) cropper.destroy();

        cropModal.show();

        // Init Cropper after modal is shown to ensure dimensions are correct
        setTimeout(() => {
            cropper = new Cropper(cropImageTarget, {
                aspectRatio: 1, // Square crop or free (NaN)
                viewMode: 1,
                autoCropArea: 0.8,
            });
        }, 200);
    };
    reader.readAsDataURL(file);
}

// 3. Apply Crop
btnApplyCrop.addEventListener('click', () => {
    if (!cropper) return;

    // Get cropped canvas
    const canvas = cropper.getCroppedCanvas({
        width: 800,
        height: 800,
        imageSmoothingQuality: 'high'
    });

    canvas.toBlob((blob) => {
        // Store blob
        croppedBlobs[currentCropIndex] = blob;

        // Update Preview
        const preview = document.getElementById(`preview-${currentCropIndex}`);
        preview.src = URL.createObjectURL(blob);

        cropModal.hide();

        // Optional: Notify user
        // Swal.fire({ icon: 'success', title: 'Cropped', toast: true, position: 'top-end', showConfirmButton: false, timer: 1000 });

    }, 'image/jpeg', 0.9);
});

// 4. Remove Image
function removeImage(index) {
    const input = document.getElementById(`image${index}`);
    const preview = document.getElementById(`preview-${index}`);
    const uploadContent = document.getElementById(`upload-content-${index}`);
    const actions = document.getElementById(`actions-${index}`);

    input.value = ''; // Reset file input
    preview.src = '';
    preview.style.display = 'none';
    uploadContent.style.display = 'block';
    actions.style.display = 'none';

    delete originalFiles[index];
    delete croppedBlobs[index];
}

// 5. Validation Logic
function validateForm() {
    let isValid = true;

    // Helper to set invalid
    const setInvalid = (id, msg) => {
        const el = document.getElementById(id);
        el.classList.add('is-invalid');
        const feedback = el.nextElementSibling;
        if (feedback) feedback.textContent = msg;
        isValid = false;
    };

    // Reset Validation
    document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

    // Required Fields
    const required = ['productName', 'description', 'brand', 'category', 'color', 'size', 'material', 'quantity', 'regularPrice', 'sellingPrice'];
    required.forEach(field => {
        const value = document.getElementById(field).value.trim();
        if (!value) setInvalid(field, `${field} is required`);
    });

    // Semantic Checks
    const regPrice = parseFloat(document.getElementById('regularPrice').value);
    const sellPrice = parseFloat(document.getElementById('sellingPrice').value);

    if (sellPrice >= regPrice) {
        setInvalid('sellingPrice', 'Selling Price must be lower than Regular Price');
    }

    // Image Count Check
    const imageCount = Object.keys(originalFiles).length;
    if (imageCount < 2) {
        Swal.fire({ icon: 'warning', title: 'Images Missing', text: 'Please upload at least 2 images (Max 6).' });
        isValid = false;
    }

    return isValid;
}

// 6. Handling Form Submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Show Loading
    Swal.fire({ title: 'Uploading...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const formData = new FormData(form);

    // Replace Images in FormData
    // We need to clear existing native 'images' from FormData because we want to send specific blobs/files
    formData.delete('images');

    // Append Images manually (Cropped > Original)
    // Constraint: Backend expects key 'images'
    for (let i = 1; i <= 6; i++) {
        const blob = croppedBlobs[i];
        const original = originalFiles[i];

        if (blob) {
            // Append cropped blob
            formData.append('images', blob, `image-${i}.jpg`);
        } else if (original) {
            // Append original file if not cropped
            formData.append('images', original);
        }
    }

    try {
        const response = await fetch('/admin/addProduct', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok && result.success) {
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Product added successfully.',
                confirmButtonText: 'Go to Products'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = '/admin/products';
                } else {
                    window.location.reload();
                }
            });
        } else {
            throw new Error(result.message || 'Validation failed');
        }

    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Something went wrong!'
        });
    }
});
