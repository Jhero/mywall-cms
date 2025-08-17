<script>
  import { createEventDispatcher } from 'svelte';
  import { link } from 'svelte-spa-router';
  import { uiStore, setCurrentPage } from '../../stores/ui.js';
  import { goto } from '$app/navigation';

  import { 
    Home, 
    FileText, 
    Users, 
    BarChart3, 
    Settings, 
    ChevronLeft,
    Menu,
    Archive
  } from 'lucide-svelte';

  export let sidebarCollapsed = false;
  
  const dispatch = createEventDispatcher();
  
  let currentPage = 'dashboard';
  
  uiStore.subscribe(state => {
    currentPage = state.currentPage;
  });

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/' },
    { id: 'category', label: 'Kategory', icon: Archive, path: '/category' },
    { id: 'users', label: 'Pengguna', icon: Users, path: '/users' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { id: 'settings', label: 'Pengaturan', icon: Settings, path: '/settings' },
  ];

  const handleMenuClick = (item) => {
    // setCurrentPage(item.id);
    goto(item.path);
  };
</script>

<aside class="sidebar bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 ease-in-out"
       class:w-64={!sidebarCollapsed}
       class:w-16={sidebarCollapsed}>
  
  <div class="flex items-center justify-between p-4 border-b border-gray-700">
    {#if !sidebarCollapsed}
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-sm">C</span>
        </div>
        <span class="text-xl font-bold">CMS MyWall</span>
      </div>
    {:else}
      <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
        <span class="text-white font-bold text-sm">C</span>
      </div>
    {/if}
  </div>

  <nav class="mt-8">
    <ul class="space-y-2 px-4">
      {#each menuItems as item}
        <li>
          <a
            href={item.path}
            use:link
            on:click={() => handleMenuClick(item)}
            class="flex items-center px-3 py-2 rounded-lg transition-all duration-200 group relative"
            class:bg-blue-600={currentPage === item.id}
            class:text-blue-200={currentPage === item.id}
            class:hover:bg-gray-700={currentPage !== item.id}
            class:justify-center={sidebarCollapsed}
          >
            <svelte:component this={item.icon} class="w-5 h-5" />
            
            {#if !sidebarCollapsed}
              <span class="ml-3 font-medium">{item.label}</span>
            {:else}
              <div class="absolute left-12 bg-gray-900 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                {item.label}
              </div>
            {/if}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
</aside>
