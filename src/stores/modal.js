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
            // Pass callback functions instead of HTML string
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
            // Store button texts for the modal component to use
            props: {
                confirmText: options.confirmText || 'Delete',
                cancelText: options.cancelText || 'Cancel',
                confirmClass: 'px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700',
                cancelClass: 'px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200'
            }
        });
    });
}