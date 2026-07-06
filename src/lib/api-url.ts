/**
 * Utility for building API URLs
 * Uses BACKEND_URL environment variable in production
 * Falls back to /api/* proxy in development (localhost)
 */

export const getApiBaseUrl = (): string => {
  // In development/locally, use the /api proxy
  if (typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1')) {
    return '/api';
  }

  // In production (Vercel), use NEXT_PUBLIC_BACKEND_URL or BACKEND_URL
  if (typeof window !== 'undefined') {
    // Frontend doesn't need to know, it uses relative /api paths
    return '/api';
  }

  // Server-side: use BACKEND_URL environment variable
  return process.env.BACKEND_URL || 'http://localhost:8081/api';
};

export const buildApiUrl = (endpoint: string): string => {
  const base = getApiBaseUrl();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
};

export const buildUploadUrl = (uploadPath: string): string => {
  const path = uploadPath.startsWith('/') ? uploadPath : `/${uploadPath}`;
  
  // For image URLs in the frontend, use the /api proxy
  if (typeof window !== 'undefined') {
    return `/api/uploads${path}`;
  }

  // Server-side
  return `${process.env.BACKEND_URL || 'http://localhost:8081'}/uploads${path}`;
};

/**
 * Usage examples:
 * 
 * // In client components
 * const url = buildApiUrl('/auth/login');
 * const imageUrl = buildUploadUrl('/pharmacies/images/test.jpg');
 * 
 * // In API routes
 * const backendUrl = buildApiUrl('/medicaments');
 */
