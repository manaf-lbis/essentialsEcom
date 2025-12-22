/**
 * Global Alert Helper for modern and beautiful SweetAlert2 notifications.
 * This utility provides pre-configured mixins for a consistent premium feel.
 */

// Toast Mixin
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

// Global Toast Functions
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

// Confirm Modal Function
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
