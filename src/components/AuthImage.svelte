<script>
    import { onMount } from 'svelte';
    import { authStore } from '../stores/auth.js';
    import { createEventDispatcher } from 'svelte';

    export let src = '';
    export let alt = '';
    export let className = '';
    
    let imageSrc = '/placeholder.jpg';
    let loading = true;
    let error = false;
    let user = null;

    // Subscribe to auth store
    const unsubscribe = authStore.subscribe(auth => {
        user = auth?.user || null;
    });

    // Clean up subscription on component destroy
    import { onDestroy } from 'svelte';
    onDestroy(() => {
        if (unsubscribe) unsubscribe();
    });
    
    const dispatch = createEventDispatcher();
    
    onMount(async () => {
        if (src) {
            try {
                // Get token from user after subscription has been established
                const token = user?.token;
                const defaultHeaders = {};
                
                if (token) {
                    defaultHeaders.Authorization = `Bearer ${token}`;
                }
                
                const config = {
                    headers: {
                        ...defaultHeaders,
                    },
                };

                const url = `/api/images${src}`;
                const response = await fetch(url, config);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                // Check if the response is an image
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.startsWith('image/')) {
                    // Create blob URL for image data
                    const blob = await response.blob();
                    imageSrc = URL.createObjectURL(blob);
                } else {
                    // If it's not an image, assume it's a URL
                    const imageUrl = await response.text();
                    imageSrc = imageUrl;
                }
                
                loading = false;
            } catch (err) {
                error = true;
                loading = false;
            }
        } else {
            loading = false;
        }
    });

    // Handle image load error
    function handleImageError() {
        error = true;
        imageSrc = '/placeholder.jpg';
    }
</script>

{#if loading}
    <div class="image-placeholder {className}">
        <span>Loading...</span>
    </div>
{:else if error}
    <img 
        src="/placeholder.jpg" 
        {alt} 
        class={className}
        on:error={handleImageError}
    />
{:else}
    <img 
        src={imageSrc} 
        {alt} 
        class={className}
        on:error={handleImageError}
    />
{/if}

<style>
    .image-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #f0f0f0;
        color: #666;
        min-height: 100px;
        border-radius: 4px;
    }
    
    img {
        max-width: 100%;
        height: auto;
    }
</style>