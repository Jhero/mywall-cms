<!-- src/routes/category/edit/[id]/+page.svelte -->
<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { browser } from '$app/environment';
    import { setCurrentPage } from '../../../../stores/ui.js';
    import { saveCategory } from '../../../../lib/categoryUtils.js'; // Import dari lib

    // Data dari load function
    export let data;
    
    // Destructure data dari load function
    $: ({ category: loadedCategory, categoryId } = data);
    
    // Set the current page when component mounts
    onMount(() => {
        setCurrentPage('category');
    });

    // Form state - initialize dengan data dari load function
    let category = {
        id: null,
        name: '',
        description: '',
        slug: '',
        isActive: true
    };
    let isLoading = false;
    let isSaving = false;
    let errors = {};
    let showSuccessMessage = false;

    // Initialize form dengan data dari load function
    $: if (loadedCategory) {
        category = {
            id: loadedCategory.id || null,
            name: loadedCategory.name || '',
            description: loadedCategory.description || '',
            slug: loadedCategory.slug || '',
            isActive: loadedCategory.isActive !== undefined ? loadedCategory.isActive : true
        };
    }

    // Generate slug from name
    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    // Handle name input change
    const handleNameChange = (event) => {
        category.name = event.target.value;
        if (category.name) {
            category.slug = generateSlug(category.name);
        }
        // Clear name error when user starts typing
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
            // Use imported save function
            await saveCategory(categoryId, {
                name: category.name.trim(),
                isActive: category.isActive
            }, fetch); // Pass fetch function

            showSuccessMessage = true;
            setTimeout(() => {
                showSuccessMessage = false;
                goto('/category');
            }, 2000);

        } catch (error) {
            console.error('Error updating category:', error);
            
            // Handle validation errors from API
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
        // Implement your error notification system
        console.error('Error:', message);
        // Example: toast.error(message);
    };
</script>

<svelte:head>
    <title>Edit Kategori - CMS Admin</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-6">
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
                        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        disabled={isSaving}
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSaving}
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
                            Update
                        {/if}
                    </button>
                </div>
            </form>
        {/if}
    </div>
</div>