// Object to store Cropper instances for each image
var croppers = {};

// Function to initialize the cropper when an image is uploaded
function prepareCrop(event, previewId) {
    const input = event.target;
    const imagePreview = document.getElementById(previewId);

    // If a file is selected, create a new cropper instance
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';

            // Initialize the Cropper once the image is fully loaded
            imagePreview.onload = function () {
                // If a cropper already exists, reinitialize it (allow re-cropping)
                if (croppers[previewId]) {
                    croppers[previewId].replace(imagePreview.src); // Update the cropper with new image
                } else {
                    // Initialize the cropper
                    croppers[previewId] = new Cropper(imagePreview, {
                        aspectRatio: 1 / 1,
                        viewMode: 1,
                        autoCropArea: 1,
                        scalable: true,
                        zoomable: true,
                        movable: true,
                        cropBoxResizable: true,
                    });
                }
            };
        };
        reader.readAsDataURL(input.files[0]);
    }
}

let croppedImages = [];
// Function to crop the image and display the result
function cropImage(canvasId, previewId) {
    const croppedImagePreview = document.getElementById(previewId);
    const imagePreviewId = previewId.replace(
        'croppedImagePreview',
        'imagePreview'
    );
    const cropper = croppers[imagePreviewId];

    if (cropper) {
        const croppedCanvas = cropper.getCroppedCanvas();

        if (croppedCanvas) {
            const croppedImageData = croppedCanvas.toDataURL('image/jpeg');

            croppedCanvas.toBlob(function (blob) {
                croppedImages.push(blob); // Store the blob in the array instead of an object
                console.log('Cropped image stored:', blob);
            }, 'image/jpeg');

            // Display the cropped image in the preview div
            croppedImagePreview.innerHTML =
                '<img src="' +
                croppedImageData +
                '" alt="Cropped Image" style="width: 100px;">';
        } else {
            console.error('Cropped canvas not available.');
        }

        // Optionally, destroy the cropper after cropping
        cropper.destroy();
        delete croppers[imagePreviewId];
    } else {
        console.error('Cropper is not initialized for', previewId);
    }
}

// form validation

const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
// const form = document.getElementById('form');

function clearErr() {
    const err = document.getElementsByClassName('validate-err');
    for (let ele of err) {
        ele.innerHTML = '';
    }
    return true;
}

submitBtn.addEventListener('click', (e) => {
    const productName = document.getElementById('productName').value;
    const brandName = document.getElementById('brandName').value;
    const color = document.getElementById('color').value;
    const size = document.getElementById('size').value;
    // const category = document.getElementById('category').value;
    const regularPrice = document.getElementById('regularPrice').value;
    const sellingPrice = document.getElementById('sellingPrice').value;
    const material = document.getElementById('material').value;
    const description = document.getElementById('description').value;
    const quantity = document.getElementById('quantity').value;
    const image1 = document.getElementById('imagePreview1').src;
    const image2 = document.getElementById('imagePreview2').src;
    const image3 = document.getElementById('imagePreview3').src;
    const _id = document.getElementById('_id').value;

    clearErr()

   
    e.preventDefault();

    let validatation = true;

    if (productName.length < 4) {
        validatation = false;
        document.getElementById('productNameErr').innerHTML =
            'Product name Shoul atleast 4 Char.';
    }

    if (brandName.length < 4) {
        validatation = false;
        document.getElementById('brandNameErr').innerHTML =
            'Brand name Shoul atleast 4 Char.';
    }

    if (color.length < 3) {
        validatation = false;
        document.getElementById('colorErr').innerHTML = 'Enter a Valid Color.';
    }

    if (size.length <= 0) {
        validatation = false;
        document.getElementById('sizeErr').innerHTML = 'Enter a proper size';
    }

    // if (category === '') {
    //     validatation = false;
    //     document.getElementById('categoryErr').innerHTML = 'Select Category';
    // }

    if (regularPrice <= 0) {
        validatation = false;
        document.getElementById('priceErr1').innerHTML =
            'Price shoul be greater than 0';
    }

    if (quantity <= 0) {
        validatation = false;
        document.getElementById('quantityErr').innerHTML =
            'Quantity should be minimum 1';
    }


    if (sellingPrice <= 0 || Number(sellingPrice) > Number(regularPrice)) {
        validatation = false;
        document.getElementById('priceErr2').innerHTML =
            'Selling price Should be Lessthan regular price';
    }

    if (material.length < 3) {
        validatation = false;
        document.getElementById('materialErr').innerHTML = 'enter a valid Material';
    }

    if (description.length < 50) {
        validatation = false;
        document.getElementById('descriptionErr').innerHTML =
            'Description Should be minimum 50 charater';
    }

    if (!image1) {
        alert('not avail');
        
        validatation = false;
        document.getElementById('productImage1Err').innerHTML = 'Upload image';
    }

    if (!image2) {
        validatation = false;
        document.getElementById('productImage2Err').innerHTML = 'Upload image';
    }

    if (!image3) {
        validatation = false;
        document.getElementById('productImage3Err').innerHTML = 'Upload image';
    }

    if (validatation) {
 
        submitDataToServer();
    }

   async function submitDataToServer() {
        const formData = new FormData();

        // Append text data
        formData.append('productName', productName);
        formData.append('brand', brandName);
        formData.append('color', color);
        formData.append('size', size);
        // formData.append('category', category);
        formData.append('regularPrice', regularPrice);
        formData.append('sellingPrice', sellingPrice);
        formData.append('material', material);
        formData.append('description', description);
        formData.append('quantity', quantity);
        formData.append('_id',_id)

        // Append cropped images to FormData
        for (let i = 0; i < croppedImages.length; i++) {
            const imageBlob = croppedImages[i];
            formData.append('images', imageBlob, `image_${i}.png`); // Ensure the 'images' field name matches multer config
        }


        // Send data to the server
        const response = await fetch('/admin/updateProduct', {
            method: 'POST',
            body: formData,
        });

        if(response.ok){
           await Swal.fire({
                title: "Success",
                text: "Product updated sucessfull",
                icon: "success"
            });

            window.location.href = '/admin/products';
        }else{
            await Swal.fire({
                title: "Failed",
                text: "Product added Failed please try again ",
                icon: "error"
            });

            window.location.href = '/admin/products';

        }


    }

});



//deletion
const imageDeleteBtn =  document.querySelectorAll('.imageDeleteBtn');

imageDeleteBtn.forEach((ele)=>{
    ele.addEventListener('click',deleteImage)
})

async function deleteImage(event){
    event.preventDefault();

    const deleteUrl = event.target.closest('a').getAttribute('href')
    


   await Swal.fire({
        title: "Are tou sure want to remove the image?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, Remove it!"
      }).then( async (result) => {
        if (result.isConfirmed) {
         await Swal.fire({
            title: "Image Removed!",
            text: "Your file has been deleted.",
            icon: "success",
            showConfirmButton: false,
            timer: 1000
          });

        // continue delete
          window.location.href = deleteUrl;
        }
      });


}


