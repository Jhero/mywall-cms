<script>
  import { createEventDispatcher } from 'svelte';
  import { toggleSidebar, uiStore } from '../../stores/ui.js';
  import { notificationStore } from '../../stores/notifications.js';
  import { authStore } from '../../stores/auth.js';
  import { 
    Menu, 
    Search, 
    Bell, 
    Plus, 
    User, 
    Settings, 
    LogOut,
    ChevronDown
  } from 'lucide-svelte';

  const dispatch = createEventDispatcher();
  
  let showNotifications = false;
  let showQuickActions = false;
  let showProfile = false;
  let searchQuery = '';
  
  let currentPage = 'dashboard';
  let sidebarCollapsed = false;

  uiStore.subscribe(state => {
    currentPage = state.currentPage;
    sidebarCollapsed = state.sidebarCollapsed;
  });

  const pageTitle = {
    dashboard: 'Dashboard',
    category: 'Kategori',
    users: 'Manajemen Pengguna',
    analytics: 'Analytics',
    settings: 'Pengaturan'
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      // Implement search functionality
      notificationStore.info(`Mencari: ${searchQuery}`);
    }
  };

  const handleLogout = () => {
    authStore.logout();
    notificationStore.success('Berhasil logout');
  };

  const closeDropdowns = () => {
    showNotifications = false;
    showQuickActions = false;
    showProfile = false;
  };

  // Close dropdowns when clicking outside
  const handleClickOutside = (event) => {
    if (!event.target.closest('.dropdown-container')) {
      closeDropdowns();
    }
  };
</script>

<svelte:window on:click={handleClickOutside} />

<header class="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
  <div class="flex items-center justify-between">
    <!-- Left Section -->
    <div class="flex items-center space-x-4">
      <button 
        on:click={toggleSidebar}
        class="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
      >
        <Menu class="w-5 h-5 text-gray-600" />
      </button>
      
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          {pageTitle[currentPage] || 'Dashboard'}
        </h1>
        <p class="text-sm text-gray-500">Selamat datang kembali!</p>
      </div>
    </div>

    <!-- Right Section -->
    <div class="flex items-center space-x-4">
      <!-- Search -->
      <div class="relative hidden md:block">
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Cari..."
          bind:value={searchQuery}
          on:keypress={handleSearch}
          class="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <!-- Notifications -->
      <div class="relative dropdown-container">
        <button 
          on:click={() => showNotifications = !showNotifications}
          class="relative p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          <Bell class="w-5 h-5 text-gray-600" />
          <span class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        {#if showNotifications}
          <div class="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div class="p-4 border-b border-gray-200">
              <h3 class="font-semibold text-gray-900">Notifikasi</h3>
            </div>
            <div class="max-h-64 overflow-y-auto">
              <div class="p-4 border-b border-gray-100 hover:bg-gray-50">
                <div class="flex items-start space-x-3">
                  <div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">Artikel baru dipublikasi</p>
                    <p class="text-xs text-gray-500">2 menit yang lalu</p>
                  </div>
                </div>
              </div>
              <div class="p-4 border-b border-gray-100 hover:bg-gray-50">
                <div class="flex items-start space-x-3">
                  <div class="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">Pengguna baru mendaftar</p>
                    <p class="text-xs text-gray-500">15 menit yang lalu</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="p-4 border-t border-gray-200">
              <button class="text-blue-600 text-sm font-medium hover:text-blue-700">
                Lihat semua notifikasi
              </button>
            </div>
          </div>
        {/if}
      </div>

      <!-- Quick Actions -->
      <div class="relative dropdown-container">
        <button 
          on:click={() => showQuickActions = !showQuickActions}
          class="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          <Plus class="w-5 h-5 text-gray-600" />
        </button>

        {#if showQuickActions}
          <div class="absolute right-0 top-12 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <button class="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3">
              <FileText class="w-4 h-4 text-gray-400" />
              <span class="text-sm">Artikel Baru</span>
            </button>
            <button class="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3">
              <User class="w-4 h-4 text-gray-400" />
              <span class="text-sm">Pengguna Baru</span>
            </button>
          </div>
        {/if}
      </div>

      <!-- Profile Menu -->
      <div class="relative dropdown-container">
        <button 
          on:click={() => showProfile = !showProfile}
          class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          <img 
            src="https://via.placeholder.com/32x32/4F46E5/FFFFFF?text=A" 
            alt="Profile" 
            class="w-8 h-8 rounded-full"
          />
          <span class="hidden md:block text-sm font-medium text-gray-700">Admin User</span>
          <ChevronDown class="hidden md:block w-4 h-4 text-gray-400" />
        </button>

        {#if showProfile}
          <div class="absolute right-0 top-12 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div class="p-4 border-b border-gray-200">
              <p class="font-medium text-gray-900">Admin User</p>
              <p class="text-sm text-gray-500">admin@example.com</p>
            </div>
            <button class="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3">
              <User class="w-4 h-4 text-gray-400" />
              <span class="text-sm">Profil Saya</span>
            </button>
            <button class="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3">
              <Settings class="w-4 h-4 text-gray-400" />
              <span class="text-sm">Pengaturan</span>
            </button>
            <hr class="my-1">
            <button 
              on:click={handleLogout}
              class="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3 text-red-600"
            >
              <LogOut class="w-4 h-4" />
              <span class="text-sm">Logout</span>
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
</header>
