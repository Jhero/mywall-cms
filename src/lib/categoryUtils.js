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
export const saveCategory = async (categoryId, categoryData, fetch) => {
    const config = createConfig();
    
    const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
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
};

// Bisa ditambahkan fungsi lain seperti:
// - createCategory (untuk halaman create)
// - deleteCategory (untuk action delete)
// - listCategories (untuk halaman list dengan filter/search)
// dll sesuai kebutuhan