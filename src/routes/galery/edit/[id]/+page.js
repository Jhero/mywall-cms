// +page.js
import { error } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { authStore } from '../../../../stores/auth.js';


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

function parseImagePath(path) {
  if (!path) return '/placeholder.jpg';
  const result = path.replace(/^uploads\\/, '/').replace(/\\/g, '/');
  return result;
}

const fetchImageWithAuth = async (imagePath) => {
  try {
    const config = createConfig();
    const response = await fetch(`/api/images${parseImagePath(imagePath)}`,config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const blob = await response.blob();
    return URL.createObjectURL(blob); // Buat object URL untuk display
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
};

/** @type {import('./$types').PageLoad} */
export async function load({ fetch, params, url }) {
  try {    
    const config = createConfig();
    // Fetch data dari API galleries
    const id = params.id;
    const response = await fetch(`/api/galleries/${id}`,config);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const apiData = await response.json();
    const result = apiData.data;
    // Transform data dari API ke format yang dibutuhkan
    const transformedImages = {
      id: result.ID || Date.now() + Math.random(),
      title: result.title || 'Untitled',
      caption: result.description || result.title || 'No description',
      url: await fetchImageWithAuth(result.image_url),
      // url: `http://localhost:8080/api/images${parseImagePath(result.image_url)}`,
      categoryId: result.category_id || null,
      uploadedAt: new Date().toISOString(),
      originalData: result // Simpan data asli untuk referensi      
    }

    return {
      images: [transformedImages],
      meta: {
        title: 'Gallery Editor',
        description: 'Edit and manage your image gallery',
        totalImages: 1,
        apiEndpoint: 'http://localhost:8080/api/galleries'
      }
    };
    
  } catch (err) {
    console.error('Failed to load gallery data:', err);
    
    // Fallback ke sample data jika API gagal
    const fallbackImages = [
      { 
        id: 'fallback-1', 
        title: 'Sample Image 1',
        caption: 'Beautiful landscape (Sample)',
        url: 'https://picsum.photos/300/200?random=1',
        categoryId: 1,
        uploadedAt: new Date('2024-01-15').toISOString()
      },
      { 
        id: 'fallback-2', 
        title: 'Sample Image 2', 
        caption: 'City skyline (Sample)',
        url: 'https://picsum.photos/300/200?random=2',
        categoryId: 1,
        uploadedAt: new Date('2024-01-16').toISOString()
      }
    ];

    // Jika error 500 atau connection error, gunakan fallback
    if (err.message.includes('fetch') || err.message.includes('500')) {
      console.warn('Using fallback data due to API error:', err.message);
      return {
        images: fallbackImages,
        meta: {
          title: 'Gallery Editor (Offline Mode)',
          description: 'Edit and manage your image gallery - using sample data',
          totalImages: fallbackImages.length,
          apiEndpoint: 'http://localhost:8080/api/galleries',
          offline: true,
          error: 'API not available, using sample data'
        }
      };
    }

    // Untuk error lainnya, throw error
    throw error(500, {
      message: 'Failed to load gallery data from API. Please check if the server is running.',
      details: err.message
    });
  }
}
