import { useState } from 'react';
import { CONFIG } from '../config';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function useUploader() {
  const [cloudinaryUrl, setCloudinaryUrl] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const resetUploader = () => {
    setCloudinaryUrl(null);
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    setLocalPreviewUrl(null);
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
  };

  const uploadToCloudinary = (file) => {
    if (!CONFIG || !CONFIG.cloudinary || !CONFIG.cloudinary.cloudName || CONFIG.cloudinary.cloudName === 'your_cloud_name') {
      console.warn('Cloudinary is not configured. Using local preview only.');
      setCloudinaryUrl('/assets/images/white-tee.png'); // Mock fallback url
      setIsUploading(false);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    const url = `https://api.cloudinary.com/v1_1/${CONFIG.cloudinary.cloudName}/image/upload`;
    
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    
    formData.append('file', file);
    formData.append('upload_preset', CONFIG.cloudinary.uploadPreset || CONFIG.cloudinary.productUploadPreset);

    xhr.open('POST', url, true);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(percentComplete);
      }
    });

    xhr.addEventListener('load', () => {
      setIsUploading(false);
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          setCloudinaryUrl(response.secure_url);
          setError(null);
        } catch {
          setError('Failed to parse Cloudinary response.');
          setCloudinaryUrl(null);
        }
      } else {
        try {
          const errResponse = JSON.parse(xhr.responseText || '{}');
          setError(`Cloudinary upload failed: ${errResponse.error?.message || xhr.statusText}`);
        } catch {
          setError(`Cloudinary upload failed with status ${xhr.status}`);
        }
        setCloudinaryUrl(null);
      }
    });

    xhr.addEventListener('error', () => {
      setIsUploading(false);
      setError('Network error occurred during Cloudinary upload.');
      setCloudinaryUrl(null);
    });

    xhr.send(formData);
  };

  const handleFile = (file) => {
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Invalid file type. Please upload a JPG, PNG, or SVG.');
      return false;
    }

    if (file.size > MAX_SIZE) {
      setError('File is too large. Max size allowed is 10MB.');
      return false;
    }

    const objectUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(objectUrl);

    uploadToCloudinary(file);
    return true;
  };

  return {
    cloudinaryUrl,
    setCloudinaryUrl,
    localPreviewUrl,
    isUploading,
    uploadProgress,
    error,
    setError,
    handleFile,
    resetUploader
  };
}
