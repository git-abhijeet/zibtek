import Swal from 'sweetalert2';

export const showSuccess = (message, timer = 1500) => {
    return Swal.fire({
        icon: 'success',
        title: message,
        showConfirmButton: false,
        timer,
    });
};

export const showError = (message) => {
    return Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: message,
    });
};

export const showInfo = (message, timer = 2000) => {
    return Swal.fire({
        icon: 'info',
        title: message,
        showConfirmButton: false,
        timer,
    });
};
