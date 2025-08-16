import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Initial state
const initialState = {
    isAuthenticated: false,
    user: null,
    token: null
};

// Create the store
function createAuthStore() {
    const { subscribe, set, update } = writable(initialState);
    
    return {
        subscribe,
        
        // Login function
        login: (userData) => {
            const authData = {
                isAuthenticated: true,
                user: userData,
                token: 'demo-token-' + Date.now() // In real app, this comes from API
            };
            
            set(authData);
            
            // Save to localStorage if in browser
            if (browser) {
                localStorage.setItem('auth', JSON.stringify(authData));
            }
        },
        
        // Logout function
        logout: () => {
            set(initialState);
            
            // Remove from localStorage if in browser
            if (browser) {
                localStorage.removeItem('auth');
                localStorage.removeItem('authToken');
            }
        },
        
        // Initialize auth from localStorage
        init: () => {
            if (browser) {
                const stored = localStorage.getItem('auth');
                if (stored) {
                    try {
                        const authData = JSON.parse(stored);
                        // Validate stored data
                        if (authData.isAuthenticated && authData.user && authData.token) {
                            set(authData);
                        }
                    } catch (error) {
                        console.error('Error parsing stored auth data:', error);
                        localStorage.removeItem('auth');
                    }
                }
            }
        },
        
        // Update user data
        updateUser: (userData) => {
            update(state => ({
                ...state,
                user: { ...state.user, ...userData }
            }));
        }
    };
}

export const authStore = createAuthStore();

// Initialize the store when in browser
if (browser) {
    authStore.init();
}