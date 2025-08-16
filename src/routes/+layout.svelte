<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { authStore } from '../stores/auth.js';
  import { uiStore } from '../stores/ui.js';
  import Sidebar from '../components/layout/Sidebar.svelte';
  import Header from '../components/layout/Header.svelte';
  import '../styles/global.css';

  let isAuthenticated = false;
  let isLoading = true;
  let sidebarCollapsed = false;

  // Subscribe to auth store
  authStore.subscribe(auth => {
    isAuthenticated = auth.isAuthenticated;
  });

  // Handle authentication check only on client side
  onMount(() => {
    // Check authentication status
    const token = localStorage.getItem('authToken');
    
    if (token) {
      // Validate token or set as authenticated
      authStore.login({
        id: 1,
        email: localStorage.getItem('userEmail') || 'admin@example.com',
        name: localStorage.getItem('userName') || 'Admin User',
        token: token
      });
    }
    
    isLoading = false;
    
    // Only redirect after component is mounted
    setTimeout(() => {
      if (!isAuthenticated && browser) {
        // Check if we're not already on login page
        if ($page.url.pathname !== '/login') {
          goto('/login');
        }
      }
    }, 100);
  });

  // Handle route changes - only redirect if not authenticated
  $: if (browser && !isLoading && !isAuthenticated && $page.url.pathname !== '/login') {
    goto('/login');
  }

  const toggleSidebar = () => {
    sidebarCollapsed = !sidebarCollapsed;
  };

  const handleSidebarMenuClick = (event) => {
    // Handle any additional logic when sidebar menu is clicked
    console.log('Menu clicked:', event.detail);
  };

  const handleLogout = () => {
    if (browser) {
      authStore.logout();
      localStorage.removeItem('authToken');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      goto('/login');
    }
  };
</script>

<svelte:head>
  <title>MyWall CMS</title>
  <meta name="description" content="Content Management System" />
</svelte:head>

{#if isLoading}
  <!-- Loading screen -->
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
      <p class="text-gray-600">Loading...</p>
    </div>
  </div>
{:else if isAuthenticated}
  <!-- Main app layout -->
  <div class="min-h-screen bg-gray-50 flex">
    <!-- Sidebar -->
    <Sidebar 
      {sidebarCollapsed} 
      on:toggleSidebar={toggleSidebar}
      on:menuClick={handleSidebarMenuClick}
    />
    
    <!-- Main content area -->
    <div class="flex-1 flex flex-col">
      <!-- Header -->
      <Header 
        on:toggleSidebar={toggleSidebar}
        on:logout={handleLogout}
        {sidebarCollapsed}
      />
      
      <!-- Page content -->
      <main class="flex-1 overflow-auto p-6">
        <slot />
      </main>
    </div>
  </div>
{:else}
  <!-- Login page or unauthenticated state -->
  <div class="min-h-screen bg-gray-50">
    <slot />
  </div>
{/if}

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  }
  
  :global(*, *::before, *::after) {
    box-sizing: border-box;
  }
</style>