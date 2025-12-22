

let cropper = null;
let currentCropIndex = null;
const croppedBlobs = {};
const originalFiles = {};

const form = document.getElementById('productForm');
const cropModal = new bootstrap.Modal(document.getElementById('cropModal'), { keyboard: false });
const cropImageTarget = document.getElementById('cropImageTarget');
const btnApplyCrop = document.getElementById('btnApplyCrop');

function handleImageNative(input, index) {
    if (input.files && input.files[0]) {
        const file = input.files[0];

        if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
            Swal.fire({ icon: 'error', title: 'Invalid File', text: 'Please select a valid image (JPG, PNG, WEBP).' });
            input.value = '';
            return;
        }

        originalFiles[index] = file;

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
            cropper = new Cropper(cropImageTarget, {
                aspectRatio: 1,
                viewMode: 1,
                autoCropArea: 0.8,
            });
        }, 200);
    };
    reader.readAsDataURL(file);
}

btnApplyCrop.addEventListener('click', () => {
    if (!cropper) return;

    const canvas = cropper.getCroppedCanvas({
        width: 800,
        height: 800,
        imageSmoothingQuality: 'high'
    });

    canvas.toBlob((blob) => {

        croppedBlobs[currentCropIndex] = blob;

        const preview = document.getElementById(`preview-${currentCropIndex}`);
        preview.src = URL.createObjectURL(blob);

        cropModal.hide();

    }, 'image/jpeg', 0.9);
});

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

function validateForm() {
    let isValid = true;

    const setInvalid = (id, msg) => {
        const el = document.getElementById(id);
        el.classList.add('is-invalid');
        const feedback = el.nextElementSibling;
        if (feedback) feedback.textContent = msg;
        isValid = false;
    };

    document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

    const required = ['productName', 'description', 'brand', 'category', 'color', 'size', 'material', 'quantity', 'regularPrice', 'sellingPrice'];
    required.forEach(field => {
        const value = document.getElementById(field).value.trim();
        if (!value) setInvalid(field, `${field} is required`);
    });

    const regPrice = parseFloat(document.getElementById('regularPrice').value);
    const sellPrice = parseFloat(document.getElementById('sellingPrice').value);

    if (sellPrice >= regPrice) {
        setInvalid('sellingPrice', 'Selling Price must be lower than Regular Price');
    }

    const imageCount = Object.keys(originalFiles).length;
    if (imageCount < 2) {
        Swal.fire({ icon: 'warning', title: 'Images Missing', text: 'Please upload at least 2 images (Max 6).' });
        isValid = false;
    }

    return isValid;
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    Swal.fire({ title: 'Uploading...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const formData = new FormData(form);

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
