// Get the API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7000';

// Helper function to get full image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '/placeholder-product.jpg';
  
  // If the image path is already a full URL, return it as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Remove leading slash if it exists
  const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
  return `${API_URL}/${cleanPath}`;
};