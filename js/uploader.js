/**
 * Crazy Cloths - Cloudinary Design Image Uploader
 */

let cloudinaryUrl = null;
let isUploading = false;

// Expose these globally or import them in order.js
window.UploaderState = {
  getCloudinaryUrl() {
    return cloudinaryUrl;
  },
  setCloudinaryUrl(url) {
    cloudinaryUrl = url;
  },
  getIsUploading() {
    return isUploading;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const uploadZone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');
  
  if (!uploadZone || !fileInput) return;

  const previewContainer = document.getElementById('upload-preview-container');
  const previewThumbnail = document.getElementById('preview-thumbnail');
  const progressBar = document.getElementById('upload-progress-bar');
  const progressFill = document.getElementById('upload-progress-fill');
  const uploadError = document.getElementById('upload-error');
  const uploadText = document.getElementById('upload-text');
  const uploadSubtext = document.getElementById('upload-subtext');
  const uploadIcon = document.getElementById('upload-icon');
  
  const designOverlay = document.getElementById('design-overlay');
  const baseMockup = document.getElementById('base-mockup');

  // Allowed formats and max size
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml'];
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  // Trigger file select
  uploadZone.addEventListener('click', (e) => {
    // Only open dialog if click is not on the preview / delete actions
    if (e.target.closest('#remove-upload-btn')) return;
    fileInput.click();
  });

  // Handle file select
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      handleFile(fileInput.files[0]);
    }
  });

  // Drag and drop events
  ['dragenter', 'dragover'].forEach(eventName => {
    uploadZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    uploadZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
    }, false);
  });

  uploadZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  });

  /**
   * Process and upload the selected design file
   * @param {File} file 
   */
  function handleFile(file) {
    // Hide previous errors
    uploadError.style.display = 'none';
    uploadError.textContent = '';

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      showError('Invalid file type. Please upload a JPG, PNG, or SVG.');
      return;
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      showError('File is too large. Max size allowed is 10MB.');
      return;
    }

    // 1. Show immediate preview using Local Object URL
    const objectUrl = URL.createObjectURL(file);
    
    // Set preview image in uploader
    previewThumbnail.src = objectUrl;
    previewContainer.classList.add('active');
    
    // Hide default uploader icon/text
    uploadIcon.style.display = 'none';
    uploadText.style.display = 'none';
    uploadSubtext.style.display = 'none';

    // Show design overlay on main mockup
    if (designOverlay) {
      designOverlay.src = objectUrl;
      designOverlay.style.display = 'block';
      
      // Trigger mockup scale pulse animation
      const mockupContainer = baseMockup.parentElement;
      mockupContainer.classList.remove('pulse-active');
      void mockupContainer.offsetWidth; // Trigger reflow
      mockupContainer.classList.add('pulse-active');
    }

    // 2. Perform Cloudinary Upload
    uploadToCloudinary(file);
  }

  /**
   * Upload image to Cloudinary using XHR to track progress
   * @param {File} file 
   */
  function uploadToCloudinary(file) {
    if (!CONFIG || !CONFIG.cloudinary || CONFIG.cloudinary.cloudName === 'your_cloud_name') {
      console.warn('Cloudinary is not configured. Using local preview only.');
      progressBar.style.display = 'none';
      cloudinaryUrl = "https://example.com/mock-cloudinary-upload.png"; // Fallback URL for testing
      return;
    }

    isUploading = true;
    progressBar.style.display = 'block';
    progressFill.style.width = '0%';

    const url = `https://api.cloudinary.com/v1_1/${CONFIG.cloudinary.cloudName}/image/upload`;
    
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    
    formData.append('file', file);
    formData.append('upload_preset', CONFIG.cloudinary.uploadPreset);

    xhr.open('POST', url, true);

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        progressFill.style.width = percentComplete + '%';
      }
    });

    xhr.addEventListener('load', () => {
      isUploading = false;
      progressBar.style.display = 'none';

      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        cloudinaryUrl = response.secure_url;
        
        // Add success burst anim
        previewThumbnail.classList.remove('upload-success-burst');
        void previewThumbnail.offsetWidth; // Trigger reflow
        previewThumbnail.classList.add('upload-success-burst');

        // Save order state change
        if (window.triggerSummaryUpdate) {
          window.triggerSummaryUpdate();
        }
      } else {
        const errResponse = JSON.parse(xhr.responseText || '{}');
        showError(`Cloudinary upload failed: ${errResponse.error?.message || xhr.statusText}`);
        resetUploader();
      }
    });

    xhr.addEventListener('error', () => {
      isUploading = false;
      progressBar.style.display = 'none';
      showError('Network error occurred during Cloudinary upload.');
      resetUploader();
    });

    xhr.send(formData);
  }

  function showError(msg) {
    uploadError.textContent = msg;
    uploadError.style.display = 'block';
  }

  function resetUploader() {
    fileInput.value = '';
    cloudinaryUrl = null;
    isUploading = false;
    
    previewContainer.classList.remove('active');
    progressBar.style.display = 'none';
    progressFill.style.width = '0%';
    
    uploadIcon.style.display = 'block';
    uploadText.style.display = 'block';
    uploadSubtext.style.display = 'block';

    if (designOverlay) {
      designOverlay.src = '';
      designOverlay.style.display = 'none';
    }

    if (window.triggerSummaryUpdate) {
      window.triggerSummaryUpdate();
    }
  }

  // Remove upload button handler
  const removeBtn = document.getElementById('remove-upload-btn');
  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      resetUploader();
    });
  }
});
