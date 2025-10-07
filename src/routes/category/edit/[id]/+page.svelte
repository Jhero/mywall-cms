<!-- src/routes/category/edit/[id]/+page.svelte -->
<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { browser } from '$app/environment';
    import { setCurrentPage } from '../../../../stores/ui.js';
    import { saveCategory } from '../../../../lib/categoryUtils.js';
    import { getFullImageUrl } from '../../../../lib/imageUtils.js';
    import { authStore } from '../../../../stores/auth.js';
    import { get } from 'svelte/store';
    // Data dari load function
    export let data;
    
    // Destructure data dari load function
    $: ({ category: loadedCategory, categoryId } = data);
    
    // Set the current page when component mounts
    onMount(() => {
        setCurrentPage('category');
    });

    // Form state
    let category = {
        id: null,
        name: '',
        isActive: true,
        image: null,
        imageUrl: ''
    };
    let isLoading = false;
    let isSaving = false;
    let isUploading = false;
    let isImageLoading = false;
    let imageLoadProgress = 0;
    let errors = {};
    let showSuccessMessage = false;
    let imageFile = null;
    let imagePreview = '';
    // Auth store
    const auth = get(authStore);
    const token = auth?.user?.token;
    // Initialize form dengan data dari load function
    $: if (loadedCategory) {
        category = {
            id: loadedCategory.id || null,
            name: loadedCategory.name || '',
            description: loadedCategory.description || '',
            slug: loadedCategory.slug || '',
            isActive: loadedCategory.isActive !== undefined ? loadedCategory.isActive : true,
            image: loadedCategory.image || null,
            imageUrl: loadedCategory.imageUrl || ''
        };
        
        // Load image jika ada imageUrl
        if (loadedCategory.imageUrl && !imagePreview) {
            loadImageWithProgress(loadedCategory.imageUrl);
        }
    }

    // Function untuk load image dengan progress
    const loadImageWithProgress = async (imageUrl) => {
        if (!imageUrl) return;
        
        isImageLoading = true;
        imageLoadProgress = 0;
        
        try {
            // Jika imageUrl sudah full URL, gunakan langsung
            // Jika relative, tambahkan base API path
            const fullImageUrl = getFullImageUrl(imageUrl);
            // Setup headers dengan authorization
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            console.log('Loading image from:', fullImageUrl);
            
            // const response = await fetch(fullImageUrl);
            const response = await fetch(fullImageUrl, {
                headers: headers
            });
            
            if (!response.ok) {
                throw new Error(`Failed to load image: ${response.status}`);
            }
            
            const contentLength = response.headers.get('content-length');
            const total = parseInt(contentLength || '0', 10);
            let loaded = 0;
            
            // Create reader untuk track progress
            const reader = response.body.getReader();
            const chunks = [];
            
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;
                
                chunks.push(value);
                loaded += value.length;
                
                // Update progress jika content-length tersedia
                if (total > 0) {
                    imageLoadProgress = Math.round((loaded / total) * 100);
                } else {
                    // Fallback progress indicator
                    imageLoadProgress = Math.min(imageLoadProgress + 10, 90);
                }
                
                // Force update untuk progress bar
                if (browser) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }
            
            // Complete progress
            imageLoadProgress = 100;
            
            // Create blob dari chunks
            const blob = new Blob(chunks);
            const objectUrl = URL.createObjectURL(blob);
            
            imagePreview = objectUrl;
            
            // Cleanup object URL setelah image loaded
            const img = new Image();
            img.onload = () => {
                // Delay cleanup untuk memastikan image ter-render
                setTimeout(() => {
                    // URL.revokeObjectURL(objectUrl); // Uncomment jika ingin cleanup memory
                }, 1000);
            };
            img.src = objectUrl;
            
        } catch (error) {
            console.error('Error loading image:', error);
            // Fallback ke original imageUrl jika gagal
            imagePreview = imageUrl;
        } finally {
            isImageLoading = false;
            // Reset progress setelah delay
            setTimeout(() => {
                imageLoadProgress = 0;
            }, 1000);
        }
    };

    // Handle image upload
    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validasi tipe file
        const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validImageTypes.includes(file.type)) {
            errors = { ...errors, image: 'Format file tidak didukung. Gunakan JPG, PNG, atau GIF.' };
            return;
        }

        // Validasi ukuran file (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            errors = { ...errors, image: 'Ukuran file terlalu besar. Maksimal 5MB.' };
            return;
        }

        imageFile = file;
        
        // Clear image error
        if (errors.image) {
            errors = { ...errors, image: null };
        }

        // Create preview langsung dari file
        const reader = new FileReader();
        reader.onloadstart = () => {
            isImageLoading = true;
            imageLoadProgress = 0;
        };
        reader.onprogress = (event) => {
            if (event.lengthComputable) {
                imageLoadProgress = Math.round((event.loaded / event.total) * 100);
            }
        };
        reader.onload = (e) => {
            imagePreview = e.target.result;
            isImageLoading = false;
            setTimeout(() => {
                imageLoadProgress = 0;
            }, 1000);
        };
        reader.onerror = () => {
            isImageLoading = false;
            imageLoadProgress = 0;
            errors = { ...errors, image: 'Gagal memuat gambar' };
        };
        reader.readAsDataURL(file);
    };

    // Remove image
    const removeImage = () => {
        imageFile = null;
        imagePreview = '';
        category.image = null;
        category.imageUrl = '';
        
        // Reset file input
        const fileInput = document.getElementById('image');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    // Handle name input change
    const handleNameChange = (event) => {
        category.name = event.target.value;
        if (errors.name) {
            errors = { ...errors, name: null };
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!category.name?.trim()) {
            newErrors.name = 'Nama kategori wajib diisi';
        } else if (category.name.trim().length < 2) {
            newErrors.name = 'Nama kategori minimal 2 karakter';
        }

        errors = newErrors;
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (event) => {
        event.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        isSaving = true;
        try {
            // Prepare form data for file upload
            const formData = new FormData();
            formData.append('name', category.name.trim());
            formData.append('isActive', category.isActive.toString());
            
            // Append image if exists
            if (imageFile) {
                formData.append('image', imageFile);
            } else if (!category.imageUrl && category.image) {
                // If image was removed
                formData.append('removeImage', 'true');
            }

            // Use imported save function with FormData
            await saveCategory(categoryId, formData, true);

            showSuccessMessage = true;
            setTimeout(() => {
                showSuccessMessage = false;
                goto('/category');
            }, 2000);

        } catch (error) {
            console.error('Error updating category:', error);
            
            if (error.errors) {
                errors = error.errors;
            } else {
                showErrorNotification(error.message || 'Gagal mengupdate kategori');
            }
        } finally {
            isSaving = false;
        }
    };

    // Handle cancel
    const handleCancel = () => {
        goto('/category');
    };

    // Utility functions
    const showErrorNotification = (message) => {
        console.error('Error:', message);
        // Bisa ditambahkan toast notification di sini
    };
</script>

<svelte:head>
    <title>Edit Kategori - CMS Admin</title>
    <style>
        .min-h-screen-fixed {
            min-height: 100vh;
            height: auto;
            overflow-x: hidden;
        }
        
        .content-container {
            max-height: calc(100vh - 120px);
            overflow-y: auto;
        }
        
        .content-container::-webkit-scrollbar {
            width: 6px;
        }
        
        .content-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 3px;
        }
        
        .content-container::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 3px;
        }
        
        .content-container::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
        }
        
        .image-preview-container {
            transition: all 0.3s ease;
        }
        
        .image-preview {
            max-height: 200px;
            object-fit: contain;
        }
        
        .uploading-overlay {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(4px);
        }
        
        /* Progress bar styles */
        .progress-bar {
            transition: width 0.3s ease;
        }
        
        .loader-spinner {
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .opacity-50 {
            opacity: 0.5;
        }
    </style>
</svelte:head>

<div class="min-h-screen-fixed bg-gray-50">
    <div class="max-w-4xl mx-auto p-6 content-container">
        <!-- Header -->
        <div class="mb-6">
            <nav class="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                <a href="/category" class="hover:text-gray-700">Kategori</a>
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                </svg>
                <span class="text-gray-900">Edit Kategori</span>
            </nav>
            <h1 class="text-2xl font-bold text-gray-900">
                Edit Kategori {loadedCategory?.name ? `- ${loadedCategory.name}` : ''}
            </h1>
        </div>

        <!-- Success Message -->
        {#if showSuccessMessage}
            <div class="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium text-green-800">
                            Kategori berhasil diupdate! Mengalihkan ke halaman kategori...
                        </p>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Form -->
        <div class="bg-white shadow rounded-lg">
            {#if !loadedCategory}
                <div class="flex justify-center items-center h-64">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span class="ml-3 text-gray-600">Memuat data kategori...</span>
                </div>
            {:else}
                <form on:submit={handleSubmit} class="p-6 space-y-6">
                    <!-- Category Image -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Gambar Kategori
                        </label>
                        
                        <!-- Image Preview dengan Loader -->
                        {#if imagePreview || category.imageUrl}
                            <div class="image-preview-container mb-4">
                                <div class="relative inline-block">
                                    <img 
                                        src={imagePreview} 
                                        alt="Preview gambar kategori"
                                        class="image-preview rounded-lg border border-gray-300 max-w-full {isImageLoading ? 'opacity-50' : ''}"
                                    />
                                    
                                    <!-- Loading Overlay -->
                                    {#if isImageLoading}
                                        <div class="absolute inset-0 uploading-overlay rounded-lg flex items-center justify-center">
                                            <div class="text-center">
                                                <div class="loader-spinner rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                                <p class="text-sm text-gray-600">Loading {imageLoadProgress}%</p>
                                            </div>
                                        </div>
                                    {/if}
                                    
                                    <!-- Progress Bar -->
                                    {#if isImageLoading && imageLoadProgress > 0}
                                        <div class="absolute bottom-0 left-0 right-0 bg-gray-200 rounded-b-lg">
                                            <div 
                                                class="progress-bar h-2 bg-blue-600 rounded-b-lg transition-all duration-300"
                                                style="width: {imageLoadProgress}%"
                                            ></div>
                                        </div>
                                    {/if}
                                </div>
                                
                                <button
                                    type="button"
                                    on:click={removeImage}
                                    class="mt-2 px-3 py-1 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                                    disabled={isSaving || isUploading || isImageLoading}
                                >
                                    <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                    Hapus Gambar
                                </button>
                            </div>
                        {/if}

                        <!-- File Input -->
                        <div class="flex items-center justify-center">
                            <label for="image" class="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors {isImageLoading ? 'opacity-50' : ''}">
                                <div class="flex flex-col items-center justify-center pt-5 pb-6">
                                    {#if isImageLoading}
                                        <div class="loader-spinner rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                                        <p class="mb-1 text-sm text-gray-500">
                                            Loading {imageLoadProgress}%
                                        </p>
                                    {:else}
                                        <svg class="w-8 h-8 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                        </svg>
                                        <p class="mb-1 text-sm text-gray-500">
                                            <span class="font-medium">Klik untuk upload</span> atau drag & drop
                                        </p>
                                        <p class="text-xs text-gray-500">
                                            PNG, JPG, GIF (MAX. 5MB)
                                        </p>
                                    {/if}
                                </div>
                                <input 
                                    id="image" 
                                    name="image"
                                    type="file" 
                                    accept="image/*"
                                    on:change={handleImageUpload}
                                    class="hidden" 
                                    disabled={isSaving || isUploading || isImageLoading}
                                />
                            </label>
                        </div>
                        
                        {#if errors.image}
                            <p class="mt-2 text-sm text-red-600">{errors.image}</p>
                        {:else}
                            <p class="mt-1 text-sm text-gray-500">
                                Upload gambar untuk kategori ini. Gambar akan ditampilkan di frontend aplikasi.
                            </p>
                        {/if}
                    </div>

                    <!-- Category Name -->
                    <div>
                        <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
                            Nama Kategori <span class="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            bind:value={category.name}
                            on:input={handleNameChange}
                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            class:border-red-500={errors.name}
                            placeholder="Masukkan nama kategori"
                            disabled={isSaving}
                        />
                        {#if errors.name}
                            <p class="mt-1 text-sm text-red-600">{errors.name}</p>
                        {/if}
                    </div>

                    <!-- Status -->
                    <div>
                        <div class="flex items-center">
                            <input
                                type="checkbox"
                                id="isActive"
                                bind:checked={category.isActive}
                                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                                disabled={isSaving}
                            />
                            <label for="isActive" class="ml-2 block text-sm font-medium text-gray-700">
                                Aktif
                            </label>
                        </div>
                        <p class="mt-1 text-sm text-gray-500">
                            Kategori yang tidak aktif tidak akan ditampilkan di frontend.
                        </p>
                    </div>

                    <!-- Form Actions -->
                    <div class="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            on:click={handleCancel}
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            disabled={isSaving}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            disabled={isSaving || isImageLoading}
                        >
                            {#if isSaving}
                                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Menyimpan...
                            {:else}
                                <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                Simpan
                            {/if}
                        </button>
                    </div>
                </form>
            {/if}
        </div>
    </div>
</div>