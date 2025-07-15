import Swal from 'sweetalert2';

// Centralized SweetAlert configurations for consistent styling across the app

// Success toast configuration
export const showSuccessToast = (title, text, timer = 3000) => {
    return Swal.fire({
        icon: 'success',
        title,
        text,
        timer,
        timerProgressBar: true,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
        width: '400px',
        padding: '1rem',
        customClass: {
            popup: 'swal-under-header'
        },
        backdrop: false,
        allowOutsideClick: true,
        allowEscapeKey: true,
        customStyle: {
            zIndex: 9999
        }
    });
};

// Error toast configuration
export const showErrorToast = (title, text, timer = 4000) => {
    return Swal.fire({
        icon: 'error',
        title,
        text,
        timer,
        timerProgressBar: true,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
        width: '400px',
        padding: '1rem',
        customClass: {
            popup: 'swal-under-header'
        },
        backdrop: false,
        allowOutsideClick: true,
        allowEscapeKey: true,
        customStyle: {
            zIndex: 9999
        }
    });
};

// Warning toast configuration
export const showWarningToast = (title, text, timer = 4000) => {
    return Swal.fire({
        icon: 'warning',
        title,
        text,
        timer,
        timerProgressBar: true,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
        width: '400px',
        padding: '1rem',
        customClass: {
            popup: 'swal-under-header'
        },
        backdrop: false,
        allowOutsideClick: true,
        allowEscapeKey: true,
        customStyle: {
            zIndex: 9999
        }
    });
};

// Info toast configuration
export const showInfoToast = (title, text, timer = 4000) => {
    return Swal.fire({
        icon: 'info',
        title,
        text,
        timer,
        timerProgressBar: true,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
        width: '400px',
        padding: '1rem',
        customClass: {
            popup: 'swal-under-header'
        },
        backdrop: false,
        allowOutsideClick: true,
        allowEscapeKey: true,
        customStyle: {
            zIndex: 9999
        }
    });
};

// Validation error toast configuration
export const showValidationErrors = (errors) => {
    const errorMessages = Object.values(errors).filter(Boolean);
    if (errorMessages.length > 0) {
        return Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            html: errorMessages.map(msg => `<div style="text-align: left; margin: 5px 0;">• ${msg}</div>`).join(''),
            timer: 5000,
            timerProgressBar: true,
            showConfirmButton: false,
            position: 'top-end',
            toast: true,
            width: '400px',
            padding: '1rem',
            customClass: {
                popup: 'swal-under-header'
            },
            backdrop: false,
            allowOutsideClick: true,
            allowEscapeKey: true,
            customStyle: {
                zIndex: 9999
            }
        });
    }
};

// Confirmation dialog configuration
export const showConfirmationDialog = (title, text, confirmButtonText = 'Yes', cancelButtonText = 'Cancel') => {
    return Swal.fire({
        icon: 'question',
        title,
        text,
        showCancelButton: true,
        confirmButtonColor: '#D72638',
        cancelButtonColor: '#6c757d',
        confirmButtonText,
        cancelButtonText,
        width: '400px',
        padding: '1rem',
        customClass: {
            popup: 'swal-under-header'
        },
        backdrop: true,
        allowOutsideClick: true,
        allowEscapeKey: true,
        customStyle: {
            zIndex: 9999
        }
    });
};

// Success modal configuration
export const showSuccessModal = (title, text, confirmButtonText = 'OK') => {
    return Swal.fire({
        icon: 'success',
        title,
        text,
        confirmButtonColor: '#28a745',
        confirmButtonText,
        width: '400px',
        padding: '1rem',
        customClass: {
            popup: 'swal-under-header'
        },
        backdrop: true,
        allowOutsideClick: true,
        allowEscapeKey: true,
        customStyle: {
            zIndex: 9999
        }
    });
};

// Error modal configuration
export const showErrorModal = (title, text, confirmButtonText = 'OK') => {
    return Swal.fire({
        icon: 'error',
        title,
        text,
        confirmButtonColor: '#D72638',
        confirmButtonText,
        width: '400px',
        padding: '1rem',
        customClass: {
            popup: 'swal-under-header'
        },
        backdrop: true,
        allowOutsideClick: true,
        allowEscapeKey: true,
        customStyle: {
            zIndex: 9999
        }
    });
};

// Loading dialog configuration
export const showLoadingDialog = (title = 'Loading...', text = 'Please wait') => {
    return Swal.fire({
        title,
        text,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        backdrop: true,
        customStyle: {
            zIndex: 9999
        },
        didOpen: () => {
            Swal.showLoading();
        }
    });
};

// Close any open SweetAlert
export const closeSweetAlert = () => {
    Swal.close();
}; 