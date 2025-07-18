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

// Delete confirmation popup
export const showDeleteConfirmation = (itemName = 'this item') => {
    return Swal.fire({
        icon: 'warning',
        title: 'Confirm Deletion',
        text: `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
        showCancelButton: true,
        confirmButtonColor: '#D72638',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
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

// Logout confirmation popup
export const showLogoutConfirmation = () => {
    return Swal.fire({
        icon: 'question',
        title: 'Confirm Logout',
        text: 'Are you sure you want to logout? Any unsaved changes will be lost.',
        showCancelButton: true,
        confirmButtonColor: '#D72638',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Logout',
        cancelButtonText: 'Cancel',
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

// Unsaved changes confirmation popup
export const showUnsavedChangesConfirmation = () => {
    return Swal.fire({
        icon: 'warning',
        title: 'Unsaved Changes',
        text: 'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.',
        showCancelButton: true,
        confirmButtonColor: '#D72638',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Leave',
        cancelButtonText: 'Stay',
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

// User action confirmation popup
export const showUserActionConfirmation = (action, userName) => {
    return Swal.fire({
        icon: 'question',
        title: `Confirm ${action}`,
        text: `Are you sure you want to ${action.toLowerCase()} ${userName}?`,
        showCancelButton: true,
        confirmButtonColor: '#D72638',
        cancelButtonColor: '#6c757d',
        confirmButtonText: action,
        cancelButtonText: 'Cancel',
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

// Password change confirmation popup
export const showPasswordChangeConfirmation = () => {
    return Swal.fire({
        icon: 'info',
        title: 'Password Change',
        text: 'Your password has been changed successfully. You will be logged out and need to login with your new password.',
        confirmButtonColor: '#28a745',
        confirmButtonText: 'OK',
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

// Bulk action confirmation popup
export const showBulkActionConfirmation = (action, count) => {
    return Swal.fire({
        icon: 'warning',
        title: `Confirm Bulk ${action}`,
        text: `Are you sure you want to ${action.toLowerCase()} ${count} selected item(s)? This action cannot be undone.`,
        showCancelButton: true,
        confirmButtonColor: '#D72638',
        cancelButtonColor: '#6c757d',
        confirmButtonText: action,
        cancelButtonText: 'Cancel',
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