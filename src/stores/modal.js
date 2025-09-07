import { writable } from 'svelte/store';

export const modalState = writable({
    isOpen: false,
    title: '',
    content: '',
    size: 'md',
    closable: true,
    actions: null,
    component: null,
    props: {},
    // Add callback functions for confirmation modals
    onConfirm: null,
    onCancel: null
});

export function openModal(options) {
    modalState.set({
        isOpen: true,
        title: options.title || '',
        content: options.content || '',
        size: options.size || 'md',
        closable: options.closable !== false,
        actions: options.actions || null,
        component: options.component || null,
        props: options.props || {},
        onConfirm: options.onConfirm || null,
        onCancel: options.onCancel || null
    });
}

export function closeModal() {
    modalState.update(state => ({ ...state, isOpen: false }));
}

// Helper function untuk delete confirmation
export function confirmDelete(options) {    
    return new Promise((resolve) => {
        openModal({
            title: options.title || 'Delete Confirmation',
            content: options.message || 'Are you sure you want to delete this item?',
            size: options.size || 'sm',
            closable: options.closable !== false,
            onConfirm: () => {
                console.info("Confirm button clicked");
                closeModal();
                resolve(true);
            },
            onCancel: () => {
                console.info("Cancel button clicked");
                closeModal();
                resolve(false);
            },
            props: {
                confirmText: options.confirmText || 'Delete',
                cancelText: options.cancelText || 'Cancel',
                confirmClass: 'px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700',
                cancelClass: 'px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200'
            }
        });
    });
}

// General confirmation dialog
export function confirm(options) {
    return new Promise((resolve) => {
        openModal({
            title: options.title || 'Confirmation',
            content: options.message || 'Are you sure?',
            size: options.size || 'sm',
            closable: options.closable !== false,
            onConfirm: () => {
                console.info("Confirm button clicked");
                closeModal();
                resolve(true);
            },
            onCancel: () => {
                console.info("Cancel button clicked");
                closeModal();
                resolve(false);
            },
            props: {
                confirmText: options.confirmText || 'Confirm',
                cancelText: options.cancelText || 'Cancel',
                confirmClass: options.confirmClass || 'px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700',
                cancelClass: options.cancelClass || 'px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200'
            }
        });
    });
}

// Alert/Info dialog (single button)
export function alert(options) {
    return new Promise((resolve) => {
        openModal({
            title: options.title || 'Information',
            content: options.message || '',
            size: options.size || 'sm',
            closable: options.closable !== false,
            onConfirm: () => {
                console.info("OK button clicked");
                closeModal();
                resolve(true);
            },
            props: {
                confirmText: options.confirmText || 'OK',
                confirmClass: options.confirmClass || 'px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700',
                alertMode: true // Flag to show only one button
            }
        });
    });
}

// Success notification
export function showSuccess(options) {
    return new Promise((resolve) => {
        openModal({
            title: options.title || 'Success',
            content: options.message || 'Operation completed successfully!',
            size: options.size || 'sm',
            closable: options.closable !== false,
            onConfirm: () => {
                console.info("Success OK clicked");
                closeModal();
                resolve(true);
            },
            props: {
                confirmText: options.confirmText || 'OK',
                confirmClass: 'px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700',
                alertMode: true,
                icon: 'success' // Could be used to show success icon
            }
        });
    });
}

// Error notification
export function showError(options) {
    return new Promise((resolve) => {
        openModal({
            title: options.title || 'Error',
            content: options.message || 'An error occurred!',
            size: options.size || 'sm',
            closable: options.closable !== false,
            onConfirm: () => {
                console.info("Error OK clicked");
                closeModal();
                resolve(true);
            },
            props: {
                confirmText: options.confirmText || 'OK',
                confirmClass: 'px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700',
                alertMode: true,
                icon: 'error' // Could be used to show error icon
            }
        });
    });
}

// Warning notification
export function showWarning(options) {
    return new Promise((resolve) => {
        openModal({
            title: options.title || 'Warning',
            content: options.message || 'Please be careful!',
            size: options.size || 'sm',
            closable: options.closable !== false,
            onConfirm: () => {
                console.info("Warning OK clicked");
                closeModal();
                resolve(true);
            },
            props: {
                confirmText: options.confirmText || 'OK',
                confirmClass: 'px-4 py-2 text-white bg-yellow-600 rounded-lg hover:bg-yellow-700',
                alertMode: true,
                icon: 'warning' // Could be used to show warning icon
            }
        });
    });
}

// Save confirmation (for unsaved changes)
export function confirmSave(options) {
    return new Promise((resolve) => {
        openModal({
            title: options.title || 'Unsaved Changes',
            content: options.message || 'You have unsaved changes. Do you want to save them?',
            size: options.size || 'sm',
            closable: options.closable !== false,
            onConfirm: () => {
                console.info("Save button clicked");
                closeModal();
                resolve('save');
            },
            onCancel: () => {
                console.info("Don't save button clicked");
                closeModal();
                resolve('discard');
            },
            props: {
                confirmText: options.confirmText || 'Save',
                cancelText: options.cancelText || "Don't Save",
                confirmClass: 'px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700',
                cancelClass: 'px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200',
                showThirdButton: true,
                thirdButtonText: options.thirdButtonText || 'Cancel',
                thirdButtonClass: 'px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50',
                onThirdButton: () => {
                    console.info("Cancel button clicked");
                    closeModal();
                    resolve('cancel');
                }
            }
        });
    });
}

// Custom form modal
export function showForm(options) {
    return new Promise((resolve) => {
        openModal({
            title: options.title || 'Form',
            content: options.content || '',
            size: options.size || 'md',
            closable: options.closable !== false,
            component: options.component, // Pass custom form component
            props: {
                ...options.props,
                onSubmit: (data) => {
                    console.info("Form submitted", data);
                    closeModal();
                    resolve({ success: true, data });
                },
                onCancel: () => {
                    console.info("Form cancelled");
                    closeModal();
                    resolve({ success: false, data: null });
                }
            }
        });
    });
}

// Loading modal (non-closable by default)
export function showLoading(options) {
    openModal({
        title: options.title || 'Loading...',
        content: options.message || 'Please wait...',
        size: options.size || 'sm',
        closable: options.closable === true, // Default to false for loading
        props: {
            loading: true,
            icon: 'loading'
        }
    });
}

// Hide loading modal
export function hideLoading() {
    closeModal();
}

// Image preview modal
export function showImage(options) {
    return new Promise((resolve) => {
        openModal({
            title: options.title || 'Image Preview',
            content: '',
            size: options.size || 'lg',
            closable: options.closable !== false,
            onConfirm: () => {
                closeModal();
                resolve(true);
            },
            props: {
                imageSrc: options.src,
                imageAlt: options.alt || 'Preview',
                confirmText: 'Close',
                confirmClass: 'px-4 py-2 text-white bg-gray-600 rounded-lg hover:bg-gray-700',
                alertMode: true,
                imageMode: true
            }
        });
    });
}