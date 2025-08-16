<script>
    import { onMount } from 'svelte';
    import { setCurrentPage } from '../../stores/ui.js';
    
    // Set the current page when component mounts
    onMount(() => {
        setCurrentPage('category');
    });

    // Your category logic here
    let categories = [];
    let isLoading = false;

    async function loadCategories() {
        isLoading = true;
        try {
            // Fetch categories from your API
            const response = await fetch('/api/categories');
            if (response.ok) {
                categories = await response.json();
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        } finally {
            isLoading = false;
        }
    }

    onMount(() => {
        loadCategories();
    });
</script>

<svelte:head>
    <title>Kategori - MyWall CMS</title>
</svelte:head>

<div class="p-6">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Manajemen Kategori</h1>
        <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
            + Tambah Kategori
        </button>
    </div>

    {#if isLoading}
        <div class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
    {:else}
        <div class="bg-white rounded-lg shadow">
            <!-- Your category content here -->
            <div class="p-6">
                <p class="text-gray-600">Halaman kategori berhasil dimuat!</p>
                
                {#if categories.length > 0}
                    <div class="mt-4">
                        <!-- Display categories -->
                        {#each categories as category}
                            <div class="p-3 border-b border-gray-200">
                                {category.name}
                            </div>
                        {/each}
                    </div>
                {:else}
                    <div class="text-center py-8">
                        <p class="text-gray-500">Belum ada kategori. Silakan tambah kategori baru.</p>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>