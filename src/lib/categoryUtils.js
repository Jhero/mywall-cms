// src/lib/categoryUtils.js
import { get } from 'svelte/store';
import { authStore } from '../stores/auth.js';

// Helper function untuk membuat config dengan auth
const createConfig = () => {
    const auth = get(authStore);
    const token = auth?.user?.token;
    
    const headers = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return { headers };
};

// Save category function
export const saveCategory = async (categoryId, categoryData) => {
    try {
        const config = createConfig();
        const isUpdate = categoryId && categoryId !== null && categoryId !== undefined && categoryId !== '';
        const method = isUpdate ? 'PUT' : 'POST';
        const url = method==="PUT" ? `/api/categories/${categoryId}` : '/api/categories';
        
        const response = await fetch(url, {
            method:method,
            ...config,
            body: JSON.stringify(categoryData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw {
                status: response.status,
                errors: errorData.errors,
                message: errorData.message || 'Failed to update category'
            };
        }

        return await response.json();        
    } catch (error) {
        // Handle network or other errors
        if (error.status && error.errors) {
            throw error; // Re-throw API errors
        }
        
        throw {
            status: 0,
            errors: {},
            message: 'Network error occurred. Please try again.'
        };        
    }
};

export const deleteCategory = async (id) => {
    try {
        const config = createConfig();
        const method = 'DELETE';
        const url =  `/api/categories/${id}`;
        
        const response = await fetch(url, {
            method:method,
            ...config
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw {
                status: false,
                errors: errorData.error,
                message: errorData.message || 'Failed to update category'
            };
        }
        else {
            const result = await response.json();;
            const dataresponse = {
                status: true,
                message: result.message,
                errors: {}
            }
            return dataresponse;
        }
    } catch (error) {
        // Handle network or other errors
        if (error.status && error.errors) {
            throw error; // Re-throw API errors
        }
        
        throw {
            status: false,
            errors: {},
            message: 'Network error occurred. Please try again.'
        };        
    }
};
// Bisa ditambahkan fungsi lain seperti:
// - createCategory (untuk halaman create)
// - deleteCategory (untuk action delete)
// - listCategories (untuk halaman list dengan filter/search)
// dll sesuai kebutuhan