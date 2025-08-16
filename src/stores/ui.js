import { writable } from 'svelte/store';

export const uiStore = writable({
    sidebarCollapsed: false,
    currentPage: 'dashboard',
    showModal: false,
    modalType: null,
    loading: false,
    theme: 'light'
});

export const toggleSidebar = () => {
    uiStore.update(state => ({
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed
    }));
};

export const setCurrentPage = (page) => {
    uiStore.update(state => ({
        ...state,
        currentPage: page
    }));
};

export const showModal = (type) => {
    uiStore.update(state => ({
        ...state,
        showModal: true,
        modalType: type
    }));
};

export const hideModal = () => {
    uiStore.update(state => ({
        ...state,
        showModal: false,
        modalType: null
    }));
};
