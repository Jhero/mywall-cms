<script>
  import { onMount } from 'svelte';
  import { uiStore } from '../../stores/ui.js';
  import Sidebar from './Sidebar.svelte';
  import Header from './Header.svelte';
  
  let sidebarCollapsed = false;
  
  onMount(() => {
    uiStore.subscribe(state => {
      sidebarCollapsed = state.sidebarCollapsed;
    });
  });
</script> 

<div class="flex h-screen bg-gray-50">
  <Sidebar {sidebarCollapsed} />
  
  <div class="flex-1 flex flex-col overflow-hidden">
    <Header />
    
    <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
      <slot />
    </main>
  </div>
</div>

<style>
  :global(.sidebar-collapsed) {
    transform: translateX(-240px);
  }
  
  @media (max-width: 768px) {
    :global(.sidebar) {
      position: absolute;
      z-index: 50;
    }
  }
</style>
