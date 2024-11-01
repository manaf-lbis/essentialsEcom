
//delete category =============================

const deleteBtn = document.getElementById('deleteBtn');
const deleteBtns = document.querySelectorAll('.deleteBtn');


// Add confirmation before delete
deleteBtns.forEach(deleteBtn => {
    deleteBtn.addEventListener('click', (event) => {


        event.preventDefault(); // Prevent the default delete action

        const deleteUrl = deleteBtn.getAttribute('href'); // Get the delete URL

        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        }).then((result) => {
            if (result.isConfirmed) {
                // If confirmed, redirect to the delete URL
                window.location.href = deleteUrl;
            }
        });
    });
});


// restore category =======================

const restoreBtn = document.getElementById('restoreBtn')

restoreBtn.addEventListener('click', async (event) => {

    event.preventDefault();

    // alert
    const swalWithBootstrapButtons = Swal.mixin({
        customClass: {
            confirmButton: "btn btn-success",
            cancelButton: "btn btn-danger"
        },
        buttonsStyling: false
    });
    swalWithBootstrapButtons.fire({
        title: "Are you sure?",
        text: "Are you sure want to Restore this category",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, Restore It!",
        cancelButtonText: "No, cancel!",
        reverseButtons: true
    }).then(async (result) => {
        if (result.isConfirmed) {

            await swalWithBootstrapButtons.fire({
                title: "Restored!",
                text: "Category Restored Sucessfully",
                icon: "success"
            });

            //sending restore request 
            const request = restoreBtn.getAttribute('href'); //getting restore  request url
            window.location.href = request

        } else if (
            /* Read more about handling dismissals below */
            result.dismiss === Swal.DismissReason.cancel
        ) {
            swalWithBootstrapButtons.fire({
                title: "Cancelled",
                text: "Cancelled request",
                icon: "error"
            });
        }
    });



})



