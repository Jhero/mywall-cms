<script>
    import { onMount } from 'svelte';
    import { setCurrentPage } from '../../stores/ui.js';
    import { goto } from '$app/navigation';
    import { authStore } from '../../stores/auth.js';
    import { notificationStore } from '../../stores/notifications.js';
    import { createEventDispatcher } from 'svelte';
    import { confirmDelete, showSuccess } from '../../stores/modal.js';
    import Modal from '../../components/ui/Modal.svelte'; // Add Modal component import
    import { deleteCategory } from '../../lib/categoryUtils.js'; // Import dari lib

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
    let itemsPerPage = 10;
    let totalItems = 0;
    let currentPage = 1;
    let isAddingCategory = false;

    // Filter variables
    let searchQuery = '';
    let sortBy = 'name'; // 'name', 'created_at', 'updated_at'
    let sortOrder = 'asc'; // 'asc', 'desc'
    let showFilters = false;
    
    // Debounce timer for search
    let searchTimeout;

    const logout = async () => {
        // Clear authentication data
        localStorage.removeItem('auth');
        localStorage.removeItem('authToken');
        
        // Invalidate all data and redirect
        await goto('/login', { replaceState: true });
    };

    // Build query parameters for API
    const buildQueryParams = () => {
        const params = new URLSearchParams({
            page: currentPage.toString(),
            limit: itemsPerPage.toString()
        });

        // Add search query if exists
        if (searchQuery.trim()) {
            params.append('name', searchQuery.trim());
        }

        // Add sorting parameters
        if (sortBy) {
            params.append('sort_by', sortBy);
            params.append('sort_order', sortOrder);
        }

        return params.toString();
    };

    // Handle search with debounce
    const handleSearch = (event) => {
        const value = event.target.value;
        
        // Clear existing timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        // Set new timeout
        searchTimeout = setTimeout(() => {
            searchQuery = value;
            currentPage = 1; // Reset to first page when searching
            loadCategories(); // Reload data with new search
        }, 300); // 300ms debounce
    };

    // Handle sort change
    const handleSort = (field) => {
        if (sortBy === field) {
            // Toggle sort order if same field
            sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            // Set new field and default to ascending
            sortBy = field;
            sortOrder = 'asc';
        }
        currentPage = 1; // Reset to first page when sorting
        loadCategories(); // Reload data with new sort
    };

    // Clear all filters
    const clearFilters = () => {
        searchQuery = '';
        sortBy = 'name';
        sortOrder = 'asc';
        currentPage = 1;
        
        // Clear search input
        const searchInput = document.querySelector('input[type="search"]');
        if (searchInput) {
            searchInput.value = '';
        }
        
        loadCategories(); // Reload data without filters
    };

    // Load categories function with API filtering
    const loadCategories = async () => {
        isLoading = true;
        try {
            const queryParams = buildQueryParams();
            const response = await fetch(`/api/categories?${queryParams}`, config);
            if (response.status === 401) {
                logout();
                return;
            }
            
            const data = await response.json();
            
            // Assuming your API returns data in this structure:
            // { data: { data: [...], total: number, current_page: number, per_page: number, last_page: number } }
            categories = data.data.data || [];
            totalItems = data.data.total || 0;
            currentPage = data.data.current_page || 1;
            itemsPerPage = data.data.per_page || 10;
            totalPages = data.data.last_page || Math.ceil(totalItems / itemsPerPage);
            
        } catch (error) {
            console.error('Error loading categories:', error);
            if (error.status === 401 || error.message.includes('401')) {
                logout();
                return;
            }
            
            // Show error notification
            showErrorNotification('Failed to load categories');
        } finally {
            isLoading = false;
        }
    };
    
    // Handle add new category
    const handleAdd = async () => {
        try {
            isLoading = true;
            goto('/category/add');
        } catch (error) {
            console.error('Navigation error:', error);
            await showError({
                title: 'Category Failed',
                message: 'Failed open category page.'
            });            
        } finally {
            isLoading = false;
        }        
    };

    const handleEdit = async (category) => {
        try {
            category.isEditing = true;
            await goto(`/category/edit/${category.ID}`);
        } catch (error) {
            await showError({
                title: 'Category Failed',
                message: 'Failed open category page edit.'
            });            
        } finally {
            category.isEditing = false;
        }
    };
    
    // Handle delete category
    const handleDelete = async (category) => {
        const confirmed = await confirmDelete({
            title: 'Delete Category?',
            message: 'Are you sure you want to delete this category? This action cannot be undone.',
            confirmText: 'Yes, delete it',
            cancelText: 'Keep it'
        });
        
        if (confirmed) {
            try {
                isLoading = true;
                
                const id = category.ID;
                const response = await deleteCategory(id);
                
                if (response.status) {
                    await showSuccess({
                        message: 'Data deleted successfully!'
                    });
                    
                    // Reload categories after deletion
                    await loadCategories();
                } else {
                    throw new Error(response.message);
                }
            } catch (error) {
                console.error('Failed to delete category:', error);
                await showError({
                    title: 'Delete Failed',
                    message: error.message
                });
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
    
    const showErrorNotification = (message) => {
        console.error('Error:', message);
    };

    // Watch for itemsPerPage changes
    const handleItemsPerPageChange = () => {
        currentPage = 1;
        loadCategories();
    };

    onMount(() => {
        loadCategories();
    });

    // Clean up timeout on destroy
    import { onDestroy } from 'svelte';
    onDestroy(() => {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
    });
</script>

<svelte:head>
    <title>Kategori - MyWall CMS</title>
</svelte:head>

<div class="p-6">
    <!-- Header with Add Button and Filter Toggle -->
    <div class="flex justify-between items-center mb-6">
        <div class="flex items-center space-x-4">
            <button on:click={handleAdd} class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
                + Tambah
            </button>
            <button 
                on:click={() => showFilters = !showFilters}
                class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center"
            >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                </svg>
                Filter
            </button>
        </div>
        
        <!-- Quick Stats -->
        {#if !isLoading}
            <div class="text-sm text-gray-500">
                {#if searchQuery}
                    {totalItems} hasil ditemukan
                {:else}
                    {totalItems} kategori total
                {/if}
            </div>
        {/if}
    </div>

    <!-- Filter Panel -->
    {#if showFilters}
        <div class="bg-gray-50 rounded-lg p-4 mb-6 border">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <!-- Search Input -->
                <div>
                    <label for="search" class="block text-sm font-medium text-gray-700 mb-2">
                        Cari Kategori
                    </label>
                    <div class="relative">
                        <input
                            type="search"
                            id="search"
                            placeholder="Cari nama kategori..."
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10"
                            on:input={handleSearch}
                        />
                        <svg class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                </div>

                <!-- Items Per Page -->
                <div>
                    <label for="itemsPerPage" class="block text-sm font-medium text-gray-700 mb-2">
                        Items per Page
                    </label>
                    <select 
                        id="itemsPerPage"
                        bind:value={itemsPerPage}
                        on:change={handleItemsPerPageChange}
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </div>

                <!-- Sort By -->
                <div>
                    <label for="sortBy" class="block text-sm font-medium text-gray-700 mb-2">
                        Urutkan Berdasarkan
                    </label>
                    <select 
                        id="sortBy"
                        bind:value={sortBy}
                        on:change={() => { currentPage = 1; loadCategories(); }}
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="name">Nama Kategori</option>
                        <option value="created_at">Tanggal Dibuat</option>
                        <option value="updated_at">Terakhir Diperbarui</option>
                    </select>
                </div>

                <!-- Sort Order -->
                <div>
                    <label for="sortOrder" class="block text-sm font-medium text-gray-700 mb-2">
                        Urutan
                    </label>
                    <select 
                        id="sortOrder"
                        bind:value={sortOrder}
                        on:change={() => { currentPage = 1; loadCategories(); }}
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="asc">A ke Z / Lama ke Baru</option>
                        <option value="desc">Z ke A / Baru ke Lama</option>
                    </select>
                </div>
            </div>

            <!-- Filter Actions -->
            <div class="flex justify-end mt-4 space-x-2">
                <button
                    on:click={clearFilters}
                    class="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    Reset Filter
                </button>
            </div>
        </div>
    {/if}

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
                                    <th 
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                        on:click={() => handleSort('name')}
                                    >
                                        <div class="flex items-center">
                                            Nama Kategori
                                            {#if sortBy === 'name'}
                                                <svg class="w-4 h-4 ml-1 {sortOrder === 'desc' ? 'transform rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                                                </svg>
                                            {/if}
                                        </div>
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
                                            {(currentPage - 1) * itemsPerPage + index + 1}
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

                    <!-- Pagination -->
                    {#if totalPages > 1}
                        <div class="flex items-center justify-between mt-6">
                            <div class="text-sm text-gray-700">
                                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} 
                                {searchQuery ? 'hasil pencarian' : 'kategori'}
                            </div>
                            <div class="flex space-x-2">
                                <button
                                    class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={currentPage === 1}
                                    on:click={() => handlePageChange(currentPage - 1)}
                                >
                                    Previous
                                </button>
                                
                                {#each Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                                    const start = Math.max(1, currentPage - 2);
                                    const end = Math.min(totalPages, start + 4);
                                    return start + i;
                                }).filter(p => p <= totalPages) as page}
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
                {:else if searchQuery}
                    <!-- No Search Results -->
                    <div class="text-center py-12">
                        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        <h3 class="mt-4 text-lg font-medium text-gray-900">Tidak ada hasil yang ditemukan</h3>
                        <p class="mt-2 text-sm text-gray-500">Coba ubah kata kunci pencarian Anda atau hapus filter.</p>
                        <div class="mt-6">
                            <button
                                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                on:click={clearFilters}
                            >
                                Reset Filter
                            </button>
                        </div>
                    </div>
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
<Modal />