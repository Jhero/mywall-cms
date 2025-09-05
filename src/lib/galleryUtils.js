// src/lib/galleryUtils.js
import { get } from 'svelte/store';
import { authStore } from '../stores/auth.js';


// Helper function untuk membuat config dengan auth
const createConfig = () => {
  const auth = get(authStore);
  const token = auth?.user?.token;
  
  const headers = {
      'Content-Type': 'application/json',
  };

  if (token) {
      headers.Authorization = `Bearer ${token}`;
  }

  return { headers };
};

// Fungsi untuk POST data baru ke API
export async function createGalleryItem(fetch, data) {
    try {
      const config = createConfig();
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      if (data.image) {
        formData.append('image', data.image);
      }
      if (data.category_id) {
        formData.append('category_id', data.category_id);
      }
  
      const response = await fetch('/api/galleries', {
        method: 'POST',
        ...config,
        body: formData
      });
  
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
  
      return await response.json();
    } catch (err) {
      console.error('Failed to create gallery item:', err);
      throw err;
    }
}
  
  // Fungsi untuk UPDATE data di API
export async function updateGalleryItem(id, data) {
    try {
      const config = createConfig();
      if (config.headers) {
          delete config.headers['Content-Type'];
      }
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category_id', data.category_id);
      // if (data.image) {
      //   formData.append('image', data.image);
      // }  
      const response = await fetch(`/api/galleries/${id}`, {
        method: 'PUT', // atau 'PATCH' tergantung API
        ...config,
        body: formData
      });
  
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
  
      return await response.json();
    } catch (err) {
      console.error('Failed to update gallery item:', err);
      throw err;
    }
}
  
  // Fungsi untuk DELETE data dari API
export async function deleteGalleryItem(fetch, id) {
    try {
      const response = await fetch(`/api/galleries/${id}`, {
        method: 'DELETE'
      });
  
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
  
      return true;
    } catch (err) {
      console.error('Failed to delete gallery item:', err);
      throw err;
    }
}

// Fungsi helper untuk validasi file
export function validateImageFile(file) {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('File type not supported. Please upload JPEG, PNG, GIF, or WebP images.');
  }
  
  if (file.size > maxSize) {
    throw new Error('File size too large. Please upload images smaller than 5MB.');
  }
  
  return true;
}

// Fungsi helper untuk generate ID unik
export function generateImageId() {
  return Date.now() + Math.random().toString(36).substr(2, 9);
}