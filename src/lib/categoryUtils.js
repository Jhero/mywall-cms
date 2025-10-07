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
// export const saveCategory = async (categoryId, categoryData) => {
//     try {
//         const config = createConfig();
//         const isUpdate = categoryId && categoryId !== null && categoryId !== undefined && categoryId !== '';
//         const method = isUpdate ? 'PUT' : 'POST';
//         const url = method==="PUT" ? `/api/categories/${categoryId}` : '/api/categories';
        
//         const response = await fetch(url, {
//             method:method,
//             ...config,
//             body: JSON.stringify(categoryData),
//         });

//         if (!response.ok) {
//             const errorData = await response.json();
//             throw {
//                 status: response.status,
//                 errors: errorData.errors,
//                 message: errorData.message || 'Failed to update category'
//             };
//         }

//         return await response.json();        
//     } catch (error) {
//         // Handle network or other errors
//         if (error.status && error.errors) {
//             throw error; // Re-throw API errors
//         }
        
//         throw {
//             status: 0,
//             errors: {},
//             message: 'Network error occurred. Please try again.'
//         };        
//     }
// };

export async function saveCategory(categoryId, data, isFormData = false) {
    try {
        const auth = get(authStore);
        const token = auth?.user?.token;

        const options = {
            method: categoryId ? 'PUT' : 'POST',
            headers: {}
        };

        // Add authorization header if token exists
        if (token) {
            options.headers.Authorization = `Bearer ${token}`;
        }

        if (isFormData) {
            // For FormData (file upload)
            options.body = data;
        } else {
            // For JSON data - sesuaikan dengan struktur API baru
            options.headers['Content-Type'] = 'application/json';
            
            const requestData = {
                name: data.name?.trim(),
                isActive: data.isActive,
                // Tambahkan field lain sesuai kebutuhan API
                ...data
            };
            
            options.body = JSON.stringify(requestData);
        }

        const url = categoryId 
            ? `/api/categories/${categoryId}`
            : '/api/categories';

        const response = await fetch(url, options);
        const result = await response.json();

        console.log('Save category response:', result); // Debug log

        if (!response.ok) {
            throw new Error(result.message || 'Gagal menyimpan kategori');
        }

        // Handle API response structure
        if (result.status && result.data) {
            return result.data;
        } else if (result.data) {
            return result.data;
        } else {
            return result;
        }

    } catch (error) {
        console.error('Error saving category:', error);
        throw error;
    }
}

// Function untuk get categories dengan pagination
export async function getCategories(params = {}) {
    try {
        const auth = get(authStore);
        const token = auth?.user?.token;

        const queryParams = new URLSearchParams({
            page: params.page || 1,
            limit: params.limit || 10,
            name: params.name || '',
            sort_by: params.sort_by || 'name',
            sort_order: params.sort_order || 'desc',
            ...params
        });

        const headers = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`/api/categories?${queryParams}`, {
            headers: headers
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Gagal mengambil data kategori');
        }

        return result;
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
}

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