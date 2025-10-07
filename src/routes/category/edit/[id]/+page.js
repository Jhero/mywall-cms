// src/routes/category/edit/[id]/+page.js
import { error } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { authStore } from '../../../../stores/auth.js';
import { cleanImageUrl } from '../../../../lib/imageUtils.js';

/** @type {import('./$types').PageLoad} */
// export async function load({ params, fetch, url }) {
//     const { id } = params;
    
//     // Validate ID
//     if (!id || isNaN(parseInt(id))) {
//         throw error(400, 'Invalid category ID');
//     }
    
//     // Get current auth state
//     const auth = get(authStore);
//     const token = auth?.user?.token;
    
//     try {
//         // Setup headers
//         const headers = {
//             'Content-Type': 'application/json',
//         };

//         if (token) {
//             headers.Authorization = `Bearer ${token}`;
//         }

//         // Fetch category data dengan query parameters sesuai format baru
//         const apiUrl = `/api/categories?page=1&limit=10&name=&sort_by=name&sort_order=desc`;
//         console.log('Fetching categories from:', apiUrl); // Debug log
        
//         const response = await fetch(apiUrl, {
//             headers: headers
//         });
        
//         console.log('API Response status:', response.status); // Debug log
        
//         if (!response.ok) {
//             if (response.status === 404) {
//                 throw error(404, 'Category not found');
//             }
//             if (response.status === 401) {
//                 throw error(401, 'Unauthorized');
//             }
//             throw error(response.status, 'Failed to load categories');
//         }
        
//         const result = await response.json();
//         console.log('API Response data:', result); // Debug log
        
//         // Handle API response structure
//         if (!result.status || !result.data || !result.data.data) {
//             console.error('Invalid API response structure:', result);
//             throw error(500, 'Invalid API response structure');
//         }
        
//         // Find the specific category from the list
//         const categories = result.data.data;
//         const category = categories.find(cat => cat.ID === parseInt(id));
        
//         if (!category) {
//             throw error(404, `Category with ID ${id} not found in the list`);
//         }
        
//         console.log('Found category:', category); // Debug log
        
//         // Transform data to match our frontend structure
//         const transformedCategory = {
//             id: category.ID,
//             name: category.name || '',
//             description: category.description || '',
//             slug: category.slug || '',
//             isActive: category.isActive !== undefined ? category.isActive : true,
//             image: category.image || null,
//             imageUrl: category.image_url || '',
//             userId: category.user_id,
//             createdAt: category.CreatedAt,
//             updatedAt: category.UpdatedAt,
//             deletedAt: category.DeletedAt
//         };
        
//         console.log('Transformed category data:', transformedCategory); // Debug log
        
//         return {
//             category: transformedCategory,
//             categoryId: parseInt(id)
//         };
        
//     } catch (err) {
//         console.error('Error loading category:', err);
        
//         // If it's already a SvelteKit error, re-throw it
//         if (err.status) {
//             throw err;
//         }
        
//         // Otherwise, throw a generic server error
//         throw error(500, 'Failed to load category data: ' + err.message);
//     }
// }

export async function load({ params, fetch }) {
    const { id } = params;
    
    // Validate ID
    if (!id || isNaN(parseInt(id))) {
        throw error(400, 'Invalid category ID');
    }
    
    // Get current auth state
    const auth = get(authStore);
    const token = auth?.user?.token;
    
    try {
        // Setup headers
        const headers = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        // Gunakan endpoint khusus untuk single category jika ada
        const apiUrl = `/api/categories/${id}`;
        console.log('Fetching category from:', apiUrl);
        
        const response = await fetch(apiUrl, {
            headers: headers
        });
        
        console.log('API Response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw error(404, 'Category not found');
            }
            if (response.status === 401) {
                throw error(401, 'Unauthorized');
            }
            throw error(response.status, 'Failed to load category');
        }
        
        const result = await response.json();
        console.log('API Response data:', result);
        
        // Handle different response structures
        let categoryData;
        
        if (result.status && result.data) {
            // Structure: { status: true, data: { ...category data } }
            categoryData = result.data;
        } else if (result.data) {
            // Structure: { data: { ...category data } }
            categoryData = result.data;
        } else {
            // Structure: direct category data
            categoryData = result;
        }
        
        // Transform data to match our frontend structure
        const transformedCategory = {
            id: categoryData.ID || categoryData.id || parseInt(id),
            name: categoryData.name || '',
            description: categoryData.description || '',
            slug: categoryData.slug || '',
            isActive: categoryData.isActive !== undefined ? categoryData.isActive : true,
            image: categoryData.image || null,
            // imageUrl: categoryData.image_url || categoryData.imageUrl || '',
            imageUrl: cleanImageUrl(categoryData.image_url || categoryData.imageUrl || ''),
            userId: categoryData.user_id || categoryData.userId,
            createdAt: categoryData.CreatedAt || categoryData.createdAt,
            updatedAt: categoryData.UpdatedAt || categoryData.updatedAt,
            deletedAt: categoryData.DeletedAt || categoryData.deletedAt
        };
        
        console.log('Transformed category data:', transformedCategory);
        
        return {
            category: transformedCategory,
            categoryId: parseInt(id)
        };
        
    } catch (err) {
        console.error('Error loading category:', err);
        
        if (err.status) {
            throw err;
        }
        
        throw error(500, 'Failed to load category data: ' + err.message);
    }
}