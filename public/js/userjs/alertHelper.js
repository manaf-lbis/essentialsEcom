

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    customClass: {
        popup: 'modern-toast'
    },
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});

window.SuccessToast = (message) => {
    Toast.fire({
        icon: 'success',
        title: message
    });
};

window.ErrorToast = (message) => {
    Toast.fire({
        icon: 'error',
        title: message
    });
};

window.WarningToast = (message) => {
    Toast.fire({
        icon: 'warning',
        title: message
    });
};

window.ConfirmAction = async (title, text, confirmButtonText = 'Yes, Proceed', icon = 'warning') => {
    return Swal.fire({
        title: title,
        text: text,
        icon: icon,
        showCancelButton: true,
        confirmButtonText: confirmButtonText,
        cancelButtonText: 'Cancel',
        reverseButtons: true,
    });
};
