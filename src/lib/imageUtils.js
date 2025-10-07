// src/lib/imageUtils.js
export function cleanImageUrl(imageUrl) {
    if (!imageUrl) return '';
    
    let cleanedUrl = imageUrl;
    
    // Remove "uploads\" or "uploads/" prefix if exists
    if (cleanedUrl.startsWith('uploads\\') || cleanedUrl.startsWith('uploads/')) {
        cleanedUrl = cleanedUrl.replace(/^uploads[\\\/]/, '');
    }
    
    // Replace backslashes with forward slashes for URL compatibility
    cleanedUrl = cleanedUrl.replace(/\\/g, '/');
    
    return cleanedUrl;
}

export function getFullImageUrl(imageUrl) {
    const cleanedUrl = cleanImageUrl(imageUrl);
    
    if (!cleanedUrl) return '';
    
    // Jika sudah full URL, return langsung
    if (cleanedUrl.startsWith('http')) {
        return cleanedUrl;
    }
    
    // Jika relative, tambahkan base API path
    return `/api/images/${cleanedUrl}`;
}