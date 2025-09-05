<script>
  import { onMount } from 'svelte';
  import { createGalleryItem, updateGalleryItem, deleteGalleryItem, generateImageId, validateImageFile } from '../../../../lib/galleryUtils.js';
  
  /** @type {import('./$types').PageData} */
  export let data;
  
  let images = data.images || [];
  let editingId = null;
  let editingCaption = '';
  let editingTitle = '';
  let fileInput;
  let showModal = false;
  let selectedImage = null;
  let isLoading = false;
  let errorMessage = '';
  let isOnlineMode = !data.meta.offline;
  
  // Reactive statement untuk update document title
  $: if (typeof document !== 'undefined') {
    document.title = `${data.meta.title} (${images.length} images)`;
  }
  
  function startEdit(image) {
    editingId = image.id;
    editingCaption = image.caption;
    editingTitle = image.title || image.caption;
  }
  
  async function saveEdit() {
    if (editingCaption.trim() === '' || editingTitle.trim() === '') {
      errorMessage = 'Title and caption cannot be empty';
      return;
    }
    
    isLoading = true;
    try {
      if (isOnlineMode) {
        // Update via API
        const updatedData = await updateGalleryItem(editingId, {
          title: editingTitle.trim(),
          description: editingCaption.trim(),
          category_id: selectedImage?.categoryId || 1
        });
        
        // Update local data
        images = images.map(img => 
          img.id === editingId 
            ? { 
                ...img, 
                title: editingTitle.trim(),
                caption: editingCaption.trim(),
                originalData: updatedData
              }
            : img
        );
      } else {
        // Update local only
        images = images.map(img => 
          img.id === editingId 
            ? { 
                ...img, 
                title: editingTitle.trim(),
                caption: editingCaption.trim()
              }
            : img
        );
      }
      
      editingId = null;
      editingCaption = '';
      editingTitle = '';
      errorMessage = '';
    } catch (err) {
      errorMessage = `Failed to update: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }
  
  function cancelEdit() {
    editingId = null;
    editingCaption = '';
    editingTitle = '';
    errorMessage = '';
  }
  
  async function deleteImage(id) {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    isLoading = true;
    try {
      if (isOnlineMode) {
        // Delete via API
        await deleteGalleryItem(id);
      }
      
      // Update local data
      images = images.filter(img => img.id !== id);
    } catch (err) {
      errorMessage = `Failed to delete: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }
  
  async function handleFileUpload(event) {
    const files = event.target.files;
    if (files.length === 0) return;
    
    isLoading = true;
    errorMessage = '';
    
    try {
      const uploadPromises = Array.from(files).map(async file => {
        // Validasi file
        validateImageFile(file);
        
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        
        if (isOnlineMode) {
          // Upload via API
          try {
            const apiResponse = await createGalleryItem({
              title: fileName,
              description: `Uploaded image: ${fileName}`,
              image: file,
              category_id: 1
            });
            
            return {
              id: apiResponse.id || generateImageId(),
              title: apiResponse.title || fileName,
              caption: apiResponse.description || fileName,
              url: apiResponse.image ? `http://localhost:8080${apiResponse.image}` : URL.createObjectURL(file),
              categoryId: apiResponse.category_id || 1,
              uploadedAt: new Date().toISOString(),
              originalData: apiResponse
            };
          } catch (apiErr) {
            console.warn('API upload failed, using local:', apiErr.message);
            // Fallback ke local jika API gagal
            return createLocalImage(file, fileName);
          }
        } else {
          // Local upload
          return createLocalImage(file, fileName);
        }
      });
      
      const newImages = await Promise.all(uploadPromises);
      images = [...images, ...newImages];
      
    } catch (err) {
      errorMessage = err.message;
    } finally {
      isLoading = false;
      fileInput.value = '';
    }
  }
  
  function createLocalImage(file, fileName) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          id: generateImageId(),
          title: fileName,
          caption: fileName,
          url: e.target.result,
          categoryId: 1,
          uploadedAt: new Date().toISOString(),
          isLocal: true
        });
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
  
  function openModal(image) {
    selectedImage = image;
    showModal = true;
  }
  
  function closeModal() {
    showModal = false;
    selectedImage = null;
  }
  
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      if (editingId) {
        cancelEdit();
      } else if (showModal) {
        closeModal();
      }
    } else if (event.key === 'Enter' && editingId) {
      saveEdit();
    }
  }
  
  function clearError() {
    errorMessage = '';
  }
  
  onMount(() => {
    // Auto-clear error messages after 5 seconds
    let errorTimeout;
    $: if (errorMessage) {
      clearTimeout(errorTimeout);
      errorTimeout = setTimeout(() => {
        errorMessage = '';
      }, 5000);
    }
    
    return () => {
      clearTimeout(errorTimeout);
    };
  });
</script>

<svelte:head>
  <title>{data.meta.title}</title>
  <meta name="description" content={data.meta.description} />
</svelte:head>

<svelte:window on:keydown={handleKeydown} />

<div class="gallery-container">
  <!-- Error Message -->
  {#if errorMessage}
    <div class="error-banner">
      <span>{errorMessage}</span>
      <button class="error-close" on:click={clearError}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  {/if}
  
  <div class="header">
    <div class="header-info"></div>
    
    <div class="upload-section">
      <input 
        type="file" 
        bind:this={fileInput}
        on:change={handleFileUpload}
        accept="image/*"
        multiple
        disabled={isLoading}
        style="display: none;"
      />
      <button 
        class="upload-btn"
        class:loading={isLoading}
        disabled={isLoading}
        on:click={() => fileInput.click()}
      >
        {#if isLoading}
          <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21,12a9,9 0 1,1-6.22-8.56"></path>
          </svg>
          Uploading...
        {:else}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7,10 12,15 17,10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Upload Images
        {/if}
      </button>
    </div>
  </div>
  
  {#if images.length === 0}
    <div class="empty-state">
      <div class="empty-icon">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21,15 16,10 5,21"></polyline>
        </svg>
      </div>
      <h3>No images in gallery</h3>
      <p>Click "Upload Images" to add your first photos</p>
    </div>
  {:else}
    <div class="gallery-grid">
      {#each images as image (image.id)}
        <div class="image-card" class:editing={editingId === image.id}>
          <div class="image-container">
            <img 
              src={image.url} 
              alt={image.caption}
              on:click={() => openModal(image)}
              loading="lazy"
            />
            <div class="image-overlay">
              <button 
                class="btn btn-primary btn-icon"
                on:click={() => startEdit(image)}
                title="Edit caption"
                disabled={editingId !== null}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button 
                class="btn btn-danger btn-icon"
                on:click={() => deleteImage(image.id)}
                title="Delete image"
                disabled={editingId !== null}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3,6 5,6 21,6"></polyline>
                  <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                </svg>
              </button>
              <button 
                class="btn btn-secondary btn-icon"
                on:click={() => openModal(image)}
                title="View full size"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 3h6v6"></path>
                  <path d="M10 14 21 3"></path>
                  <path d="M9 21H3v-6"></path>
                  <path d="M14 10 3 21"></path>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="caption-section">
            {#if editingId === image.id}
              <div class="edit-form">
                <input 
                  type="text" 
                  bind:value={editingTitle}
                  placeholder="Enter title..."
                  class="caption-input title-input"
                  maxlength="100"
                />
                <input 
                  type="text" 
                  bind:value={editingCaption}
                  placeholder="Enter description..."
                  class="caption-input"
                  maxlength="200"
                />
                <div class="edit-actions">
                  <button class="btn btn-success btn-sm" on:click={saveEdit} disabled={isLoading}>
                    {#if isLoading}
                      <svg class="spinner-sm" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21,12a9,9 0 1,1-6.22-8.56"></path>
                      </svg>
                    {:else}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20,6 9,17 4,12"></polyline>
                      </svg>
                    {/if}
                  </button>
                  <button class="btn btn-secondary btn-sm" on:click={cancelEdit}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
            {:else}
              <h3 class="image-title">{image.title || image.caption}</h3>
              <p class="caption">{image.caption}</p>
              <div class="image-meta">
                <p class="upload-date">
                  Uploaded: {new Date(image.uploadedAt).toLocaleDateString('id-ID')}
                </p>
                {#if image.categoryId}
                  <span class="category-badge">Category: {image.categoryId}</span>
                {/if}
                {#if image.isLocal}
                  <span class="local-badge">Local</span>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Modal -->
{#if showModal && selectedImage}
  <div class="modal-overlay" on:click={closeModal}>
    <div class="modal-content" on:click|stopPropagation>
      <button class="modal-close" on:click={closeModal}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <img src={selectedImage.url} alt={selectedImage.caption} />
      <div class="modal-info">
        <h3 class="modal-title">{selectedImage.title || selectedImage.caption}</h3>
        <p class="modal-caption">{selectedImage.caption}</p>
        <div class="modal-meta">
          <p class="modal-date">
            Uploaded: {new Date(selectedImage.uploadedAt).toLocaleDateString('id-ID')}
          </p>
          {#if selectedImage.categoryId}
            <span class="category-badge">Category: {selectedImage.categoryId}</span>
          {/if}
          {#if selectedImage.isLocal}
            <span class="local-badge">Local File</span>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(body) {
    margin: 0;
    background: #f8f9fa;
  }
  
  .gallery-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .error-banner {
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #c92a2a;
    font-size: 14px;
  }
  
  .error-close {
    background: none;
    border: none;
    color: #c92a2a;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
  }
  
  .error-close:hover {
    background: #fcc;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid #e1e5e9;
  }
  
  .header-info h1 {
    margin: 0 0 8px 0;
    color: #2c3e50;
    font-size: 2rem;
    font-weight: 600;
  }
  
  .status-info {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  
  .image-count {
    margin: 0;
    color: #7f8c8d;
    font-size: 14px;
  }
  
  .api-status {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    background: #d5f4e6;
    color: #27ae60;
  }
  
  .api-status.offline {
    background: #ffeaea;
    color: #e74c3c;
  }
  
  .upload-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #3498db;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
    min-width: 140px;
    justify-content: center;
  }
  
  .upload-btn:hover:not(:disabled) {
    background: #2980b9;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
  }
  
  .upload-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
  
  .spinner {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
  }
  
  .image-card {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }
  
  .image-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
  
  .image-card.editing {
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.3);
  }
  
  .image-container {
    position: relative;
    overflow: hidden;
  }
  
  .image-container img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    cursor: pointer;
    transition: transform 0.3s ease;
  }
  
  .image-container:hover img {
    transform: scale(1.05);
  }
  
  .image-overlay {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 6px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  .image-container:hover .image-overlay {
    opacity: 1;
  }
  
  .caption-section {
    padding: 16px;
  }
  
  .image-title {
    margin: 0 0 8px 0;
    color: #2c3e50;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.3;
  }
  
  .caption {
    margin: 0 0 8px 0;
    color: #34495e;
    font-size: 14px;
    line-height: 1.4;
  }
  
  .image-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  
  .upload-date {
    margin: 0;
    color: #95a5a6;
    font-size: 12px;
  }
  
  .category-badge, .local-badge {
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 500;
  }
  
  .category-badge {
    background: #e3f2fd;
    color: #1976d2;
  }
  
  .local-badge {
    background: #fff3e0;
    color: #f57c00;
  }
  
  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .caption-input {
    width: 100%;
    padding: 8px 12px;
    border: 2px solid #bdc3c7;
    border-radius: 6px;
    font-size: 14px;
    font-family: inherit;
    transition: border-color 0.2s ease;
  }
  
  .title-input {
    font-weight: 600;
  }
  
  .caption-input:focus {
    outline: none;
    border-color: #3498db;
  }
  
  .spinner-sm {
    animation: spin 1s linear infinite;
  }
  
  .edit-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
  
  .btn {
    border: none;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    font-weight: 500;
  }
  
  .btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  .btn-sm {
    padding: 6px 8px;
  }
  
  .btn-icon {
    padding: 8px;
  }
  
  .btn-primary {
    background: #3498db;
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: #2980b9;
  }
  
  .btn-danger {
    background: #e74c3c;
    color: white;
  }
  
  .btn-danger:hover:not(:disabled) {
    background: #c0392b;
  }
  
  .btn-secondary {
    background: #95a5a6;
    color: white;
  }
  
  .btn-secondary:hover:not(:disabled) {
    background: #7f8c8d;
  }
  
  .btn-success {
    background: #27ae60;
    color: white;
  }
  
  .btn-success:hover:not(:disabled) {
    background: #229954;
  }
  
  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 80px 20px;
    color: #7f8c8d;
  }
  
  .empty-icon {
    margin-bottom: 24px;
    opacity: 0.6;
  }
  
  .empty-state h3 {
    margin: 0 0 16px 0;
    font-size: 1.4rem;
    color: #95a5a6;
  }
  
  .empty-state p {
    margin: 0;
    font-size: 16px;
  }
  
  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
    animation: fadeIn 0.2s ease;
  }
  
  .modal-content {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: scaleIn 0.2s ease;
  }
  
  .modal-content img {
    width: 100%;
    height: auto;
    max-height: 70vh;
    object-fit: contain;
    display: block;
  }
  
  .modal-info {
    padding: 20px;
    background: #f8f9fa;
  }
  
  .modal-title {
    margin: 0 0 8px 0;
    color: #2c3e50;
    font-size: 18px;
    font-weight: 600;
  }
  
  .modal-caption {
    margin: 0 0 12px 0;
    color: #34495e;
    font-size: 14px;
    line-height: 1.4;
  }
  
  .modal-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }
  
  .modal-date {
    margin: 0;
    color: #7f8c8d;
    font-size: 14px;
  }
  
  .modal-close {
    position: absolute;
    top: 16px;
    right: 16px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    z-index: 1001;
  }
  
  .modal-close:hover {
    background: rgba(0, 0, 0, 0.8);
    transform: scale(1.1);
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes scaleIn {
    from { 
      opacity: 0;
      transform: scale(0.9);
    }
    to { 
      opacity: 1;
      transform: scale(1);
    }
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .gallery-container {
      padding: 16px;
    }
    
    .header {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;
    }
    
    .gallery-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    
    .header-info h1 {
      font-size: 1.5rem;
      text-align: center;
    }
    
    .image-count {
      text-align: center;
    }
    
    .modal-content {
      max-width: 95vw;
      max-height: 95vh;
    }
    
    .empty-state {
      padding: 60px 20px;
    }
  }
  
  @media (max-width: 480px) {
    .image-overlay {
      opacity: 1;
      background: rgba(0, 0, 0, 0.7);
      border-radius: 0 0 8px 8px;
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 8px;
      justify-content: center;
    }
    
    .btn-icon {
      padding: 6px;
    }
  }
</style>