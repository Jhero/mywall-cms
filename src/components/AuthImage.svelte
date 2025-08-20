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

    let user = "";

    authStore.subscribe(auth => {
        user = auth.user;
    });

    // Set the current page when component mounts
    // onMount(() => {
    //     setCurrentPage('gallery');
    // });
    
    const dispatch = createEventDispatcher();
    const token = user.token;            
    const defaultHeaders = {}
    
    if (token) {
        defaultHeaders.Authorization = `Bearer ${token}`;
    }
    
    const config = {
        headers: {
            ...defaultHeaders,
        },
    };

    
    onMount(async () => {
        if (src) {
            try {
                console.info("test-1",src);
                console.info("test-2",JSON.stringify(config));
                const url = `/api/images${src}`;
                const blob = await fetch(url,config);
                imageSrc = URL.createObjectURL(blob);
                console.info("test-3",JSON.stringify(imageSrc));
                loading = false;
            } catch (err) {
                console.info("test-4",error.message);
                error = true;
                loading = false;
            }
        } else {
            loading = false;
        }
    });
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
        on:error={() => error = true}
    />
{:else}
    <img 
        src={imageSrc} 
        {alt} 
        class={className}
        on:error={() => error = true}
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
    }
</style>
