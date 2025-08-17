<script>
    import { onMount } from 'svelte';
    import { setCurrentPage } from '../../stores/ui.js';
    import { goto } from '$app/navigation';
    import { authStore } from '../../stores/auth.js';
    import { createEventDispatcher } from 'svelte';

    let user = "";

    authStore.subscribe(auth => {
        user = auth.user;
    });

    // Set the current page when component mounts
    onMount(() => {
        setCurrentPage('category');
    });
    const dispatch = createEventDispatcher();
    const token = user.token;            
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };
    
    if (token) {
        defaultHeaders.Authorization = `Bearer ${token}`;
    }
    
    const config = {
        headers: {
            ...defaultHeaders,
        },
    };

    // Your category logic here
    let categories = [];
    let isLoading = false;
    let totalPages = 0;
    let itemsPerPage  = 10;
    let totalItems  = 0;
    let currentPage = 1;
    let isAddingCategory = false;

    $: totalPages = Math.ceil(totalItems / itemsPerPage);


    // Load categories function
    const loadCategories = async () => {
        isLoading = true;
        try {
            // Replace with your actual API call
            const response = await fetch(`/api/categories?page=${currentPage}&limit=${itemsPerPage}`, config);
            const data = await response.json();
            
            categories = data || [];
            totalItems = data.total || categories.length;
        } catch (error) {
            console.error('Failed to load categories:', error);
            // Show error toast/notification
            showErrorNotification('Gagal memuat kategori');
        } finally {
            isLoading = false;
        }
    };
    
    // Handle add new category
    
    const handleAdd = () => {
        try {
            // Optional: Set loading state for add button
            isLoading = true;
            
            // Navigate to add category page
            goto('/category/add');
        } catch (error) {
            console.error('Navigation error:', error);
            showErrorNotification('Gagal membuka halaman tambah kategori');
        } finally {
            // Reset loading state
            isLoading = false;
        }        
    };
    
    // const handleEdit = (category) => {
    //     console.log('Editing category:', category);
    //     // Navigate to edit form or open modal with category data
    //     dispatch('editCategory', category);
    //     // Or use SvelteKit navigation:
    //     // goto(`/category/edit/${category.id}`);
    // };

    const handleEdit = async (category) => {
        try {
            // Optional: Set loading state for this specific row
            category.isEditing = true;
            
            // Navigate to edit page
            await goto(`/category/edit/${category.ID}`);
        } catch (error) {
            console.error('Navigation error:', error);
            showErrorNotification('Gagal membuka halaman edit');
        } finally {
            category.isEditing = false;
        }
    };
    
    // Handle delete category
    const handleDelete = async (category) => {
        // Show confirmation dialog
        const confirmed = await showConfirmDialog(
            'Hapus Kategori',
            `Apakah Anda yakin ingin menghapus kategori "${category.name}"?`,
            'Hapus',
            'Batal'
        );
        
        if (confirmed) {
            try {
                isLoading = true;
                
                // Replace with your actual API call
                const response = await fetch(`/api/categories/${category.id}`, {
                    method: 'DELETE',
                });
                
                if (response.ok) {
                    // Remove from local array
                    categories = categories.filter(cat => cat.id !== category.id);
                    totalItems -= 1;
                    
                    // Show success notification
                    showSuccessNotification('Kategori berhasil dihapus');
                    
                    // Reload if current page becomes empty
                    if (categories.length === 0 && currentPage > 1) {
                        currentPage -= 1;
                        await loadCategories();
                    }
                } else {
                    throw new Error('Failed to delete category');
                }
            } catch (error) {
                console.error('Failed to delete category:', error);
                showErrorNotification('Gagal menghapus kategori');
            } finally {
                isLoading = false;
            }
        }
    };
    
    // Handle page change for pagination
    const handlePageChange = async (page) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            currentPage = page;
            await loadCategories();
        }
    };


    // Utility functions for notifications (implement according to your notification system)
    const showSuccessNotification = (message) => {
        // Implement your success notification
        console.log('Success:', message);
        // Example with a toast library:
        // toast.success(message);
    };
    
    const showErrorNotification = (message) => {
        // Implement your error notification
        console.error('Error:', message);
        // Example with a toast library:
        // toast.error(message);
    };
    
    const showConfirmDialog = async (title, message, confirmText = 'OK', cancelText = 'Cancel') => {
        // Implement your confirmation dialog
        // For now, using browser confirm (replace with custom modal)
        return confirm(`${title}\n\n${message}`);
        
        // Example with a custom modal:
        // return new Promise((resolve) => {
        //     const modal = new ConfirmModal({
        //         target: document.body,
        //         props: { title, message, confirmText, cancelText },
        //     });
        //     modal.$on('confirm', () => resolve(true));
        //     modal.$on('cancel', () => resolve(false));
        // });
    };

    onMount(() => {
        loadCategories();
    });
</script>

<svelte:head>
    <title>Kategori - MyWall CMS</title>
</svelte:head>

<div class="p-6">
    <div class="flex justify-between items-center mb-6">
        <button on:click={handleAdd} class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
            + Tambah
        </button>
    </div>

    {#if isLoading}
        <div class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
    {:else}
        <div class="bg-white rounded-lg shadow">
            <div class="p-6">
                {#if categories.length > 0}
                    <!-- Table -->
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        #
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nama Kategori
                                    </th>
                                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                {#each categories as category, index}
                                    <tr class="hover:bg-gray-50 transition-colors">
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {index + 1}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm font-medium text-gray-900">
                                                {category.name}
                                            </div>
                                            {#if category.description}
                                                <div class="text-sm text-gray-500">
                                                    {category.description}
                                                </div>
                                            {/if}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div class="flex justify-end space-x-2">
                                                <!-- Edit Button -->
                                                <button
                                                    class="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center"
                                                    on:click={() => handleEdit(category)}
                                                    title="Edit kategori"
                                                >
                                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                                    </svg>
                                                    Edit
                                                </button>
                                                
                                                <!-- Delete Button -->
                                                <button
                                                    class="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center"
                                                    on:click={() => handleDelete(category)}
                                                    title="Hapus kategori"
                                                >
                                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                    </svg>
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination (optional) -->
                    {#if totalPages > 1}
                        <div class="flex items-center justify-between mt-6">
                            <div class="text-sm text-gray-700">
                                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} kategori
                            </div>
                            <div class="flex space-x-2">
                                <button
                                    class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={currentPage === 1}
                                    on:click={() => handlePageChange(currentPage - 1)}
                                >
                                    Previous
                                </button>
                                
                                {#each Array.from({length: totalPages}, (_, i) => i + 1) as page}
                                    {#if page === currentPage}
                                        <span class="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-300 rounded-md">
                                            {page}
                                        </span>
                                    {:else}
                                        <button
                                            class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                            on:click={() => handlePageChange(page)}
                                        >
                                            {page}
                                        </button>
                                    {/if}
                                {/each}
                                
                                <button
                                    class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={currentPage === totalPages}
                                    on:click={() => handlePageChange(currentPage + 1)}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    {/if}
                {:else}
                    <!-- Empty State -->
                    <div class="text-center py-12">
                        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                        </svg>
                        <h3 class="mt-4 text-lg font-medium text-gray-900">Belum ada kategori</h3>
                        <p class="mt-2 text-sm text-gray-500">Mulai dengan menambahkan kategori pertama Anda.</p>
                        <div class="mt-6">
                            <button
                                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                on:click={handleAdd}
                            >
                                <svg class="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                                Tambah
                            </button>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>