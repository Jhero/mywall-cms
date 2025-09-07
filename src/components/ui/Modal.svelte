<script>
  import { modalState, closeModal } from '../../stores/modal.js';
  import { onMount, onDestroy } from 'svelte';
  
  let modalElement;
  
  // Handle ESC key
  function handleKeydown(event) {
    if (event.key === 'Escape' && $modalState.closable) {
      handleClose();
    }
  }
  
  // Handle backdrop click
  function handleBackdropClick(event) {
    if (event.target === modalElement && $modalState.closable) {
      handleClose();
    }
  }
  
  function handleClose() {
    if ($modalState.onCancel) {
      $modalState.onCancel();
    } else {
      closeModal();
    }
  }
  
  function handleConfirm() {
    if ($modalState.onConfirm) {
      $modalState.onConfirm();
    }
  }
  
  function handleCancel() {
    if ($modalState.onCancel) {
      $modalState.onCancel();
    } else {
      closeModal();
    }
  }
  
  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
  });
  
  onDestroy(() => {
    document.removeEventListener('keydown', handleKeydown);
  });
  
  // Determine modal size classes
  $: sizeClasses = {
    'sm': 'max-w-md',
    'md': 'max-w-lg',
    'lg': 'max-w-2xl',
    'xl': 'max-w-4xl'
  }[$modalState.size] || 'max-w-lg';
</script>

{#if $modalState.isOpen}
  <!-- Backdrop -->
  <div 
    bind:this={modalElement}
    class="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 p-4"
    on:click={handleBackdropClick}
  >
    <!-- Modal -->
    <div 
      class="bg-white rounded-lg shadow-xl w-full {sizeClasses} max-h-[90vh] overflow-auto"
      on:click|stopPropagation
    >
      <!-- Header -->
      {#if $modalState.title}
        <div class="flex items-center justify-between p-6 border-b">
          <h2 class="text-xl font-semibold text-gray-800">
            {$modalState.title}
          </h2>
          {#if $modalState.closable}
            <button 
              on:click={handleClose}
              class="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              aria-label="Close modal"
            >
              ×
            </button>
          {/if}
        </div>
      {/if}
      
      <!-- Content -->
      <div class="p-6">
        {#if $modalState.component}
          <!-- Render dynamic component -->
          <svelte:component 
            this={$modalState.component} 
            {...$modalState.props} 
          />
        {:else if $modalState.content}
          <!-- Render text content -->
          <div class="text-gray-700">
            {$modalState.content}
          </div>
        {/if}
      </div>
      
      <!-- Actions/Footer -->
      {#if $modalState.actions}
        <!-- For custom HTML actions (legacy support) -->
        <div class="flex justify-end gap-3 p-6 border-t bg-gray-50">
          {@html $modalState.actions}
        </div>
      {:else if $modalState.onConfirm || $modalState.onCancel}
        <!-- For confirmation dialogs -->
        <div class="flex justify-end gap-3 p-6 border-t bg-gray-50">
          {#if $modalState.onCancel}
            <button 
              on:click={handleCancel}
              class={$modalState.props.cancelClass || 'px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200'}
            >
              {$modalState.props.cancelText || 'Cancel'}
            </button>
          {/if}
          {#if $modalState.onConfirm}
            <button 
              on:click={handleConfirm}
              class={$modalState.props.confirmClass || 'px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700'}
            >
              {$modalState.props.confirmText || 'Confirm'}
            </button>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/if}