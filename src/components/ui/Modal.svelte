<script>
  import { createEventDispatcher } from 'svelte';
  import { X } from 'lucide-svelte';
  
  export let show = false;
  export let title = '';
  export let size = 'md'; // sm, md, lg, xl
  export let closable = true;

  const dispatch = createEventDispatcher();
  
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  const handleClose = () => {
    if (closable) {
      dispatch('close');
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closable) {
      handleClose();
    }
  };

  const handleEscape = (e) => {
    if (e.key === 'Escape' && closable) {
      handleClose();
    }
  };
</script>

<svelte:window on:keydown={handleEscape} />

{#if show}
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    on:click={handleBackdropClick}
  >
    <div 
      class="bg-white rounded-lg shadow-xl w-full {sizes[size]} max-h-[90vh] overflow-y-auto"
      on:click|stopPropagation
    >
      {#if title || closable}
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          {#if title}
            <h3 class="text-lg font-semibold text-gray-900">{title}</h3>
          {/if}
          
          {#if closable}
            <button 
              on:click={handleClose}
              class="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X class="w-5 h-5" />
            </button>
          {/if}
        </div>
      {/if}

      <div class="p-6">
        <slot />
      </div>

      <slot name="footer" />
    </div>
  </div>
{/if}
