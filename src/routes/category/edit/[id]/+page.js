// src/routes/category/edit/[id]/+page.js
import { error } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { authStore } from '../../../../stores/auth.js';

/** @type {import('./$types').PageLoad} */
export async function load({ params, fetch }) {
    const { id } = params;
    
    // Validate ID
    if (!id || isNaN(parseInt(id))) {
        throw error(400, 'Invalid category ID');
    }
    
    // Get current auth state
    const auth = get(authStore);
    const token = auth?.user?.token;
    
    // Setup headers
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    if (token) {
        defaultHeaders.Authorization = `Bearer ${token}`;
    }

    const config = {
        headers: defaultHeaders,
    };
    
    try {
        // Fetch category data
        const response = await fetch(`/api/categories/${id}`, config);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw error(404, 'Category not found');
            }
            if (response.status === 401) {
                throw error(401, 'Unauthorized');
            }
            throw error(response.status, 'Failed to load category');
        }
        
        const category = await response.json();
        
        return {
            category,
            categoryId: parseInt(id)
        };
    } catch (err) {
        console.error('Error loading category:', err);
        
        // If it's already a SvelteKit error, re-throw it
        if (err.status) {
            throw err;
        }
        
        // Otherwise, throw a generic server error
        throw error(500, 'Failed to load category data');
    }
}