<!-- src/routes/category/edit/[id]/+error.svelte -->
<script>
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    
    // Get error info from page store
    $: error = $page.error;
    $: status = error?.status || 500;
    $: message = error?.message || 'Terjadi kesalahan';
    
    const goBack = () => {
        goto('/category');
    };
</script>

<svelte:head>
    <title>Error - Edit Kategori</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <!-- Error Icon -->
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <svg class="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
        </div>
        
        <!-- Error Message -->
        <h1 class="text-2xl font-bold text-gray-900 mb-2">
            {#if status === 404}
                Kategori Tidak Ditemukan
            {:else if status === 400}
                ID Kategori Tidak Valid
            {:else}
                Terjadi Kesalahan
            {/if}
        </h1>
        
        <p class="text-gray-600 mb-8">
            {#if status === 404}
                Kategori yang Anda cari tidak ditemukan atau telah dihapus.
            {:else if status === 400}
                ID kategori yang diberikan tidak valid.
            {:else}
                {message}
            {/if}
        </p>
        
        <!-- Actions -->
        <div class="space-y-4">
            <button
                on:click={goBack}
                class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
                <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Kembali ke Daftar Kategori
            </button>
            
            <button
                on:click={() => location.reload()}
                class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
            >
                <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Coba Lagi
            </button>
        </div>
    </div>
</div>