<script>
    import { onMount } from 'svelte';
    import { setCurrentPage } from '../../stores/ui.js';
    import { goto } from '$app/navigation';
    import { authStore } from '../../stores/auth.js';
    import { createEventDispatcher } from 'svelte';
    import AuthImage from '../../components/AuthImage.svelte';

    let user = "";

    authStore.subscribe(auth => {
        user = auth.user;
    });

    // Set the current page when component mounts
    onMount(() => {
        setCurrentPage('gallery');
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

    // Gallery logic
    let images = [];
    let isLoading = false;
    let totalPages = 0;
    let itemsPerPage = 12; // Usually more items for gallery grid
    let totalItems = 0;
    let currentPage = 1;
    let viewMode = 'grid'; // 'grid' or 'list'
    let selectedImages = [];
    let isSelectMode = false;
    let searchQuery = '';
    let selectedCategory = '';
    let categories = [];
    let imageUrl = '/placeholder.jpg';

    $: totalPages = Math.ceil(totalItems / itemsPerPage);

    $: filteredImages = images.filter(image => {
        const matchesSearch = !searchQuery || 
            image.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            image.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategory || image.category_id === selectedCategory;
        return matchesSearch && matchesCategory;
    });


    function parseImagePath(path) {
        if (!path) return '/placeholder.jpg';
        const result = path.replace(/^uploads\\/, '/').replace(/\\/g, '/');
        return result;
    }

    const logout = async () => {
        // Clear authentication data
        localStorage.removeItem('auth');
        localStorage.removeItem('authToken');
        
        // Invalidate all data and redirect
        await goto('/login', { replaceState: true });
    };    

    // Load images function
    const loadImages = async () => {
        isLoading = true;
        try {
            const response = await fetch(`/api/galleries?page=${currentPage}&limit=${itemsPerPage}&search=${searchQuery}&category=${selectedCategory}`, config);
            if (response.status === 401) {
                logout();
                return;
            }
            const data = await response.json();
            
            images = data.data.data || [];
            totalItems = data.data.pagination.total_items;
        } catch (error) {
            if (error.status === 401 || error.message.includes('401')) {
                logout();
                return;
            }
        } finally {
            isLoading = false;
        }
    };

    // Load categories for filter
    const loadCategories = async () => {
        try {
            const response = await fetch('/api/categories', config);
            const data = await response.json();
            categories = data || [];
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    };
    
    // Handle add new image
    const handleAdd = () => {
        try {
            isLoading = true;
            goto('/galleries/add');
        } catch (error) {
            console.error('Navigation error:', error);
            showErrorNotification('Gagal membuka halaman upload gambar');
        } finally {
            isLoading = false;
        }        
    };

    // Handle edit image
    const handleEdit = async (image) => {
        try {
            image.isEditing = true;
            await goto(`/galleries/edit/${image.id}`);
        } catch (error) {
            console.error('Navigation error:', error);
            showErrorNotification('Gagal membuka halaman edit');
        } finally {
            image.isEditing = false;
        }
    };

    // Handle view image detail
    const handleView = async (image) => {
        try {
            await goto(`/galleries/view/${image.id}`);
        } catch (error) {
            console.error('Navigation error:', error);
            showErrorNotification('Gagal membuka detail gambar');
        }
    };
    
    // Handle delete image
    const handleDelete = async (image) => {
        const confirmed = await showConfirmDialog(
            'Hapus Gambar',
            `Apakah Anda yakin ingin menghapus gambar "${image.title}"?`,
            'Hapus',
            'Batal'
        );
        
        if (confirmed) {
            try {
                isLoading = true;
                
                const response = await fetch(`/api/galleries/${image.id}`, {
                    method: 'DELETE',
                    ...config
                });
                
                if (response.ok) {
                    images = images.filter(img => img.id !== image.id);
                    totalItems -= 1;
                    showSuccessNotification('Gambar berhasil dihapus');
                    
                    if (images.length === 0 && currentPage > 1) {
                        currentPage -= 1;
                        await loadImages();
                    }
                } else {
                    throw new Error('Failed to delete image');
                }
            } catch (error) {
                console.error('Failed to delete image:', error);
                showErrorNotification('Gagal menghapus gambar');
            } finally {
                isLoading = false;
            }
        }
    };

    // Handle bulk delete
    const handleBulkDelete = async () => {
        if (selectedImages.length === 0) return;
        
        const confirmed = await showConfirmDialog(
            'Hapus Gambar',
            `Apakah Anda yakin ingin menghapus ${selectedImages.length} gambar yang dipilih?`,
            'Hapus',
            'Batal'
        );
        
        if (confirmed) {
            try {
                isLoading = true;
                
                const response = await fetch('/api/galleries/bulk-delete', {
                    method: 'POST',
                    ...config,
                    body: JSON.stringify({ ids: selectedImages })
                });
                
                if (response.ok) {
                    images = images.filter(img => !selectedImages.includes(img.id));
                    totalItems -= selectedImages.length;
                    selectedImages = [];
                    isSelectMode = false;
                    showSuccessNotification(`${selectedImages.length} gambar berhasil dihapus`);
                    
                    if (images.length === 0 && currentPage > 1) {
                        currentPage -= 1;
                        await loadImages();
                    }
                } else {
                    throw new Error('Failed to delete images');
                }
            } catch (error) {
                console.error('Failed to delete images:', error);
                showErrorNotification('Gagal menghapus gambar');
            } finally {
                isLoading = false;
            }
        }
    };

    // Handle select image
    const handleSelectImage = (imageId) => {
        if (selectedImages.includes(imageId)) {
            selectedImages = selectedImages.filter(id => id !== imageId);
        } else {
            selectedImages = [...selectedImages, imageId];
        }
    };

    // Handle select all
    const handleSelectAll = () => {
        if (selectedImages.length === filteredImages.length) {
            selectedImages = [];
        } else {
            selectedImages = filteredImages.map(img => img.id);
        }
    };
    
    // Handle page change
    const handlePageChange = async (page) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            currentPage = page;
            await loadImages();
        }
    };

    // Handle search
    const handleSearch = async () => {
        currentPage = 1;
        await loadImages();
    };

    // Handle filter change
    const handleFilterChange = async () => {
        currentPage = 1;
        await loadImages();
    };

    // Utility functions
    const showSuccessNotification = (message) => {
        console.log('Success:', message);
    };
    
    const showErrorNotification = (message) => {
        console.error('Error:', message);
    };
    
    const showConfirmDialog = async (title, message, confirmText = 'OK', cancelText = 'Cancel') => {
        return confirm(`${title}\n\n${message}`);
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };


    onMount(() => {
        loadImages();
        loadCategories();
    });
</script>

<svelte:head>
    <title>Galeri - MyWall CMS</title>
</svelte:head>

<div class="p-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">Galeri</h1>
            <p class="text-gray-600 mt-1">Kelola koleksi gambar Anda</p>
        </div>
        
        <div class="flex flex-wrap items-center justify-end space-x-2 w-full sm:w-auto">
            {#if isSelectMode}
                <button 
                    on:click={() => { isSelectMode = false; selectedImages = []; }}
                    class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium"
                >
                    Batal
                </button>
                <button 
                    on:click={handleSelectAll}
                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                    {selectedImages.length === filteredImages.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                </button>
                {#if selectedImages.length > 0}
                    <button 
                        on:click={handleBulkDelete}
                        class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                    >
                        Hapus ({selectedImages.length})
                    </button>
                {/if}
            {:else}
                <button 
                    on:click={() => isSelectMode = true}
                    class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                    Pilih
                </button>
                <button 
                    on:click={handleAdd} 
                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                    + Upload
                </button>
            {/if}
        </div>
    </div>

    <!-- Filters and Search -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <!-- Search and Category Filter -->
            <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 flex-1">
                <div class="flex-1">
                    <input
                        type="text"
                        placeholder="Cari gambar..."
                        bind:value={searchQuery}
                        on:input={handleSearch}
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <select
                        bind:value={selectedCategory}
                        on:change={handleFilterChange}
                        class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Semua Kategori</option>
                        {#each categories as category}
                            <option value={category.id}>{category.name}</option>
                        {/each}
                    </select>
                </div>
            </div>

            <!-- View Mode Toggle -->
            <div class="flex items-center space-x-2">
                <button
                    class="p-2 rounded {viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}"
                    on:click={() => viewMode = 'grid'}
                    aria-label="Switch to grid view"
                    title="Grid View"
                >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                </button>
                <button
                    class="p-2 rounded {viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}"
                    on:click={() => viewMode = 'list'}
                    aria-label="Switch to list view"
                    title="List View"
                >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    </div>

    {#if isLoading}
        <div class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
    {:else}
        <div class="bg-white rounded-lg shadow">
            <div class="p-6">
                {#if filteredImages.length > 0}
                    {#if viewMode === 'grid'}
                        <!-- Grid View -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                            {#each filteredImages as image}
                                <div class="relative group bg-gray-50 rounded-lg overflow-hidden border-2 transition-all duration-200 {selectedImages.includes(image.id) ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}">
                                    <!-- Selection Checkbox -->
                                    {#if isSelectMode}
                                        <div class="absolute top-2 left-2 z-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedImages.includes(image.id)}
                                                on:change={() => handleSelectImage(image.id)}
                                                class="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                                            />
                                        </div>
                                    {/if}

                                    <!-- Image -->
                                    <div class="aspect-w-1 aspect-h-1 w-full">
                                        <button
                                            type="button"
                                            class="w-full h-48 p-0 border-none bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                                            on:click={() => !isSelectMode && handleView(image)}
                                            disabled={isSelectMode}
                                            aria-label="View {image.title}"
                                        >
                                            <AuthImage 
                                                src={parseImagePath(image.image_url)} 
                                                alt="Profile picture" 
                                                className="profile-image"
                                            />
                                        </button>
                                    </div>

                                    <!-- Overlay Actions -->
                                    {#if !isSelectMode}
                                        <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-2">
                                            <button
                                                on:click={() => handleView(image)}
                                                class="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
                                                aria-label="Lihat gambar {image.title || 'ini'}"
                                                title="Lihat"
                                            >
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                                </svg>
                                            </button>
                                            <button
                                                on:click={() => handleEdit(image)}
                                                class="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
                                                aria-label="Edit gambar {image.title || 'ini'}"
                                                title="Edit"
                                            >
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                                </svg>
                                            </button>
                                            <button
                                                on:click={() => handleDelete(image)}
                                                class="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
                                                aria-label="Hapus gambar {image.title || 'ini'}"
                                                title="Hapus"
                                            >
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    {/if}

                                    <!-- Image Info -->
                                    <div class="p-3">
                                        <h3 class="font-medium text-sm text-gray-900 truncate" title={image.title}>
                                            {image.title}
                                        </h3>
                                        <div class="flex items-center justify-between mt-1">
                                            <span class="text-xs text-gray-500">
                                                {formatFileSize(image.size)}
                                            </span>
                                            <span class="text-xs text-gray-500">
                                                {image.width}×{image.height}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <!-- List View -->
                        <div class="space-y-4">
                            {#each filteredImages as image}
                                <div class="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                                    {#if isSelectMode}
                                        <input
                                            type="checkbox"
                                            checked={selectedImages.includes(image.id)}
                                            on:change={() => handleSelectImage(image.id)}
                                            class="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                                        />
                                    {/if}
                                    
                                    <button
                                        type="button"
                                        class="w-16 h-16 p-0 border-none bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                                        on:click={() => !isSelectMode && handleView(image)}
                                        disabled={isSelectMode}
                                        aria-label="View {image.title}"
                                    >
                                        <AuthImage 
                                            src={parseImagePath(image.image_url)} 
                                            alt="Profile picture" 
                                            className="profile-image"
                                        />

                                    </button>                                    
                                    <div class="flex-1 min-w-0">
                                        <h3 class="font-medium text-gray-900 truncate">{image.title}</h3>
                                        {#if image.description}
                                            <p class="text-sm text-gray-500 truncate">{image.description}</p>
                                        {/if}
                                        <div class="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                            <span>{formatFileSize(image.size)}</span>
                                            <span>{image.width}×{image.height}</span>
                                            <span>{new Date(image.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    
                                    {#if !isSelectMode}
                                        <div class="flex items-center space-x-2">
                                            <button
                                                on:click={() => handleView(image)}
                                                class="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                                                title="Lihat"
                                            >
                                                Lihat
                                            </button>
                                            <button
                                                on:click={() => handleEdit(image)}
                                                class="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                                                title="Edit"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                on:click={() => handleDelete(image)}
                                                class="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                                                title="Hapus"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    {/if}

                    <!-- Pagination -->
                    {#if totalPages > 1}
                        <div class="flex items-center justify-between mt-6">
                            <div class="text-sm text-gray-700">
                                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} gambar
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
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <h3 class="mt-4 text-lg font-medium text-gray-900">Belum ada gambar</h3>
                        <p class="mt-2 text-sm text-gray-500">Mulai dengan mengunggah gambar pertama Anda ke galeri.</p>
                        <div class="mt-6">
                            <button
                                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                on:click={handleAdd}
                            >
                                <svg class="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                                Upload Gambar
                            </button>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>